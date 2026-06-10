import React from "react";

interface GradeBadgeProps {
  grade: string;
}

export default function GradeBadge({ grade }: GradeBadgeProps) {
  const normalized = (grade || "").trim().toUpperCase();

  let styles = "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-350 border-slate-200 dark:border-slate-800"; // Fallback/default

  if (["A+", "A"].includes(normalized)) {
    styles = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-350 border-emerald-250/50 dark:border-emerald-900/60";
  } else if (["A-", "B+"].includes(normalized)) {
    styles = "bg-teal-50 text-teal-700 dark:bg-teal-950/45 dark:text-teal-350 border-teal-250/50 dark:border-teal-900/60";
  } else if (["B", "B-"].includes(normalized)) {
    styles = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/45 dark:text-indigo-350 border-indigo-250/50 dark:border-indigo-900/60";
  } else if (["C+", "C"].includes(normalized)) {
    styles = "bg-amber-50 text-amber-700 dark:bg-amber-950/45 dark:text-amber-350 border-amber-250/50 dark:border-amber-900/60";
  } else if (["C-", "D"].includes(normalized)) {
    styles = "bg-orange-50 text-orange-700 dark:bg-orange-950/45 dark:text-orange-350 border-orange-250/50 dark:border-orange-900/60";
  } else if (normalized === "F") {
    styles = "bg-rose-50 text-rose-700 dark:bg-rose-950/45 dark:text-rose-350 border-rose-250/50 dark:border-rose-900/60";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      {normalized || "—"}
    </span>
  );
}
