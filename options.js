document.addEventListener('DOMContentLoaded', function() {
    // Load and display current settings
    loadSettings();
    
    // Add word handler
    document.getElementById('addWord').addEventListener('click', addNewWord);
    
    // Settings change handlers
    document.getElementById('caseSensitive').addEventListener('change', updateSettings);
    document.getElementById('replacementType').addEventListener('change', updateSettings);
    document.getElementById('highlightColor').addEventListener('change', updateSettings);
    
    // Reset statistics handler
    document.getElementById('resetStats').addEventListener('click', resetStatistics);
  });
  
  function loadSettings() {
    chrome.storage.local.get([
      'offensiveWords',
      'statistics',
      'caseSensitive',
      'replacementType',
      'highlightColor'
    ], (data) => {
      // Display word list
      displayWordList(data.offensiveWords || []);
      
      // Display statistics
      displayStatistics(data.statistics || {});
      
      // Set current settings
      document.getElementById('caseSensitive').checked = data.caseSensitive || false;
      document.getElementById('replacementType').value = data.replacementType || 'asterisk';
      document.getElementById('highlightColor').value = data.highlightColor || '#ff0000';
    });
  }
  
  function addNewWord() {
    const newWord = document.getElementById('newWord').value.trim();
    if (newWord) {
      chrome.storage.local.get(['offensiveWords'], (data) => {
        const words = data.offensiveWords || [];
        if (!words.includes(newWord)) {
          words.push(newWord);
          chrome.storage.local.set({ offensiveWords: words }, () => {
            displayWordList(words);
            document.getElementById('newWord').value = '';
          });
        }
      });
    }
  }
  
  function displayWordList(words) {
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = words.map(word => `
      <div class="word-item">
        ${word}
        <span class="remove-word" data-word="${word}">×</span>
      </div>
    `).join('');
    
    // Add remove handlers
    document.querySelectorAll('.remove-word').forEach(elem => {
      elem.addEventListener('click', function() {
        removeWord(this.dataset.word);
      });
    });
  }
  
  function removeWord(word) {
    chrome.storage.local.get(['offensiveWords'], (data) => {
      const words = data.offensiveWords.filter(w => w !== word);
      chrome.storage.local.set({ offensiveWords: words }, () => {
        displayWordList(words);
      });
    });
  }
  
  function displayStatistics(stats) {
    const tbody = document.getElementById('statisticsBody');
    tbody.innerHTML = Object.entries(stats).map(([word, count]) => `
      <tr>
        <td>${word}</td>
        <td>${count}</td>
        <td>${new Date().toLocaleString()}</td>
      </tr>
    `).join('');
  }
  
  function resetStatistics() {
    chrome.storage.local.set({ statistics: {} }, () => {
      displayStatistics({});
    });
  }
  
  function updateSettings() {
    const settings = {
      caseSensitive: document.getElementById('caseSensitive').checked,
      replacementType: document.getElementById('replacementType').value,
      highlightColor: document.getElementById('highlightColor').value
    };
    chrome.storage.local.set(settings);
  }
  
  // Updated content.js to handle new settings
  chrome.storage.local.get([
    'detectionEnabled',
    'replacementType',
    'highlightColor'
  ], (settings) => {
    if (settings.detectionEnabled) {
      const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const words = node.textContent.split(/\b/);
          let modified = false;
          
          words.forEach((word, index) => {
            if (word.trim().length > 0) {
              chrome.runtime.sendMessage({ type: "checkWord", word: word }, (response) => {
                if (response && response.isOffensive === 1) {
                  if (settings.replacementType === 'asterisk') {
                    words[index] = '*'.repeat(word.length);
                  } else {
                    // Create highlight span
                    const span = document.createElement('span');
                    span.textContent = word;
                    span.style.backgroundColor = settings.highlightColor;
                    span.style.color = 'white';
                    words[index] = span.outerHTML;
                  }
                  modified = true;
                }
              });
            }
          });
          
          if (modified) {
            const temp = document.createElement('div');
            temp.innerHTML = words.join('');
            while (temp.firstChild) {
              node.parentNode.insertBefore(temp.firstChild, node);
            }
            node.parentNode.removeChild(node);
          }
        } else {
          Array.from(node.childNodes).forEach(processNode);
        }
      };
  
      processNode(document.body);
      
      // Observer for dynamic content
      new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              processNode(node);
            }
          });
        });
      }).observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  });