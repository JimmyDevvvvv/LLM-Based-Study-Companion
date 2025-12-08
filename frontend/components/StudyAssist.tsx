"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Send, Loader2, AlertCircle, Sparkles, User, Bot } from "lucide-react";
import { API_ENDPOINTS, apiUtils } from "@/config/api";
import { themeClasses } from "@/utils/themeStyles";
import { Message as ConversationMessage } from "@/types";

interface StudyAssistProps {
  isDark: boolean;
  userId: string;
  accessToken?: string | null;
  setToast: (message: string) => void;
  currentConversationId: string | null;
  createConversation: (title?: string) => Promise<string | null>;
  loadConversation: (conversationId: string) => Promise<ConversationMessage[] | null>;
  updateConversation: (conversationId: string, messages: ConversationMessage[], title?: string) => Promise<boolean>;
  generateTitle: (messages: ConversationMessage[]) => string;
  isGuest?: boolean;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  toolUsed?: string;
  confidence?: number;
  isError?: boolean;
}

const WELCOME_MESSAGE: Message = {
  id: 1,
  role: "assistant",
  content: "Hello! I'm StudyMind AI, your intelligent study companion. ✨\n\nI can help you with:\n• Creating quizzes and flashcards\n• Generating study guides and summaries\n• Explaining concepts\n• Project ideas and more\n\nJust ask me anything in natural language!\n\n💡 **How it works:** I automatically understand what you need and route your request to the right tool. For example, say \"Create a quiz on Python\" and I'll use the Quiz Generator for you!"
};

