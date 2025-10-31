"use client";

import React, { useState } from "react";
import Section from "./Section";

export default function ProjectIdeas({ isDark }: { isDark: boolean }) {
  const [topic, setTopic] = useState<string>('Data Structures');
  const [level, setLevel] = useState<string>('beginner');
  const [variations, setVariations] = useState<boolean>(true);
  const [ideas, setIdeas] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const run = async () => {
    if (!topic.trim()) return;
    setLoading(true); setIdeas('');
    try {
      const res = await fetch('http://127.0.0.1:5000/ideas', {
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
      const res = await fetch('http://127.0.0.1:5000/content/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: ideas, name: 'ideas', as_markdown: true }) });
      const data = await res.json();
      if (data && data.saved_path) alert(`Saved: ${data.saved_path}`);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} placeholder="Course topic" />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={`px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={variations} onChange={(e) => setVariations(e.target.checked)} /> Variations</label>
        <button onClick={run} disabled={loading || !topic.trim()} className={`px-4 py-2 rounded-md ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>Generate</button>
      </div>
      {ideas && (
        <Section title="Ideas">
          <div className="flex gap-2 mb-2">
            <button onClick={() => navigator.clipboard.writeText(ideas)} className={`px-3 py-1.5 rounded-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Copy</button>
            <button onClick={save} className={`px-3 py-1.5 rounded-md ${isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}>Save</button>
          </div>
          <pre className={`whitespace-pre-wrap text-sm p-4 rounded-lg ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>{ideas}</pre>
        </Section>
      )}
    </div>
  );
}


