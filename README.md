# Campus+ Sync

> Chrome Extension (Manifest V3) for automatic academic data extraction from Thapar University's Oracle PeopleSoft portal (`campus.thapar.edu`).

## ✨ Features

- **Auto-extract** course names, codes, grades, percentages, assignments, and instructor info
- **Generic PeopleSoft parser** — works across multiple page types (grade pages, assignment views, course rosters)
- **Local storage** — all data stays in your browser via `chrome.storage.local`
- **Export to JSON** — download structured data as `campus-data.json`
- **Data viewer** — prettified, syntax-highlighted JSON viewer in a new tab
- **Privacy first** — no backend, no login automation, no passwords, no external data transmission

## 📁 Folder Structure

```
PeopleHard/
├── manifest.json
├── README.md
└── src/
    ├── styles.css
    ├── background/
    │   └── background.js         # Service worker (message routing, storage)
    ├── content/
    │   └── content.js            # Page extraction orchestrator
    ├── popup/
    │   ├── popup.html            # Extension popup UI
    │   ├── popup.js              # Popup logic & button handlers
    │   ├── viewer.html           # Full-page data viewer
    │   └── viewer.js             # Viewer logic & JSON rendering
    └── utils/
        ├── extractors.js         # Generic PeopleSoft data extractors
        └── storage.js            # Chrome storage operations
```

## 🚀 Setup & Installation

### Prerequisites
- Google Chrome (version 99 or higher)

### Load as Unpacked Extension

1. **Clone or download** this repository to your local machine.

2. **Open Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** — toggle the switch in the top-right corner.

4. **Click "Load unpacked"** — select the `PeopleHard/` folder (the folder containing `manifest.json`).

5. The extension icon will appear in your Chrome toolbar. If you don't see it, click the puzzle piece icon (Extensions menu) and pin **Campus+ Sync**.

### Verify Installation

1. Navigate to [https://campus.thapar.edu](https://campus.thapar.edu)
2. Click the **Campus+ Sync** extension icon
3. The popup should show **Status: Ready**
4. Open Chrome DevTools (F12) → Console tab to see `[Campus+]` log messages

## 📖 Usage

### Sync Current Page
1. Navigate to any page on `campus.thapar.edu` (grades, assignments, course info)
2. Click the extension icon → **Sync Current Page**
3. The extension extracts visible academic data and saves it locally

### Export JSON
1. Click the extension icon → **Export JSON**
2. A file named `campus-data.json` will download to your default downloads folder

### View Stored Data
1. Click the extension icon → **View Stored Data**
2. A new tab opens showing all stored sync data with:
   - Stats cards (total syncs, courses, assignments)
   - Syntax-highlighted JSON
   - Copy to clipboard button
   - Clear all data button

## 📊 Data Format

```json
{
  "syncs": [
    {
      "timestamp": "2026-06-10T12:30:00.000Z",
      "pageTitle": "Student Grades",
      "pageUrl": "https://campus.thapar.edu/...",
      "semester": "Monsoon Semester 2025-26",
      "courses": [
        {
          "courseCode": "UCS101",
          "courseName": "Introduction to Programming",
          "grade": "A",
          "percentage": "92.5",
          "instructor": "Dr. John Doe",
          "assignments": [
            {
              "name": "Assignment 1",
              "category": "Assignment",
              "score": "45",
              "maxMarks": "50"
            }
          ]
        }
      ]
    }
  ]
}
```

## 🔍 How Extraction Works

The extractor is **generic** and does NOT hardcode specific page elements. It searches for:

| Pattern | Purpose |
|---------|---------|
| IDs containing `CRSE`, `COURSE`, `SUBJECT`, `CATALOG` | Course information |
| IDs containing `GRADE`, `GRD`, `MARK`, `SCORE`, `PERCENTAGE` | Grade data |
| IDs containing `ASSIGN`, `HOMEWORK`, `QUIZ`, `EXAM`, `LAB`, `PROJECT` | Assignment data |
| IDs containing `INSTRUCTOR`, `INSTR`, `FACULTY` | Instructor names |
| IDs containing `TERM`, `SEMESTER`, `STRM` | Semester info |
| PeopleSoft table classes (`PSLEVEL1GRID`, `PSLEVEL2GRID`, etc.) | Structured table data |

If no PeopleSoft-specific patterns are found, a **deep table scan** fallback extracts data from any visible tables with academic-looking headers.

## 🛡️ Privacy & Security

- ❌ No external backend or API calls
- ❌ No login automation
- ❌ No password storage
- ❌ No data leaves your browser
- ✅ Only activates on `campus.thapar.edu`
- ✅ All data stored locally via `chrome.storage.local`
- ✅ Export is a local file download

## 🐛 Debugging

Open Chrome DevTools (F12) on any `campus.thapar.edu` page. Look for `[Campus+]` prefixed messages:

```
[Campus+] Content script loaded on: https://campus.thapar.edu/...
[Campus+] Received SYNC_PAGE request
[Campus+] Found course: UCS101 - Introduction to Programming
[Campus+] Found grade: A
[Campus+] Found assignment: Assignment 1 (45/50)
[Campus+] Extraction complete. Found 1 course(s), 3 assignment(s).
[Campus+] Sync complete
```

To inspect the background service worker, go to `chrome://extensions/` → Campus+ Sync → click "Inspect views: service worker".

## 📝 License

This extension is for personal academic use only. Not affiliated with Thapar University.
