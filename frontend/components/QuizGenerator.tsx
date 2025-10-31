"use client";

import React, { useState } from "react";
import { HelpCircle, Copy, Save, Sparkles } from "lucide-react";
import Section from "./Section";

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

  const generateQuiz = async () => {
    if (!qzTopic.trim()) return;
    setLoading(true);
    try {
      const combinedTopic = ctxText.trim() ? `${qzTopic} (use this context if helpful)\n\n${ctxText}` : qzTopic;
      const res = await fetch("http://127.0.0.1:5000/quiz", {
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
                className={`w-full px-4 py-3 border-2 rounded-xl ${isDark ? 'border-green-500/30 bg-gray-800/50 text-gray-100 focus:border-green-500' : 'border-green-200 bg-white text-gray-900 focus:border-green-500'} focus:outline-none transition-all duration-300`} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Difficulty</label>
              <select value={qzDifficulty} onChange={(e) => setQzDifficulty(e.target.value)} className={`w-full px-4 py-3 border-2 rounded-xl ${isDark ? 'border-green-500/30 bg-gray-800/50 text-gray-100' : 'border-green-200 bg-white'} focus:outline-none focus:border-green-500 transition-all duration-300`}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Question Type</label>
              <select value={qzType} onChange={(e) => setQzType(e.target.value)} className={`w-full px-4 py-3 border-2 rounded-xl ${isDark ? 'border-green-500/30 bg-gray-800/50 text-gray-100' : 'border-green-200 bg-white'} focus:outline-none focus:border-green-500 transition-all duration-300`}>
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
                className={`w-full px-4 py-3 border-2 rounded-xl ${isDark ? 'border-green-500/30 bg-gray-800/50 text-gray-100' : 'border-green-200 bg-white'} focus:outline-none focus:border-green-500 transition-all duration-300`}
              />
            </div>
          </div>
        </Section>
        <div>
          <button onClick={generateQuiz} disabled={loading || !qzTopic.trim()} className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg ${loading || !qzTopic.trim() ? 'bg-gray-400' : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-green-500/30'}`}>
            <span className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              {loading ? 'Generating Quiz...' : 'Generate Quiz'}
            </span>
          </button>
        </div>
        {qzOutput && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`rounded-2xl overflow-hidden border-2 ${isDark ? 'border-green-500/30 bg-gradient-to-br from-gray-800/50 to-gray-900/50' : 'border-green-200 bg-gradient-to-br from-white to-green-50/30'} shadow-2xl shadow-green-500/10`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-green-500/30 bg-gradient-to-r from-green-900/30 to-teal-900/30' : 'border-green-200 bg-gradient-to-r from-green-100 to-teal-100'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <HelpCircle className="w-4 h-4 text-white" />
                    </div>
                    Quiz Questions
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>{qzCount} Questions</span>
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(qzOutput).then(() => setToast('Copied quiz'))} className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${isDark ? 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'}`}>
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button onClick={async () => {
                      try {
                        const res = await fetch('http://127.0.0.1:5000/content/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: qzOutput, name: 'quiz', as_markdown: true }) });
                        const data = await res.json();
                        if (data && data.saved_path) setToast(`Saved: ${data.saved_path}`);
                      } catch {}
                    }} className="px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-emerald-500/30">
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
              <div className={`p-6 ${isDark ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm`}>
                <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{qzOutput}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
