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
 * Validates letter grades (A+, A, A-, B+, B, B-, C+, C, C-, D, F, I, W).
 * @param {string} value
 * @returns {boolean}
 */
function looksLikeGrade(value) {
  if (!value) return false;
  const val = value.trim();
  const letterGradeRegex = /^(?:[A-C][+-]?|[DFIW])$/i;
  return letterGradeRegex.test(val);
}

/**
 * Validates if a course code is valid according to prefix whitelist and rejects dates.
 * @param {string} code
 * @returns {boolean}
 */
function isValidCourseCode(code) {
  if (!code) return false;
  const cleaned = code.trim().toUpperCase();

  // Reject date-like values
  const datePattern = /^(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\d{4}$/i;
  if (datePattern.test(cleaned)) {
    return false;
  }

  // Extract alphabetical prefix
  const prefixMatch = cleaned.match(/^([A-Z]{2,5})/);
  if (!prefixMatch) return false;

  const prefix = prefixMatch[1];
  const whitelist = [
    "UCS", "UEC", "UTA", "UMA", "UHU", "UEN", "ENC",
    "TMA", "TCS", "TEC", "ECE", "COE", "MEE", "CHE", "CIE"
  ];

  return whitelist.includes(prefix);
}

/**
 * Extract course information from PeopleSoft page doc.
 * @param {Document|Element} doc - Document to scan
 * @returns {Array<{courseCode: string, courseName: string, instructor: string}>}
 */
function extractCourseInfo(doc = document) {
  const courses = [];
  const seenCodes = new Set();

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
        if (text) {
          const codeMatch = text.match(/\b([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\b/i);
          if (codeMatch) {
            const code = codeMatch[1].replace(/\s+/g, '').toUpperCase();
            if (isValidCourseCode(code) && !seenCodes.has(code)) {
              seenCodes.add(code);
              let name = text.replace(codeMatch[0], '').trim();
              name = name.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();
              
              if (name.toLowerCase().includes('view my') || name.toLowerCase().includes('grade book') || name.toLowerCase().includes('student view')) {
                name = '';
              }
              courses.push({
                courseCode: code,
                courseName: name || code,
                instructor: ''
              });
              console.log(`${LOG_PREFIX} Found course: ${code} - ${name}`);
            }
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
    if (rows.length < 2) continue;

    const firstRow = rows[0];
    const headers = Array.from(firstRow.querySelectorAll('th, td')).map(el => el.textContent.trim().toUpperCase());
    const crseColIdx = headers.findIndex(h => h.includes('CRSE') || h.includes('COURSE') || h.includes('SUBJECT') || h.includes('CLASS'));

    if (crseColIdx !== -1) {
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length === 0) continue;

        const cellText = cells[crseColIdx].textContent.trim();
        const codeMatch = cellText.match(/\b([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\b/i);
        if (codeMatch) {
          const code = codeMatch[1].replace(/\s+/g, '').toUpperCase();
          if (isValidCourseCode(code) && !seenCodes.has(code)) {
            seenCodes.add(code);
            let name = cellText.replace(codeMatch[0], '').trim();
            name = name.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();
            courses.push({
              courseCode: code,
              courseName: name || code,
              instructor: ''
            });
            console.log(`${LOG_PREFIX} Found course in table: ${code}`);
          }
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
        if (isValidCourseCode(courseCode)) {
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
              instructor: ''
            });
          }
        }
      }
    }

    for (const course of codeToCourse.values()) {
      if (!seenCodes.has(course.courseCode)) {
        seenCodes.add(course.courseCode);
        courses.push(course);
        console.log(`${LOG_PREFIX} Fallback found course: ${course.courseCode} - ${course.courseName}`);
      }
    }
  }

  return courses;
}

/**
 * Extract overall letter grade independently.
 * @param {Document|Element} doc
 * @returns {string} Overall letter grade or empty string
 */
function extractOverallGrade(doc = document) {
  const gradePatterns = ['CRSE_GRADE', 'GRADE_INPUT', 'OVERALL_GRADE'];
  const allElements = doc.querySelectorAll('[id]');
  
  for (const el of allElements) {
    const id = el.id.toUpperCase();
    if (gradePatterns.some(pat => id.includes(pat))) {
      const text = el.textContent.trim();
      if (looksLikeGrade(text)) {
        console.log(`[Campus+] Found overall grade by ID (${el.id}): ${text}`);
        return text.toUpperCase();
      }
    }
  }

  const elements = doc.querySelectorAll('span, div, td, th, b, strong');
  for (const el of elements) {
    if (el.children.length > 0) continue;
    const text = el.textContent.trim();
    if (looksLikeGrade(text)) {
      const parentText = el.parentElement ? el.parentElement.textContent.toLowerCase() : '';
      if (parentText.includes('overall') || parentText.includes('final') || parentText.includes('course grade')) {
        console.log(`[Campus+] Found overall grade in context scan: ${text}`);
        return text.toUpperCase();
      }
    }
  }

  return '';
}

/**
 * Extract overall percentage independently.
 * @param {Document|Element} doc
 * @returns {string} Overall percentage value (e.g. "67.50") or empty string
 */
function extractOverallPercentage(doc = document) {
  const elements = doc.querySelectorAll('span, div, td, th, label');
  const percentagePattern = /\b([1-9]\d(?:\.\d{1,2})?|100(?:\.0+)?)\b/;

  let overallPct = '';

  for (const el of elements) {
    const text = el.textContent.trim();
    if (!text) continue;

    if (/overall\s*grade/i.test(text) || /overall\s*percentage/i.test(text) || /overall\s*mark/i.test(text)) {
      const match = text.match(percentagePattern);
      if (match) {
        const val = parseFloat(match[1]);
        if (val > 0 && val <= 100) {
          overallPct = match[1];
          return overallPct;
        }
      }

      const parent = el.parentElement;
      if (parent) {
        const siblingElements = parent.querySelectorAll('span, div, td');
        for (const sib of siblingElements) {
          const sibText = sib.textContent.trim();
          const match = sibText.match(percentagePattern);
          if (match) {
            const val = parseFloat(match[1]);
            const parentText = parent.textContent.toLowerCase();
            const containerText = (sib.parentElement ? sib.parentElement.textContent.toLowerCase() : '') + ' ' + parentText;
            if (containerText.includes('mid-term') || containerText.includes('mid term') || containerText.includes('mst')) {
              continue;
            }
            if (val > 0 && val <= 100) {
              overallPct = match[1];
              return overallPct;
            }
          }
        }
      }
    }
  }

  const pctPatterns = ['OVERALL_GRADE', 'CRSE_GRADE', 'GRADE_INPUT', 'PERCENT', 'PCT'];
  const allElements = doc.querySelectorAll('[id]');
  for (const el of allElements) {
    const id = el.id.toUpperCase();
    if (pctPatterns.some(pat => id.includes(pat))) {
      const text = el.textContent.trim();
      const match = text.match(percentagePattern);
      if (match) {
        const val = parseFloat(match[1]);
        const parentText = (el.parentElement ? el.parentElement.textContent.toLowerCase() : '');
        if (parentText.includes('mid-term') || parentText.includes('mid term') || parentText.includes('mst')) {
          continue;
        }
        if (val > 0 && val <= 100) {
          overallPct = match[1];
          return overallPct;
        }
      }
    }
  }

  for (const el of elements) {
    if (el.children.length > 0) continue;
    const text = el.textContent.trim();
    const match = text.match(/^\s*([1-9]\d(?:\.\d{1,2})?|100(?:\.0+)?)\s*%?\s*$/);
    if (match) {
      const val = parseFloat(match[1]);
      const parentText = el.parentElement ? el.parentElement.textContent.toLowerCase() : '';
      if (parentText.includes('overall') || parentText.includes('final') || parentText.includes('course grade')) {
        if (parentText.includes('mid-term') || parentText.includes('mid term') || parentText.includes('mst')) {
          continue;
        }
        overallPct = match[1];
        return overallPct;
      }
    }
  }

  return overallPct;
}

/**
 * Expose overall grades wrapper for backward compatibility.
 * @param {Document|Element} doc
 * @returns {Array<{grade: string, percentage: string}>}
 */
function extractGrades(doc = document) {
  const overallGrade = extractOverallGrade(doc);
  const overallPct = extractOverallPercentage(doc);
  const grades = [];
  if (overallGrade || overallPct) {
    grades.push({ grade: overallGrade, percentage: overallPct });
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
