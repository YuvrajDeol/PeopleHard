"use client";

import React, { useState, useEffect } from "react";
import ImportButton from "@/components/ImportButton";
import { getStoredCourses, getStoredCredits, resetAllStoredData, STORAGE_KEYS } from "@/lib/storage";
import { 
  Settings, 
  Download, 
  Trash2, 
  Info, 
  Layout, 
  History, 
  CalendarCheck, 
  Briefcase, 
  FileText,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

export default function SettingsPage() {
  const [hasData, setHasData] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const courses = getStoredCourses();
    setHasData(Object.keys(courses).length > 0);
  }, []);

  const handleImportSuccess = () => {
    setHasData(true);
    // Reload window or update local state as needed
  };

  const handleExport = () => {
    const courses = getStoredCourses();
    const credits = getStoredCredits();
    
    const exportData = {
      courses,
      credits
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    );
    
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `peoplehard-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleReset = () => {
    resetAllStoredData();
    setHasData(false);
    setShowConfirmReset(false);
    setResetSuccess(true);
    
    setTimeout(() => {
      setResetSuccess(false);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Settings className="text-indigo-600 dark:text-indigo-400" size={26} />
          System Settings
        </h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Configure academic data interfaces, export local files, or restore the platform back to default.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Actions */}
        <div className="space-y-8">
          {/* Import Card */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Import Extension Data
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                Upload your exports from the browser extension to compile CGPA.
              </p>
            </div>
            <ImportButton onImportSuccess={handleImportSuccess} />
          </div>

          {/* Export Card */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Export Dashboard Data
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                Back up your course database and custom credits mapping as a single JSON file.
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={!hasData}
              className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                hasData 
                  ? "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer shadow-sm"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-650 cursor-not-allowed"
              }`}
            >
              <Download size={18} />
              <span>Export local data</span>
            </button>
          </div>

          {/* Reset Card */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                Danger Zone
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                Wipe all courses and credits records. This action cannot be undone.
              </p>
            </div>
            
            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-950/45 dark:text-rose-450 rounded-xl text-sm font-semibold transition-all border border-rose-200/40 dark:border-rose-900/40 cursor-pointer"
              >
                <Trash2 size={18} />
                <span>Reset all local data</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/40 space-y-3">
                <p className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  Are you absolutely sure you want to clear the entire dashboard database?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {resetSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-350 border border-emerald-200 dark:border-emerald-900/30 text-xs">
                <CheckCircle2 size={16} />
                <span>Dashboard reset successful. Reloading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Future Roadmap Preview */}
        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Info className="text-indigo-600 dark:text-indigo-400" size={18} />
              Platform Roadmap
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
              Future capabilities planned for upcoming releases of the PeopleHard academic OS.
            </p>

            <div className="space-y-4 mt-6">
              {/* Feature 1 */}
              <div className="flex gap-3 items-start opacity-70">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                  <History size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Semester & SGPA History (Planned)
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Track individual semesters, visualize GPA trend lines, and forecast performance targets.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-3 items-start opacity-70">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                  <CalendarCheck size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Attendance Tracking (Planned)
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Automated attendance percentage parsing from portal schedules with low-threshold warning alerts.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-3 items-start opacity-70">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                  <Briefcase size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Placement & Criteria Verifiers (Planned)
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Evaluate eligibility against typical corporate criteria thresholds (e.g. CGPA &gt; 8.0).
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-3 items-start opacity-70">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                  <FileText size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Transcript & Document Generator (Planned)
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Compile clean, shareable PDFs of custom academic scorecards and grade summaries.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Platform Version</span>
            <span>v2.0.0 Stable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
