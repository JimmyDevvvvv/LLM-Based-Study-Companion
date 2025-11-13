"use client";

import React, { useMemo, useState } from "react";
import { X, Mail, Lock, LogIn, UserPlus, Eye, EyeOff, CheckCircle, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function AuthModal({ isOpen, onClose, isDark }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message || "Authentication failed");
      } else {
        setSuccess(isSignUp ? "Account created successfully! 🎉" : "Welcome back! 👋");
        setTimeout(() => {
          onClose();
          setEmail("");
          setPassword("");
          setSuccess("");
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 6;
  const isFormValid = isEmailValid && isPasswordValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-10 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '4s'}}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '6s'}}></div>
      </div>

      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-[32px] shadow-2xl backdrop-blur-2xl border ${isDark ? 'bg-slate-950/90 border-slate-800/70 shadow-[0_40px_120px_-60px_rgba(37,99,235,0.85)]' : 'bg-white/90 border-white/40 shadow-[0_40px_120px_-60px_rgba(59,130,246,0.55)]'} overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500`}>
        
        {/* Gradient accent line at top */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-full transition-all duration-300 transform hover:scale-110 z-10 ${isDark ? 'bg-gray-800/50 hover:bg-gray-700 text-gray-400' : 'bg-gray-100/50 hover:bg-gray-200 text-gray-600'} backdrop-blur-sm`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform transition-transform hover:scale-110">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {isSignUp ? 'Join StudyMind' : 'Welcome Back'}
            </h2>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {isSignUp 
                ? 'Start your intelligent learning journey today' 
                : 'Continue your personalized learning experience'}
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 text-green-400 text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/40 text-red-400 text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="group">
              <label className={`block text-sm font-semibold mb-3 transition-colors ${focusedField === 'email' ? 'text-blue-500' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                focusedField === 'email'
                  ? isDark ? 'border-indigo-500/60 bg-slate-900/60' : 'border-indigo-400/60 bg-white/90'
                  : isDark ? 'border-slate-800/70 bg-slate-950/70' : 'border-slate-200/70 bg-white/85'
              } backdrop-blur-xl`}>
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  focusedField === 'email' ? 'text-blue-500' : isDark ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border-0 outline-none transition-all duration-300 font-medium ${
                    isDark
                      ? 'bg-transparent text-white placeholder-slate-500'
                      : 'bg-transparent text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="you@example.com"
                />
                {isEmailValid && focusedField === 'email' && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-in scale-in duration-300" />
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className={`block text-sm font-semibold mb-3 transition-colors ${focusedField === 'password' ? 'text-blue-500' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                focusedField === 'password'
                  ? isDark ? 'border-indigo-500/60 bg-slate-900/60' : 'border-indigo-400/60 bg-white/90'
                  : isDark ? 'border-slate-800/70 bg-slate-950/70' : 'border-slate-200/70 bg-white/85'
              } backdrop-blur-xl`}>
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  focusedField === 'password' ? 'text-blue-500' : isDark ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  minLength={6}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border-0 outline-none transition-all duration-300 font-medium ${
                    isDark 
                      ? 'bg-transparent text-white placeholder-gray-500' 
                      : 'bg-transparent text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                    isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isSignUp && (
                <p className={`mt-2 text-xs font-medium transition-colors ${password.length >= 6 ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  ✓ At least 6 characters required
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`relative w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group mt-8 ${
                isFormValid && !loading
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-[0_25px_60px_-30px_rgba(147,51,234,0.55)]'
                  : 'bg-gradient-to-r from-slate-400 to-slate-500 shadow-lg shadow-slate-600/30'
              }`}
            >
              {/* Gradient background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700/50' : 'bg-gray-200/50'}`}></div>
            <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>or</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700/50' : 'bg-gray-200/50'}`}></div>
          </div>

          {/* Toggle sign up/in */}
          <div className={`text-center text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
                setEmail("");
                setPassword("");
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold hover:opacity-80 transition-opacity"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          {/* Guest mode note */}
          <div className={`mt-6 p-4 rounded-2xl backdrop-blur-lg border ${
            isDark
              ? 'bg-slate-900/70 border-slate-800/70 text-slate-300'
              : 'bg-white/90 border-slate-200/70 text-slate-600'
          } text-xs font-medium`}>
            <div className="flex gap-2">
              <span className="text-lg">💡</span>
              <div>
                <strong className="text-indigo-500 dark:text-indigo-300">Continue as Guest</strong>
                <p className="mt-1 opacity-90">Use StudyMind without signing in. Your data will be saved locally.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}