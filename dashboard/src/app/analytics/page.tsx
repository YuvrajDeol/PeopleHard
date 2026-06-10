"use client";

import React, { useState, useEffect } from "react";
import { Course } from "@/lib/cgpa";
import { getStoredCourses, getStoredCredits, syncFromExtensionStorage } from "@/lib/storage";
import AnalyticsChart from "@/components/AnalyticsChart";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [credits, setCredits] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load from local storage
  useEffect(() => {
    setCourses(Object.values(getStoredCourses()));
    setCredits(getStoredCredits());
    setLoading(false);

    // Auto-sync from Chrome Extension storage if running in extension context
    syncFromExtensionStorage((updatedCourses) => {
      setCourses(updatedCourses);
    });
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

  const hasData = courses.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={26} />
          Academic Analytics
        </h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Explore visual insights of grade distributions, credit distributions, and GPA contributions.
        </p>
      </div>

      {!hasData ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10">
          <BarChart3 size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400 font-semibold">No Analytics Data Available</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Please import academic records to visualize your metrics.</p>
        </div>
      ) : (
        <AnalyticsChart courses={courses} creditsMap={credits} />
      )}
    </div>
  );
}
