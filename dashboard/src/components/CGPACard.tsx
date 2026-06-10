import React from "react";
import { Award } from "lucide-react";

interface CGPACardProps {
  cgpa: number;
  totalCredits: number;
}

export default function CGPACard({ cgpa, totalCredits }: CGPACardProps) {
  const formattedCgpa = cgpa > 0 ? cgpa.toFixed(2) : "0.00";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100 dark:border-indigo-950/65 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700 text-white p-8 shadow-xl shadow-indigo-500/10 flex flex-col justify-between min-h-[200px]">
      {/* Decorative backdrop shapes */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-12 -mb-12 h-36 w-36 rounded-full bg-purple-500/20 blur-xl pointer-events-none" />

      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-indigo-200">
            Cumulative GPA
          </span>
          <h1 className="text-6xl font-black tracking-tight mt-2 leading-none">
            {formattedCgpa}
          </h1>
        </div>
        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
          <Award size={24} className="text-white" />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-medium text-indigo-100">
        <div>
          <span>Total Earned Credits</span>
          <p className="text-lg font-bold text-white mt-0.5">{totalCredits}</p>
        </div>
        <div className="text-right">
          <span>Academic Standing</span>
          <p className="text-lg font-bold text-white mt-0.5">
            {cgpa >= 8.5 ? "First Class with Distinction" : cgpa >= 6.5 ? "First Class" : cgpa > 0 ? "Second Class" : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
