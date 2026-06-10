/**
 * Campus+ Sync — Utility: Extraction Functions
 *
 * Generic extractors for Oracle PeopleSoft academic pages.
 * Operates strictly on the target academic content document/iframe.
 */

const LOG_PREFIX = '[Campus+]';

/**
 * Locate and return the actual academic content document/iframe (Bug Refactor).
 * @returns {Document} The target document context (iframe or main document)
 */
function getAcademicDocument() {
  const iframe = document.getElementById('ptifrmtgtframe') || document.querySelector('iframe#ptifrmtgtframe');
  if (iframe) {
    try {
      if (iframe.contentDocument) {
        console.log(`${LOG_PREFIX} Target academic iframe found and accessible.`);
        return iframe.contentDocument;
      }
    } catch (e) {
      console.warn(`${LOG_PREFIX} Iframe #ptifrmtgtframe exists but is inaccessible:`, e.message);
    }
  }
  console.log(`${LOG_PREFIX} Operating on main document.`);
  return document;
}

/**
 * Validates whether a value resembles a grade.
 * Validates letter grades (A+, A, A-, B+, B, B-, C+, C, D, F, I, W), GPA (e.g. 8.45), and percentages.
 * @param {string} value
 * @returns {boolean}
 */
function looksLikeGrade(value) {
  if (!value) return false;
  const val = value.trim();
  const letterGradeRegex = /^(?:[A-D][+-]?|[FIW])$/i;
  const numericGradeRegex = /^(?:10(?:\.00?)?|[0-9]\.[0-9]{1,2})$/;
  const percentageRegex = /^\d+(?:\.\d+)?%?$/;
  return letterGradeRegex.test(val) || numericGradeRegex.test(val) || percentageRegex.test(val);
}

/**
 * Extract course information from PeopleSoft page doc.
 * @param {Document|Element} doc - Document to scan
 * @returns {Array<{courseCode: string, courseName: string, instructor: string}>}
 */
