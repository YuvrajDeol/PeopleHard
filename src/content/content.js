/**
 * Campus+ Sync — Content Script
 *
 * Injected into campus.thapar.edu pages.
 * Listens for SYNC_PAGE messages from the popup/background,
 * runs the extraction pipeline, and sends results back.
 *
 * Also runs in static injection mode (declared in manifest)
 * so the page is always ready for extraction on user request.
 */

const CONTENT_LOG = '[Campus+]';

/**
 * Extract all visible academic data from the current PeopleSoft page.
 * Combines course info, grades, assignments, and semester data.
 * @returns {object} Structured extraction result
 */
function extractPageData() {
  console.log(`${CONTENT_LOG} Starting page extraction...`);

  // Acquire target academic document/iframe context
  const doc = getAcademicDocument();

  // ── Course Information ──────────────────────────────────────────────
  const rawCourses = extractCourseInfo(doc);
  const overallGrade = extractOverallGrade(doc);
  const overallPct = extractOverallPercentage(doc);
  const assignments = extractAssignments(doc);
  const semester = extractSemesterInfo(doc);

  // ── Merge grades into courses ──────────────────────────────────────
  const courses = rawCourses.map((course) => {
    const percentageNum = overallPct ? parseFloat(overallPct) : "";
    return {
      courseCode: course.courseCode,
      courseName: course.courseName,
      grade: overallGrade || "",
      percentage: isNaN(percentageNum) ? "" : percentageNum,
      instructor: course.instructor || '',
      assignments: [],
    };
  });

  // If we found grades but no courses, create placeholder course entries
  if (courses.length === 0 && (overallGrade || overallPct)) {
    const percentageNum = overallPct ? parseFloat(overallPct) : "";
    courses.push({
      courseCode: '',
      courseName: doc.title || document.title || 'Unknown Course',
      grade: overallGrade || "",
      percentage: isNaN(percentageNum) ? "" : percentageNum,
      instructor: '',
      assignments: [],
    });
  }

  // Assign assignments to courses, or to a general bucket if no courses found
  if (courses.length > 0 && assignments.length > 0) {
    // Try to distribute assignments among courses
    // For now, attach all to the first course (PeopleSoft typically shows one course at a time)
    courses[0].assignments = assignments;
  } else if (courses.length === 0 && assignments.length > 0) {
    courses.push({
      courseCode: '',
      courseName: doc.title || document.title || 'Unknown Course',
      grade: '',
      percentage: '',
      instructor: '',
      assignments: assignments,
    });
  }

  let result = {
    timestamp: new Date().toISOString(),
    pageTitle: doc.title || document.title || '',
    pageUrl: window.location.href,
    semester: semester,
    courses: courses,
  };

  // Run Result Quality Validation (Bug 9)
  result = validateAndCleanData(result);

  const totalAssignments = result.courses.reduce((sum, c) => sum + c.assignments.length, 0);
  console.log(`${CONTENT_LOG} Extraction complete. Found ${result.courses.length} course(s), ${totalAssignments} assignment(s).`);
  console.log(`${CONTENT_LOG} Sync complete`);

  return result;
}

/**
 * Validates result data before saving (Bug 9)
 * - Discard empty assignments & courses
 * - Remove duplicate assignments & courses (merging assignments if matching)
 * @param {object} result - Extracted data result object
 * @returns {object} Cleaned result object
 */
function validateAndCleanData(result) {
  if (!result || !result.courses) return result;

  const cleanedCourses = [];
  const seenCourses = new Set();

  for (const course of result.courses) {
    // Discard empty course check
    const hasCodeOrName = course.courseCode.trim() || course.courseName.trim();
    const hasAssignments = course.assignments && course.assignments.length > 0;
    if (!hasCodeOrName && !hasAssignments) {
      continue; // Skip empty course
    }

    // Discard empty assignments & remove duplicate assignments
    const cleanedAssignments = [];
    const seenAssignments = new Set();

    if (course.assignments) {
      for (const assign of course.assignments) {
        if (!assign.name || !assign.name.trim()) {
          continue; // Skip empty assignment
        }
        const assignKey = assign.name.trim();
        if (seenAssignments.has(assignKey)) {
          continue; // Skip duplicate assignment
        }
        seenAssignments.add(assignKey);
        cleanedAssignments.push(assign);
      }
    }

    course.assignments = cleanedAssignments;

    // Course deduplication key: courseCode or courseName
    const courseKey = course.courseCode.trim() ? course.courseCode.trim() : course.courseName.trim();
    if (courseKey) {
      if (seenCourses.has(courseKey)) {
        // Merge assignments for duplicate courses instead of dropping
        const existingCourse = cleanedCourses.find(c => 
          (c.courseCode && c.courseCode === course.courseCode) || 
          (!c.courseCode && c.courseName === course.courseName)
        );
        if (existingCourse) {
          const existingAssignNames = new Set(existingCourse.assignments.map(a => a.name.trim()));
          for (const a of course.assignments) {
            if (!existingAssignNames.has(a.name.trim())) {
              existingCourse.assignments.push(a);
            }
          }
          if (!existingCourse.grade && course.grade) {
            existingCourse.grade = course.grade;
          }
          if (!existingCourse.percentage && course.percentage) {
            existingCourse.percentage = course.percentage;
          }
          continue;
        }
      }
      seenCourses.add(courseKey);
    }

    cleanedCourses.push(course);
  }

  result.courses = cleanedCourses;
  return result;
}

// ── Message Listener ───────────────────────────────────────────────────
// Listens for sync requests from popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_PAGE') {
    console.log(`${CONTENT_LOG} Received SYNC_PAGE request`);
    try {
      const data = extractPageData();
      sendResponse({ success: true, data: data });
    } catch (error) {
      console.error(`${CONTENT_LOG} Extraction error:`, error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep channel open for async sendResponse
});

// Announce content script is ready
console.log(`${CONTENT_LOG} Content script loaded on: ${window.location.href}`);
