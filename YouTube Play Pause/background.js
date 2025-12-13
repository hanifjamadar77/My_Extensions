// Store extension state
let extensionEnabled = true;
let previousTabId = null;

// Load saved state on startup
chrome.storage.local.get(['enabled'], (result) => {
  extensionEnabled = result.enabled !== undefined ? result.enabled : true;
});

// Inject content script into existing YouTube tabs on startup
chrome.tabs.query({}, (tabs) => {
  tabs.forEach(tab => {
    if (tab.url && tab.url.includes('youtube.com/watch')) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).catch(() => {});
    }
  });
});

// Listen for tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!extensionEnabled) return;

  const newTabId = activeInfo.tabId;
  
  // If there was a previous tab, check if it's YouTube and pause it
  if (previousTabId !== null && previousTabId !== newTabId) {
    try {
      const prevTab = await chrome.tabs.get(previousTabId);
      if (prevTab.url && prevTab.url.includes('youtube.com/watch')) {
        chrome.tabs.sendMessage(previousTabId, { action: 'pause' }).catch(() => {});
      }
    } catch (error) {
      // Tab might have been closed
    }
  }

  // Check if new tab is YouTube and resume it
  try {
    const newTab = await chrome.tabs.get(newTabId);
    if (newTab.url && newTab.url.includes('youtube.com/watch')) {
      setTimeout(() => {
        chrome.tabs.sendMessage(newTabId, { action: 'play' }).catch(() => {});
      }, 300);
    }
  } catch (error) {
    // Handle error
  }

  previousTabId = newTabId;
});

// Listen for window focus changes (switching between apps)
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (!extensionEnabled || windowId === chrome.windows.WINDOW_ID_NONE) return;

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, windowId: windowId });
    if (activeTab && activeTab.url && activeTab.url.includes('youtube.com/watch')) {
      setTimeout(() => {
        chrome.tabs.sendMessage(activeTab.id, { action: 'play' }).catch(() => {});
      }, 300);
    }
  } catch (error) {
    // Handle error
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getState') {
    sendResponse({ enabled: extensionEnabled });
    return false;
  } 
  
  if (request.action === 'toggle') {
    extensionEnabled = request.enabled;
    chrome.storage.local.set({ enabled: extensionEnabled });
    sendResponse({ success: true, enabled: extensionEnabled });
    return false;
  }
  
  return false;
});