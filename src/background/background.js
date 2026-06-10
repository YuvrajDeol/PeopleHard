/**
 * Campus+ Sync — Background Service Worker
 *
 * Handles extension lifecycle events, message routing between
 * popup and content scripts, and data persistence.
 *
 * All event listeners are registered synchronously at top level
 * per MV3 service worker requirements.
 */

const BG_LOG = '[Campus+]';

// ── Installation Handler ─────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log(`${BG_LOG} Extension installed. Initializing storage...`);
    await chrome.storage.local.set({
      campusPlusData: { syncs: [] },
      lastSyncTimestamp: null,
    });
    console.log(`${BG_LOG} Storage initialized.`);
  } else if (details.reason === 'update') {
    console.log(`${BG_LOG} Extension updated to version ${chrome.runtime.getManifest().version}`);
  }
});

// ── Message Handler ──────────────────────────────────────────────────
// Routes messages between popup ↔ content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_DATA') {
    (async () => {
      try {
        const { data } = message;
        const existing = await chrome.storage.local.get('campusPlusData');
        const storedData = existing.campusPlusData || { syncs: [] };

        // Duplicate sync prevention based on URL and timestamp (Bug 5)
        const isDuplicate = storedData.syncs.some(
          (sync) => sync.pageUrl === data.pageUrl && sync.timestamp === data.timestamp
        );

        if (!isDuplicate) {
          storedData.syncs.push(data);

          // Cap at 50 syncs
          if (storedData.syncs.length > 50) {
            storedData.syncs = storedData.syncs.slice(-50);
          }

          await chrome.storage.local.set({
            campusPlusData: storedData,
            lastSyncTimestamp: data.timestamp,
          });

          console.log(`${BG_LOG} Data saved. Total syncs: ${storedData.syncs.length}`);
          sendResponse({ success: true, syncCount: storedData.syncs.length });
        } else {
          console.log(`${BG_LOG} Duplicate sync ignored for: ${data.pageUrl} at ${data.timestamp}`);
          sendResponse({ success: true, syncCount: storedData.syncs.length, duplicate: true });
        }
      } catch (error) {
        console.error(`${BG_LOG} Save error:`, error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_STORED_DATA') {
    (async () => {
      try {
        const result = await chrome.storage.local.get('campusPlusData');
        const data = result.campusPlusData || { syncs: [] };
        sendResponse({ success: true, data: data });
      } catch (error) {
        console.error(`${BG_LOG} Retrieval error:`, error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'CLEAR_DATA') {
    (async () => {
      try {
        await chrome.storage.local.set({
          campusPlusData: { syncs: [] },
          lastSyncTimestamp: null,
        });
        console.log(`${BG_LOG} All data cleared.`);
        sendResponse({ success: true });
      } catch (error) {
        console.error(`${BG_LOG} Clear error:`, error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'GET_LAST_SYNC') {
    (async () => {
      try {
        const result = await chrome.storage.local.get('lastSyncTimestamp');
        sendResponse({ success: true, timestamp: result.lastSyncTimestamp || null });
      } catch (error) {
        console.error(`${BG_LOG} Get last sync error:`, error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});

console.log(`${BG_LOG} Background service worker started.`);
