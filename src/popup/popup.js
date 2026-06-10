/**
 * Campus+ Sync — Popup Script
 *
 * Handles UI interactions for the extension popup.
 * - Sync Current Page: injects content script and triggers extraction
 * - Export JSON: downloads stored data as campus-data.json
 * - View Stored Data: opens the data viewer page
 *
 * All chrome API calls use async/await. No inline event handlers.
 */

const POPUP_LOG = '[Campus+]';

// ── DOM Elements ─────────────────────────────────────────────────────
const syncBtn = document.getElementById('syncBtn');
const exportBtn = document.getElementById('exportBtn');
const viewBtn = document.getElementById('viewBtn');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const statusCard = document.getElementById('statusCard');
const lastSyncEl = document.getElementById('lastSync');

// Syncing State Flag (Bug 6)
let isSyncing = false;

// ── Initialization ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await updateLastSyncDisplay();
  await checkCurrentTab();
});

/**
 * Check if the current tab is on campus.thapar.edu and update status accordingly.
 */
async function checkCurrentTab() {
  if (isSyncing) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.startsWith('https://campus.thapar.edu')) {
      setStatus('ready', 'Ready');
      syncBtn.disabled = false;
    } else {
      setStatus('inactive', 'Not on campus portal');
      syncBtn.disabled = true;
    }
  } catch (error) {
    console.error(`${POPUP_LOG} Error checking tab:`, error);
    setStatus('error', 'Error checking tab');
  }
}

/**
 * Update the last sync display from storage.
 */
async function updateLastSyncDisplay() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_LAST_SYNC' });
    if (response && response.success && response.timestamp) {
      const date = new Date(response.timestamp);
      lastSyncEl.textContent = formatTimestamp(date);
      lastSyncEl.title = date.toISOString();
    } else {
      lastSyncEl.textContent = 'Never';
    }
  } catch (error) {
    console.error(`${POPUP_LOG} Error getting last sync:`, error);
    lastSyncEl.textContent = 'Never';
  }
}

/**
 * Format a Date to a human-readable relative or absolute timestamp.
 * @param {Date} date
 * @returns {string}
 */
function formatTimestamp(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Set the visual status indicator.
 * @param {'ready'|'syncing'|'success'|'error'|'inactive'} state
 * @param {string} text
 */
function setStatus(state, text) {
  statusText.textContent = text;
  statusCard.className = `status-card status-${state}`;
}

// ── Sync Button Handler ──────────────────────────────────────────────
syncBtn.addEventListener('click', async () => {
  if (isSyncing || syncBtn.disabled) return;

  isSyncing = true;
  setStatus('syncing', 'Syncing...');
  syncBtn.disabled = true;
  exportBtn.disabled = true;
  viewBtn.disabled = true;
  syncBtn.classList.add('loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.url.startsWith('https://campus.thapar.edu')) {
      setStatus('error', 'Not on campus portal');
      return;
    }

    // First, ensure content scripts are injected (they may already be via static declaration)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/utils/extractors.js'],
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/content.js'],
      });
    } catch (injectionError) {
      // Scripts may already be injected via manifest — this is fine
      console.log(`${POPUP_LOG} Script injection note:`, injectionError.message);
    }

    // Send sync message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'SYNC_PAGE' });

    if (response && response.success) {
      // Save data via background service worker
      const saveResponse = await chrome.runtime.sendMessage({
        type: 'SAVE_DATA',
        data: response.data,
      });

      if (saveResponse && saveResponse.success) {
        if (saveResponse.duplicate) {
          setStatus('success', 'Synced (Duplicate ignored)');
        } else {
          setStatus('success', `Synced! (${response.data.courses.length} course(s))`);
        }
        console.log(`${POPUP_LOG} Sync complete. Courses: ${response.data.courses.length}`);
        await updateLastSyncDisplay();
      } else {
        setStatus('error', 'Failed to save data');
        console.error(`${POPUP_LOG} Save failed:`, saveResponse);
      }
    } else {
      const errorMsg = response ? response.error : 'No response from page';
      setStatus('error', 'Extraction failed');
      console.error(`${POPUP_LOG} Extraction failed:`, errorMsg);
    }
  } catch (error) {
    console.error(`${POPUP_LOG} Sync error:`, error);
    setStatus('error', 'Sync failed');
  } finally {
    isSyncing = false;
    syncBtn.disabled = false;
    exportBtn.disabled = false;
    viewBtn.disabled = false;
    syncBtn.classList.remove('loading');

    // Reset status after 3 seconds
    setTimeout(async () => {
      await checkCurrentTab();
    }, 3000);
  }
});

// ── Export Button Handler ────────────────────────────────────────────
exportBtn.addEventListener('click', async () => {
  if (isSyncing) return;
  try {
    exportBtn.disabled = true;
    const response = await chrome.runtime.sendMessage({ type: 'GET_STORED_DATA' });

    if (response && response.success && response.data.syncs.length > 0) {
      const jsonString = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'campus-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`${POPUP_LOG} Data exported as campus-data.json`);
    } else {
      setStatus('error', 'No data to export');
      setTimeout(async () => {
        await checkCurrentTab();
      }, 2000);
    }
  } catch (error) {
    console.error(`${POPUP_LOG} Export error:`, error);
    setStatus('error', 'Export failed');
  } finally {
    exportBtn.disabled = false;
  }
});

// ── View Stored Data Button Handler ──────────────────────────────────
viewBtn.addEventListener('click', async () => {
  try {
    const viewerUrl = chrome.runtime.getURL('src/popup/viewer.html');
    await chrome.tabs.create({ url: viewerUrl });
  } catch (error) {
    console.error(`${POPUP_LOG} Error opening viewer:`, error);
  }
});
