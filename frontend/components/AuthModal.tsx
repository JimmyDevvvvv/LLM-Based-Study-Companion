"use client";

import React, { useState } from "react";
import { X, Mail, Lock, LogIn, UserPlus } from "lucide-react";
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

  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message || "Authentication failed");
      } else {
        onClose();
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} p-8 animate-in slide-in-from-bottom-4`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isSignUp ? 'Sign up to save your data' : 'Sign in to continue'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none transition-colors`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none transition-colors`}
                placeholder="••••••••"
              />
            </div>
            {isSignUp && (
              <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                At least 6 characters
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {/* Toggle sign up/in */}
        <div className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="font-semibold text-blue-500 hover:text-blue-600 transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        {/* Guest mode note */}
        <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'} text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          <strong>Note:</strong> You can continue using the app without signing in. Your data will be stored locally.
        </div>
      </div>
    </div>
  );
}