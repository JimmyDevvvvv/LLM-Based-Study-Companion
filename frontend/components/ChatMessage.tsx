"use client";

import React, { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Message } from "@/types";
import { themeClasses } from "@/utils/themeStyles";

interface ChatMessageProps {
  message: Message;
  index: number;
  isDark: boolean;
}

export default function ChatMessage({ message, index, isDark }: ChatMessageProps) {
  const theme = useMemo(() => themeClasses(isDark), [isDark]);
  return (
    <div
      className="group animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className={`relative py-8 px-4 sm:px-6 transition-all duration-500 ${
          message.type === "assistant"
            ? `${isDark ? "bg-slate-900/50" : "bg-white/80"} backdrop-blur-xl rounded-3xl border ${
                isDark ? "border-slate-800/60" : "border-slate-200/60"
              } shadow-[0_25px_80px_-60px_rgba(99,102,241,0.45)]`
            : ""
        }`}
      >
        {message.type === "assistant" && (
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.22),transparent_55%)]"></div>
        )}
        <div className="relative flex items-start space-x-4">
          <div
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
              message.type === "user"
                ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/40"
                : "bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 shadow-emerald-500/40"
            }`}
          >
            <div className="absolute inset-0 rounded-2xl bg-white/15"></div>
            <span className="relative z-10">{message.type === "user" ? "U" : "AI"}</span>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {message.task && (
              <span
                className={`${theme.pill} inline-flex items-center gap-2 animate-in slide-in-from-left-2`}
              >
                <Sparkles className="w-3 h-3 animate-pulse" />
                {message.task}
              </span>
            )}

            {message.isProcessing ? (
              <div
                className={`flex items-center gap-3 text-sm font-medium ${
                  isDark ? "text-slate-200" : "text-slate-600"
                } animate-in slide-in-from-left-2`}
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-[bounce_1s_infinite] shadow-indigo-400/40"></div>
                  <div
                    className="w-2 h-2 rounded-full bg-purple-400 animate-[bounce_1s_infinite] shadow-purple-400/40"
                    style={{ animationDelay: "0.15s" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-[bounce_1s_infinite] shadow-emerald-400/40"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                </div>
                <span>{message.content}</span>
              </div>
            ) : (
              <div
                className={`prose prose-lg max-w-none transition-all duration-300 ${
                  message.isError
                    ? "text-red-500"
                    : isDark
                    ? "text-slate-100 prose-invert"
                    : "text-slate-900"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed animate-in slide-in-from-left-2">
                  {message.content}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
