"use client";

import React from "react";
import { Send, Sparkles, Paperclip, X } from "lucide-react";

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
}: ChatInputProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    <div className={`relative border-t ${isDark ? 'border-purple-500/20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900' : 'border-purple-200 bg-gradient-to-r from-white via-purple-50 to-white'} backdrop-blur-2xl sticky bottom-0 shadow-2xl shadow-purple-500/10`}>
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none"></div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {selectedFile && (
          <div className={`mb-3 flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30' : 'bg-gradient-to-r from-purple-100 to-blue-100 border-purple-300'} animate-in slide-in-from-bottom-2 shadow-lg`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Paperclip className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm flex-1 truncate font-medium">{selectedFile.name}</span>
            <button onClick={removeFile} className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}`}>
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-focus-within:opacity-20 blur-xl transition-all duration-500`}></div>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              onInput={handleInputResize}
              placeholder="Ask me anything or upload a file... ✨"
              className={`w-full px-6 py-4 pr-28 border-2 ${isDark ? 'border-gray-600 bg-gray-700/80 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:bg-gray-700' : 'border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'} rounded-2xl resize-none focus:outline-none focus:ring-4 ${isDark ? 'focus:ring-blue-400/20' : 'focus:ring-blue-500/20'} max-h-40 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl font-medium text-lg`}
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`absolute right-16 bottom-3 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg group overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-600' : 'bg-gradient-to-br from-gray-200 to-gray-300'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <Paperclip className={`w-5 h-5 relative z-10 transition-colors duration-300 ${isDark ? 'text-gray-200 group-hover:text-white' : 'text-gray-700 group-hover:text-white'}`} />
            </button>
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && !selectedFile) || loading || isTyping}
              className={`absolute right-3 bottom-3 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg group overflow-hidden ${
                (!inputText.trim() && !selectedFile) || loading || isTyping
                  ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                  : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-gradient'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 opacity-0 group-hover:opacity-50 transition-all duration-300"></div>
              <Send className="w-5 h-5 text-white relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </button>
          </div>
        </div>
        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-3 text-center flex items-center justify-center space-x-2`}>
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>StudyMind AI can make mistakes. Double-check important information.</span>
          <Sparkles className="w-3 h-3 animate-pulse" style={{animationDelay: '0.5s'}} />
        </div>
      </div>
    </div>
  );
}
