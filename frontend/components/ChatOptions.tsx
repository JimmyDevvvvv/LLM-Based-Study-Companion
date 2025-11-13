"use client";

import React, { useMemo } from "react";
import { BookOpen, Brain, Lightbulb, FileText } from "lucide-react";
import { Option } from "@/types";
import { themeClasses } from "@/utils/themeStyles";

interface ChatOptionsProps {
  isDark: boolean;
  loading: boolean;
  handleOptionSelect: (task: string, label: string) => void;
}

export default function ChatOptions({ isDark, loading, handleOptionSelect }: ChatOptionsProps) {
  const theme = useMemo(() => themeClasses(isDark), [isDark]);
  const options: Option[] = [
    {
      label: "Summary",
      task: "summarize", 
      icon: FileText,
      description: "Get key points and main ideas",
      color: "from-blue-500 to-cyan-500"
    },
    {
      label: "Quiz",
      task: "quiz",
      icon: Brain,
      description: "Test your understanding",
      color: "from-purple-500 to-pink-500"
    },
    {
      label: "Flashcards",
      task: "flashcards", 
      icon: BookOpen,
      description: "Create study cards",
      color: "from-green-500 to-emerald-500"
    },
    {
      label: "Explanation",
      task: "explain",
      icon: Lightbulb,
      description: "Detailed breakdown of concepts",
      color: "from-orange-500 to-red-500"
    },
  ];

  return (
    <div className={`py-8 ${isDark ? 'bg-slate-950/40' : 'bg-white/70'} backdrop-blur-2xl rounded-3xl border ${isDark ? 'border-slate-800/40' : 'border-slate-200/60'} shadow-[0_25px_90px_-70px_rgba(129,140,248,0.55)] animate-in fade-in slide-in-from-bottom-4 duration-700`}>
      <div className="flex items-start gap-4">
        <div className={`${theme.icon} w-12 h-12`}>
          AI
        </div>
        <div className="flex-1">
          <p className={`${isDark ? 'text-slate-100' : 'text-slate-900'} mb-6 text-lg font-semibold tracking-tight`}>
            🎯 Choose how you’d like to explore this content:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.task}
                  onClick={() => handleOptionSelect(option.task, option.label)}
                  disabled={loading}
                  className={`group relative overflow-hidden flex items-center space-x-4 p-5 rounded-2xl transition-all duration-400 text-left backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 ${
                    isDark
                      ? "bg-slate-900/60 border border-slate-800/70 hover:bg-slate-900/80 hover:border-indigo-400/40"
                      : "bg-white/90 border border-slate-200/70 hover:bg-white hover:border-indigo-200"
                  } ${loading ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-2xl"}`}
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 group-hover:scale-110`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'} group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${option.color} group-hover:bg-clip-text transition-all duration-300`}>
                        {option.label}
                      </div>
                      <div className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-r ${option.color} opacity-0 group-hover:opacity-15 transition-opacity duration-400 rounded-2xl`}></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
