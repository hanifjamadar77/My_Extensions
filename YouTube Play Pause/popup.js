const toggleBtn = document.getElementById('toggleBtn');
const statusText = document.getElementById('statusText');
const statusIndicator = document.getElementById('statusIndicator');

// Update UI based on current state
function updateUI(enabled) {
  if (enabled) {
    statusText.textContent = 'Extension is ON';
    toggleBtn.textContent = 'Turn OFF';
    statusIndicator.classList.remove('disabled');
  } else {
    statusText.textContent = 'Extension is OFF';
    toggleBtn.textContent = 'Turn ON';
    statusIndicator.classList.add('disabled');
  }
}

// Get current state on popup open
setTimeout(() => {
  try {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (!response || chrome.runtime.lastError) {
        updateUI(true);
        return;
      }
      
      if (typeof response.enabled === 'boolean') {
        updateUI(response.enabled);
      } else {
        updateUI(true);
      }
    });
  } catch (error) {
    updateUI(true);
  }
}, 200);

// Handle toggle button click
toggleBtn.addEventListener('click', () => {
  try {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (!response || chrome.runtime.lastError) return;
      
      const currentState = typeof response.enabled === 'boolean' ? response.enabled : true;
      const newState = !currentState;
      
      chrome.runtime.sendMessage({ action: 'toggle', enabled: newState }, (toggleResponse) => {
        if (!toggleResponse || chrome.runtime.lastError) return;
        updateUI(newState);
      });
    });
  } catch (error) {
    // Handle error silently
  }
});