//This script monitors text inputs and analyzes them for abusive language.


// Import settings from extension storage
let settings = {
  enableForInstagram: true,
  enableHighlighting: true,
  enableAutoReplacement: true,
  enableNotifications: true
};

// API endpoint
const API_URL = 'http://localhost:5000/api';

// Debug mode - set to true for additional console logs
const DEBUG = true;

// Log function that only outputs when debug is enabled
function debugLog(message, data) {
  if (DEBUG) {
    console.log(`ChatGuard: ${message}`, data || '');
  }
}

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
        debugLog('Settings loaded', settings);
      }
    });
  }
}

// Promise-based function to ensure settings are loaded
function ensureSettingsLoaded() {
  return new Promise((resolve) => {
    if (chrome && chrome.storage) {
      chrome.storage.sync.get([
        'enableForInstagram',
        'enableHighlighting',
        'enableAutoReplacement',
        'enableNotifications'
      ], (result) => {
        if (result) {
          settings = { 
            ...settings,
            enableForInstagram: result.enableForInstagram !== undefined ? result.enableForInstagram : true,
            enableHighlighting: result.enableHighlighting !== undefined ? result.enableHighlighting : true,
            enableAutoReplacement: result.enableAutoReplacement !== undefined ? result.enableAutoReplacement : true,
            enableNotifications: result.enableNotifications !== undefined ? result.enableNotifications : true
          };
        }
        debugLog('Settings ensured', settings);
        resolve(settings);
      });
    } else {
      resolve(settings);
    }
  });
}

// Initialize and load settings
loadSettings();

// Attach listeners to text input fields
function attachListeners() {
  // Only run on enabled sites
  if (window.location.hostname.includes('instagram.com') && !settings.enableForInstagram) {
    return;
  }
  
  debugLog('Attaching listeners to text inputs');
  
  // Find all text input fields, textareas, and contenteditable elements
  const textInputs = document.querySelectorAll('input[type="text"], textarea');
  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  
  // For regular inputs and textareas
  textInputs.forEach(input => {
    input.addEventListener('input', debounce(analyzeInput, 500));
    debugLog('Listener attached to input', input);
  });
  
  // For contenteditable elements (like div-based editors)
  editableElements.forEach(element => {
    element.addEventListener('input', debounce(analyzeContentEditable, 500));
    debugLog('Listener attached to contenteditable', element);
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
    debugLog('Analyzing input', text);
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
    debugLog('Analyzing contenteditable', text);
    const result = await analyzeText(text);
    handleAnalysisResult(result, event.target);
  } catch (error) {
    console.error('Error analyzing contenteditable:', error);
  }
}

// Call API to analyze text using the ML model
async function analyzeText(text) {
  try {
    debugLog('Calling API', text);
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
    
    const result = await response.json();
    debugLog('API response', result);
    return result;
  } catch (error) {
    console.error('Error calling API:', error);
    // Fallback to local analysis in case the API is down
    debugLog('Using fallback local analysis');
    
    // Simple check for common offensive words
    const commonOffensiveWords = ['fuck', 'shit', 'bitch', 'ass', 'asshole', 'dick'];
    const words = text.toLowerCase().split(/\s+/);
    const foundOffensiveWords = words.filter(word => commonOffensiveWords.includes(word));
    
    return {
      text: text,
      label: foundOffensiveWords.length > 0 ? "offensive" : "not offensive",
      probability: foundOffensiveWords.length > 0 ? 1.0 : 0.0,
      is_offensive: foundOffensiveWords.length > 0,
      offensive_words: foundOffensiveWords
    };
  }
}

// Handle analysis result
async function handleAnalysisResult(result, element) {
  // First log the result to help with debugging
  debugLog('Analysis result', result);
  
  // Remove previous highlighting if any
  resetHighlighting(element);
  
  // Check if the ML model classified it as offensive
  if (result.is_offensive) {
    debugLog('Offensive content detected');
    
    // Make sure settings are loaded
    await ensureSettingsLoaded();
    
    if (settings.enableHighlighting) {
      highlightOffensiveWords(element, result.offensive_words || []);
    }
    
    // Apply auto-replacement immediately if enabled
    if (settings.enableAutoReplacement) {
      applyWordReplacement(element, result.offensive_words || []);
    }
    
    debugLog('Notifications enabled', settings.enableNotifications);
    
    // Show notification if enabled
    if (settings.enableNotifications) {
      showNotification();
    }
    
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
  
  debugLog('Highlighting offensive words', offensiveWords);
  
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
  
  debugLog('Replacing offensive words', offensiveWords);
  
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

// Show notification about offensive content using direct DOM approach
function showNotification() {
  debugLog('Showing notification');
  
  try {
    // First, try a direct DOM approach without shadow DOM for compatibility
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border: 2px solid #474DFF;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 2147483647;
      width: 300px;
      font-family: Arial, sans-serif;
      color: black;
      animation: chatguardFadeIn 0.3s ease-in-out;
    `;
    
    // Add CSS animation directly to the document if it doesn't exist
    let styleTag = document.getElementById('chatguard-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'chatguard-styles';
      styleTag.innerHTML = `
        @keyframes chatguardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(styleTag);
    }
    
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="font-weight: bold; color: #001573;">Abusive words detected</div>
        <button id="chatguard-close-btn" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #888;">&times;</button>
      </div>
      <p style="margin: 0; color: #333;">Please edit your message for the next time.</p>
    `;
    
    document.body.appendChild(div);
    
    // Add close button functionality
    const closeButton = document.getElementById('chatguard-close-btn');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (document.body.contains(div)) {
          document.body.removeChild(div);
        }
      });
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(div)) {
        document.body.removeChild(div);
      }
    }, 5000);
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    
    // Fallback to alert
    try {
      alert('ChatGuard: Abusive words detected. Please edit your message.');
      return true;
    } catch (e) {
      console.error('Even fallback alert failed:', e);
      return false;
    }
  }
}

// Handle form submission
async function handleFormSubmit(event) {
  const form = event.target;
  const inputsWithOffensiveContent = form.querySelectorAll('[data-contains-offensive="true"]');
  
  if (inputsWithOffensiveContent.length > 0) {
    debugLog('Form submission with offensive content detected');
    
    // Make sure settings are loaded
    await ensureSettingsLoaded();
    
    if (settings.enableAutoReplacement) {
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
      
      // Show notification about the replacement if enabled
      if (settings.enableNotifications) {
        showNotification();
      }
    }
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

// Function to test notifications (accessible via browser console)
function testNotification() {
  debugLog('Testing notification system');
  return showNotification();
}

// Make it accessible from the global window object
window.testChatGuardNotification = testNotification;

// Listen for messaging from background scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'testNotification') {
    debugLog('Received test notification request');
    const result = showNotification();
    sendResponse({ success: result });
    return true;
  }
});

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
    
    debugLog('Settings changed', settings);
    
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

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Log that the script has loaded
debugLog('Content script loaded and ready');