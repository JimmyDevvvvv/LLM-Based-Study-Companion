"use client";

import React, { useEffect, useState } from "react";
import Section from "./Section";

export default function HistoryView({ isDark }: { isDark: boolean }) {
  const [items, setItems] = useState<{ type: string; name: string }[]>([]);
  const [gradingEntries, setGradingEntries] = useState<number>(0);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/history');
        const data = await res.json();
        setItems(data.items || []); setGradingEntries(data.grading_entries || 0);
      } catch {}
    })();
  }, []);
  return (
    <div className="space-y-3">
      <div className="text-sm">Grading history entries: <span className="font-semibold">{gradingEntries}</span></div>
      <Section title="Saved Files">
        <ul className="list-disc ml-5 text-sm">
          {items.map((it, idx) => (<li key={idx}>{it.name}</li>))}
        </ul>
      </Section>
    </div>
  );
}


