import { getGradePoints } from "./gradePoints";

export interface Course {
  courseCode: string;
  courseName: string;
  grade?: string;
  percentage?: number | string;
  instructor?: string;
}

/**
 * Calculates CGPA from a list of courses and their credits.
 * CGPA = Σ(credits * grade points) / Σ(credits)
 * Ignored subjects:
 * - Missing credits
 * - Grades without a grade point equivalent (e.g., "I", "W", empty grade)
 */
export function calculateCGPA(courses: Course[], creditsMap: Record<string, number>): number {
  let weightedPointsSum = 0;
  let creditsSum = 0;

  for (const course of courses) {
    if (!course.courseCode) continue;
    const credits = creditsMap[course.courseCode];
    if (credits === undefined || credits === null || isNaN(credits)) continue;

    const points = getGradePoints(course.grade || "");
    if (points === null) continue; // Ignore courses with no letter grade or invalid grade

    weightedPointsSum += points * credits;
    creditsSum += credits;
  }

  if (creditsSum === 0) return 0;
  return weightedPointsSum / creditsSum;
}

/**
 * Calculates total credits for courses that have both credits defined and a valid grade point.
 */
export function calculateTotalEarnedCredits(courses: Course[], creditsMap: Record<string, number>): number {
  let creditsSum = 0;

  for (const course of courses) {
    if (!course.courseCode) continue;
    const credits = creditsMap[course.courseCode];
    if (credits === undefined || credits === null || isNaN(credits)) continue;

    const points = getGradePoints(course.grade || "");
    if (points === null) continue;

    creditsSum += credits;
  }

  return creditsSum;
}
