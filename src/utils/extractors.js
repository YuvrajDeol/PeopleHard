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
 * Group and associate grades with courses from the same block or row context.
 * @param {Document|Element} doc - Document to scan
 * @returns {Array<{courseCode: string, courseName: string, grade: string, percentage: string, instructor: string}>}
 */
function extractCourseInfo(doc = document) {
  const courseMap = new Map();
  const seenCodes = new Set();

  function getRowSuffix(id) {
    const match = id.match(/[\$_](\d+)$/);
    return match ? match[1] : null;
  }

  // Strategy 1: Find elements by PeopleSoft ID patterns for courses & grades
  const crsePatterns = ['CRSE', 'COURSE', 'CLASS_NAME', 'SUBJECT', 'CATALOG', 'DESCR'];
  const gradePatterns = ['GRADE', 'GRD', 'MARK', 'SCORE', 'PERCENTAGE', 'PERCENT', 'GPA'];
  const allElements = doc.querySelectorAll('[id]');

  for (const el of allElements) {
    const id = el.id;
    const idUpper = id.toUpperCase();

    // Prevent matching outer shell navigation items
    if (idUpper.includes('PORTLET') || idUpper.includes('MENU') || idUpper.includes('NAV')) {
      continue;
    }

    const suffix = getRowSuffix(id) || 'single';

    if (!courseMap.has(suffix)) {
      courseMap.set(suffix, {
        courseCode: '',
        courseName: '',
        grade: '',
        percentage: '',
        instructor: ''
      });
    }

    const courseObj = courseMap.get(suffix);
    const text = el.textContent.trim();
    if (!text) continue;

    const isCrseId = crsePatterns.some(pat => idUpper.includes(pat));
    if (isCrseId) {
      const codeMatch = text.match(/\b([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\b/i);
      if (codeMatch) {
        const code = codeMatch[1].replace(/\s+/g, '').toUpperCase();
        if (isValidCourseCode(code)) {
          courseObj.courseCode = code;
          let name = text.replace(codeMatch[0], '').trim();
          name = name.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();
          if (name && !name.toLowerCase().includes('view my') && !name.toLowerCase().includes('grade book') && !name.toLowerCase().includes('student view')) {
            courseObj.courseName = name;
          }
        }
      } else if (idUpper.includes('DESCR') || idUpper.includes('TITLE')) {
        if (!text.toLowerCase().includes('view my') && !text.toLowerCase().includes('grade book') && !text.toLowerCase().includes('student view')) {
          courseObj.courseName = text;
        }
      }
    }

    const isGradeId = gradePatterns.some(pat => idUpper.includes(pat));
    if (isGradeId) {
      const parsed = parseGradeFromString(text);
      if (parsed) {
        if (parsed.grade) courseObj.grade = parsed.grade;
        if (parsed.percentage) courseObj.percentage = parsed.percentage;
      }
    }
  }

  // Strategy 2: Search tables for course & grade data inside doc
  const tables = doc.querySelectorAll('table');
  for (const table of tables) {
    const rows = table.querySelectorAll('tr');
    if (rows.length < 2) continue;

    const firstRow = rows[0];
    const headers = Array.from(firstRow.querySelectorAll('th, td')).map(el => el.textContent.trim().toUpperCase());
    
    const crseColIdx = headers.findIndex(h => h.includes('CRSE') || h.includes('COURSE') || h.includes('SUBJECT') || h.includes('CLASS'));
    const gradeColIdx = headers.findIndex(h => h.includes('GRADE') || h.includes('MARK') || h.includes('GPA'));
    const pctColIdx = headers.findIndex(h => h.includes('PERCENT') || h.includes('PCT') || h.includes('%'));

    if (crseColIdx !== -1) {
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length === 0) continue;

        const cellText = cells[crseColIdx].textContent.trim();
        const codeMatch = cellText.match(/\b([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\b/i);
        if (codeMatch) {
          const code = codeMatch[1].replace(/\s+/g, '').toUpperCase();
          if (isValidCourseCode(code)) {
            const suffix = `tbl_${table.id || 't'}_row_${i}`;
            const courseObj = {
              courseCode: code,
              courseName: '',
              grade: '',
              percentage: '',
              instructor: ''
            };

            let name = cellText.replace(codeMatch[0], '').trim();
            name = name.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();
            courseObj.courseName = name || code;

            if (gradeColIdx !== -1 && cells[gradeColIdx]) {
              const val = cells[gradeColIdx].textContent.trim();
              if (looksLikeGrade(val)) {
                courseObj.grade = val;
              }
            }
            if (pctColIdx !== -1 && cells[pctColIdx]) {
              const val = cells[pctColIdx].textContent.trim();
              const cleanVal = val.replace('%', '').trim();
              if (/^\d+(?:\.\d+)?$/.test(cleanVal)) {
                const num = parseFloat(cleanVal);
                if (num >= 0 && num <= 100) {
                  courseObj.percentage = cleanVal;
                }
              }
            }

            courseMap.set(suffix, courseObj);
          }
        }
      }
    }
  }

  const finalCourses = [];
  for (const [suffix, courseObj] of courseMap.entries()) {
    if (courseObj.courseCode && isValidCourseCode(courseObj.courseCode)) {
      if (!seenCodes.has(courseObj.courseCode)) {
        seenCodes.add(courseObj.courseCode);
        if (!courseObj.courseName) {
          courseObj.courseName = courseObj.courseCode;
        }
        finalCourses.push(courseObj);
      }
    }
  }

  // Fallback / Strategy 3: Scan all leaf elements for course code pattern
  if (finalCourses.length === 0) {
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
              instructor: '',
              grade: '',
              percentage: ''
            });
          }
        }
      }
    }

    // Single course page grade/percentage association fallback
    let pageGrade = '';
    let pagePercentage = '';
    for (const el of allTextElements) {
      if (el.children.length > 0) continue;
      const text = el.textContent.trim();
      if (!text) continue;
      const parsed = parseGradeFromString(text);
      if (parsed) {
        if (parsed.grade) pageGrade = parsed.grade;
        if (parsed.percentage) pagePercentage = parsed.percentage;
      }
    }

    for (const course of codeToCourse.values()) {
      if (codeToCourse.size === 1) {
        course.grade = pageGrade;
        course.percentage = pagePercentage;
      }
      finalCourses.push(course);
    }
  }

  return finalCourses.filter(c => c.courseCode && isValidCourseCode(c.courseCode));
}

/**
 * Extract grade information from PeopleSoft page doc.
 * @param {Document|Element} doc - Document to scan
 * @returns {Array<{grade: string, percentage: string}>}
 */
function extractGrades(doc = document) {
  const grades = [];
  const seen = new Set();

  const gradePatterns = ['GRADE', 'GRD', 'MARK', 'SCORE', 'PERCENTAGE', 'PERCENT', 'GPA'];
  const allElements = doc.querySelectorAll('[id]');

  for (const el of allElements) {
    const id = el.id.toUpperCase();

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
