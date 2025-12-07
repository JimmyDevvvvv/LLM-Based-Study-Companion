"use client";

import { useState, useEffect, useRef } from "react";
import { Conversation, Message } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useAuth } from "@/hooks/useAuth";
import { useTone } from "@/hooks/useTone";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import StudyAssist from "@/components/StudyAssist";

export default function StudyMind() {
  // Auth hook
  const { user, loading: authLoading, getUserId, isAuthenticated, getAccessToken, isGuest, continueAsGuest } = useAuth();
  const userId = getUserId();
  const accessToken = getAccessToken();
  
  const { isDark, mounted, toggleTheme } = useTheme();
  
  // Tone management - need a dummy setMessages for useTone hook
  const [dummyMessages, setDummyMessages] = useState<any[]>([]);
  const { tone, toneMenuOpen, setToneMenuOpen, availableTones, changeTone } = useTone(userId, setDummyMessages);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("assist");
  const [toast, setToast] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Auto-initialize guest mode if user is not authenticated
  const autoInitializedRef = useRef<boolean>(false);
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !autoInitializedRef.current) {
      autoInitializedRef.current = true;
      // Try to continue as guest automatically
      const savedGuestId = localStorage.getItem('guest_user_id');
      if (savedGuestId) {
        // Resume guest session (no need to show auth modal)
        continueAsGuest().catch(err => {
          console.error('Failed to resume guest session:', err);
          // Only show modal if guest initialization truly fails
          setShowAuthModal(true);
        });
      } else {
        // New guest - auto-initialize without showing auth modal
        continueAsGuest().catch(err => {
          console.error('Failed to initialize guest session:', err);
          setShowAuthModal(true);
        });
      }
    }
  }, [authLoading, isAuthenticated, continueAsGuest]);

  const {
    conversations,
    currentConversationId,
    createConversation,
    loadConversation,
    updateConversation,
    deleteConversation,
    setCurrentConversationId,
    generateTitle,
    error: convError,
    loading: convLoading,
    optimisticUpdatePreview,
  } = useChatHistory(userId, accessToken);

  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    setSidebarOpen(savedSidebarState !== 'false');
  }, []);

  // Surface chat history errors as toasts
  useEffect(() => {
    if (convError) {
      setToast(convError);
      // Auto-clear toast after 3s
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [convError]);



  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    localStorage.setItem('sidebarOpen', (!sidebarOpen).toString());
  };

  const startNewConversation = async () => {
    await createConversation("New Conversation");
  };

  const handleConversationSelect = async (conversationId: string) => {
    // Don't reload if we're already on this conversation
    if (conversationId === currentConversationId) return;
    setCurrentConversationId(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const success = await deleteConversation(conversationId);
    if (success) {
      if (conversationId === currentConversationId) {
        const remainingConversations = conversations.filter(c => c.id !== conversationId);
        if (remainingConversations.length > 0) {
          handleConversationSelect(remainingConversations[0].id);
        } else {
          startNewConversation();
        }
      }
    }
  };

  if (!mounted || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading StudyMind AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex h-screen overflow-hidden transition-all duration-500 ease-in-out ${isDark ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100' : 'bg-gradient-to-br from-white via-purple-50 to-blue-50 text-gray-800'}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <Sidebar
        isDark={isDark}
        sidebarOpen={sidebarOpen}
        conversations={conversations}
        currentConversation={currentConversationId}
        toggleSidebar={toggleSidebar}
        startNewConversation={startNewConversation}
        setCurrentConversation={handleConversationSelect}
        deleteConversation={handleDeleteConversation}
        user={user}
        onShowAuth={() => setShowAuthModal(true)}
      />

      {/* Main Area */}
      <div className="relative flex-1 flex flex-col min-w-0 z-10">
        
        <Header
          isDark={isDark}
          activeTab={activeTab}
          tone={tone}
          toneMenuOpen={toneMenuOpen}
          availableTones={availableTones}
          toggleSidebar={toggleSidebar}
          setActiveTab={setActiveTab}
          setToneMenuOpen={setToneMenuOpen}
          changeTone={changeTone}
          toggleTheme={toggleTheme}
          user={user}
          onShowAuth={() => setShowAuthModal(true)}
        />

        {/* Main Content - Study Assistant */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-2xl max-w-md mx-4`}>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Sign In or Continue as Guest
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                  Please sign in or continue as guest to access StudyMind AI features.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Sign In / Sign Up
                </button>
                <button
                  onClick={async () => {
                    await continueAsGuest();
                    setShowAuthModal(false);
                  }}
                  className="w-full px-6 py-3 border-2 border-indigo-500 text-indigo-500 rounded-lg font-semibold hover:bg-indigo-500 hover:text-white transition-all duration-300 transform hover:scale-105"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        ) : (
          <StudyAssist
            isDark={isDark}
            userId={userId}
            accessToken={accessToken}
            setToast={setToast}
          />
        )}


        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-md shadow ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-900 text-white'}`} onAnimationEnd={() => setToast("")}>
            {toast}
          </div>
        )}
      </div>

      {/* Auth Modal - Can close if authenticated or if user chooses guest mode */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => {
          // Allow closing if user is authenticated (including guests)
          if (isAuthenticated) {
            setShowAuthModal(false);
          }
        }}
        isDark={isDark}
      />
      
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