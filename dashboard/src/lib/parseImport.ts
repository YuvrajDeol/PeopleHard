import { cleanCourseName } from "./cleanCourseName";
import { Course } from "./cgpa";

export interface ImportResult {
  courses: Course[];
  error?: string;
}

/**
 * Parses and validates the imported PeopleHard JSON file.
 * Returns the parsed list of deduplicated courses with cleaned names, or an error.
 */
export function parseImport(jsonString: string): ImportResult {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== "object") {
      return { courses: [], error: "Invalid file format. Expected a JSON object." };
    }

    if (!Array.isArray(data.syncs)) {
      return { courses: [], error: "Missing 'syncs' array in the imported data." };
    }

    const courseMap: Record<string, Course> = {};

    // Iterate through syncs. Later syncs appear at the end of the array.
    // Overwriting keys naturally keeps the latest record for each course.
    for (const sync of data.syncs) {
      if (!sync || typeof sync !== "object") continue;
      
      const courses = sync.courses;
      if (!Array.isArray(courses)) continue;

      for (const course of courses) {
        if (!course || typeof course !== "object") continue;

        const code = (course.courseCode || "").trim().toUpperCase();
        if (!code) continue; // Skip courses with empty codes

        const name = cleanCourseName(course.courseName || "");
        
        courseMap[code] = {
          courseCode: code,
          courseName: name,
          grade: (course.grade || "").trim(),
          percentage: course.percentage !== undefined ? course.percentage : "",
          instructor: (course.instructor || "").trim()
        };
      }
    }

    const resultCourses = Object.values(courseMap);

    if (resultCourses.length === 0) {
      return { courses: [], error: "No valid courses found in the imported data." };
    }

    return { courses: resultCourses };
  } catch (err: any) {
    return { courses: [], error: `Failed to parse JSON: ${err.message}` };
  }
}
