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
function handleAnalysisResult(result, element) {
  // Check if the ML model classified it as offensive
  if (result.is_offensive) {
    if (settings.enableHighlighting) {
      highlightOffensiveText(element);
    }
    
    if (settings.enableNotifications) {
      showNotification();
    }
    
    // Store that this element contains offensive content
    element.dataset.containsOffensive = 'true';
    
    // Store the specific offensive words if any were found
    element.dataset.offensiveWords = JSON.stringify(result.offensive_words || []);
    
    // Listen for form submission if this input is part of a form
    if (element.form && settings.enableAutoReplacement) {
      if (!element.form.dataset.chatguardListener) {
        element.form.addEventListener('submit', handleFormSubmit);
        element.form.dataset.chatguardListener = 'true';
      }
    }
  } else {
    // Reset highlighting and data attribute
    resetHighlighting(element);
    element.dataset.containsOffensive = 'false';
    element.dataset.offensiveWords = '';
  }
}

// Highlight offensive text in the input
function highlightOffensiveText(element) {
  // Visual indication depends on the element type
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    element.style.border = '2px solid red';
    element.style.backgroundColor = 'rgba(255, 0, 0, 0.05)';
  } else {
    // For contenteditable
    element.style.outline = '2px solid red';
    element.style.backgroundColor = 'rgba(255, 0, 0, 0.05)';
  }
}

// Reset highlighting
function resetHighlighting(element) {
  element.style.border = '';
  element.style.backgroundColor = '';
  element.style.outline = '';
}

// Show notification about offensive content
function showNotification() {
  // Create notification container if it doesn't exist
  let notificationContainer = document.querySelector('.chatguard-notification');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'chatguard-notification';
    notificationContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #fff;
      border: 2px solid #474DFF;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      max-width: 300px;
    `;
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification content
  notificationContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <strong style="color: #001573;">Abusive words detected</strong>
      <button style="background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
    </div>
    <p style="margin: 0; color: #333;">
      Please edit your message for the next time.
    </p>
  `;
  
  // Add close button functionality
  const closeButton = notificationContainer.querySelector('button');
  closeButton.addEventListener('click', () => {
    notificationContainer.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notificationContainer)) {
      notificationContainer.remove();
    }
  }, 5000);
}

// Handle form submission
function handleFormSubmit(event) {
  const form = event.target;
  const inputsWithOffensiveContent = form.querySelectorAll('[data-contains-offensive="true"]');
  
  if (inputsWithOffensiveContent.length > 0 && settings.enableAutoReplacement) {
    // Replace offensive content before submission
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

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});