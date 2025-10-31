"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  index: number;
  isDark: boolean;
}

export default function ChatMessage({ message, index, isDark }: ChatMessageProps) {
  return (
    <div 
      className="group animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`relative py-8 transition-all duration-500 ${
        message.type === 'assistant' 
          ? `${isDark ? 'bg-gradient-to-r from-gray-800/20 via-purple-900/10 to-gray-800/20' : 'bg-gradient-to-r from-purple-50/30 via-blue-50/30 to-purple-50/30'} backdrop-blur-sm` 
          : ''
      } hover:bg-opacity-90 group`}>
        {message.type === 'assistant' && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        )}
        <div className="relative flex items-start space-x-4">
          
          {/* Avatar */}
          <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-6 ${
            message.type === 'user' 
              ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-blue-500/50 animate-pulse' 
              : 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 shadow-green-500/50'
          }`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
            <span className="relative z-10">{message.type === 'user' ? 'U' : 'AI'}</span>
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
  );
}
