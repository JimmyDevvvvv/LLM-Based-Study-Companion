"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Zap, Brain, Lightbulb, Sparkles, FileText, ArrowUp } from "lucide-react";

interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  task?: string;
  isProcessing?: boolean;
  isError?: boolean;
}

interface Option {
  label: string;
  task: string;
  icon: any;
  gradient: string;
  description: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    // Add welcome message
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: 'Hi! I\'m StudyMind AI. Paste your course material, notes, or any text you want to study, and I\'ll help you learn it better! ✨',
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentText(inputText);
    setInputText("");
    
    // Show animated options
    setTimeout(() => {
      setShowOptions(true);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOptionSelect = async (task: string, label: string) => {
    setShowOptions(false);
    setLoading(true);

    // Add assistant message indicating processing
    const processingMessage: Message = {
      id: Date.now(),
      type: 'assistant',
      content: `Creating your ${label.toLowerCase()}...`,
      timestamp: new Date(),
      isProcessing: true
    };

    setMessages(prev => [...prev, processingMessage]);

    try {
      const res = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText, task }),
      });
      const data = await res.json();
      
      const resultMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.output || "Error: " + JSON.stringify(data),
        timestamp: new Date(),
        task: label
      };

      // Replace processing message with result
      setMessages(prev => prev.filter(msg => !msg.isProcessing).concat([resultMessage]));
    } catch (err) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "Request failed: " + String(err),
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => prev.filter(msg => !msg.isProcessing).concat([errorMessage]));
    } finally {
      setLoading(false);
    }
  };

  const options: Option[] = [
    {
      label: "Summarize",
      task: "summarize",
      icon: FileText,
      gradient: "from-blue-500 to-indigo-600",
      description: "Get key points and main ideas"
    },
    {
      label: "Quiz Me",
      task: "quiz",
      icon: Brain,
      gradient: "from-emerald-500 to-teal-600",
      description: "Test your knowledge"
    },
    {
      label: "Flashcards",
      task: "flashcards",
      icon: Zap,
      gradient: "from-purple-500 to-violet-600",
      description: "Create study cards"
    },
    {
      label: "Explain",
      task: "explain",
      icon: Lightbulb,
      gradient: "from-orange-500 to-amber-500",
      description: "Break down complex concepts"
    },
  ];

  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            StudyMind AI
          </h1>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div
                className={`max-w-3xl p-4 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-indigo-600 text-white ml-auto'
                    : message.isError
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-white shadow-sm border border-gray-200'
                }`}
              >
                {message.isProcessing ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-gray-600">{message.content}</span>
                  </div>
                ) : (
                  <>
                    {message.task && (
                      <div className="flex items-center space-x-2 mb-3 text-indigo-600">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-semibold text-sm">{message.task}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Animated Options */}
          {showOptions && !loading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="max-w-3xl">
                <div className="mb-3 text-gray-600 font-medium">Choose how you&apos;d like to study this:</div>
                <div className="grid grid-cols-2 gap-3">
                  {options.map((option, index) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.task}
                        onClick={() => handleOptionSelect(option.task, option.label)}
                        className={`relative group p-4 bg-gradient-to-r ${option.gradient} text-white rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 animate-option-slide-in text-left`}
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-semibold">{option.label}</span>
                        </div>
                        <div className="text-sm text-white/80">{option.description}</div>
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/20 to-transparent"></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                onInput={handleInputResize}
                placeholder="Paste your study material here..."
                className="w-full p-4 pr-12 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all duration-200 bg-white shadow-sm max-h-32"
                rows={1}
                style={{
                  minHeight: '56px',
                  height: 'auto',
                  overflowY: inputText.split('\n').length > 3 ? 'auto' : 'hidden'
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || loading}
              className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes option-slide-in {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-option-slide-in {
          animation: option-slide-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}