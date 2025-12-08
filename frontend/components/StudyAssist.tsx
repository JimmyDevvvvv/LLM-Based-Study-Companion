"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Send, Loader2, AlertCircle, Sparkles, User, Bot } from "lucide-react";
import { API_ENDPOINTS, apiUtils } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";

interface StudyAssistProps {
  isDark: boolean;
  userId: string;
  accessToken?: string | null;
  setToast: (message: string) => void;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  toolUsed?: string;
  confidence?: number;
  isError?: boolean;
}

export default function StudyAssist({ isDark, userId, accessToken, setToast }: StudyAssistProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm StudyMind AI, your intelligent study companion. ✨\n\nI can help you with:\n• Creating quizzes and flashcards\n• Generating study guides and summaries\n• Explaining concepts\n• Project ideas and more\n\nJust ask me anything in natural language!\n\n💡 **How it works:** I automatically understand what you need and route your request to the right tool. For example, say \"Create a quiz on Python\" and I'll use the Quiz Generator for you!"
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [stage, setStage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const theme = useMemo(() => themeClasses(isDark), [isDark]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStage("Analyzing your request...");

    try {
      const response = await apiUtils.post(
        API_ENDPOINTS.studyAssist,
        {
          query: userMessage.content,
          context: { user_id: userId }
        },
        accessToken
      );

      if (response.success) {
        const { intent, tool_used, result, confidence, metadata } = response;
        
        // Format the response based on tool result
        let content = "";
        if (result.quiz) {
          content = result.quiz;
        } else if (result.content) {
          content = result.content;
        } else if (result.output) {
          content = result.output;
        } else if (result.ideas) {
          content = result.ideas;
        } else if (result.answer) {
          content = result.answer;
        } else if (result.response) {
          content = result.response;
        } else {
          content = JSON.stringify(result, null, 2);
        }

        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: content,
          toolUsed: tool_used,
          confidence: confidence
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else if (response.needs_clarification) {
        const options = response.clarification_options || [];
        const optionsText = options.map((opt: any, idx: number) => 
          `${idx + 1}. ${opt.name}: ${opt.description}`
        ).join("\n");

        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: `I can help with that! Which would you like?\n\n${optionsText}\n\nJust tell me the number or describe what you want.`
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle error response from backend
        const errorMsg = response.message || response.error || "Something went wrong. Please try again.";
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: errorMsg,
          isError: true
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Show toast for errors
        if (setToast) {
          setToast(errorMsg);
        }
      }
    } catch (err: any) {
      let errorMessage = "Something went wrong. Please try again.";
      let showToast = true;

      // Handle different error types
      if (err instanceof Error) {
        const errorStr = err.message.toLowerCase();
        
        // Check for quota/rate limit errors (429)
        if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("quota_exceeded")) {
          errorMessage = "Daily AI request limit reached — please try again tomorrow.";
        }
        // Check for model not found errors
        else if (errorStr.includes("model") && (errorStr.includes("not found") || errorStr.includes("not supported"))) {
          errorMessage = "AI model configuration error. Please contact support.";
        }
        // Check for network errors
        else if (errorStr.includes("network") || errorStr.includes("fetch") || errorStr.includes("failed to fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
        // Check for backend not running
        else if (errorStr.includes("backend") || errorStr.includes("500") || errorStr.includes("connection refused")) {
          errorMessage = "Backend service unavailable. Please check if the server is running.";
        }
        // Use original error message if it's informative
        else if (err.message && err.message.length < 200) {
          errorMessage = err.message;
        }
      }

      const errorMsgObj: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: errorMessage,
        isError: true
      };

      setMessages(prev => [...prev, errorMsgObj]);
      
      // Show toast for errors
      if (showToast && setToast) {
        setToast(errorMessage);
      }
    } finally {
      setLoading(false);
      setStage("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? "bg-slate-800" : "bg-slate-100"
                }`}>
                  <Bot className={`w-5 h-5 ${isDark ? "text-slate-300" : "text-slate-600"}`} />
                </div>
              )}

              <div className={`flex flex-col gap-2 max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? isDark
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-500 text-white"
                    : isDark
                      ? "bg-slate-800 text-slate-100"
                      : "bg-slate-100 text-slate-900"
                } ${message.isError ? "border border-red-500/50" : ""}`}>
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
                
                {message.toolUsed && (
                  <div className={`text-xs px-2 py-1 rounded ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>
                    Generated using: {message.toolUsed}
                    {message.confidence && ` (${Math.round(message.confidence * 100)}% confidence)`}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? "bg-indigo-600" : "bg-indigo-500"
                }`}>
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}>
                <Bot className={`w-5 h-5 ${isDark ? "text-slate-300" : "text-slate-600"}`} />
              </div>
              <div className={`rounded-2xl px-4 py-3 ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {stage || "Thinking..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className={`border-t ${
        isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
      }`}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className={`relative rounded-2xl ${
              isDark ? "bg-slate-800" : "bg-slate-100"
            } border ${
              isDark ? "border-slate-700" : "border-slate-300"
            } shadow-lg`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInputResize}
                placeholder="Message StudyMind AI..."
                className={`w-full px-4 py-3 pr-12 resize-none border-0 outline-none ${
                  isDark
                    ? "bg-slate-800 text-slate-100 placeholder-slate-400"
                    : "bg-slate-100 text-slate-900 placeholder-slate-500"
                } rounded-2xl text-sm`}
                rows={1}
                style={{ minHeight: "52px", maxHeight: "200px" }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`absolute right-2 bottom-2 p-2 rounded-xl transition-all ${
                  input.trim() && !loading
                    ? isDark
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-indigo-500 hover:bg-indigo-600 text-white"
                    : isDark
                      ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className={`mt-2 text-xs text-center ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}>
              <Sparkles className="w-3 h-3 inline mr-1" />
              StudyMind can make mistakes. Verify important information.
            </div>
            <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${
              isDark ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border border-indigo-200 text-indigo-700"
            }`}>
              <div className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">How the orchestrator works:</p>
                  <p className="leading-relaxed">
                    I analyze your natural language query, determine which tool you need (quiz, flashcards, study guide, etc.), extract relevant parameters (topic, difficulty, count), and automatically route to the right tool. No need to navigate tabs or fill forms—just ask!
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
