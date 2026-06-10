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
  const letterGradeRegex = /^(?:[A-E][+-]?|[FIWX])$/i;
  const numericGradeRegex = /^(?:10(?:\.00?)?|[0-9]\.[0-9]{1,2})$/;
  const percentageRegex = /^\d+(?:\.\d+)?%$/;
  return letterGradeRegex.test(val) || numericGradeRegex.test(val) || percentageRegex.test(val);
}

/**
 * Tries to find and extract a grade letter or GPA/percentage from a string.
 * @param {string} text
 * @returns {{grade: string, percentage: string}}
 */
function parseGradeFromString(text) {
  if (!text) return null;
  const clean = text.trim();
  
  if (looksLikeGrade(clean)) {
    if (/^\d+(?:\.\d+)?%?$/.test(clean)) {
      return { grade: '', percentage: clean.replace('%', '').trim() };
    } else {
      return { grade: clean.toUpperCase(), percentage: '' };
    }
  }

  const pctMatch = clean.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    const num = parseFloat(pctMatch[1]);
    if (num >= 0 && num <= 100) {
      return { grade: '', percentage: pctMatch[1] };
    }
  }

  const gradeLabelMatch = clean.match(/(?:grade|grd|mark|gpa)\s*[:=-]?\s*\b([A-E][+-]?|[FIWX])\b/i);
  if (gradeLabelMatch) {
    return { grade: gradeLabelMatch[1].toUpperCase(), percentage: '' };
  }

  const gpaMatch = clean.match(/(?:gpa|g.p.a|cgpa)\s*[:=-]?\s*\b(10(?:\.00?)?|[0-9]\.[0-9]{1,2})\b/i);
  if (gpaMatch) {
    return { grade: gpaMatch[1], percentage: '' };
  }

  return null;
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
  const crsePatterns = ['CRSE', 'COURSE', 'CLASS_NAME', 'SUBJECT', 'CATALOG', 'DESCR'];
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
            if (courseName.toLowerCase().includes('view my') || courseName.toLowerCase().includes('grade book') || courseName.toLowerCase().includes('student view')) {
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

  // Strategy 2: Search tables for course data inside doc
  const tables = doc.querySelectorAll('table');
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
          
          if (courseName.toLowerCase().includes('view my') || courseName.toLowerCase().includes('grade book') || courseName.toLowerCase().includes('student view')) {
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

  // Fallback / Strategy 3: Scan all leaf elements for course code pattern
  if (courses.length === 0) {
    const codeToCourse = new Map();
    const allTextElements = doc.querySelectorAll('span, div, td, th, a, h1, h2, h3, h4, b, strong');
    
    for (const el of allTextElements) {
      if (el.children.length > 0) continue;
      const text = el.textContent.trim();
      if (!text) continue;

      const codeMatch = text.match(/\b([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\b/i);
      if (codeMatch) {
        const courseCode = codeMatch[1].replace(/\s+/g, '').toUpperCase();
        let courseName = text.replace(codeMatch[0], '').trim();
        courseName = courseName.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();

        if (courseName.toLowerCase().includes('view my') || courseName.toLowerCase().includes('grade book') || courseName.toLowerCase().includes('student view')) {
          courseName = '';
        }

        const existing = codeToCourse.get(courseCode);
        if (!existing || (courseName && (!existing.courseName || courseName.length > existing.courseName.length))) {
          codeToCourse.set(courseCode, {
            courseCode: courseCode,
            courseName: courseName || courseCode,
            instructor: '',
          });
        }
      }
    }

    for (const course of codeToCourse.values()) {
      courses.push(course);
      console.log(`${LOG_PREFIX} Fallback found course: ${course.courseCode} - ${course.courseName}`);
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

  // Strategy 2: Search all tables inside doc
  const tables = doc.querySelectorAll('table');
  for (const table of tables) {
    const firstRow = table.querySelector('tr');
    if (!firstRow) continue;
    const headers = Array.from(firstRow.querySelectorAll('th, td')).map((el) => el.textContent.trim().toUpperCase());
    
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
          const val = cells[pctColIdx].textContent.trim();
          const cleanVal = val.replace('%', '').trim();
          if (/^\d+(?:\.\d+)?$/.test(cleanVal)) {
            const num = parseFloat(cleanVal);
            if (num >= 0 && num <= 100) {
              gradeEntry.percentage = cleanVal;
            }
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

  // Fallback / Strategy 3: Scan all leaf elements for grade/percentage patterns
  if (grades.length === 0) {
    const allElements = doc.querySelectorAll('span, div, td, th, b, strong');
    for (const el of allElements) {
      if (el.children.length > 0) continue;
      const text = el.textContent.trim();
      if (!text) continue;

      const gradeInfo = parseGradeFromString(text);
      if (gradeInfo) {
        const key = JSON.stringify(gradeInfo);
        if (!seen.has(key)) {
          seen.add(key);
          grades.push(gradeInfo);
          console.log(`${LOG_PREFIX} Fallback found grade/percentage:`, gradeInfo);
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
