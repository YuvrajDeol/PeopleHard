"use client";

import React from "react";

interface CreditInputProps {
  courseCode: string;
  value: number | "";
  onChange: (courseCode: string, credits: number | "") => void;
}

export default function CreditInput({ courseCode, value, onChange }: CreditInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal === "") {
      onChange(courseCode, "");
      return;
    }

    let val = parseInt(rawVal, 10);
    if (isNaN(val)) return;

    // Constrain min 0 and max 10
    if (val < 0) val = 0;
    if (val > 10) val = 10;

    onChange(courseCode, val);
  };

  return (
    <input
      type="number"
      min={0}
      max={10}
      value={value}
      onChange={handleChange}
      className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      placeholder="—"
    />
  );
}
