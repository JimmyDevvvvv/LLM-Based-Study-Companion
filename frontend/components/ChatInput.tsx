"use client";

import React, { useMemo } from "react";
import { Send, Sparkles, Paperclip, X } from "lucide-react";
import { themeClasses } from "@/utils/themeStyles";

interface ChatInputProps {
  isDark: boolean;
  inputText: string;
  loading: boolean;
  isTyping: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  setInputText: (text: string) => void;
  handleSend: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleInputResize: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  handleFileUpload: (file: File | null) => void;
}

export default function ChatInput({
  isDark,
  inputText,
  loading,
  isTyping,
  inputRef,
  setInputText,
  handleSend,
  handleKeyPress,
  handleInputResize,
  handleFileUpload
: ChatInputProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const theme = useMemo(() => themeClasses(isDark), [isDark]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    handleFileUpload(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    handleFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  return (
    <div className={`relative sticky bottom-0 border-t backdrop-blur-2xl transition-all duration-500 ${isDark ? 'border-slate-800/50 bg-slate-950/70' : 'border-slate-200/60 bg-white/80'} shadow-[0_-25px_80px_-40px_rgba(99,102,241,0.35)]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.18),transparent_55%)] pointer-events-none animate-[pulse_8s_infinite]"></div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {selectedFile && (
          <div className={`${theme.surfaceMuted} flex items-center gap-3 px-4 py-3 mb-4 animate-in slide-in-from-bottom-4 shadow-xl`}>
            <div className={`${theme.icon} w-10 h-10`}>
              <Paperclip className="w-4 h-4" />
            </div>
            <span className={`text-sm flex-1 truncate font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{selectedFile.name}</span>
            <button
              onClick={removeFile}
              className={`${theme.ghostButton} !rounded-2xl !px-3 !py-1.5 text-red-400 hover:text-red-300`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="relative group">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/25 via-purple-500/10 to-sky-500/25 opacity-0 blur-2xl group-focus-within:opacity-100 transition-all duration-700"></div>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              onInput={handleInputResize}
              placeholder="Ask me anything, drop a file, or request a study flow..."
              className={`${theme.textarea} w-full px-6 py-4 pr-32 max-h-40 backdrop-blur-lg shadow-lg hover:shadow-2xl font-medium text-lg`}
              rows={1}
              style={{
                minHeight: '64px',
                height: 'auto',
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`${theme.secondaryButton} !px-3 !py-2.5 !rounded-2xl shadow-lg`}
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !selectedFile) || loading || isTyping}
                className={`${theme.primaryButton} !px-4 !py-2.5 !rounded-2xl shadow-lg disabled:opacity-60 disabled:hover:translate-y-0`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className={`mt-4 text-xs flex items-center justify-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span className="tracking-wide">StudyMind can sometimes misstep — verify important facts.</span>
          <Sparkles className="w-3 h-3 animate-[pulse_1.8s_ease-in-out_infinite] delay-150" />
        </div>
      </div>
    </div>
  );
}
