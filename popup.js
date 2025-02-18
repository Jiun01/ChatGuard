// Handles the extension popup interface
document.addEventListener('DOMContentLoaded', () => {
    // Load current settings
    chrome.storage.local.get(['detectionEnabled', 'offensiveWords'], (data) => {
      document.getElementById('enableDetection').checked = data.detectionEnabled;
      
      // Display word list
      const wordList = document.getElementById('wordList');
      if (data.offensiveWords) {
        wordList.innerHTML = '<h3>Monitored Words:</h3>' +
          data.offensiveWords.map(word => `<div>${word}</div>`).join('');
      }
    });
  
    // Save settings when changed
    document.getElementById('enableDetection').addEventListener('change', (e) => {
      chrome.storage.local.set({ detectionEnabled: e.target.checked });
    });
  });