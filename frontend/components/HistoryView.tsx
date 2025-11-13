"use client";

import React, { useEffect, useMemo, useState } from "react";
import Section from "./Section";
import { API_ENDPOINTS, apiUtils } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";

export default function HistoryView({ isDark }: { isDark: boolean }) {
  const [items, setItems] = useState<{ type: string; name: string }[]>([]);
  const [gradingEntries, setGradingEntries] = useState<number>(0);
  const theme = useMemo(() => themeClasses(isDark), [isDark]);
  useEffect(() => {
    (async () => {
      try {
        const data = await apiUtils.get<{ items: { type: string; name: string }[]; grading_entries: number }>(API_ENDPOINTS.history);
        setItems(data.items || []); setGradingEntries(data.grading_entries || 0);
      } catch {}
    })();
  }, []);
  return (
    <div className="space-y-4">
      <div className={`${theme.surface} p-4 flex items-center justify-between`}>
        <div className="space-y-1">
          <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-xs tracking-wide uppercase`}>Grading Activity</p>
          <p className={`${isDark ? 'text-slate-100' : 'text-slate-900'} text-xl font-semibold`}>{gradingEntries}</p>
        </div>
        <div className={`${theme.badge}`}>Recent Evaluations</div>
      </div>
      <Section title="Saved Files" description="Quick access to exported templates, quizzes, and lecture content.">
        {items.length === 0 ? (
          <div className={`${theme.caption}`}>
            No saved files yet. Generate content or quizzes to see them appear here.
          </div>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((it, idx) => (
              <li key={idx} className={`${theme.surfaceMuted} flex items-center justify-between px-4 py-3`}>
                <span className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{it.name}</span>
                <span className={`${theme.badge}`}>{it.type}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}