export default function StudyAssist({ 
  isDark, 
  userId, 
  accessToken, 
  setToast,
  currentConversationId,
  createConversation,
  loadConversation,
  updateConversation,
  generateTitle,
  isGuest = false
}: StudyAssistProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [stage, setStage] = useState<string>("");
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const theme = useMemo(() => themeClasses(isDark), [isDark]);
  const hasLoadedConversationRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentConversationId) {
        // No conversation selected - show welcome message
        setMessages([WELCOME_MESSAGE]);
        hasLoadedConversationRef.current = null;
        return;
      }

      // Reset loaded state when conversation changes
      if (hasLoadedConversationRef.current !== currentConversationId) {
        hasLoadedConversationRef.current = null;
      }

      // Don't reload if we've already loaded this conversation
      if (hasLoadedConversationRef.current === currentConversationId) {
        return;
      }

      setLoadingMessages(true);
      try {
        const loadedMessages = await loadConversation(currentConversationId);
        
        if (loadedMessages && loadedMessages.length > 0) {
          // Convert ConversationMessage[] to Message[]
          const convertedMessages: Message[] = loadedMessages.map((msg, idx) => ({
            id: typeof msg.id === 'number' ? msg.id : (idx + 1),
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content || "",
            isError: msg.isError || false
          }));
          setMessages(convertedMessages);
        } else {
          // Empty conversation - show welcome message
          setMessages([WELCOME_MESSAGE]);
        }
        hasLoadedConversationRef.current = currentConversationId;
      } catch (err) {
        console.error("Error loading conversation:", err);
        setMessages([WELCOME_MESSAGE]);
        hasLoadedConversationRef.current = null;
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentConversationId, loadConversation]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    // For guests, don't create conversations - just use null
    // For authenticated users, ensure we have a conversation
    let conversationId = currentConversationId;
    if (!conversationId && !isGuest) {
      // Create a new conversation if none exists (only for authenticated users)
      conversationId = await createConversation("New Conversation");
      if (!conversationId) {
        setToast("Failed to create conversation. Please try again.");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
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

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        // Save messages to conversation (only for authenticated users)
        if (conversationId && !isGuest) {
          const conversationMessages: ConversationMessage[] = finalMessages
            .filter(msg => msg.id !== WELCOME_MESSAGE.id) // Exclude welcome message
            .map((msg, idx) => ({
              id: msg.id,
              type: msg.role === "user" ? "user" : "assistant",
              content: msg.content,
              timestamp: new Date(),
              isError: msg.isError
            }));

          // Generate title from first user message if this is a new conversation
          let title: string | undefined;
          if (finalMessages.filter(m => m.role === "user").length === 1) {
            title = generateTitle(conversationMessages.filter(m => m.type === "user"));
          }

          await updateConversation(conversationId, conversationMessages, title);
        }
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

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        // Save messages to conversation (only for authenticated users)
        if (conversationId && !isGuest) {
          const conversationMessages: ConversationMessage[] = finalMessages
            .filter(msg => msg.id !== WELCOME_MESSAGE.id)
            .map((msg, idx) => ({
              id: msg.id,
              type: msg.role === "user" ? "user" : "assistant",
              content: msg.content,
              timestamp: new Date(),
              isError: msg.isError
            }));

          await updateConversation(conversationId, conversationMessages);
        }
      } else {
        // Handle error response from backend
        let errorMsg = response.message || "Something went wrong. Please try again.";
        
        // Convert error codes to user-friendly messages
        if (response.error === "ambiguous_query") {
          errorMsg = "I'm not quite sure what you'd like me to do. Could you be more specific?";
        } else if (response.error === "quota_exceeded") {
          errorMsg = "Daily AI request limit reached — please try again tomorrow.";
        } else if (response.error === "model_not_found") {
          errorMsg = "AI model configuration error. Please contact support.";
        } else if (response.error && !response.message) {
          // If we have an error code but no message, provide a generic one
          errorMsg = "Something went wrong. Please try again.";
        }
        
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: errorMsg,
          isError: true
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        // Save messages to conversation (even on error, only for authenticated users)
        if (conversationId && !isGuest) {
          const conversationMessages: ConversationMessage[] = finalMessages
            .filter(msg => msg.id !== WELCOME_MESSAGE.id)
            .map((msg, idx) => ({
              id: msg.id,
              type: msg.role === "user" ? "user" : "assistant",
              content: msg.content,
              timestamp: new Date(),
              isError: msg.isError
            }));

          await updateConversation(conversationId, conversationMessages);
        }
        
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

      const finalMessages = [...updatedMessages, errorMsgObj];
      setMessages(finalMessages);

      // Save messages to conversation (even on error, only for authenticated users)
      if (conversationId && !isGuest) {
        const conversationMessages: ConversationMessage[] = finalMessages
          .filter(msg => msg.id !== WELCOME_MESSAGE.id)
          .map((msg, idx) => ({
            id: msg.id,
            type: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
            timestamp: new Date(),
            isError: msg.isError
          }));

        await updateConversation(conversationId, conversationMessages);
      }
      
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
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              style={{
                animation: `messageSlideIn 0.4s ease-out ${index * 50}ms both`
              }}
            >
              {message.role === "assistant" && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isDark ? "bg-slate-800 shadow-lg" : "bg-slate-100 shadow-md"
                }`}>
                  <Bot className={`w-5 h-5 ${isDark ? "text-slate-300" : "text-slate-600"}`} />
                </div>
              )}

              <div className={`flex flex-col gap-2 max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-4 py-3 transition-all duration-200 hover:shadow-lg ${
                  message.role === "user"
                    ? isDark
                      ? "bg-indigo-600 text-white shadow-indigo-500/20"
                      : "bg-indigo-500 text-white shadow-indigo-500/30"
                    : isDark
                      ? "bg-slate-800 text-slate-100 shadow-slate-900/50"
                      : "bg-slate-100 text-slate-900 shadow-slate-200/50"
                } ${message.isError ? "border border-red-500/50 shadow-red-500/20" : ""}`}>
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
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                  isDark ? "bg-indigo-600 shadow-indigo-500/30" : "bg-indigo-500 shadow-indigo-500/40"
                }`}>
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Messages Indicator with skeleton */}
          {loadingMessages && (
            <div className="flex gap-4 justify-start animate-message-in">
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
                    Loading conversation...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator with typing animation */}
          {loading && (
            <div className="flex gap-4 justify-start animate-message-in">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}>
                <Bot className={`w-5 h-5 ${isDark ? "text-slate-300" : "text-slate-600"}`} />
              </div>
              <div className={`rounded-2xl px-4 py-3 shadow-lg ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${isDark ? "bg-slate-400" : "bg-slate-500"} animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                    <span className={`w-2 h-2 rounded-full ${isDark ? "bg-slate-400" : "bg-slate-500"} animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                    <span className={`w-2 h-2 rounded-full ${isDark ? "bg-slate-400" : "bg-slate-500"} animate-bounce`} style={{ animationDelay: '300ms' }}></span>
                  </div>
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
            <div className={`relative rounded-2xl transition-all duration-200 ${
              isDark ? "bg-slate-800" : "bg-slate-100"
            } border ${
              isDark ? "border-slate-700" : "border-slate-300"
            } shadow-lg hover:shadow-xl focus-within:shadow-2xl focus-within:border-indigo-400/50`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInputResize}
                placeholder="Message StudyMind AI..."
                className={`w-full px-4 py-3 pr-12 resize-none border-0 outline-none transition-all duration-200 ${
                  isDark
                    ? "bg-slate-800 text-slate-100 placeholder-slate-400 focus:placeholder-slate-500"
                    : "bg-slate-100 text-slate-900 placeholder-slate-500 focus:placeholder-slate-400"
                } rounded-2xl text-sm focus:ring-0`}
                rows={1}
                style={{ minHeight: "52px", maxHeight: "200px" }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`absolute right-2 bottom-2 p-2 rounded-xl transition-all duration-200 active:scale-90 ${
                  input.trim() && !loading
                    ? isDark
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110"
                      : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110"
                    : isDark
                      ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
              </button>
            </div>
            <div className={`mt-2 text-xs text-center ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}>
              <Sparkles className="w-3 h-3 inline mr-1" />
              StudyMind can make mistakes. Verify important information.
            </div>
            <div className={`mt-2 px-3 py-2 rounded-lg text-xs transition-all duration-300 animate-in fade-in ${
              isDark ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/15" : "bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            }`}>
              <div className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 animate-pulse" />
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
