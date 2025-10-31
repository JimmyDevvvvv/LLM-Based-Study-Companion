"use client";

import React, { useState } from "react";
import { FileText, Presentation, Sparkles, Save, Minimize2, Maximize2 } from "lucide-react";
import Section from "./Section";

interface ContentGenerationProps {
  isDark: boolean;
  userId: string;
  ctxText: string;
  setCtxText: (text: string) => void;
  setToast: (message: string) => void;
}

export default function ContentGeneration({ isDark, userId, ctxText, setCtxText, setToast }: ContentGenerationProps) {
  const [cgInput, setCgInput] = useState<string>("");
  const [cgDifficulty, setCgDifficulty] = useState<string>("beginner");
  const [cgOutput, setCgOutput] = useState<string>("");
  const [cgSlides, setCgSlides] = useState<string>("");
  const [cgSaving, setCgSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const generateContent = async () => {
    if (!cgInput.trim()) return;
    setLoading(true);
    setCgSlides("");
    try {
      const combined = ctxText.trim() ? `${cgInput}\n\nContext:\n${ctxText}` : cgInput;
      const res = await fetch("http://127.0.0.1:5000/content/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ input: combined, difficulty: cgDifficulty, user_id: userId })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCgOutput(data.content || "");
    } catch (e) {
      setCgOutput(`Error: ${e instanceof Error ? e.message : "Failed to generate content"}. Please check if the backend is running.`);
      console.error('Content Generation Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateSlides = async () => {
    if (!cgOutput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/content/slide", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ content: cgOutput })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCgSlides(data.slides || "");
    } catch (e) {
      setCgSlides(`Error: ${e instanceof Error ? e.message : "Failed to create slides"}. Please try again.`);
      console.error('Slide Generation Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const adjustContent = async (action: "simplify" | "expand") => {
    const base = cgSlides.trim() ? cgSlides : cgOutput;
    if (!base.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/content/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: base, action })
      });
      const data = await res.json();
      if (cgSlides.trim()) setCgSlides(data.content || ""); else setCgOutput(data.content || "");
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    const base = cgSlides.trim() ? cgSlides : cgOutput;
    if (!base.trim()) return;
    setCgSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/content/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: base, name: "lecture", as_markdown: true })
      });
      const data = await res.json();
      if (data && data.saved_path) setToast(`Saved: ${data.saved_path}`);
    } catch (e) {
      // noop
    } finally {
      setCgSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {ctxText && (
          <div className={`text-xs px-3 py-2 rounded-md border ${isDark ? 'border-amber-600 bg-amber-900/20 text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
            Context loaded from Upload. <button onClick={() => setCtxText('')} className={`${isDark ? 'text-amber-200' : 'text-amber-700'} underline ml-2`}>Clear</button>
          </div>
        )}

        <Section title="Content Generation" icon={<FileText className="w-5 h-5 text-white" />} gradient="from-blue-500 to-purple-600">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Topic or Source Text
              </label>
              <textarea
                value={cgInput}
                onChange={(e) => setCgInput(e.target.value)}
                placeholder="e.g., Introduction to Recursion, or paste source notes..."
                className={`w-full px-4 py-3 border-2 ${isDark ? 'border-purple-500/30 bg-gray-800/50 text-gray-100 focus:border-purple-500' : 'border-purple-200 bg-white text-gray-900 focus:border-purple-500'} rounded-xl focus:outline-none transition-all duration-300 backdrop-blur-sm`}
                rows={5}
              />
            </div>
          </div>
        </Section>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Difficulty:</label>
            <select
              value={cgDifficulty}
              onChange={(e) => setCgDifficulty(e.target.value)}
              className={`px-4 py-2 border-2 rounded-xl ${isDark ? 'border-purple-500/30 bg-gray-800/50 text-gray-100' : 'border-purple-200 bg-white'} transition-all duration-300 focus:outline-none focus:border-purple-500`}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <button onClick={generateContent} disabled={loading || !cgInput.trim()} className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg ${loading || !cgInput.trim() ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-purple-500/30'}`}>
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {loading ? 'Generating...' : 'Generate Lecture'}
            </span>
          </button>
          <button onClick={generateSlides} disabled={loading || !cgOutput.trim()} className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg ${loading || !cgOutput.trim() ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-pink-500/30'}`}>
            <span className="flex items-center gap-2">
              <Presentation className="w-4 h-4" />
              Generate Slides
            </span>
          </button>
          <button onClick={() => adjustContent('simplify')} disabled={loading || (!cgOutput.trim() && !cgSlides.trim())} className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'}`}>
            <span className="flex items-center gap-2">
              <Minimize2 className="w-4 h-4" />
              Simplify
            </span>
          </button>
          <button onClick={() => adjustContent('expand')} disabled={loading || (!cgOutput.trim() && !cgSlides.trim())} className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'}`}>
            <span className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              Expand
            </span>
          </button>
          <button onClick={saveContent} disabled={cgSaving || (!cgOutput.trim() && !cgSlides.trim())} className={`px-4 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${cgSaving || (!cgOutput.trim() && !cgSlides.trim()) ? 'bg-gray-400' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30'}`}>
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {cgSaving ? 'Saving...' : 'Save'}
            </span>
          </button>
        </div>

        {cgOutput && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`rounded-2xl overflow-hidden border-2 ${isDark ? 'border-blue-500/30 bg-gradient-to-br from-gray-800/50 to-gray-900/50' : 'border-blue-200 bg-gradient-to-br from-white to-blue-50/30'} shadow-2xl shadow-blue-500/10`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-blue-500/30 bg-gradient-to-r from-blue-900/30 to-purple-900/30' : 'border-blue-200 bg-gradient-to-r from-blue-100 to-purple-100'}`}>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Lecture Content
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>Markdown</span>
                </h3>
              </div>
              <div className={`p-6 ${isDark ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm`}>
                <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{cgOutput}</pre>
              </div>
            </div>
          </div>
        )}

        {cgSlides && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`rounded-2xl overflow-hidden border-2 ${isDark ? 'border-purple-500/30 bg-gradient-to-br from-gray-800/50 to-gray-900/50' : 'border-purple-200 bg-gradient-to-br from-white to-purple-50/30'} shadow-2xl shadow-purple-500/10`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-pink-900/30' : 'border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100'}`}>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <Presentation className="w-4 h-4 text-white" />
                  </div>
                  Slide Content
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>Ready to Present</span>
                </h3>
              </div>
              <div className={`p-6 ${isDark ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm`}>
                <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{cgSlides}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
