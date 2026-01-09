// 🔔 Debug (remove later)
alert("AI Chat Navigator content script loaded");

// ===============================
// AI Chat Navigator – Content Script
// ===============================
const seenQuestions = new Set();

// Extract ChatGPT chat ID from URL
function getChatId() {
  const match =
    location.pathname.match(/\/c\/([^/]+)/) ||
    location.pathname.match(/\/conversation\/([^/]+)/);

  return match ? match[1] : "new-chat";
}

function loadSeenQuestions() {
  seenQuestions.clear();

  const chatId = getChatId();
  chrome.storage.local.get("aiNavigator", (data) => {
    const questions = data.aiNavigator?.[chatId] || [];
    questions.forEach(q => seenQuestions.add(q.text));
  });
}

// Load when script runs
loadSeenQuestions();

// Save a user question
function saveQuestion(text, element) {
  if (!text) return;

  // 🚫 Prevent duplicate saving
  if (seenQuestions.has(text)) return;

  seenQuestions.add(text);

  const chatId = getChatId();
  const id = "q-" + Date.now();

  element.dataset.aiNavId = id;

  chrome.storage.local.get("aiNavigator", (data) => {
    const store = data.aiNavigator || {};
    store[chatId] ??= [];
    store[chatId].push({ id, text });

    chrome.storage.local.set({ aiNavigator: store });
  });
}


// Observe DOM for new user messages
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;

      // ChatGPT user message container
      const userBlock =
        node.matches?.('[data-message-author-role="user"]')
          ? node
          : node.querySelector?.('[data-message-author-role="user"]');

      if (userBlock && !userBlock.dataset.aiNavTracked) {
        userBlock.dataset.aiNavTracked = "true";
        saveQuestion(userBlock.innerText.trim(), userBlock);
      }
    }
  }
});

// Start observing AFTER DOM is ready
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for popup scroll requests
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "SCROLL_TO") {
    const el = document.querySelector(
      `[data-ai-nav-id="${msg.id}"]`
    );

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.outline = "2px solid #6366f1";
      setTimeout(() => (el.style.outline = ""), 1200);
    }
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "CLEAR_CHAT") {
    seenQuestions.clear();
  }
});
// ===============================