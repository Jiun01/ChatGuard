document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.local.get(['enableProtection', 'highlightWords', 'autoReplace', 'showNotifications'], function(data) {
    document.getElementById('enableProtection').checked = data.enableProtection ?? true;
    document.getElementById('highlightWords').checked = data.highlightWords ?? true;
    document.getElementById('autoReplace').checked = data.autoReplace ?? true;
    document.getElementById('showNotifications').checked = data.showNotifications ?? true;
    updateStatus();
  });

  // Save settings when changed
  const toggles = document.querySelectorAll('.switch input');
  toggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
      const setting = {
        [this.id]: this.checked
      };
      chrome.storage.local.set(setting);
      updateStatus();
    });
  });

  // Open settings page
  document.getElementById('openSettings').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Update status text
  function updateStatus() {
    const isEnabled = document.getElementById('enableProtection').checked;
    const status = document.querySelector('.status');
    status.textContent = isEnabled ? 'Protection Active' : 'Protection Disabled';
    status.style.color = isEnabled ? 'var(--risd-blue)' : '#666';
  }
});
