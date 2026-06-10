/**
 * Campus+ Sync — Data Viewer Script
 *
 * Displays stored sync data as prettified, syntax-highlighted JSON
 * in a full-page viewer. Supports copy to clipboard and clear all.
 */

const VIEWER_LOG = '[Campus+]';

const contentEl = document.getElementById('content');
const statsRow = document.getElementById('statsRow');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const toast = document.getElementById('toast');

let currentData = null;

// ── Load and Display Data ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});

async function loadData() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STORED_DATA' });

    if (response && response.success && response.data.syncs.length > 0) {
      currentData = response.data;
      renderStats(currentData);
      renderJSON(currentData);
    } else {
      renderEmptyState();
    }
  } catch (error) {
    console.error(`${VIEWER_LOG} Error loading data:`, error);
    contentEl.innerHTML = `<div class="empty-state"><h2>Error Loading Data</h2><p>${error.message}</p></div>`;
  }
}

/**
 * Render statistics cards.
 */
function renderStats(data) {
  const totalSyncs = data.syncs.length;
  const totalCourses = data.syncs.reduce((sum, s) => sum + (s.courses ? s.courses.length : 0), 0);
  const totalAssignments = data.syncs.reduce((sum, s) => {
    if (!s.courses) return sum;
    return sum + s.courses.reduce((cSum, c) => cSum + (c.assignments ? c.assignments.length : 0), 0);
  }, 0);
  const lastSync = data.syncs[data.syncs.length - 1];
  const lastSyncTime = lastSync ? new Date(lastSync.timestamp).toLocaleString('en-IN') : 'N/A';

  statsRow.innerHTML = `
    <div class="stat-card">
      <span class="stat-value">${totalSyncs}</span>
      <span class="stat-label">Total Syncs</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${totalCourses}</span>
      <span class="stat-label">Courses Found</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${totalAssignments}</span>
      <span class="stat-label">Assignments</span>
    </div>
    <div class="stat-card">
      <span class="stat-value" style="font-size: 14px; line-height: 2;">${lastSyncTime}</span>
      <span class="stat-label">Last Sync</span>
    </div>
  `;
}

/**
 * Render syntax-highlighted JSON.
 */
function renderJSON(data) {
  const jsonString = JSON.stringify(data, null, 2);
  const highlighted = syntaxHighlight(jsonString);

  contentEl.innerHTML = `
    <div class="json-container">
      <pre>${highlighted}</pre>
    </div>
  `;
}

/**
 * Apply syntax highlighting to JSON string.
 * @param {string} json - Formatted JSON string
 * @returns {string} HTML with syntax highlighting spans
 */
function syntaxHighlight(json) {
  // Escape HTML first
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[{}\[\],])/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      } else if (/[{}\[\],]/.test(match)) {
        cls = 'json-bracket';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

/**
 * Render empty state when no data exists.
 */
function renderEmptyState() {
  statsRow.innerHTML = '';
  contentEl.innerHTML = `
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="16" width="40" height="36" rx="4" stroke="#64748B" stroke-width="2" fill="none"/>
        <path d="M20 28H44M20 36H36M20 44H40" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
        <circle cx="32" cy="10" r="4" stroke="#64748B" stroke-width="2" fill="none"/>
      </svg>
      <h2>No Data Yet</h2>
      <p>Visit campus.thapar.edu and click "Sync Current Page" to start extracting data.</p>
    </div>
  `;
}

// ── Copy Button ──────────────────────────────────────────────────────
copyBtn.addEventListener('click', async () => {
  if (!currentData) return;

  try {
    await navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
    showToast('Copied to clipboard!');
    console.log(`${VIEWER_LOG} Data copied to clipboard`);
  } catch (error) {
    console.error(`${VIEWER_LOG} Copy failed:`, error);
    showToast('Copy failed');
  }
});

// ── Clear Button ─────────────────────────────────────────────────────
clearBtn.addEventListener('click', async () => {
  if (!currentData) return;

  try {
    const response = await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });
    if (response && response.success) {
      currentData = null;
      renderEmptyState();
      showToast('All data cleared');
      console.log(`${VIEWER_LOG} All data cleared`);
    }
  } catch (error) {
    console.error(`${VIEWER_LOG} Clear failed:`, error);
    showToast('Clear failed');
  }
});

/**
 * Show a brief toast notification.
 * @param {string} message
 */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}
