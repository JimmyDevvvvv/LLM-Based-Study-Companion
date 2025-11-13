"use client";

import React, { useMemo, useState } from "react";
import Section from "./Section";
import { API_ENDPOINTS, apiUtils } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";

export default function UploadView({ isDark, onUseContext }: { isDark: boolean; onUseContext: (text: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const theme = useMemo(() => themeClasses(isDark), [isDark]);
  const upload = async () => {
    if (!file) return; setLoading(true); setExtracted('');
    try {
      const data = await apiUtils.uploadFile(file);
      setExtracted(data.extracted_text || '');
    } catch { setExtracted('Error.'); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <div className={`${theme.surface} px-4 py-4 flex items-center gap-3 bg-gradient-to-r from-transparent via-transparent to-transparent`}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className={`${theme.input} flex-1 text-sm`}
        />
        <button
          onClick={upload}
          disabled={loading || !file}
          className={`${theme.primaryButton} ${loading || !file ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''}`}
        >
          {loading ? 'Extracting...' : 'Upload & Extract'}
        </button>
      </div>
      {extracted && (
        <Section title="Extracted Text" description="Send to chat, copy it, or save for later.">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(extracted)}
              className={theme.secondaryButton}
            >
              Copy
            </button>
            <button
              onClick={async () => {
                try {
                  const data = await apiUtils.post(API_ENDPOINTS.contentSave, { content: extracted, name: 'upload', as_markdown: false });
                  if (data && (data as any).saved_path) alert(`Saved: ${(data as any).saved_path}`);
                } catch {}
              }}
              className={theme.primaryButton}
            >
              Save
            </button>
            <button
              onClick={() => onUseContext(extracted)}
              className={`${theme.secondaryButton} ${isDark ? '!text-sky-300' : '!text-sky-600'}`}
            >
              Use as Context
            </button>
          </div>
          <pre className={`whitespace-pre-wrap text-sm p-4 rounded-2xl border transition-all duration-500 ${isDark ? 'bg-slate-900/70 border-slate-800/60 text-slate-100' : 'bg-white/90 border-slate-200/70 text-slate-900'}`}>
            {extracted}
          </pre>
        </Section>
      )}
    </div>
  );
}


