"use client";

import React, { useState, useEffect } from "react";
import { Course, calculateCGPA, calculateTotalEarnedCredits } from "@/lib/cgpa";
import { getStoredCourses, getStoredCredits, setStoredCredits } from "@/lib/storage";
import CGPACard from "@/components/CGPACard";
import StatsCard from "@/components/StatsCard";
import CourseTable from "@/components/CourseTable";
import { 
  BookOpen, 
  GraduationCap, 
  CheckSquare, 
  FileText,
  Import,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [credits, setCredits] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load from local storage
  useEffect(() => {
    const storedCourses = Object.values(getStoredCourses());
    const storedCredits = getStoredCredits();
    setCourses(storedCourses);
    setCredits(storedCredits);
    setLoading(false);
  }, []);

  // Handle credits saving
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

  // Derive Stats
  const cgpa = calculateCGPA(courses, credits);
  const totalEarnedCredits = calculateTotalEarnedCredits(courses, credits);
  const totalCourses = courses.length;
  const gradesSynced = courses.filter(c => c.grade && c.grade.trim() !== "").length;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-900 rounded-lg" />
        <div className="h-48 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-slate-200 dark:bg-slate-900 rounded-2xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-900 rounded-2xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasData = courses.length > 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Academic Overview
            <Sparkles className="text-amber-500" size={24} />
          </h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
            Track your semester performance, course credits, and cumulative GPA.
          </p>
        </div>
        {!hasData && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700/95 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25"
          >
            <Import size={16} />
            <span>Import Student Data</span>
          </Link>
        )}
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="flex flex-col justify-center items-center py-20 px-6 border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10 text-center max-w-2xl mx-auto mt-8">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner border border-indigo-100 dark:border-indigo-900/30">
            <BookOpen size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            No Academic Data Found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
            Import your exported academic JSON from the PeopleHard browser extension to get started with CGPA calculations and visual analytics.
          </p>
          <Link
            href="/settings"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all"
          >
            Go to Settings & Import
          </Link>
        </div>
      ) : (
        /* Dashboard Content */
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hero CGPA Card */}
            <div className="lg:col-span-2">
              <CGPACard cgpa={cgpa} totalCredits={totalEarnedCredits} />
            </div>

            {/* Side Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              <StatsCard
                title="Total Courses"
                value={totalCourses}
                description="Academics listed in transcript logs"
                icon={BookOpen}
                gradient="from-blue-500 to-indigo-500"
              />
              <StatsCard
                title="Grades Synced"
                value={gradesSynced}
                description="Courses with declared overall grades"
                icon={CheckSquare}
                gradient="from-emerald-500 to-teal-500"
              />
            </div>
          </div>

          {/* Table Preview Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Recent Courses
              </h2>
              <Link
                href="/courses"
                className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                View all courses
              </Link>
            </div>
            <CourseTable
              courses={courses.slice(0, 5)}
              creditsMap={credits}
              onCreditChange={handleCreditChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
