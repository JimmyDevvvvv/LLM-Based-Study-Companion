"use client";

import React, { useState } from "react";
import Section from "./Section";
import { API_ENDPOINTS, apiUtils } from "@/config/api";

export default function UploadView({ isDark, onUseContext }: { isDark: boolean; onUseContext: (text: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const upload = async () => {
    if (!file) return; setLoading(true); setExtracted('');
    try {
      const data = await apiUtils.uploadFile(file);
      setExtracted(data.extracted_text || '');
    } catch { setExtracted('Error.'); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-3">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
      <button onClick={upload} disabled={loading || !file} className={`px-4 py-2 rounded-md ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>Upload & Extract</button>
      {extracted && (
        <Section title="Extracted Text">
          <div className="flex gap-2 mb-2">
            <button onClick={() => navigator.clipboard.writeText(extracted)} className={`px-3 py-1.5 rounded-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Copy</button>
            <button onClick={async () => { try { const data = await apiUtils.post(API_ENDPOINTS.contentSave, { content: extracted, name: 'upload', as_markdown: false }); if (data && (data as any).saved_path) alert(`Saved: ${(data as any).saved_path}`);} catch {} }} className={`px-3 py-1.5 rounded-md ${isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}>Save</button>
            <button onClick={() => onUseContext(extracted)} className={`px-3 py-1.5 rounded-md ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>Use as Context</button>
          </div>
          <pre className={`whitespace-pre-wrap text-sm p-4 rounded-lg ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>{extracted}</pre>
        </Section>
      )}
    </div>
  );
}


