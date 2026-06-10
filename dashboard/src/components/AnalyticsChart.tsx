"use client";

import React, { useState, useEffect } from "react";
import { Course } from "@/lib/cgpa";
import { getGradePoints } from "@/lib/gradePoints";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";

interface AnalyticsChartProps {
  courses: Course[];
  creditsMap: Record<string, number>;
}

const COLORS = [
  "#4f46e5", // Indigo
  "#7c3aed", // Purple
  "#2563eb", // Blue
  "#059669", // Emerald
  "#0d9488", // Teal
  "#ca8a04", // Yellow
  "#ea580c", // Orange
  "#dc2626", // Red
  "#db2777", // Pink
  "#22d3ee"  // Cyan
];

const GRADE_COLORS: Record<string, string> = {
  "A+": "#10b981", // Emerald
  "A": "#059669",
  "A-": "#0d9488", // Teal
  "B+": "#3b82f6", // Blue
  "B": "#2563eb",
  "B-": "#6366f1", // Indigo
  "C+": "#f59e0b", // Amber
  "C": "#d97706",
  "C-": "#f97316", // Orange
  "D": "#ea580c",
  "F": "#ef4444", // Red
  "DEFAULT": "#64748b"
};

export default function AnalyticsChart({ courses, creditsMap }: AnalyticsChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Grade Distribution Data
  const gradeData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    // Whitelist grades sorting order
    const orderedGrades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
    
    orderedGrades.forEach(g => { counts[g] = 0; });

    courses.forEach(c => {
      if (c.grade) {
        const g = c.grade.trim().toUpperCase();
        if (g in counts) {
          counts[g]++;
        } else {
          counts[g] = 1;
        }
      }
    });

    return Object.entries(counts)
      .map(([grade, count]) => ({
        grade,
        count,
        fill: GRADE_COLORS[grade] || GRADE_COLORS.DEFAULT
      }))
      .filter(item => item.count > 0 || orderedGrades.includes(item.grade)); // Keep empty ones if standard
  }, [courses]);

  // 2. Credit Distribution Data
  const creditData = React.useMemo(() => {
    const groups: Record<string, number> = {};
    courses.forEach(c => {
      const credits = creditsMap[c.courseCode];
      if (credits !== undefined && credits !== null && !isNaN(credits)) {
        const key = `${credits} Credit${credits === 1 ? "" : "s"}`;
        groups[key] = (groups[key] || 0) + 1;
      }
    });

    return Object.entries(groups).map(([name, value]) => ({
      name,
      value
    }));
  }, [courses, creditsMap]);

  // 3. GPA Contribution Data
  // Contribution = credits * gradePoints
  const contributionData = React.useMemo(() => {
    const data = courses
      .map(c => {
        const credits = creditsMap[c.courseCode];
        const gradePoints = getGradePoints(c.grade || "");
        if (
          credits !== undefined && 
          credits !== null && 
          !isNaN(credits) && 
          gradePoints !== null
        ) {
          return {
            courseCode: c.courseCode,
            courseName: c.courseName,
            contribution: credits * gradePoints,
            credits,
            gradePoints
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{
        courseCode: string;
        courseName: string;
        contribution: number;
        credits: number;
        gradePoints: number;
      }>;

    // Sort descending by contribution
    return data.sort((a, b) => b.contribution - a.contribution).slice(0, 10);
  }, [courses, creditsMap]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
        <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
        <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
        <div className="h-80 lg:col-span-2 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  const hasData = courses.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-24 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10">
        <p className="text-slate-500 dark:text-slate-400 font-medium">Please import academic data first to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 1. Grade Distribution Chart */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 p-6 shadow-sm flex flex-col">
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-6">
          Grade Distribution
        </h4>
        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="grade" stroke="rgba(148, 163, 184, 0.6)" fontSize={12} tickLine={false} />
              <YAxis allowDecimals={false} stroke="rgba(148, 163, 184, 0.6)" fontSize={12} tickLine={false} />
              <Tooltip 
                cursor={{ fill: "rgba(148, 163, 184, 0.05)" }}
                contentStyle={{ 
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(51, 65, 85, 0.5)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px"
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {gradeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Credit Distribution Chart */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 p-6 shadow-sm flex flex-col">
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-6">
          Credit Distribution
        </h4>
        <div className="h-64 flex-1 flex flex-col justify-center">
          {creditData.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-12">No credit entries found. Assign credits to courses to view.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={creditData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {creditData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(51, 65, 85, 0.5)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. GPA Contribution Chart */}
      <div className="lg:col-span-2 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 p-6 shadow-sm flex flex-col">
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">
          GPA Contribution (Top 10 Courses)
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          Calculated as: (Course Credits × Grade Points)
        </p>
        <div className="h-80 flex-1">
          {contributionData.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-12">No courses with both credits and grades. Assign credits and grades to view.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={contributionData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis type="number" stroke="rgba(148, 163, 184, 0.6)" fontSize={12} tickLine={false} />
                <YAxis 
                  dataKey="courseCode" 
                  type="category" 
                  stroke="rgba(148, 163, 184, 0.6)" 
                  fontSize={12} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(51, 65, 85, 0.5)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    const c = props.payload;
                    return [`${value} points (${c.credits}cr × ${c.gradePoints}gp)`, "GPA Contribution"];
                  }}
                />
                <Bar dataKey="contribution" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16}>
                  {contributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
