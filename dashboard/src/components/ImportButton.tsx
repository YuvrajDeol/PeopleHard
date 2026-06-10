"use client";

import React, { useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseImport } from "@/lib/parseImport";
import { setStoredCourses, getStoredCourses } from "@/lib/storage";
import { Course } from "@/lib/cgpa";

interface ImportButtonProps {
  onImportSuccess?: (courses: Course[]) => void;
}

export default function ImportButton({ onImportSuccess }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setError("Could not read file content.");
        return;
      }

      const result = parseImport(text);
      if (result.error) {
        setError(result.error);
        return;
      }

      // Convert imported list to key-value record for storage
      const courseMap: Record<string, Course> = {};
      
      // Preserve existing percentage/grades if they aren't provided in the import (optional fallback)
      const existing = getStoredCourses();
      
      for (const course of result.courses) {
        if (!course.courseCode) continue;
        courseMap[course.courseCode] = {
          ...existing[course.courseCode],
          ...course
        };
      }

      setStoredCourses(courseMap);
      setSuccess(true);
      if (onImportSuccess) {
        onImportSuccess(Object.values(courseMap));
      }
    };
    reader.onerror = () => {
      setError("An error occurred while reading the file.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      
      <button
        onClick={handleButtonClick}
        className="flex items-center justify-center gap-2.5 w-full py-4 border-2 border-dashed border-slate-200 hover:border-indigo-500 dark:border-slate-800 dark:hover:border-indigo-500/80 rounded-2xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/10 dark:hover:bg-slate-900/30 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-350 dark:hover:text-slate-100 transition-all cursor-pointer shadow-inner"
      >
        <Upload size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-500" />
        <span>Select peoplehard-data.json</span>
      </button>

      {fileName && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium mt-1">
          Selected: {fileName}
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-350 border border-rose-200/40 dark:border-rose-900/30 mt-2 text-sm leading-relaxed">
          <AlertCircle size={18} className="flex-shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-350 border border-emerald-250/40 dark:border-emerald-900/30 mt-2 text-sm">
          <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-500" />
          <span>Data imported successfully!</span>
        </div>
      )}
    </div>
  );
}
