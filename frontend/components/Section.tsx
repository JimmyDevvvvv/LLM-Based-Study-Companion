"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  gradient?: string;
}

export default function Section({ title, children, icon, gradient = "from-blue-500 to-purple-600" }: SectionProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative group">
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-10 blur-xl transition-all duration-500 rounded-2xl`}></div>
        <div className="relative flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          {icon && (
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              {icon}
            </div>
          )}
          <h3 className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            {title}
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
          </h3>
        </div>
      </div>
      <div className="transform transition-all duration-300">{children}</div>
    </div>
  );
}
