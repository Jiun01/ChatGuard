//Manages extension settings and background tasks
 
// Debug mode - set to true for additional console logs
const DEBUG = true;

// Log function that only outputs when debug is enabled
function debugLog(message, data) {
  if (DEBUG) {
    console.log(`ChatGuard BG: ${message}`, data || '');
  }
}

// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  debugLog('Extension installed/updated');
  
  // Initialize settings with defaults
  const defaultSettings = {
    enableForInstagram: true,
    enableHighlighting: true,
    enableAutoReplacement: true,
    enableNotifications: true
  };
  
  // Get current settings (if any)
  chrome.storage.sync.get(Object.keys(defaultSettings), (result) => {
    // Create merged settings object (existing settings or defaults)
    const settings = {};
    for (const [key, defaultValue] of Object.entries(defaultSettings)) {
      settings[key] = result[key] !== undefined ? result[key] : defaultValue;
    }
    
    // Save settings
    chrome.storage.sync.set(settings);
    debugLog('Settings initialized', settings);
    
    // Update badge
    updateBadgeText();
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Log message request for debugging
  debugLog('Message received', request);
  
  // Handle different message types
  if (request.type === 'LOG') {
    // Log messages from content script
    debugLog('Content script log', request.message);
    sendResponse({ success: true });
  } 
  else if (request.type === 'GET_SETTINGS') {
    // Return settings to content script if requested
    chrome.storage.sync.get([
      'enableForInstagram',
      'enableHighlighting',
      'enableAutoReplacement',
      'enableNotifications'
    ], (result) => {
      sendResponse({ success: true, settings: result });
    });
    return true; // Indicates we'll respond asynchronously
  }
  else if (request.action === 'triggerTestNotification') {
    // Test notification in the active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, 
          {action: 'testNotification'}, 
          (response) => {
            debugLog('Test notification result', response);
          }
        );
      }
    });
    sendResponse({ success: true });
    return true;
  }
});

// This function checks if all settings are disabled
function checkAllSettingsDisabled() {
  return new Promise(resolve => {
    chrome.storage.sync.get([
      'enableForInstagram',
      'enableHighlighting',
      'enableAutoReplacement',
      'enableNotifications'
    ], (result) => {
      const allDisabled = !result.enableForInstagram && 
                         !result.enableHighlighting && 
                         !result.enableAutoReplacement && 
                         !result.enableNotifications;
      resolve(allDisabled);
    });
  });
}

// Update badge text based on settings
async function updateBadgeText() {
  try {
    const allDisabled = await checkAllSettingsDisabled();
    chrome.action.setBadgeBackgroundColor({ color: allDisabled ? '#888888' : '#474DFF' });
    chrome.action.setBadgeText({ text: allDisabled ? 'OFF' : 'ON' });
    debugLog('Badge updated', allDisabled ? 'OFF' : 'ON');
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Listen for settings changes to update badge
chrome.storage.onChanged.addListener(async (changes) => {
  debugLog('Settings changed', changes);
  updateBadgeText();
});

// Add command to test notification from browser action
chrome.action.onClicked.addListener((tab) => {
  debugLog('Browser action clicked on tab', tab.id);
  
  // Send test notification message to the active tab
  chrome.tabs.sendMessage(tab.id, {action: 'testNotification'}, (response) => {
    debugLog('Test notification result', response);
  });
});

// Log that the background script has loaded
debugLog('Background script loaded and ready');