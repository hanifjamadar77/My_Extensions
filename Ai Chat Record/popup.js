chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab || !tab.url) return;

  const chatId = getChatIdFromUrl(tab.url);
  if (!chatId) return;

  const list = document.getElementById("list");
  const clearBtn = document.getElementById("clear");

  // Load questions for this chat
  chrome.storage.local.get("aiNavigator", (data) => {
    const questions = data.aiNavigator?.[chatId] || [];
    list.innerHTML = "";

    if (questions.length === 0) {
      list.innerHTML = "<li>No questions yet</li>";
      return;
    }

    questions.forEach((q) => {
      const li = document.createElement("li");
      li.textContent = q.text;

      // ✅ CLICK QUESTION → SCROLL
      li.onclick = () => {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "SCROLL_TO", id: q.id },
          () => {
            if (chrome.runtime.lastError) {
              // Content script not available – ignore
              return;
            }
          }
        );
      };

      list.appendChild(li);
    });
  });

  // 🗑 CLEAR QUESTIONS FOR THIS CHAT
  clearBtn.onclick = () => {
    chrome.storage.local.get("aiNavigator", (data) => {
      const store = data.aiNavigator || {};
      delete store[chatId];

      chrome.storage.local.set({ aiNavigator: store }, () => {
        // Notify content script safely
        chrome.tabs.sendMessage(
          tab.id,
          { action: "CLEAR_CHAT" },
          () => {
            if (chrome.runtime.lastError) {
              return;
            }
          }
        );

        list.innerHTML = "<li>No questions yet</li>";
      });
    });
  };
});

function getChatIdFromUrl(url) {
  const match =
    url.match(/\/c\/([^/]+)/) ||
    url.match(/\/conversation\/([^/]+)/);

  return match ? match[1] : null;
}
