let offensiveWords = [
    "badword1",
    "badword2",
    "offensive1"
  ];
  
  // Initialize storage with default values
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ 
      offensiveWords: offensiveWords,
      detectionEnabled: true,
      statistics: {},
      replacementType: 'asterisk', // New setting for word replacement style
      caseSensitive: false,       // New setting for case sensitivity
      highlightColor: '#ff0000'   // New setting for highlight color
    });
  });
  
  // Enhanced message handling
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "checkWord") {
      chrome.storage.local.get(['offensiveWords', 'statistics', 'caseSensitive'], (data) => {
        const word = data.caseSensitive ? request.word : request.word.toLowerCase();
        const wordList = data.caseSensitive ? data.offensiveWords : data.offensiveWords.map(w => w.toLowerCase());
        
        const isOffensive = wordList.includes(word);
        
        // Update statistics if word is offensive
        if (isOffensive) {
          const stats = data.statistics || {};
          stats[request.word] = (stats[request.word] || 0) + 1;
          chrome.storage.local.set({ statistics: stats });
        }
        
        sendResponse({ isOffensive: isOffensive ? 1 : 0 });
      });
      return true;
    }
  });