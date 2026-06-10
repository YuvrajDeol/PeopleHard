"use client";

import React, { useState, useMemo } from "react";
import { Info, Calculator, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface TargetCalculatorProps {
  currentCgpa: number;
  currentCredits: number;
}

export default function TargetCalculator({ currentCgpa, currentCredits }: TargetCalculatorProps) {
  const [targetCgpa, setTargetCgpa] = useState<number | "">("");
  const [remainingCredits, setRemainingCredits] = useState<number | "">("");

  const result = useMemo(() => {
    if (
      targetCgpa === "" || 
      remainingCredits === "" || 
      isNaN(targetCgpa) || 
      isNaN(remainingCredits) || 
      remainingCredits <= 0
    ) {
      return null;
    }

    const totalCredits = currentCredits + remainingCredits;
    const requiredTotalPoints = targetCgpa * totalCredits;
    const currentTotalPoints = currentCgpa * currentCredits;
    const remainingPoints = requiredTotalPoints - currentTotalPoints;
    const requiredGpa = remainingPoints / remainingCredits;

    return {
      requiredGpa,
      totalCredits
    };
  }, [currentCgpa, currentCredits, targetCgpa, remainingCredits]);

  const feedbackMessage = useMemo(() => {
    if (!result) return null;
    const gpa = result.requiredGpa;

    if (gpa > 10.0) {
      return {
        type: "impossible",
        title: "Virtually Impossible",
        text: "The required average GPA is greater than 10.00. You cannot reach your target in this credit window.",
        color: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40",
        icon: ShieldAlert
      };
    }
    if (gpa > 9.0) {
      return {
        type: "hard",
        title: "High Effort Required",
        text: `Securing a ${gpa.toFixed(2)} GPA requires near-perfect grades (mostly A and A+). Prepare carefully!`,
        color: "text-amber-700 bg-amber-50 border-amber-250/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40",
        icon: AlertTriangle
      };
    }
    if (gpa > 0) {
      return {
        type: "achievable",
        title: "Very Achievable",
        text: `Securing a ${gpa.toFixed(2)} average GPA is very feasible. Steady academic work will get you there.`,
        color: "text-emerald-700 bg-emerald-50 border-emerald-250/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40",
        icon: CheckCircle2
      };
    }
    return {
      type: "automatic",
      title: "Already Achieved",
      text: "Your current cumulative GPA already exceeds your target. Maintain your current standing to stay ahead!",
      color: "text-indigo-700 bg-indigo-50 border-indigo-250/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40",
      icon: CheckCircle2
    };
  }, [result]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Inputs Form */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Calculator className="text-indigo-600 dark:text-indigo-400" size={20} />
          Target CGPA parameters
        </h3>

        <div className="space-y-4">
          {/* Target CGPA */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350">
              Target CGPA
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g. 8.5"
              value={targetCgpa}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setTargetCgpa(isNaN(val) ? "" : Math.min(10, Math.max(0, val)));
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* Remaining Credits */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350">
              Remaining Credits
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 60"
              value={remainingCredits}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setRemainingCredits(isNaN(val) ? "" : Math.max(1, val));
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Current status info */}
        <div className="flex gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-800/40 leading-relaxed">
          <Info size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Your Current Status:
            </span>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Current CGPA: <strong className="text-slate-850 dark:text-slate-200">{currentCgpa.toFixed(2)}</strong></li>
              <li>Graded Earned Credits: <strong className="text-slate-850 dark:text-slate-200">{currentCredits}</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Output / Results Card */}
      <div className="space-y-6">
        {!result ? (
          <div className="h-full flex flex-col justify-center items-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/20 dark:bg-slate-900/5 text-center px-6">
            <Calculator size={32} className="text-slate-350 dark:text-slate-650 mb-2.5 animate-pulse" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Awaiting parameters
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Enter your Target CGPA and Remaining Credits to calculate the required average GPA for your remaining classes.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 p-6 shadow-sm space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
                Required Average GPA
              </span>
              <h2 className="text-5xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 mt-2 leading-none">
                {result.requiredGpa < 0 ? "0.00" : result.requiredGpa.toFixed(2)}
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-2">
                Needed across the remaining {remainingCredits} credits to secure a {typeof targetCgpa === "number" ? targetCgpa.toFixed(2) : ""} overall CGPA.
              </p>
            </div>

            {feedbackMessage && (
              <div className={`flex gap-3 p-4 rounded-2xl border ${feedbackMessage.color} leading-relaxed text-sm`}>
                <feedbackMessage.icon size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">{feedbackMessage.title}</h5>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{feedbackMessage.text}</p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between text-xs text-slate-550 dark:text-slate-400 font-medium">
              <span>Total Credits at Graduation</span>
              <span className="font-bold text-slate-850 dark:text-slate-200">{result.totalCredits}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