function extractCourseInfo(doc = document) {
  const courses = [];
  const seen = new Set();

  // Strategy 1: Find elements by PeopleSoft ID patterns for courses
  const crsePatterns = ['CRSE', 'COURSE', 'CLASS_NAME', 'SUBJECT', 'CATALOG'];
  const allElements = doc.querySelectorAll('[id]');

  for (const el of allElements) {
    const id = el.id.toUpperCase();

    // Prevent matching outer shell navigation items
    if (id.includes('PORTLET') || id.includes('MENU') || id.includes('NAV')) {
      continue;
    }

    for (const pattern of crsePatterns) {
      if (id.includes(pattern)) {
        const text = el.textContent.trim();
        if (text && !seen.has(text)) {
          seen.add(text);
          // Match Thapar course codes precisely
          const codeMatch = text.match(/\b([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\b/i);
          if (codeMatch) {
            const courseCode = codeMatch[1].replace(/\s+/g, '').toUpperCase();
            let courseName = text.replace(codeMatch[0], '').trim();
            courseName = courseName.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();
            
            // Skip general navigation strings
            if (courseName.toLowerCase().includes('view my') || courseName.toLowerCase().includes('grade book')) {
              continue;
            }

            if (!courseName) {
              courseName = text;
            }
            courses.push({
              courseCode: courseCode,
              courseName: courseName,
              instructor: '',
            });
            console.log(`${LOG_PREFIX} Found course: ${courseCode} - ${courseName}`);
          }
        }
        break;
      }
    }
  }

  // Strategy 2: Search PeopleSoft tables for course data inside doc
  const tables = doc.querySelectorAll('table.PSLEVEL1GRID, table.PSLEVEL2GRID, table.PSLEVEL1GRIDWBO');
  for (const table of tables) {
    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th');
      for (const cell of cells) {
        const text = cell.textContent.trim();
        const courseMatch = text.match(/\b([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\b/i);
        if (courseMatch && !seen.has(text)) {
          seen.add(text);
          const courseCode = courseMatch[1].replace(/\s+/g, '').toUpperCase();
          let courseName = text.replace(courseMatch[0], '').trim();
          courseName = courseName.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();
          
          if (courseName.toLowerCase().includes('view my') || courseName.toLowerCase().includes('grade book')) {
            continue;
          }

          if (!courseName) {
            courseName = text;
          }
          courses.push({
            courseCode: courseCode,
            courseName: courseName,
            instructor: '',
          });
          console.log(`${LOG_PREFIX} Found course in table: ${courseCode}`);
        }
      }
    }
  }

  return courses;
}

/**
 * Extract grade information from PeopleSoft page doc.
 * @param {Document|Element} doc - Document to scan
 * @returns {Array<{grade: string, percentage: string}>}
 */
function extractGrades(doc = document) {
  const grades = [];
  const seen = new Set();

  // Strategy 1: Find elements by PeopleSoft GRADE ID patterns in doc
  const gradePatterns = ['GRADE', 'GRD', 'MARK', 'SCORE', 'PERCENTAGE', 'PERCENT', 'GPA'];
  const allElements = doc.querySelectorAll('[id]');

  for (const el of allElements) {
    const id = el.id.toUpperCase();

    // Skip menu / outer elements
    if (id.includes('PORTLET') || id.includes('MENU') || id.includes('NAV')) {
      continue;
    }

    for (const pattern of gradePatterns) {
      if (id.includes(pattern)) {
        const text = el.textContent.trim();
        if (text && !seen.has(id)) {
          seen.add(id);

          const gradeEntry = { grade: '', percentage: '' };

          if (looksLikeGrade(text)) {
            if (/^\d+(\.\d+)?%?$/.test(text)) {
              gradeEntry.percentage = text.replace('%', '').trim();
              console.log(`${LOG_PREFIX} Found percentage: ${text}`);
            } else {
              // Ensure we don't accidentally match page titles
              if (text.toLowerCase().includes('grade book') || text.toLowerCase().includes('assignment')) {
                continue;
              }
              gradeEntry.grade = text.toUpperCase();
              console.log(`${LOG_PREFIX} Found grade: ${text}`);
            }
          }

          if (gradeEntry.grade || gradeEntry.percentage) {
            grades.push(gradeEntry);
          }
        }
        break;
      }
    }
  }

  // Strategy 2: Search PeopleSoft grade tables inside doc
  const tables = doc.querySelectorAll('table.PSLEVEL1GRID, table.PSLEVEL2GRID, table.PSLEVEL1GRIDWBO');
  for (const table of tables) {
    const headers = Array.from(table.querySelectorAll('th')).map((th) => th.textContent.trim().toUpperCase());
    const gradeColIdx = headers.findIndex((h) =>
      h.includes('GRADE') || h.includes('MARK') || h.includes('GPA')
    );
    const pctColIdx = headers.findIndex((h) =>
      h.includes('PERCENT') || h.includes('PCT') || h.includes('%')
    );

    if (gradeColIdx !== -1 || pctColIdx !== -1) {
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) continue;

        const gradeEntry = { grade: '', percentage: '' };
        if (gradeColIdx !== -1 && cells[gradeColIdx]) {
          const val = cells[gradeColIdx].textContent.trim();
          if (looksLikeGrade(val) && !val.toLowerCase().includes('grade book')) {
            gradeEntry.grade = val;
          }
        }
        if (pctColIdx !== -1 && cells[pctColIdx]) {
          const val = cells[pctColIdx].textContent.trim().replace('%', '');
          if (looksLikeGrade(val)) {
            gradeEntry.percentage = val;
          }
        }

        if ((gradeEntry.grade || gradeEntry.percentage) && !seen.has(JSON.stringify(gradeEntry))) {
          seen.add(JSON.stringify(gradeEntry));
          grades.push(gradeEntry);
          console.log(`${LOG_PREFIX} Found grade in table: ${gradeEntry.grade || gradeEntry.percentage}`);
        }
      }
    }
  }

  return grades;
}

/**
 * Ignored as per refactoring requests. Returns empty array.
 * @returns {Array} Empty array
 */
function extractAssignments() {
  return [];
}

/**
 * Ignored as per refactoring requests. Returns empty string.
 * @returns {string} Empty string
 */
function extractSemesterInfo() {
  return '';
}
