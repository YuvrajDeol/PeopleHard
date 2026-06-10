export const gradePointsMap: Record<string, number> = {
  "A+": 10,
  "A": 10,
  "A-": 9,
  "B+": 8,
  "B": 7,
  "B-": 6,
  "C+": 5,
  "C": 4,
  "C-": 3,
  "D": 2,
  "F": 0
};

/**
 * Returns the grade point equivalent for a letter grade.
 * Returns null if the grade is invalid or does not have a grade point mapping (e.g. "I", "W", or empty).
 */
export function getGradePoints(grade: string): number | null {
  if (!grade) return null;
  const normalized = grade.trim().toUpperCase();
  if (normalized in gradePointsMap) {
    return gradePointsMap[normalized];
  }
  return null;
}
