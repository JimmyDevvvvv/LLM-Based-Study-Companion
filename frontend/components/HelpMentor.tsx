"use client";

import React, { useMemo, useState } from "react";
import Section from "./Section";
import { API_ENDPOINTS } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";

export default function HelpMentor({ isDark }: { isDark: boolean }) {
  const [q, setQ] = useState<string>('How do I generate quizzes?');
  const [a, setA] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const theme = useMemo(() => themeClasses(isDark), [isDark]);
  const ask = async () => {
    if (!q.trim()) return; setLoading(true); setA('');
    try {
      const res = await fetch(API_ENDPOINTS.help, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q })
      });
      const data = await res.json(); setA(data.answer || '');
    } catch (e) { setA('Error.'); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <div className={`${theme.surface} p-4 flex flex-col sm:flex-row gap-3`}>
        <input value={q} onChange={(e) => setQ(e.target.value)} className={`${theme.input} flex-1`} placeholder="Ask the mentor about StudyMind..." />
        <button onClick={ask} disabled={loading || !q.trim()} className={`${theme.primaryButton} ${loading || !q.trim() ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>{loading ? 'Thinking...' : 'Ask'}</button>
      </div>
      {a && (
        <Section title="Answer">
          <div className="flex gap-2 mb-2">
            <button onClick={() => navigator.clipboard.writeText(a)} className={theme.secondaryButton}>Copy</button>
          </div>
          <pre className={`whitespace-pre-wrap text-sm p-4 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800/60 text-slate-100' : 'bg-white/90 border-slate-200/70 text-slate-900'}`}>{a}</pre>
        </Section>
      )}
    </div>
  );
}


