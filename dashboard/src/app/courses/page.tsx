"use client";

import React, { useState, useEffect } from "react";
import { Course } from "@/lib/cgpa";
import { getStoredCourses, getStoredCredits, setStoredCredits } from "@/lib/storage";
import CourseTable from "@/components/CourseTable";
import { BookOpen } from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [credits, setCredits] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load from local storage
  useEffect(() => {
    setCourses(Object.values(getStoredCourses()));
    setCredits(getStoredCredits());
    setLoading(false);
  }, []);

  // Handle credit value changes
  const handleCreditChange = (courseCode: string, newCredits: number | "") => {
    const updatedCredits = { ...credits };
    if (newCredits === "") {
      delete updatedCredits[courseCode];
    } else {
      updatedCredits[courseCode] = newCredits;
    }
    setCredits(updatedCredits);
    setStoredCredits(updatedCredits);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-900 rounded-lg" />
        <div className="h-8 bg-slate-200 dark:bg-slate-900 rounded-lg max-w-md" />
        <div className="h-96 bg-slate-200 dark:bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  const hasData = courses.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <BookOpen className="text-indigo-600 dark:text-indigo-400" size={26} />
          Subject Roster
        </h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Manage your course credits, examine grades, and search/sort your transcript files.
        </p>
      </div>

      {!hasData ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10">
          <BookOpen size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400 font-semibold">No Courses Found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Import academic records in the settings page to populate this table.</p>
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-slate-950/20 backdrop-blur-md rounded-3xl p-6 border border-slate-200/50 dark:border-slate-850/50 shadow-sm">
          <CourseTable
            courses={courses}
            creditsMap={credits}
            onCreditChange={handleCreditChange}
          />
        </div>
      )}
    </div>
  );
}
