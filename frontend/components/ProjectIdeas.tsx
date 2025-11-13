"use client";

import React, { useMemo, useState } from "react";
import Section from "./Section";
import { API_ENDPOINTS } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";

export default function ProjectIdeas({ isDark }: { isDark: boolean }) {
  const [topic, setTopic] = useState<string>('Data Structures');
  const [level, setLevel] = useState<string>('beginner');
  const [variations, setVariations] = useState<boolean>(true);
  const [ideas, setIdeas] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const theme = useMemo(() => themeClasses(isDark), [isDark]);

  const run = async () => {
    if (!topic.trim()) return;
    setLoading(true); setIdeas('');
    try {
      const res = await fetch(API_ENDPOINTS.ideas, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level, variations })
      });
      const data = await res.json();
      setIdeas(data.ideas || '');
    } catch (e) { setIdeas('Error.'); } finally { setLoading(false); }
  };

  const save = async () => {
    if (!ideas.trim()) return;
    try {
      const res = await fetch(API_ENDPOINTS.contentSave, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: ideas, name: 'ideas', as_markdown: true }) });
      const data = await res.json();
      if (data && data.saved_path) alert(`Saved: ${data.saved_path}`);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className={`${theme.surface} p-4 grid grid-cols-1 sm:grid-cols-4 gap-3`}>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className={theme.input} placeholder="Course topic" />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={theme.input}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={variations} onChange={(e) => setVariations(e.target.checked)} /> Variations</label>
        <button onClick={run} disabled={loading || !topic.trim()} className={`${theme.primaryButton} ${loading || !topic.trim() ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}>{loading ? 'Generating…' : 'Generate'}</button>
      </div>
      {ideas && (
        <Section title="Ideas">
          <div className="flex gap-2 mb-2">
            <button onClick={() => navigator.clipboard.writeText(ideas)} className={theme.secondaryButton}>Copy</button>
            <button onClick={save} className={theme.primaryButton}>Save</button>
          </div>
          <pre className={`whitespace-pre-wrap text-sm p-4 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-800/60 text-slate-100' : 'bg-white/90 border-slate-200/70 text-slate-900'}`}>{ideas}</pre>
        </Section>
      )}
    </div>
  );
}


