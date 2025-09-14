"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Brain, Lightbulb, FileText, Send, User, Sparkles, Moon, Sun } from "lucide-react";

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
}

export default function StudyMind() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    setIsDark(savedTheme === 'dark');
    
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: "Hello! I'm StudyMind AI. I can help you study any text by creating summaries, quizzes, flashcards, or explanations. Just paste your content below to get started.",
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
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
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
    
    setTimeout(() => {
      setShowOptions(true);
    }, 300);
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
      content: `I'll create a ${label.toLowerCase()} for you. One moment...`,
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
        content: data.output || "I encountered an error: " + JSON.stringify(data),
        timestamp: new Date(),
        task: label
      };

      setMessages(prev => prev.filter(msg => !msg.isProcessing).concat([resultMessage]));
    } catch (err) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm having trouble connecting to my backend service. Please try again later.",
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
      description: "Get key points and main ideas"
    },
    {
      label: "Quiz",
      task: "quiz",
      icon: Brain,
      description: "Test your understanding"
    },
    {
      label: "Flashcards",
      task: "flashcards", 
      icon: BookOpen,
      description: "Create study cards"
    },
    {
      label: "Explanation",
      task: "explain",
      icon: Lightbulb,
      description: "Detailed breakdown of concepts"
    },
  ];

  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
  };

  if (!mounted) return null;

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
      
      {/* Sidebar */}
      <div className={`w-64 ${isDark ? 'bg-black' : 'bg-gray-900'} text-white flex flex-col`}>
        <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-700'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-medium">StudyMind</span>
          </div>
        </div>
        <div className="flex-1 p-3">
          <button className={`w-full text-left px-3 py-2.5 rounded-md ${isDark ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-800 hover:bg-gray-700'} text-sm transition-colors`}>
            New conversation
          </button>
        </div>
        <div className={`p-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <User className="w-5 h-5" />
              <span>User</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-md ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-700'} transition-colors`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-gray-300" />
              ) : (
                <Moon className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
        <div className={`border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-lg font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>StudyMind AI</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div key={message.id} className="group">
                <div className={`px-6 py-8 ${message.type === 'assistant' ? (isDark ? 'bg-gray-800' : 'bg-gray-50') : ''}`}>
                  <div className="flex items-start space-x-4">
                    
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                      message.type === 'user' ? 'bg-blue-600' : 'bg-green-600'
                    }`}>
                      {message.type === 'user' ? 'U' : 'AI'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {message.task && (
                        <div className="mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                            <Sparkles className="w-3 h-3 mr-1" />
                            {message.task}
                          </span>
                        </div>
                      )}
                      
                      {message.isProcessing ? (
                        <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex space-x-1">
                            <div className={`w-1.5 h-1.5 ${isDark ? 'bg-gray-500' : 'bg-gray-400'} rounded-full animate-bounce`}></div>
                            <div className={`w-1.5 h-1.5 ${isDark ? 'bg-gray-500' : 'bg-gray-400'} rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
                            <div className={`w-1.5 h-1.5 ${isDark ? 'bg-gray-500' : 'bg-gray-400'} rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="ml-2">{message.content}</span>
                        </div>
                      ) : (
                        <div className={`prose prose-gray max-w-none ${
                          message.isError ? 'text-red-600' : (isDark ? 'text-gray-200' : 'text-gray-900')
                        }`}>
                          <div className="whitespace-pre-wrap leading-7">
                            {message.content}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Study Options */}
            {showOptions && !loading && (
              <div className="group">
                <div className={`px-6 py-8 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      AI
                    </div>
                    <div className="flex-1">
                      <p className={`${isDark ? 'text-gray-200' : 'text-gray-900'} mb-4`}>
                        I can help you study this content in several ways. What would you like me to create?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {options.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <button
                              key={option.task}
                              onClick={() => handleOptionSelect(option.task, option.label)}
                              className={`flex items-center space-x-3 p-4 border ${isDark ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-200 hover:border-gray-300 hover:bg-white'} rounded-lg transition-all text-left`}
                            >
                              <div className={`w-8 h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-md flex items-center justify-center flex-shrink-0`}>
                                <IconComponent className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                              </div>
                              <div>
                                <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{option.label}</div>
                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{option.description}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                onInput={handleInputResize}
                placeholder="Message StudyMind..."
                className={`w-full px-4 py-3 pr-12 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'} rounded-lg resize-none focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-blue-400' : 'focus:ring-blue-500'} max-h-32`}
                rows={1}
                style={{
                  minHeight: '52px',
                  height: 'auto',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || loading}
                className={`absolute right-3 bottom-3 w-8 h-8 ${isDark ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} disabled:bg-gray-300 disabled:hover:bg-gray-300 rounded-md flex items-center justify-center transition-colors disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2 text-center`}>
              StudyMind can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}