"use client";

import React, { useMemo, useState } from "react";
import { FileText, Presentation, Sparkles, Save, Minimize2, Maximize2 } from "lucide-react";
import Section from "./Section";
import { API_ENDPOINTS } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";

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
  const theme = useMemo(() => themeClasses(isDark), [isDark]);

  const generateContent = async () => {
    if (!cgInput.trim()) return;
    setLoading(true);
    setCgSlides("");
    try {
      const combined = ctxText.trim() ? `${cgInput}\n\nContext:\n${ctxText}` : cgInput;
      const res = await fetch(API_ENDPOINTS.contentCreate, {
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
      const res = await fetch(API_ENDPOINTS.contentSlide, {
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
      const res = await fetch(API_ENDPOINTS.contentAdjust, {
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
      const res = await fetch(API_ENDPOINTS.contentSave, {
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
          <div className={`${theme.surfaceMuted} text-xs px-4 py-3 flex items-center justify-between`}>
            <span className={`${isDark ? 'text-amber-200' : 'text-amber-700'}`}>Context loaded from Upload.</span>
            <button onClick={() => setCtxText('')} className={`${theme.ghostButton} ${isDark ? '!text-amber-200' : '!text-amber-600'}`}>
              Clear
            </button>
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
                className={`${theme.textarea} w-full min-h-[180px]`}
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
              className={`${theme.input} !py-2`}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <button onClick={generateContent} disabled={loading || !cgInput.trim()} className={`${theme.primaryButton} ${loading || !cgInput.trim() ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {loading ? 'Generating...' : 'Generate Lecture'}
            </span>
          </button>
          <button onClick={generateSlides} disabled={loading || !cgOutput.trim()} className={`${theme.primaryButton} !bg-gradient-to-r !from-purple-500 !to-pink-600 ${loading || !cgOutput.trim() ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>
            <span className="flex items-center gap-2">
              <Presentation className="w-4 h-4" />
              Generate Slides
            </span>
          </button>
          <button onClick={() => adjustContent('simplify')} disabled={loading || (!cgOutput.trim() && !cgSlides.trim())} className={`${theme.secondaryButton} ${loading || (!cgOutput.trim() && !cgSlides.trim()) ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>
            <span className="flex items-center gap-2">
              <Minimize2 className="w-4 h-4" />
              Simplify
            </span>
          </button>
          <button onClick={() => adjustContent('expand')} disabled={loading || (!cgOutput.trim() && !cgSlides.trim())} className={`${theme.secondaryButton} ${loading || (!cgOutput.trim() && !cgSlides.trim()) ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>
            <span className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              Expand
            </span>
          </button>
          <button onClick={saveContent} disabled={cgSaving || (!cgOutput.trim() && !cgSlides.trim())} className={`${theme.primaryButton} !bg-gradient-to-r !from-emerald-500 !to-teal-600 ${cgSaving || (!cgOutput.trim() && !cgSlides.trim()) ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {cgSaving ? 'Saving...' : 'Save'}
            </span>
          </button>
        </div>

        {cgOutput && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`${theme.surface} overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-200 bg-blue-50/80'}`}>
                <h3 className="font-bold text-lg flex items-center gap-2 text-blue-500">
                  <div className={`${theme.icon} w-10 h-10`}>
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Lecture Content
                  <span className={`${theme.badge}`}>Markdown</span>
                </h3>
              </div>
              <div className={`p-6 ${isDark ? 'bg-slate-950/60' : 'bg-white/95'} backdrop-blur-xl`}>
                <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{cgOutput}</pre>
              </div>
            </div>
          </div>
        )}

        {cgSlides && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`${theme.surface} overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-purple-500/20 bg-purple-500/10' : 'border-purple-200 bg-purple-50/80'}`}>
                <h3 className="font-bold text-lg flex items-center gap-2 text-purple-500">
                  <div className={`${theme.icon} w-10 h-10`}>
                    <Presentation className="w-4 h-4 text-white" />
                  </div>
                  Slide Content
                  <span className={`${theme.badge}`}>Ready to Present</span>
                </h3>
              </div>
              <div className={`p-6 ${isDark ? 'bg-slate-950/60' : 'bg-white/95'} backdrop-blur-xl`}>
                <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{cgSlides}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
