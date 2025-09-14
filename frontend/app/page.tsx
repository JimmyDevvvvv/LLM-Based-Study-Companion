"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Zap, Brain, Lightbulb, Sparkles, FileText, ArrowUp, Feather, Scroll, Crown } from "lucide-react";

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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    // Add welcome message
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: 'Greetings, scholar. I am StudyMind AI, your companion in the pursuit of knowledge. Share thy texts, and I shall illuminate the path to wisdom through the ancient arts of learning. ✨📜',
        timestamp: new Date()
      }
    ]);

    // Mouse tracking for dynamic effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

    // Add assistant message indicating processing
    const processingMessage: Message = {
      id: Date.now(),
      type: 'assistant',
      content: `Conjuring your ${label.toLowerCase()} from the depths of knowledge...`,
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
        content: data.output || "The arcane arts have failed us: " + JSON.stringify(data),
        timestamp: new Date(),
        task: label
      };

      // Replace processing message with result
      setMessages(prev => prev.filter(msg => !msg.isProcessing).concat([resultMessage]));
    } catch (err) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "The scholarly connection has been severed: " + String(err),
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
      icon: Scroll,
      gradient: "from-amber-700 via-amber-600 to-yellow-600",
      description: "Distill wisdom to its essence"
    },
    {
      label: "Quiz Me",
      task: "quiz",
      icon: Crown,
      gradient: "from-red-900 via-red-800 to-red-700",
      description: "Test thy scholarly mettle"
    },
    {
      label: "Flashcards",
      task: "flashcards",
      icon: BookOpen,
      gradient: "from-emerald-900 via-emerald-800 to-emerald-700",
      description: "Forge cards of remembrance"
    },
    {
      label: "Explain",
      task: "explain",
      icon: Feather,
      gradient: "from-indigo-900 via-indigo-800 to-purple-800",
      description: "Unravel complex mysteries"
    },
  ];

  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-stone-900 to-amber-950 relative overflow-hidden">
      {/* Dynamic floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating books */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`book-${i}`}
            className="absolute opacity-10 text-amber-400 animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          >
            <BookOpen className="w-6 h-6" />
          </div>
        ))}
        
        {/* Magical particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-amber-400 rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Dynamic gradient orb following mouse */}
        <div
          className="absolute w-96 h-96 bg-gradient-radial from-amber-900/20 via-amber-800/10 to-transparent rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      </div>

      {/* Ornate border pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-50"></div>
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-transparent via-amber-600 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-transparent via-amber-600 to-transparent opacity-50"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-black/40 backdrop-blur-md border-b border-amber-600/30 p-6 sticky top-0">
        <div className="max-w-4xl mx-auto flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-3 animate-glow-pulse">
            <BookOpen className="w-10 h-10 text-amber-400 animate-bounce-gentle" />
            <Sparkles className="w-6 h-6 text-yellow-300 animate-twinkle" />
            <Feather className="w-8 h-8 text-amber-500 animate-sway" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent animate-text-shimmer drop-shadow-2xl">
              StudyMind Academia
            </h1>
            <p className="text-amber-300/80 font-serif italic text-sm mt-1">~ Illuminating the Path to Wisdom ~</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-message-appear`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div
                className={`max-w-3xl p-6 rounded-2xl backdrop-blur-md border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-amber-800/80 to-amber-700/80 border-amber-600/50 text-amber-100 ml-auto shadow-xl shadow-amber-900/20'
                    : message.isError
                    ? 'bg-red-950/80 border-red-700/50 text-red-200 shadow-xl shadow-red-900/20'
                    : 'bg-gradient-to-br from-stone-800/80 to-slate-800/80 border-stone-600/50 text-stone-100 shadow-xl shadow-black/40'
                }`}
              >
                {message.isProcessing ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-magical-bounce"></div>
                      <div className="w-3 h-3 bg-amber-500 rounded-full animate-magical-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-magical-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-amber-200 font-serif italic">{message.content}</span>
                  </div>
                ) : (
                  <>
                    {message.task && (
                      <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-amber-600/30">
                        <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                        <span className="font-serif font-bold text-amber-300 text-lg tracking-wide">{message.task}</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-amber-600/50 to-transparent"></div>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap font-serif leading-relaxed text-lg group-hover:text-amber-50 transition-colors duration-300">
                      {message.content}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Animated Options */}
          {showOptions && !loading && (
            <div className="flex justify-start animate-options-reveal">
              <div className="max-w-3xl">
                <div className="mb-6 text-amber-200 font-serif font-semibold text-xl flex items-center space-x-3">
                  <Crown className="w-6 h-6 text-yellow-400 animate-pulse" />
                  <span>Choose thy path of enlightenment:</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {options.map((option, index) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.task}
                        onClick={() => handleOptionSelect(option.task, option.label)}
                        className={`relative group p-6 bg-gradient-to-br ${option.gradient} text-white rounded-2xl border border-white/20 shadow-2xl hover:shadow-3xl transform transition-all duration-500 hover:scale-110 hover:-rotate-2 animate-option-materialize text-left overflow-hidden`}
                        style={{ animationDelay: `${index * 250}ms` }}
                      >
                        {/* Magical shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="p-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-all duration-300">
                              <Icon className="w-6 h-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                            </div>
                            <span className="font-serif font-bold text-xl">{option.label}</span>
                          </div>
                          <div className="text-sm text-white/90 font-serif italic leading-relaxed group-hover:text-white transition-colors duration-300">
                            {option.description}
                          </div>
                        </div>

                        {/* Magical border glow */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none"></div>
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
      <div className="relative z-10 bg-black/50 backdrop-blur-md border-t border-amber-600/30 p-6 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end space-x-4">
            <div className="flex-1 relative group">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                onInput={handleInputResize}
                placeholder="Share thy scholarly texts here, noble seeker of knowledge..."
                className="w-full p-6 rounded-2xl border border-amber-600/50 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 resize-none transition-all duration-300 bg-gradient-to-br from-stone-800/80 to-slate-800/80 backdrop-blur-md shadow-xl max-h-32 text-amber-100 placeholder-amber-400/70 font-serif text-lg group-hover:shadow-2xl"
                rows={1}
                style={{
                  minHeight: '72px',
                  height: 'auto',
                  overflowY: inputText.split('\n').length > 3 ? 'auto' : 'hidden'
                }}
              />
              {/* Input glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || loading}
              className="p-5 bg-gradient-to-br from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 hover:rotate-3 group border border-amber-500/50"
            >
              <ArrowUp className="w-6 h-6 group-hover:scale-125 transition-transform duration-200" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');

        .font-serif {
          font-family: 'EB Garamond', serif;
        }

        @keyframes message-appear {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes options-reveal {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes option-materialize {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.8) rotate(-5deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(5deg);
          }
          66% {
            transform: translateY(10px) rotate(-3deg);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }

        @keyframes text-shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 5px rgb(251 191 36 / 0.5));
          }
          50% {
            filter: drop-shadow(0 0 20px rgb(251 191 36 / 0.8));
          }
        }

        @keyframes magical-bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-12px) scale(1.2);
          }
        }

        .animate-message-appear {
          animation: message-appear 0.8s ease-out forwards;
        }

        .animate-options-reveal {
          animation: options-reveal 1s ease-out forwards;
        }

        .animate-option-materialize {
          animation: option-materialize 0.7s ease-out forwards;
          opacity: 0;
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-sway {
          animation: sway 3s ease-in-out infinite;
        }

        .animate-text-shimmer {
          background-size: 200% auto;
          animation: text-shimmer 3s linear infinite;
        }

        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .animate-magical-bounce {
          animation: magical-bounce 1s ease-in-out infinite;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}