"use client";

import React, { useState } from "react";
import Section from "./Section";

export default function HelpMentor({ isDark }: { isDark: boolean }) {
  const [q, setQ] = useState<string>('How do I generate quizzes?');
  const [a, setA] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const ask = async () => {
    if (!q.trim()) return; setLoading(true); setA('');
    try {
      const res = await fetch('http://127.0.0.1:5000/help', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q })
      });
      const data = await res.json(); setA(data.answer || '');
    } catch (e) { setA('Error.'); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} className={`flex-1 px-3 py-2 border-2 rounded-md ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300'}`} />
        <button onClick={ask} disabled={loading || !q.trim()} className={`px-4 py-2 rounded-md ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>Ask</button>
      </div>
      {a && (
        <Section title="Answer">
          <div className="flex gap-2 mb-2">
            <button onClick={() => navigator.clipboard.writeText(a)} className={`px-3 py-1.5 rounded-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Copy</button>
          </div>
          <pre className={`whitespace-pre-wrap text-sm p-4 rounded-lg ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>{a}</pre>
        </Section>
      )}
    </div>
  );
}


