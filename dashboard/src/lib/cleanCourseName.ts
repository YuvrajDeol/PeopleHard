/**
 * Cleans noisy Oracle PeopleSoft course names by stripping scheduling, locations,
 * instructors, and parenthetical components.
 */
export function cleanCourseName(name: string): string {
  if (!name) return "";
  
  // 1. Remove bracketed session types like (Lecture), (Tutorial), (Practical), (Lab)
  let cleaned = name.replace(/\((?:Lecture|Tutorial|Practical|Lab|L|T|P)\)/gi, "");

  // 2. Split into lines to filter out lines containing metadata labels
  const lines = cleaned.split(/\r?\n/);
  const filteredLines = lines.filter(line => {
    const l = line.trim().toLowerCase();
    if (!l) return false;
    
    // Check for common PeopleSoft metadata labels
    if (
      l.includes("days and times") || 
      l.includes("room") || 
      l.includes("instructor") || 
      l.includes("dates") || 
      l.includes("scheduling") || 
      l.includes("teacher") || 
      l.includes("date range") ||
      l.includes("meeting info") ||
      l.includes("component:") ||
      l.includes("class nbr")
    ) {
      return false;
    }
    return true;
  });

  // 3. Take the first valid line
  let finalName = filteredLines[0] || "";
  
  // 4. Clean up any trailing/leading dashes, colons, or spaces
  finalName = finalName.trim().replace(/^[-–—:\s]+|[-–—:\s]+$/g, "").trim();
  
  // Remove consecutive spaces
  finalName = finalName.replace(/\s+/g, " ");

  return finalName;
}
