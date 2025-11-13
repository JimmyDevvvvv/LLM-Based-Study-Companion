"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  gradient?: string;
  description?: string;
}

export default function Section({
  title,
  children,
  icon,
  gradient = "from-indigo-500 via-purple-500 to-pink-500",
  description,
}: SectionProps) {
  return (
    <section className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-30 transition-all duration-700 blur-3xl`}
      />
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white/85 dark:bg-slate-950/75 backdrop-blur-2xl shadow-[0_40px_120px_-60px_rgba(79,70,229,0.35)] dark:shadow-[0_45px_120px_-70px_rgba(59,130,246,0.65)] transition-all duration-500">
        <div className="px-6 sm:px-8 py-6 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-4">
          {icon && (
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg shadow-purple-500/40 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2`}
            >
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
                {title}
              </h3>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="px-6 sm:px-8 py-6 space-y-4">
          {children}
        </div>
      </div>
    </section>
  );
}
