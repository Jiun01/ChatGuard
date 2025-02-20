document.addEventListener('DOMContentLoaded', function() {
  loadWords();

  document.getElementById('addWord').addEventListener('click', addWord);
  document.getElementById('newWord').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addWord();
  });
});

function loadWords() {
  chrome.storage.local.get('filteredWords', function(data) {
    const words = data.filteredWords || [];
    displayWords(words);
  });
}

function addWord() {
  const input = document.getElementById('newWord');
  const word = input.value.trim().toLowerCase();
  
  if (word) {
    chrome.storage.local.get('filteredWords', function(data) {
      const words = data.filteredWords || [];
      if (!words.includes(word)) {
        words.push(word);
        chrome.storage.local.set({ filteredWords: words }, function() {
          displayWords(words);
          input.value = '';
        });
      }
    });
  }
}

function displayWords(words) {
  const wordList = document.getElementById('wordList');
  wordList.innerHTML = words.map(word => `
    <div class="word-item">
      <span>${word}</span>
      <span class="remove-btn" onclick="removeWord('${word}')">×</span>
    </div>
  `).join('');
}

function removeWord(word) {
  chrome.storage.local.get('filteredWords', function(data) {
    const words = (data.filteredWords || []).filter(w => w !== word);
    chrome.storage.local.set({ filteredWords: words }, function() {
      displayWords(words);
    });
  });
}