"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Brain, Lightbulb, FileText, Send, User, Sparkles, Moon, Sun, Menu, X, Plus, MessageSquare, Zap, Star } from "lucide-react";

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
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

interface Conversation {
  id: number;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export default function StudyMind() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    setIsDark(savedTheme === 'dark');
    setSidebarOpen(savedSidebarState !== 'false');
    
    // Mock conversations
    setConversations([
      {
        id: 1,
        title: "Physics Study Session",
        lastMessage: "Great! I created flashcards for quantum mechanics...",
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: 2,
        title: "History Essay Help",
        lastMessage: "Here's a summary of the Renaissance period...",
        timestamp: new Date(Date.now() - 7200000)
      }
    ]);
    
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: "Hello! I'm StudyMind AI, your intelligent study companion. ✨ Share any text with me and I'll help you master it through summaries, quizzes, flashcards, or detailed explanations. What would you like to study today?",
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

  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    localStorage.setItem('sidebarOpen', (!sidebarOpen).toString());
  };

  const startNewConversation = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'assistant',
        content: "Hello! I'm ready to help you study. What would you like to learn today?",
        timestamp: new Date()
      }
    ]);
    setCurrentConversation(null);
    setShowOptions(false);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentText(inputText);
    setInputText("");
    setIsTyping(true);
    
    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
      setShowOptions(true);
    }, 800);
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

    const processingMessage: Message = {
      id: Date.now(),
      type: 'assistant',
      content: `✨ Creating your ${label.toLowerCase()}... This will just take a moment!`,
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
        content: data.output || "I encountered an unexpected error: " + JSON.stringify(data),
        timestamp: new Date(),
        task: label
      };

      setMessages(prev => prev.filter(msg => !msg.isProcessing).concat([resultMessage]));
    } catch (err) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "🔌 I'm having trouble connecting to my backend service. Please check your connection and try again!",
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
      label: "Summary",
      task: "summarize", 
      icon: FileText,
      description: "Get key points and main ideas",
      color: "from-blue-500 to-cyan-500"
    },
    {
      label: "Quiz",
      task: "quiz",
      icon: Brain,
      description: "Test your understanding",
      color: "from-purple-500 to-pink-500"
    },
    {
      label: "Flashcards",
      task: "flashcards", 
      icon: BookOpen,
      description: "Create study cards",
      color: "from-green-500 to-emerald-500"
    },
    {
      label: "Explanation",
      task: "explain",
      icon: Lightbulb,
      description: "Detailed breakdown of concepts",
      color: "from-orange-500 to-red-500"
    },
  ];

  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
  };

  if (!mounted) return null;

  return (
    <div className={`flex h-screen transition-all duration-500 ease-in-out ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative z-50 w-72 h-full ${isDark ? 'bg-black/95 backdrop-blur-xl' : 'bg-gray-900/95 backdrop-blur-xl'} text-white flex flex-col transition-all duration-300 ease-in-out transform border-r ${isDark ? 'border-gray-800' : 'border-gray-700'}`}>
        
        {/* Sidebar Header */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-700'} backdrop-blur-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">StudyMind</span>
                <p className="text-xs text-gray-400">AI Study Companion</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={startNewConversation}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800/80 hover:bg-gray-700/80' : 'bg-gray-800/80 hover:bg-gray-700/80'} transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-gray-700/50`}
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            <span className="font-medium">New Conversation</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Chats</h3>
            {conversations.map((conv, index) => (
              <button
                key={conv.id}
                onClick={() => setCurrentConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-gray-800/60 hover:scale-[1.02] group animate-in fade-in slide-in-from-left-2`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-white transition-colors">{conv.title}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-700'} backdrop-blur-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium">User</p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-700'} transition-all duration-300 hover:scale-110 group`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className="relative">
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-180 transition-all duration-500" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-400 group-hover:-rotate-12 transition-all duration-300" />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className={`border-b ${isDark ? 'border-gray-700 bg-gray-800/90' : 'border-gray-200 bg-white/90'} px-6 py-4 backdrop-blur-xl sticky top-0 z-30`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-all duration-200 hover:scale-110`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <h1 className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                  StudyMind AI
                </h1>
                <div className="flex items-center space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 animate-pulse" style={{animationDelay: `${i * 200}ms`}} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="hidden sm:inline">AI Online</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-yellow-500 animate-bounce" />
                <span className="text-xs text-yellow-600 font-medium hidden sm:inline">Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {messages.map((message, index) => (
              <div 
                key={message.id} 
                className="group animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`py-8 transition-all duration-300 ${
                  message.type === 'assistant' 
                    ? `${isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'} backdrop-blur-sm` 
                    : ''
                } hover:bg-opacity-80`}>
                  <div className="flex items-start space-x-4">
                    
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg transition-all duration-300 hover:scale-110 ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/30' 
                        : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30'
                    }`}>
                      {message.type === 'user' ? 'U' : 'AI'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {message.task && (
                        <div className="mb-3 animate-in fade-in slide-in-from-left-2">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' : 'bg-blue-100 text-blue-800 border border-blue-200'} backdrop-blur-sm shadow-sm`}>
                            <Sparkles className="w-3 h-3 mr-1.5 animate-pulse" />
                            {message.task}
                          </span>
                        </div>
                      )}
                      
                      {message.isProcessing ? (
                        <div className={`flex items-center space-x-3 ${isDark ? 'text-gray-300' : 'text-gray-700'} animate-in fade-in slide-in-from-left-2`}>
                          <div className="flex space-x-1">
                            <div className={`w-2 h-2 ${isDark ? 'bg-blue-400' : 'bg-blue-500'} rounded-full animate-bounce shadow-lg`}></div>
                            <div className={`w-2 h-2 ${isDark ? 'bg-purple-400' : 'bg-purple-500'} rounded-full animate-bounce shadow-lg`} style={{animationDelay: '0.1s'}}></div>
                            <div className={`w-2 h-2 ${isDark ? 'bg-green-400' : 'bg-green-500'} rounded-full animate-bounce shadow-lg`} style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="ml-3 font-medium">{message.content}</span>
                        </div>
                      ) : (
                        <div className={`prose prose-lg max-w-none transition-all duration-300 ${
                          message.isError 
                            ? 'text-red-500' 
                            : isDark 
                              ? 'text-gray-200 prose-invert' 
                              : 'text-gray-900'
                        }`}>
                          <div className="whitespace-pre-wrap leading-relaxed animate-in fade-in slide-in-from-left-2">
                            {message.content}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className={`py-8 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'} backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2`}>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg animate-pulse">
                    AI
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm italic">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Study Options */}
            {showOptions && !loading && !isTyping && (
              <div className={`py-8 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'} backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700`}>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    AI
                  </div>
                  <div className="flex-1">
                    <p className={`${isDark ? 'text-gray-200' : 'text-gray-900'} mb-6 text-lg font-medium`}>
  🎯 Choose how you&apos;d like to study this content:
</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {options.map((option, index) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.task}
                            onClick={() => handleOptionSelect(option.task, option.label)}
                            className={`group relative overflow-hidden flex items-center space-x-4 p-5 border-2 ${isDark ? 'border-gray-600 hover:border-gray-500 bg-gray-800/60 hover:bg-gray-700/80' : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'} rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2`}
                            style={{ animationDelay: `${index * 150}ms` }}
                          >
                            <div className={`w-12 h-12 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-all duration-300`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-bold text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${option.color} group-hover:bg-clip-text transition-all duration-300`}>
                                {option.label}
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                                {option.description}
                              </div>
                            </div>
                            <div className={`absolute inset-0 bg-gradient-to-r ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}></div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`border-t ${isDark ? 'border-gray-700 bg-gray-800/90' : 'border-gray-200 bg-white/90'} backdrop-blur-xl sticky bottom-0`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-focus-within:opacity-20 blur-xl transition-all duration-500`}></div>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onInput={handleInputResize}
                  placeholder="Share your study material here... ✨"
                  className={`w-full px-6 py-4 pr-16 border-2 ${isDark ? 'border-gray-600 bg-gray-700/80 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:bg-gray-700' : 'border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'} rounded-2xl resize-none focus:outline-none focus:ring-4 ${isDark ? 'focus:ring-blue-400/20' : 'focus:ring-blue-500/20'} max-h-40 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl font-medium text-lg`}
                  rows={1}
                  style={{
                    minHeight: '64px',
                    height: 'auto',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || loading || isTyping}
                  className={`absolute right-3 bottom-3 w-12 h-12 bg-gradient-to-br ${isDark ? 'from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500' : 'from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600'} disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg group`}
                >
                  <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
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
      </div>
      
      <style jsx>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: animate-in 0.5s ease-out forwards;
        }
        
        .fade-in {
          animation-name: animate-in;
        }
        
        .slide-in-from-bottom-4 {
          animation-name: animate-in;
        }
        
        .slide-in-from-bottom-2 {
          animation-name: animate-in;
        }
        
        .slide-in-from-left-2 {
          animation-name: animate-in;
        }
      `}</style>
    </div>
  );
}
