import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  gradient?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  gradient = "from-indigo-500 to-purple-500" 
}: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-6 shadow-sm hover:shadow-md transition-all duration-350 flex flex-col justify-between">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-28 w-28 rounded-full bg-slate-100/40 dark:bg-slate-800/10 blur-xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2 rounded-xl bg-gradient-to-tr ${gradient} text-white shadow-sm`}>
          <Icon size={16} />
        </div>
      </div>

      <div>
        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-none">
          {value}
        </h3>
        {description && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
