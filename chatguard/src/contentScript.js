/**
 * Content script that runs in the context of web pages.
 * This script monitors text inputs and analyzes them for abusive language using the ML model.
 */

// Import settings from extension storage
let settings = {
  enableForInstagram: true,
  enableHighlighting: true,
  enableAutoReplacement: true,
  enableNotifications: true
};

// API endpoint
const API_URL = 'http://localhost:5000/api';

// Load settings from Chrome storage
function loadSettings() {
  if (chrome && chrome.storage) {
    chrome.storage.sync.get([
      'enableForInstagram',
      'enableHighlighting',
      'enableAutoReplacement',
      'enableNotifications'
    ], (result) => {
      if (result) {
        settings = { ...settings, ...result };
      }
    });
  }
}

// Initialize and load settings
loadSettings();

// Attach listeners to text input fields
function attachListeners() {
  // Only run on enabled sites
  if (window.location.hostname.includes('instagram.com') && !settings.enableForInstagram) {
    return;
  }
  
  // Find all text input fields, textareas, and contenteditable elements
  const textInputs = document.querySelectorAll('input[type="text"], textarea');
  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  
  // For regular inputs and textareas
  textInputs.forEach(input => {
    input.addEventListener('input', debounce(analyzeInput, 500));
  });
  
  // For contenteditable elements (like div-based editors)
  editableElements.forEach(element => {
    element.addEventListener('input', debounce(analyzeContentEditable, 500));
  });
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Analyze text from regular input fields
async function analyzeInput(event) {
  const text = event.target.value;
  if (!text || text.length < 3) return;
  
  try {
    const result = await analyzeText(text);
    handleAnalysisResult(result, event.target);
  } catch (error) {
    console.error('Error analyzing input:', error);
  }
}

// Analyze text from contenteditable elements
async function analyzeContentEditable(event) {
  const text = event.target.innerText || event.target.textContent;
  if (!text || text.length < 3) return;
  
  try {
    const result = await analyzeText(text);
    handleAnalysisResult(result, event.target);
  } catch (error) {
    console.error('Error analyzing contenteditable:', error);
  }
}

// Call API to analyze text using the ML model
async function analyzeText(text) {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, threshold: 0.5 }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
}

// Handle analysis result - Rely on ML model's classification
async function handleAnalysisResult(result, element) {
  // First log the result to help with debugging
  console.log('ChatGuard analysis result:', result);
  
  // Remove previous highlighting if any
  resetHighlighting(element);
  
  // Check if the ML model classified it as offensive
  if (result.is_offensive) {
    console.log('ChatGuard detected offensive content');
    
    // Make sure settings are loaded
    await ensureSettingsLoaded();
    
    if (settings.enableHighlighting) {
      highlightOffensiveWords(element, result.offensive_words || []);
    }
    
    // Apply auto-replacement immediately if enabled
    if (settings.enableAutoReplacement) {
      applyWordReplacement(element, result.offensive_words || []);
    }
    
    console.log('ChatGuard notifications enabled:', settings.enableNotifications);
    
    // Force notification regardless of settings for now (for testing)
    const notificationShown = showNotification();
    console.log('ChatGuard notification displayed:', notificationShown);
    
    // Store that this element contains offensive content
    element.dataset.containsOffensive = 'true';
    
    // Store the specific offensive words if any were found
    element.dataset.offensiveWords = JSON.stringify(result.offensive_words || []);
    
    // Listen for form submission if this input is part of a form
    if (element.form && !element.form.dataset.chatguardListener) {
      element.form.addEventListener('submit', handleFormSubmit);
      element.form.dataset.chatguardListener = 'true';
    }
  } else {
    // Reset highlighting and data attribute
    element.dataset.containsOffensive = 'false';
    element.dataset.offensiveWords = '';
  }
}

// Highlight only the offensive words within the element
function highlightOffensiveWords(element, offensiveWords) {
  if (!offensiveWords || offensiveWords.length === 0) return;
  
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    // For standard inputs, we need to create a visual indicator
    createHighlightOverlay(element, offensiveWords);
  } else {
    // For contenteditable elements, we can modify the innerHTML
    highlightContentEditableWords(element, offensiveWords);
  }
}

