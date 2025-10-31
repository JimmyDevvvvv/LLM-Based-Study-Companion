"use client";

import React from "react";
import { Menu, Star, Zap, ChevronDown, Check } from "lucide-react";

interface HeaderProps {
  isDark: boolean;
  activeTab: string;
  tone: string;
  toneMenuOpen: boolean;
  availableTones: string[];
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  setToneMenuOpen: (open: boolean) => void;
  changeTone: (tone: string) => void;
}

export default function Header({
  isDark,
  activeTab,
  tone,
  toneMenuOpen,
  availableTones,
  toggleSidebar,
  setActiveTab,
  setToneMenuOpen,
  changeTone
}: HeaderProps) {
  const tabs = [
    { key: 'chat', label: 'Chat' },
    { key: 'content', label: 'Content Generation' },
    { key: 'grading', label: 'Grading & Feedback' },
    { key: 'quiz', label: 'Quiz Generator' },
    { key: 'admin', label: 'Admin Tools' },
    { key: 'ideas', label: 'Project Ideas' },
    { key: 'help', label: 'Help' },
  ];

  return (
    <div className={`relative border-b ${isDark ? 'border-purple-500/20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900' : 'border-purple-200 bg-gradient-to-r from-white via-purple-50 to-white'} px-6 py-4 backdrop-blur-2xl sticky top-0 z-30 shadow-lg shadow-purple-500/5`}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-all duration-200 hover:scale-110`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <h1 className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
              StudyMind AI
            </h1>
            <div className="flex items-center space-x-1">
              {[...Array(3)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 animate-pulse" style={{animationDelay: `${i * 200}ms`}} />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs + Tone Selector */}
        <div className="flex items-center space-x-4">
          {/* App Tabs */}
          <div className="hidden md:flex items-center space-x-2 mr-2">
            {tabs.map((t, idx) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 group overflow-hidden ${
                  activeTab === t.key 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30' 
                    : isDark 
                      ? 'text-gray-300 hover:bg-gray-700/50 border border-gray-700/50' 
                      : 'text-gray-700 hover:bg-purple-50 border border-gray-200'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {activeTab === t.key && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tone Selector */}
          <div className="relative">
            <button
              onClick={() => setToneMenuOpen(!toneMenuOpen)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-2 
                ${isDark 
                  ? 'bg-gray-700/80 hover:bg-gray-600/90 border border-gray-600/50' 
                  : 'bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/50'} 
                transition-all duration-300 hover:scale-105 group`}
              title="Change AI response tone"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500 animate-pulse"></div>
              <span className="capitalize">{tone}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${toneMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {toneMenuOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl z-50 
                ${isDark 
                  ? 'bg-gray-800/95 border border-gray-700' 
                  : 'bg-white/95 border border-gray-200'} 
                backdrop-blur-xl transform transition-all duration-300 animate-in fade-in slide-in-from-top-2`}>
                <div className="p-1.5 space-y-1">
                  {availableTones.map((t, index) => (
                    <button
                      key={t}
                      onClick={() => changeTone(t)}
                      className={`w-full text-left px-3 py-1.5 rounded-md group transition-all duration-300
                        ${isDark 
                          ? 'hover:bg-gray-700/80 text-gray-200' 
                          : 'hover:bg-gray-100/80 text-gray-700'}
                        ${t === tone ? (isDark ? 'bg-gray-700/50' : 'bg-gray-100/50') : ''}
                        transform hover:scale-[1.02]`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="capitalize">{t}</span>
                        {t === tone && <Check className="w-3 h-3 text-green-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span className="hidden sm:inline">AI Online</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-yellow-500 animate-bounce" />
              <span className="text-xs text-yellow-600 font-medium hidden sm:inline">Pro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
