"use client";

import React, { useState, useMemo } from "react";
import { Course } from "@/lib/cgpa";
import { getGradePoints } from "@/lib/gradePoints";
import GradeBadge from "./GradeBadge";
import CreditInput from "./CreditInput";
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, BookOpen, AlertCircle } from "lucide-react";

interface CourseTableProps {
  courses: Course[];
  creditsMap: Record<string, number>;
  onCreditChange: (courseCode: string, credits: number | "") => void;
}

type SortField = "courseCode" | "courseName" | "grade" | "credits" | "gradePoints";
type SortOrder = "asc" | "desc" | null;

export default function CourseTable({ courses, creditsMap, onCreditChange }: CourseTableProps) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Get unique grades present in the list for filtering options
  const uniqueGrades = useMemo(() => {
    const grades = new Set<string>();
    courses.forEach(c => {
      if (c.grade) grades.add(c.grade.trim().toUpperCase());
    });
    return Array.from(grades).sort();
  }, [courses]);

  // Main Filter & Sort Pipeline
  const processedCourses = useMemo(() => {
    let result = [...courses];

    // 1. Apply Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        c => 
          c.courseCode.toLowerCase().includes(q) || 
          c.courseName.toLowerCase().includes(q)
      );
    }

    // 2. Apply Grade Filter
    if (gradeFilter !== "ALL") {
      result = result.filter(c => (c.grade || "").trim().toUpperCase() === gradeFilter);
    }

    // 3. Apply Sort
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        if (sortField === "courseCode") {
          valA = a.courseCode;
          valB = b.courseCode;
        } else if (sortField === "courseName") {
          valA = a.courseName;
          valB = b.courseName;
        } else if (sortField === "grade") {
          valA = a.grade || "";
          valB = b.grade || "";
        } else if (sortField === "credits") {
          valA = creditsMap[a.courseCode] ?? -1;
          valB = creditsMap[b.courseCode] ?? -1;
        } else if (sortField === "gradePoints") {
          valA = getGradePoints(a.grade || "") ?? -1;
          valB = getGradePoints(b.grade || "") ?? -1;
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [courses, creditsMap, search, gradeFilter, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp size={14} className="ml-1 inline" /> : <ChevronDown size={14} className="ml-1 inline" />;
  };

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by subject code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Grade Filter Dropdown */}
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <SlidersHorizontal size={16} className="text-slate-500" />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          >
            <option value="ALL">All Grades</option>
            {uniqueGrades.map(g => (
              <option key={g} value={g}>Grade: {g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Course Display */}
      {processedCourses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/10">
          <BookOpen size={40} className="mx-auto text-slate-350 dark:text-slate-650 mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No courses found matching your criteria.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try resetting the search filter or import courses first.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-400">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 font-medium text-slate-500 dark:text-slate-400">
                    <th 
                      onClick={() => handleSort("courseCode")} 
                      className="px-6 py-4 cursor-pointer hover:text-slate-950 dark:hover:text-slate-100 transition-colors select-none"
                    >
                      Code {renderSortIcon("courseCode")}
                    </th>
                    <th 
                      onClick={() => handleSort("courseName")} 
                      className="px-6 py-4 cursor-pointer hover:text-slate-950 dark:hover:text-slate-100 transition-colors select-none"
                    >
                      Subject {renderSortIcon("courseName")}
                    </th>
                    <th 
                      onClick={() => handleSort("grade")} 
                      className="px-6 py-4 cursor-pointer hover:text-slate-950 dark:hover:text-slate-100 transition-colors select-none text-center"
                    >
                      Grade {renderSortIcon("grade")}
                    </th>
                    <th 
                      onClick={() => handleSort("credits")} 
                      className="px-6 py-4 cursor-pointer hover:text-slate-950 dark:hover:text-slate-100 transition-colors select-none text-center"
                    >
                      Credits {renderSortIcon("credits")}
                    </th>
                    <th 
                      onClick={() => handleSort("gradePoints")} 
                      className="px-6 py-4 cursor-pointer hover:text-slate-950 dark:hover:text-slate-100 transition-colors select-none text-center"
                    >
                      Grade Points {renderSortIcon("gradePoints")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {processedCourses.map((c) => {
                    const credits = creditsMap[c.courseCode];
                    const gp = getGradePoints(c.grade || "");
                    const isMissingCredits = credits === undefined || credits === null;

                    return (
                      <tr 
                        key={c.courseCode} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-semibold text-slate-850 dark:text-slate-200">
                          {c.courseCode}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {c.courseName}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <GradeBadge grade={c.grade || ""} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-1">
                            <CreditInput
                              courseCode={c.courseCode}
                              value={credits !== undefined ? credits : ""}
                              onChange={onCreditChange}
                            />
                            {isMissingCredits && (
                              <span title="Missing Credits" className="text-amber-500 hover:text-amber-600 transition-colors">
                                <AlertCircle size={14} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                          {gp !== null ? gp : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {processedCourses.map((c) => {
              const credits = creditsMap[c.courseCode];
              const gp = getGradePoints(c.grade || "");
              const isMissingCredits = credits === undefined || credits === null;

              return (
                <div 
                  key={c.courseCode}
                  className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                        {c.courseCode}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-550 mt-1.5 leading-snug">
                        {c.courseName}
                      </h4>
                    </div>
                    <GradeBadge grade={c.grade || ""} />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Credits:</span>
                      <div className="flex items-center gap-1">
                        <CreditInput
                          courseCode={c.courseCode}
                          value={credits !== undefined ? credits : ""}
                          onChange={onCreditChange}
                        />
                        {isMissingCredits && (
                          <span title="Missing Credits" className="text-amber-500">
                            <AlertCircle size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 dark:text-slate-400 font-medium mr-1.5">Grade Points:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {gp !== null ? gp : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
