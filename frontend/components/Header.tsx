"use client";

import React, { useMemo } from "react";
import { Menu, ChevronDown, Check, Moon, Sun } from "lucide-react";
import { User } from "@/utils/authClient";
import { themeClasses } from "@/utils/themeStyles";

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
  toggleTheme?: () => void;
  user: User | null;
  onShowAuth: () => void;
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
  changeTone,
  toggleTheme,
  user,
  onShowAuth
}: HeaderProps) {
  const theme = useMemo(() => themeClasses(isDark), [isDark]);
  const tabs = [
    { key: 'assist', label: 'Study Assistant' },
  ];

  return (
    <div className={`relative border-b ${isDark ? 'border-slate-800/60 bg-slate-950/70' : 'border-slate-200/60 bg-white/80'} px-4 sm:px-6 py-4 backdrop-blur-2xl sticky top-0 z-30 shadow-[0_25px_90px_-70px_rgba(129,140,248,0.55)]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_55%)] pointer-events-none"></div>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className={`${theme.secondaryButton} !px-3 !py-2 !rounded-2xl`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <h1 className={`text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 bg-clip-text text-transparent`}>
              StudyMind AI
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Tone Selector */}
          <div className="relative">
            <button
              onClick={() => setToneMenuOpen(!toneMenuOpen)}
              className={`${theme.secondaryButton} !px-3 !py-1.5 !rounded-xl text-sm`}
              title="Change AI response tone"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500 animate-pulse"></div>
              <span className="capitalize">{tone}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${toneMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {toneMenuOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl z-50 ${isDark ? 'bg-slate-950/80 border border-slate-800/70' : 'bg-white/95 border border-slate-200/70'} backdrop-blur-2xl transform transition-all duration-300 animate-in fade-in slide-in-from-top-2`}>
                <div className="p-1.5 space-y-1">
                  {availableTones.map((t, index) => (
                    <button
                      key={t}
                      onClick={() => changeTone(t)}
                      className={`w-full text-left px-3 py-1.5 rounded-md transition-all duration-300 ${
                        isDark ? 'text-slate-200 hover:bg-slate-900/60' : 'text-slate-700 hover:bg-slate-100/80'
                      } ${t === tone ? (isDark ? 'bg-slate-900/70' : 'bg-slate-100/70') : ''}`}
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

          {/* Dark Mode Toggle */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className={`${theme.secondaryButton} !px-3 !py-2 !rounded-xl`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-[pulse_1.8s_infinite] shadow-green-500/40"></div>
              <span className="hidden sm:inline">AI Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
