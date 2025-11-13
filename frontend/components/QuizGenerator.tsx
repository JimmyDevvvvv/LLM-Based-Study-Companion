"use client";

import React, { useMemo, useState } from "react";
import { HelpCircle, Copy, Save, Sparkles } from "lucide-react";
import Section from "./Section";
import { API_ENDPOINTS } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";

interface QuizGeneratorProps {
  isDark: boolean;
  ctxText: string;
  setToast: (message: string) => void;
}

export default function QuizGenerator({ isDark, ctxText, setToast }: QuizGeneratorProps) {
  const [qzTopic, setQzTopic] = useState<string>("");
  const [qzDifficulty, setQzDifficulty] = useState<string>("beginner");
  const [qzType, setQzType] = useState<string>("mcq");
  const [qzCount, setQzCount] = useState<number>(5);
  const [qzOutput, setQzOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const theme = useMemo(() => themeClasses(isDark), [isDark]);

  const generateQuiz = async () => {
    if (!qzTopic.trim()) return;
    setLoading(true);
    try {
      const combinedTopic = ctxText.trim() ? `${qzTopic} (use this context if helpful)\n\n${ctxText}` : qzTopic;
      const res = await fetch(API_ENDPOINTS.quiz, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: combinedTopic, difficulty: qzDifficulty, type: qzType, count: qzCount })
      });
      const data = await res.json();
      setQzOutput(data.quiz || "");
    } catch (e) {
      setQzOutput("Error generating quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Section title="Quiz Generator" icon={<HelpCircle className="w-5 h-5 text-white" />} gradient="from-green-500 to-teal-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-500" />
                Topic
              </label>
              <input 
                value={qzTopic} 
                onChange={(e) => setQzTopic(e.target.value)} 
                placeholder="e.g., Python Loops, World War II..."
                className={theme.input}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Difficulty</label>
              <select value={qzDifficulty} onChange={(e) => setQzDifficulty(e.target.value)} className={theme.input}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Question Type</label>
              <select value={qzType} onChange={(e) => setQzType(e.target.value)} className={theme.input}>
                <option value="mcq">Multiple Choice</option>
                <option value="short">Short Answer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Number of Questions</label>
              <input 
                type="number" 
                value={qzCount} 
                onChange={(e) => setQzCount(Number(e.target.value))} 
                min="1" 
                max="20"
                className={theme.input}
              />
            </div>
          </div>
        </Section>
        <div>
          <button onClick={generateQuiz} disabled={loading || !qzTopic.trim()} className={`${theme.primaryButton} !px-8 !py-3 ${loading || !qzTopic.trim() ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>
            <span className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              {loading ? 'Generating Quiz...' : 'Generate Quiz'}
            </span>
          </button>
        </div>
        {qzOutput && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`${theme.surface} overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-emerald-500/20 bg-emerald-500/15' : 'border-emerald-200 bg-emerald-50/80'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <div className={`${theme.icon} w-10 h-10`}>
                      <HelpCircle className="w-4 h-4 text-white" />
                    </div>
                    Quiz Questions
                    <span className={`${theme.badge}`}>{qzCount} Questions</span>
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(qzOutput).then(() => setToast('Copied quiz'))} className={theme.secondaryButton}>
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button onClick={async () => {
                      try {
                        const res = await fetch(API_ENDPOINTS.contentSave, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: qzOutput, name: 'quiz', as_markdown: true }) });
                        const data = await res.json();
                        if (data && data.saved_path) setToast(`Saved: ${data.saved_path}`);
                      } catch {}
                    }} className={`${theme.primaryButton} !bg-gradient-to-r !from-emerald-500 !to-teal-600 flex items-center gap-2`}>
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
              <div className={`p-6 ${isDark ? 'bg-slate-950/60' : 'bg-white/95'} backdrop-blur-xl`}>
                <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{qzOutput}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
