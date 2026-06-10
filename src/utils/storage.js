/**
 * Campus+ Sync — Utility: Storage Operations
 *
 * Functions for saving, retrieving, and exporting extracted data
 * using chrome.storage.local.
 */

const STORAGE_KEY = 'campusPlusData';
const LOG_PREFIX_STORAGE = '[Campus+]';

/**
 * Save extracted data to chrome.storage.local.
 * Merges new data with existing stored data (appends new sync entries).
 * @param {object} extractedData - The structured data from extraction
 * @returns {Promise<void>}
 */
async function saveData(extractedData) {
  try {
    const existing = await chrome.storage.local.get(STORAGE_KEY);
    const storedData = existing[STORAGE_KEY] || { syncs: [] };

    // Add the new extraction as a sync entry
    storedData.syncs.push(extractedData);

    // Keep only the last 50 syncs to avoid storage overflow
    if (storedData.syncs.length > 50) {
      storedData.syncs = storedData.syncs.slice(-50);
    }

    await chrome.storage.local.set({ [STORAGE_KEY]: storedData });

    // Also update the last sync timestamp
    await chrome.storage.local.set({
      lastSyncTimestamp: extractedData.timestamp,
    });

    console.log(`${LOG_PREFIX_STORAGE} Data saved successfully. Total syncs: ${storedData.syncs.length}`);
  } catch (error) {
    console.error(`${LOG_PREFIX_STORAGE} Error saving data:`, error);
    throw error;
  }
}

/**
 * Retrieve all stored data from chrome.storage.local.
 * @returns {Promise<object>} The stored data object
 */
async function getStoredData() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || { syncs: [] };
  } catch (error) {
    console.error(`${LOG_PREFIX_STORAGE} Error retrieving data:`, error);
    return { syncs: [] };
  }
}

/**
 * Export stored data as a downloadable JSON file.
 * Creates a Blob and triggers a download named "campus-data.json".
 * @returns {Promise<void>}
 */
async function exportData() {
  try {
    const data = await getStoredData();

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'campus-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`${LOG_PREFIX_STORAGE} Data exported as campus-data.json`);
  } catch (error) {
    console.error(`${LOG_PREFIX_STORAGE} Error exporting data:`, error);
    throw error;
  }
}

/**
 * Get the last sync timestamp from storage.
 * @returns {Promise<string|null>}
 */
async function getLastSyncTimestamp() {
  try {
    const result = await chrome.storage.local.get('lastSyncTimestamp');
    return result.lastSyncTimestamp || null;
  } catch (error) {
    console.error(`${LOG_PREFIX_STORAGE} Error getting last sync timestamp:`, error);
    return null;
  }
}

/**
 * Clear all stored data.
 * @returns {Promise<void>}
 */
async function clearStoredData() {
  try {
    await chrome.storage.local.remove([STORAGE_KEY, 'lastSyncTimestamp']);
    console.log(`${LOG_PREFIX_STORAGE} All stored data cleared.`);
  } catch (error) {
    console.error(`${LOG_PREFIX_STORAGE} Error clearing data:`, error);
    throw error;
  }
}
