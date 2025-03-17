// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('ChatGuard extension installed');
  
  chrome.storage.sync.get([
    'enableForInstagram',
    'enableHighlighting',
    'enableAutoReplacement',
    'enableNotifications'
  ], (result) => {
    // Set default values if not already set
    const defaults = {
      enableForInstagram: result.enableForInstagram !== undefined ? result.enableForInstagram : true,
      enableHighlighting: result.enableHighlighting !== undefined ? result.enableHighlighting : true,
      enableAutoReplacement: result.enableAutoReplacement !== undefined ? result.enableAutoReplacement : true,
      enableNotifications: result.enableNotifications !== undefined ? result.enableNotifications : true
    };
    
    chrome.storage.sync.set(defaults);
    console.log('Default settings initialized:', defaults);
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle any message routing that might be needed
  if (request.type === 'LOG') {
    // Log messages from content script (useful for debugging)
    console.log('Content script log:', request.message);
    sendResponse({ success: true });
  } else if (request.type === 'GET_SETTINGS') {
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
});

// Optional: Set up badge or icon to indicate extension is active
chrome.action.setBadgeBackgroundColor({ color: '#474DFF' });
chrome.action.setBadgeText({ text: 'ON' });

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

// Setup badge color
chrome.action.setBadgeBackgroundColor({ color: '#474DFF' });

// Check settings on installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('ChatGuard extension installed');
  
  chrome.storage.sync.get([
    'enableForInstagram',
    'enableHighlighting',
    'enableAutoReplacement',
    'enableNotifications'
  ], (result) => {
    // Set default values if not already set
    const defaults = {
      enableForInstagram: result.enableForInstagram !== undefined ? result.enableForInstagram : true,
      enableHighlighting: result.enableHighlighting !== undefined ? result.enableHighlighting : true,
      enableAutoReplacement: result.enableAutoReplacement !== undefined ? result.enableAutoReplacement : true,
      enableNotifications: result.enableNotifications !== undefined ? result.enableNotifications : true
    };
    
    chrome.storage.sync.set(defaults);
    console.log('Default settings initialized:', defaults);
    
    // Set badge text based on settings
    updateBadgeText();
  });
});

// Update badge text based on settings
async function updateBadgeText() {
  const allDisabled = await checkAllSettingsDisabled();
  chrome.action.setBadgeText({ text: allDisabled ? 'OFF' : 'ON' });
}

// Listen for settings changes to update badge
chrome.storage.onChanged.addListener(async (changes) => {
  updateBadgeText();
});