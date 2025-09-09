"use client";

import { useState, useEffect } from "react";
import { BookOpen, Zap, Brain, Lightbulb, Sparkles, FileText } from "lucide-react";

export default function Home() {
  const [text, setText] = useState("");
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerate = async (t: string) => {
    setTask(t);
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, task: t }),
      });
      const data = await res.json();
      if (data.output) setOutput(data.output);
      else setOutput("Error: " + JSON.stringify(data));
    } catch (err) {
      setOutput("Request failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const buttons = [
    {
      label: "Summarize",
      task: "summarize",
      icon: FileText,
      gradient: "from-blue-500 via-blue-600 to-indigo-700",
      hoverGradient: "hover:from-blue-400 hover:via-blue-500 hover:to-indigo-600",
      shadow: "shadow-blue-500/25",
    },
    {
      label: "Quiz Me",
      task: "quiz",
      icon: Brain,
      gradient: "from-emerald-500 via-green-600 to-teal-700",
      hoverGradient: "hover:from-emerald-400 hover:via-green-500 hover:to-teal-600",
      shadow: "shadow-emerald-500/25",
    },
    {
      label: "Flashcards",
      task: "flashcards",
      icon: Zap,
      gradient: "from-purple-500 via-violet-600 to-purple-700",
      hoverGradient: "hover:from-purple-400 hover:via-violet-500 hover:to-purple-600",
      shadow: "shadow-purple-500/25",
    },
    {
      label: "Explain",
      task: "explain",
      icon: Lightbulb,
      gradient: "from-orange-500 via-amber-600 to-yellow-600",
      hoverGradient: "hover:from-orange-400 hover:via-amber-500 hover:to-yellow-500",
      shadow: "shadow-orange-500/25",
    },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center p-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="flex items-center justify-center mb-4 space-x-2">
            <BookOpen className="w-8 h-8 text-purple-400 animate-bounce" />
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            <Brain className="w-8 h-8 text-blue-400 animate-bounce delay-100" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4 animate-gradient">
            StudyMind AI
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your learning with AI-powered study tools. Paste your material and watch the magic happen.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-4xl mb-8 animate-fade-in-up">
          <div className="relative group">
            <textarea
              className="w-full p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:bg-white/15"
              rows={8}
              placeholder="✨ Paste your course material, notes, or any text you want to study..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full max-w-4xl">
          {buttons.map((button, index) => {
            const Icon = button.icon;
            return (
              <button
                key={button.task}
                onClick={() => handleGenerate(button.task)}
                disabled={!text.trim() || loading}
                className={`group relative px-8 py-6 bg-gradient-to-r ${button.gradient} ${button.hoverGradient} text-white rounded-2xl shadow-2xl ${button.shadow} transform transition-all duration-300 hover:scale-105 hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-3">
                  <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-lg font-semibold">{button.label}</span>
                </div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
              <div className="absolute inset-2 w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin animate-reverse"></div>
            </div>
            <p className="text-xl text-purple-300 font-medium flex items-center space-x-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>AI is crafting your {task}...</span>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </p>
          </div>
        )}

        {/* Output Section */}
        {output && !loading && (
          <div className="w-full max-w-4xl animate-fade-in-up">
            <div className="relative group">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Your {task} is ready!</span>
                  </h3>
                </div>
                <div className="p-6">
                  <pre className="text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">
                    {output}
                  </pre>
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-reverse {
          animation-direction: reverse;
        }
      `}</style>
    </div>
  );
}