"use client";

import React, { useMemo, useState } from "react";
import { BookOpen, User, Plus, MessageSquare, X, Trash2, LogIn, LogOut } from "lucide-react";
import { Conversation } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { themeClasses } from "@/utils/themeStyles";

interface SidebarProps {
  isDark: boolean;
  sidebarOpen: boolean;
  conversations: Conversation[];
  currentConversation: string | null;
  toggleSidebar: () => void;
  startNewConversation: () => void;
  setCurrentConversation: (id: string) => void;
  deleteConversation?: (id: string) => void;
  user?: any;
  onShowAuth: () => void;
}

export default function Sidebar({
  isDark,
  sidebarOpen,
  conversations,
  currentConversation,
  toggleSidebar,
  startNewConversation,
  setCurrentConversation,
  deleteConversation,
  user,
  onShowAuth
}: SidebarProps) {
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);
  const { signOut, isAuthenticated } = useAuth();
  const theme = useMemo(() => themeClasses(isDark), [isDark]);

  const handleSignOut = async () => {
    await signOut();
    // Optionally reload or redirect
    window.location.reload();
  };

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
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative z-50 w-72 h-full ${isDark ? 'bg-slate-950/90' : 'bg-slate-900/95'} backdrop-blur-3xl text-white flex flex-col transition-all duration-500 ease-in-out transform border-r ${isDark ? 'border-slate-800/60' : 'border-slate-700/50'} shadow-[0_40px_160px_-90px_rgba(99,102,241,0.65)]`}>
        
        {/* Sidebar Header */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-800/70' : 'border-slate-700/60'} backdrop-blur-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-indigo-500/30">
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

        {/* New Chat Button - Only show for authenticated (non-guest) users */}
        {user && !user.isGuest && (
          <div className="p-4">
            <button
              onClick={startNewConversation}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
              <div className="relative flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50">
                <Plus className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-bold">New Conversation</span>
              </div>
            </button>
          </div>
        )}

        {/* Conversations List - Only show for authenticated (non-guest) users */}
        {user && !user.isGuest ? (
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
                      className={`relative w-full text-left p-3 rounded-xl transition-all duration-300 group animate-in fade-in slide-in-from-left-2 ${
                        currentConversation === conv.id
                          ? 'bg-slate-900/70 border border-indigo-500/40 shadow-lg'
                          : 'border border-transparent hover:bg-slate-900/40 hover:border-indigo-400/30'
                      } hover:scale-[1.02] hover:shadow-lg`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center transition-all duration-300 ${
                          currentConversation === conv.id
                            ? 'from-indigo-500/40 to-purple-500/40 shadow-indigo-500/30'
                            : 'from-indigo-500/20 to-purple-500/20 group-hover:from-indigo-500/30 group-hover:to-purple-500/30'
                        }`}>
                          <MessageSquare className={`w-4 h-4 transition-colors ${
                            currentConversation === conv.id ? 'text-indigo-200' : 'text-indigo-300 group-hover:text-indigo-200'
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
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
        ) : (
          <div className="flex-1 px-4 pb-4 overflow-y-auto flex items-center justify-center">
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-2">Sign in to save conversations</p>
              <p className="text-xs text-gray-400">Guest users can chat but conversations won't be saved</p>
            </div>
          </div>
        )}
                <div
                  key={conv.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredConv(conv.id)}
                  onMouseLeave={() => setHoveredConv(null)}
                >
                  <button
                    onClick={() => setCurrentConversation(conv.id)}
                    className={`relative w-full text-left p-3 rounded-xl transition-all duration-300 group animate-in fade-in slide-in-from-left-2 ${
                      currentConversation === conv.id
                        ? 'bg-slate-900/70 border border-indigo-500/40 shadow-lg'
                        : 'border border-transparent hover:bg-slate-900/40 hover:border-indigo-400/30'
                    } hover:scale-[1.02] hover:shadow-lg`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center transition-all duration-300 ${
                        currentConversation === conv.id
                          ? 'from-indigo-500/40 to-purple-500/40 shadow-indigo-500/30'
                          : 'from-indigo-500/20 to-purple-500/20 group-hover:from-indigo-500/30 group-hover:to-purple-500/30'
                      }`}>
                        <MessageSquare className={`w-4 h-4 transition-colors ${
                          currentConversation === conv.id ? 'text-indigo-200' : 'text-indigo-300 group-hover:text-indigo-200'
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
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
        <div className={`p-4 border-t ${isDark ? 'border-slate-800/70' : 'border-slate-700/60'} backdrop-blur-sm`}>
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-gray-200">
                      {user.email || (user.isGuest ? 'Guest User' : 'User')}
                    </p>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-400">
                        {user.isGuest ? 'Guest Mode' : 'Online'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-slate-900/70 rounded-lg transition-colors group"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
              
              {user.isGuest && (
                <button
                  onClick={onShowAuth}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 text-sm font-semibold"
                  title="Sign in or create an account"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Sign Up</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onShowAuth}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              <LogIn className="w-4 h-4" />
              <span className="font-semibold">Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}