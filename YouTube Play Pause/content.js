// Get YouTube video player
function getVideo() {
  return document.querySelector('video');
}

// Check if extension context is valid
function isExtensionValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch {
    return false;
  }
}

// Handle messages from background script
try {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isExtensionValid()) return false;
    
    const video = getVideo();
    
    if (!video) {
      try { sendResponse({ success: false }); } catch {}
      return true;
    }

    try {
      if (request.action === 'pause' && !video.paused) {
        video.pause();
        video.dataset.autoPaused = 'true';
        try { sendResponse({ success: true }); } catch {}
      } else if (request.action === 'play' && video.paused && video.dataset.autoPaused === 'true') {
        video.play();
        delete video.dataset.autoPaused;
        try { sendResponse({ success: true }); } catch {}
      } else {
        try { sendResponse({ success: true }); } catch {}
      }
    } catch {}

    return true;
  });
} catch {}

// Handle app/window switching
document.addEventListener('visibilitychange', () => {
  if (!isExtensionValid()) return;
  
  const video = getVideo();
  if (!video) return;

  try {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (chrome.runtime.lastError || !isExtensionValid()) return;
      if (!response || !response.enabled) return;

      if (document.hidden && !video.paused) {
        video.pause();
        video.dataset.autoPaused = 'true';
      } else if (!document.hidden && video.paused && video.dataset.autoPaused === 'true') {
        video.play();
        delete video.dataset.autoPaused;
      }
    });
  } catch {}
});