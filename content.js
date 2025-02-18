// This script processes the webpage content
function processText(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = node.textContent.split(/\b/);
      let modified = false;
      
      words.forEach((word, index) => {
        if (word.trim().length > 0) {
          chrome.runtime.sendMessage(
            { type: "checkWord", word: word },
            (response) => {
              if (response && response.isOffensive === 1) {
                // Replace offensive word with asterisks
                words[index] = '*'.repeat(word.length);
                modified = true;
              }
            }
          );
        }
      });
  
      if (modified) {
        node.textContent = words.join('');
      }
    } else {
      // Recursively process child nodes
      for (const child of node.childNodes) {
        processText(child);
      }
    }
  }
  
  // Create and apply styles for highlighting
  const style = document.createElement('style');
  style.textContent = `
    .offensive-word {
      background-color: red;
      color: white;
    }
  `;
  document.head.appendChild(style);
  
  // Start processing when page loads
  document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('detectionEnabled', (data) => {
      if (data.detectionEnabled) {
        processText(document.body);
        
        // Also observe DOM changes for dynamic content
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                processText(node);
              }
            });
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  });
