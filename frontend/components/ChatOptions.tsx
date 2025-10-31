"use client";

import React from "react";
import { BookOpen, Brain, Lightbulb, FileText } from "lucide-react";
import { Option } from "@/types";

interface ChatOptionsProps {
  isDark: boolean;
  loading: boolean;
  handleOptionSelect: (task: string, label: string) => void;
}

export default function ChatOptions({ isDark, loading, handleOptionSelect }: ChatOptionsProps) {
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
    <div className={`py-8 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'} backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700`}>
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
          AI
        </div>
        <div className="flex-1">
          <p className={`${isDark ? 'text-gray-200' : 'text-gray-900'} mb-6 text-lg font-medium`}>
            🎯 Choose how you&apos;d like to study this content:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.task}
                  onClick={() => handleOptionSelect(option.task, option.label)}
                  className={`group relative overflow-hidden flex items-center space-x-4 p-5 border-2 ${isDark ? 'border-gray-600 hover:border-gray-500 bg-gray-800/60 hover:bg-gray-700/80' : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'} rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-all duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${option.color} group-hover:bg-clip-text transition-all duration-300`}>
                      {option.label}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                      {option.description}
                    </div>
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-r ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
