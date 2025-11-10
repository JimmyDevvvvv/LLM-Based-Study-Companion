"use client";

import React, { useState } from "react";
import { BookOpen, User, Plus, MessageSquare, X, Trash2 } from "lucide-react";
import { Conversation } from "@/types";

interface SidebarProps {
  isDark: boolean;
  sidebarOpen: boolean;
  conversations: Conversation[];
  currentConversation: string | null;
  toggleSidebar: () => void;
  startNewConversation: () => void;
  setCurrentConversation: (id: string) => void;
  deleteConversation?: (id: string) => void;
}

export default function Sidebar({
  isDark,
  sidebarOpen,
  conversations,
  currentConversation,
  toggleSidebar,
  startNewConversation,
  setCurrentConversation,
  deleteConversation
}: SidebarProps) {
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);
  return (
    <>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative z-50 w-72 h-full bg-gradient-to-b ${isDark ? 'from-gray-900 via-black to-gray-900' : 'from-gray-900 via-gray-800 to-gray-900'} backdrop-blur-2xl text-white flex flex-col transition-all duration-500 ease-in-out transform border-r border-purple-500/20 shadow-2xl shadow-purple-500/10`}>
        
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
            className="relative w-full group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
            <div className="relative flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50">
              <Plus className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-bold">New Conversation</span>
            </div>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Chats</h3>
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              conversations.map((conv, index) => (
                <div
                  key={conv.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredConv(conv.id)}
                  onMouseLeave={() => setHoveredConv(null)}
                >
                  <button
                    onClick={() => setCurrentConversation(conv.id)}
                    className={`relative w-full text-left p-3 rounded-xl transition-all duration-300 group animate-in fade-in slide-in-from-left-2 border ${
                      currentConversation === conv.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-purple-500/40 shadow-lg'
                        : 'border-transparent hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 hover:border-purple-500/20'
                    } hover:scale-[1.02] hover:shadow-lg`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center transition-all duration-300 ${
                        currentConversation === conv.id
                          ? 'from-blue-500/40 to-purple-500/40'
                          : 'from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30'
                      }`}>
                        <MessageSquare className={`w-4 h-4 transition-colors ${
                          currentConversation === conv.id ? 'text-blue-300' : 'text-blue-400 group-hover:text-blue-300'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <p className={`font-semibold text-sm truncate transition-colors bg-gradient-to-r bg-clip-text text-transparent ${
                          currentConversation === conv.id
                            ? 'from-white to-blue-100'
                            : 'from-gray-200 to-gray-300 group-hover:from-white group-hover:to-blue-100'
                        }`}>{conv.title}</p>
                        <p className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Delete Button */}
                  {deleteConversation && hoveredConv === conv.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Section */}
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
          </div>
        </div>
      </div>
    </>
  );
}