// Create highlight overlay for standard inputs
function createHighlightOverlay(element, offensiveWords) {
  // Set a subtle red background for the input element
  element.style.backgroundColor = 'rgba(255, 200, 200, 0.2)';
  
  // Create or update an overlay div to display highlighted words
  let overlay = element.nextElementSibling;
  if (!overlay || !overlay.classList.contains('chatguard-overlay')) {
    overlay = document.createElement('div');
    overlay.className = 'chatguard-overlay';
    overlay.style.cssText = `
      font-size: 12px;
      margin-top: 4px;
      color: #555;
    `;
    element.parentNode.insertBefore(overlay, element.nextSibling);
  }
  
  // Update the overlay content
  overlay.innerHTML = 'Detected: ' + offensiveWords.map(word => 
    `<span style="color: red; font-weight: bold;">${word}</span>`
  ).join(', ');
}

// Highlight words within a contenteditable element
function highlightContentEditableWords(element, offensiveWords) {
  if (!offensiveWords || offensiveWords.length === 0) return;
  
  // Get the current HTML content
  let html = element.innerHTML;
  
  // Create a regex pattern from the offensive words
  const escapedWords = offensiveWords.map(word => 
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp('\\b(' + escapedWords.join('|') + ')\\b', 'gi');
  
  // Replace words with highlighted versions
  const newHtml = html.replace(pattern, match => 
    `<span style="background-color: rgba(255, 0, 0, 0.2); border-bottom: 2px solid red;">${match}</span>`
  );
  
  // Only update if changes were made to avoid cursor position issues
  if (newHtml !== html) {
    // Save selection position
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    
    // Update content
    element.innerHTML = newHtml;
    
    // Try to restore cursor position
    try {
      if (selection.rangeCount > 0) {
        const newRange = document.createRange();
        newRange.setStart(element.firstChild, Math.min(startOffset, element.textContent.length));
        newRange.setEnd(element.firstChild, Math.min(endOffset, element.textContent.length));
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } catch (e) {
      console.error('Error restoring selection:', e);
    }
  }
}

// Apply real-time word replacement with asterisks
function applyWordReplacement(element, offensiveWords) {
  if (!offensiveWords || offensiveWords.length === 0) return;
  
  // Create a regex pattern from the offensive words
  const escapedWords = offensiveWords.map(word => 
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp('\\b(' + escapedWords.join('|') + ')\\b', 'gi');
  
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    // For standard inputs, replace text directly
    // Save cursor position
    const cursorPos = element.selectionStart;
    
    // Replace text
    const originalText = element.value;
    element.value = originalText.replace(pattern, match => '*'.repeat(match.length));
    
    // Try to restore cursor position
    try {
      element.setSelectionRange(cursorPos, cursorPos);
    } catch (e) {
      console.error('Error restoring cursor position:', e);
    }
  } else {
    // For contenteditable elements
    // Save selection position
    const selection = window.getSelection();
    const savedSelection = selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
    
    // Replace text
    element.textContent = element.textContent.replace(pattern, match => '*'.repeat(match.length));
    
    // Try to restore selection
    if (savedSelection) {
      try {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      } catch (e) {
        console.error('Error restoring selection:', e);
      }
    }
  }
}

// Reset highlighting
function resetHighlighting(element) {
  element.style.border = '';
  element.style.backgroundColor = '';
  element.style.outline = '';
  
  // Remove any overlay
  const overlay = element.nextElementSibling;
  if (overlay && overlay.classList.contains('chatguard-overlay')) {
    overlay.remove();
  }
}

// Show notification about offensive content
function showNotification() {
  console.log('ChatGuard: Showing notification with shadow DOM approach');
  
  try {
    // First, clean up any existing notifications
    const existingNotifications = document.querySelectorAll('.chatguard-notification-container');
    existingNotifications.forEach(node => {
      if (document.body.contains(node)) {
        document.body.removeChild(node);
      }
    });
    
    // Create host element
    const hostElement = document.createElement('div');
    hostElement.className = 'chatguard-notification-container';
    hostElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647; /* Max z-index */
      width: 300px;
      height: auto;
    `;
    
    // Attach to document
    document.body.appendChild(hostElement);
    
    // Create shadow DOM
    const shadow = hostElement.attachShadow({ mode: 'open' });
    
    // Create notification element with styles isolated in shadow DOM
    const notification = document.createElement('div');
    notification.innerHTML = `
      <style>
        .notification {
          background-color: white;
          border: 2px solid #474DFF;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          font-family: Arial, sans-serif;
          animation: fadeIn 0.3s ease-in-out;
          color: black;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .title {
          font-weight: bold;
          color: #001573;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #888;
        }
        
        .message {
          margin: 0;
          color: #333;
        }
      </style>
      
      <div class="notification">
        <div class="header">
          <div class="title">Abusive words detected</div>
          <button class="close-btn">&times;</button>
        </div>
        <p class="message">Please edit your message for the next time.</p>
      </div>
    `;
    
    // Add to shadow DOM
    shadow.appendChild(notification);
    
    // Add close button functionality
    const closeButton = shadow.querySelector('.close-btn');
    closeButton.addEventListener('click', () => {
      if (document.body.contains(hostElement)) {
        document.body.removeChild(hostElement);
      }
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(hostElement)) {
        document.body.removeChild(hostElement);
      }
    }, 5000);
    
    console.log('ChatGuard: Notification should be visible now');
    return true;
  } catch (error) {
    console.error('ChatGuard: Error showing notification:', error);
    
    // Fallback to simpler method if shadow DOM fails
    try {
      alert('ChatGuard: Abusive words detected. Please edit your message.');
      return true;
    } catch (e) {
      console.error('ChatGuard: Even fallback alert failed:', e);
      return false;
    }
  }
}

// Handle form submission
function handleFormSubmit(event) {
  const form = event.target;
  const inputsWithOffensiveContent = form.querySelectorAll('[data-contains-offensive="true"]');
  
  if (inputsWithOffensiveContent.length > 0 && settings.enableAutoReplacement) {
    // Replace offensive content before submission (as a final check)
    inputsWithOffensiveContent.forEach(input => {
      const offensiveWordsJson = input.dataset.offensiveWords || '';
      
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
        input.value = replaceOffensiveWords(input.value, offensiveWordsJson);
      } else {
        // For contenteditable
        input.innerText = replaceOffensiveWords(input.innerText, offensiveWordsJson);
      }
    });
    
    // Show notification about the replacement
    showNotification();
    
  }
}

// Replace offensive words with asterisks
function replaceOffensiveWords(text, offensiveWordsJson) {
  let offensiveWords = [];
  
  try {
    // Parse the JSON string of offensive words
    offensiveWords = JSON.parse(offensiveWordsJson || '[]');
  } catch (e) {
    console.error('Error parsing offensive words:', e);
    offensiveWords = [];
  }
  
  // If we have specific offensive words from the API
  if (offensiveWords && offensiveWords.length > 0) {
    // Create a regex pattern from the offensive words
    // Escape special regex characters in the words
    const escapedWords = offensiveWords.map(word => 
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const pattern = new RegExp('\\b(' + escapedWords.join('|') + ')\\b', 'gi');
    return text.replace(pattern, match => '*'.repeat(match.length));
  } else {
    // No specific words were identified but the content was still classified as offensive
    // In this case, replace the entire text with asterisks as a fallback
    return '*'.repeat(text.length);
  }
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachListeners);
} else {
  attachListeners();
}

// Re-attach listeners when settings change
if (chrome && chrome.storage) {
  chrome.storage.onChanged.addListener((changes) => {
    // Update settings
    for (let key in changes) {
      if (settings.hasOwnProperty(key)) {
        settings[key] = changes[key].newValue;
      }
    }
    
    // Re-attach listeners with new settings
    attachListeners();
  });
}

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const node = mutation.addedNodes[i];
        if (node.nodeType === 1) { // Element node
          // Find any new inputs or contenteditable elements
          const newInputs = node.querySelectorAll('input[type="text"], textarea');
          const newEditables = node.querySelectorAll('[contenteditable="true"]');
          
          // Attach listeners to new elements
          newInputs.forEach(input => {
            input.addEventListener('input', debounce(analyzeInput, 500));
          });
          
          newEditables.forEach(element => {
            element.addEventListener('input', debounce(analyzeContentEditable, 500));
          });
        }
      }
    }
  }
});


// Listen for a custom message to trigger notification testing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'testNotification') {
    console.log('ChatGuard: Received test notification request');
    const result = showNotification();
    sendResponse({ success: result });
    return true;
  }
});

// Add this function to your background.js file
// Then you can call chrome.runtime.sendMessage({action: 'triggerTestNotification'})
// from the background script console
function addToBackgroundJS() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'triggerTestNotification') {
      // Get the current active tab
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
          // Send test message to content script
          chrome.tabs.sendMessage(tabs[0].id, 
            {action: 'testNotification'}, 
            (response) => {
              console.log('Test notification result:', response);
            }
          );
        }
      });
      return true;
    }
  });
}

// Also add this simplified notification function as a fallback
function simpleNotification() {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 2px solid red;
    padding: 20px;
    z-index: 9999999;
    font-family: Arial;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
  `;
  div.innerHTML = '<strong>Abusive words detected!</strong><p>Please edit your message.</p>';
  document.body.appendChild(div);
  
  setTimeout(() => {
    if (document.body.contains(div)) {
      document.body.removeChild(div);
    }
  }, 5000);
  
  return true;
}

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});