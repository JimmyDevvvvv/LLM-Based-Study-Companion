"use client";

import React, { useEffect, useState } from "react";
import Section from "./Section";
import { API_ENDPOINTS, apiUtils } from "@/config/api";

export default function HistoryView({ isDark }: { isDark: boolean }) {
  const [items, setItems] = useState<{ type: string; name: string }[]>([]);
  const [gradingEntries, setGradingEntries] = useState<number>(0);
  useEffect(() => {
    (async () => {
      try {
        const data = await apiUtils.get<{ items: { type: string; name: string }[]; grading_entries: number }>(API_ENDPOINTS.history);
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


