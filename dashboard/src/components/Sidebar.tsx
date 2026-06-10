"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  GraduationCap, 
  Settings, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Laptop
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Planner", href: "/planner", icon: GraduationCap },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeClass = (href: string) => {
    const isActive = pathname === href || pathname?.startsWith(href + "/");
    return isActive 
      ? "bg-slate-100 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-400 font-medium" 
      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-100";
  };

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Top Header / Nav bar */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md md:hidden sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
            P
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            PeopleHard
          </span>
        </div>
        <button
          onClick={toggleMobile}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Overlay Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-950 p-6 shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  P
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  PeopleHard
                </span>
              </div>
              <button
                onClick={toggleMobile}
                className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <nav className="space-y-1.5 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${activeClass(item.href)}`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Dark Mode Switcher for Mobile */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-auto">
              <div className="flex items-center justify-around bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex justify-center py-2 rounded-lg text-slate-500 dark:text-slate-400 transition-all ${mounted && theme === "light" ? "bg-white text-slate-900 shadow-sm" : ""}`}
                  title="Light mode"
                >
                  <Sun size={18} />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex justify-center py-2 rounded-lg text-slate-500 dark:text-slate-400 transition-all ${mounted && theme === "dark" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : ""}`}
                  title="Dark mode"
                >
                  <Moon size={18} />
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex-1 flex justify-center py-2 rounded-lg text-slate-500 dark:text-slate-400 transition-all ${mounted && theme === "system" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : ""}`}
                  title="System mode"
                >
                  <Laptop size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md p-6 flex-shrink-0 z-30 justify-between">
        <div className="space-y-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-500/20">
              P
            </div>
            <span className="font-extrabold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              PeopleHard
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${activeClass(item.href)}`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Theme Controls */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="flex items-center justify-around bg-slate-100 dark:bg-slate-900/60 rounded-xl p-1 border border-slate-200/40 dark:border-slate-850/40">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 flex justify-center py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all ${mounted && theme === "light" ? "bg-white text-slate-900 shadow-sm" : ""}`}
              title="Light mode"
            >
              <Sun size={18} />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 flex justify-center py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all ${mounted && theme === "dark" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : ""}`}
              title="Dark mode"
            >
              <Moon size={18} />
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex-1 flex justify-center py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all ${mounted && theme === "system" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : ""}`}
              title="System mode"
            >
              <Laptop size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
