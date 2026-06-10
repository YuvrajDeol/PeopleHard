"use client";

import React, { useState, useEffect } from "react";
import { Course, calculateCGPA, calculateTotalEarnedCredits } from "@/lib/cgpa";
import { getStoredCourses, getStoredCredits } from "@/lib/storage";
import TargetCalculator from "@/components/TargetCalculator";
import { GraduationCap } from "lucide-react";

export default function PlannerPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [credits, setCredits] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load from local storage
  useEffect(() => {
    setCourses(Object.values(getStoredCourses()));
    setCredits(getStoredCredits());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-900 rounded-lg" />
        <div className="h-8 bg-slate-200 dark:bg-slate-900 rounded-lg max-w-md" />
        <div className="h-96 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  const currentCgpa = calculateCGPA(courses, credits);
  const currentCredits = calculateTotalEarnedCredits(courses, credits);
  const hasData = courses.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={26} />
          Target GPA Planner
        </h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Calculate the average grade points you need to secure in future credits to hit your goal CGPA.
        </p>
      </div>

      {!hasData ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10">
          <GraduationCap size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400 font-semibold">No Academic Standings Available</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Please import course details in settings to calculate target GPA plans.</p>
        </div>
      ) : (
        <TargetCalculator currentCgpa={currentCgpa} currentCredits={currentCredits} />
      )}
    </div>
  );
}
