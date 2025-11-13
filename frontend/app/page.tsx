"use client";

import { useState, useEffect, useRef } from "react";
import { Conversation, Message } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { useChat } from "@/hooks/useChat";
import { useTone } from "@/hooks/useTone";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ContentGeneration from "@/components/ContentGeneration";
import GradingFeedback from "@/components/GradingFeedback";
import QuizGenerator from "@/components/QuizGenerator";
import AdminTools from "@/components/AdminTools";
import ProjectIdeas from "@/components/ProjectIdeas";
import HelpMentor from "@/components/HelpMentor";
import AuthModal from "@/components/AuthModal";

export default function StudyMind() {
  // Auth hook
  const { user, loading: authLoading, getUserId, isAuthenticated, getAccessToken } = useAuth();
  const userId = getUserId();
  const accessToken = getAccessToken();
  
  const { isDark, mounted, toggleTheme } = useTheme();
  const {
    messages,
    setMessages,
    inputText,
    setInputText,
    loading,
    isTyping,
    messagesEndRef,
    inputRef,
    handleSend,
    handleKeyPress,
    handleInputResize,
    handleFileUpload
  } = useChat(userId);
  
  const { tone, toneMenuOpen, setToneMenuOpen, availableTones, changeTone } = useTone(userId, setMessages);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [ctxText, setCtxText] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const initializedRef = useRef<boolean>(false);
  const [threadLoading, setThreadLoading] = useState<boolean>(false);

  // Auto-show auth modal if user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [authLoading, isAuthenticated]);

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

  // Initialize: Load existing conversation or create new one (only once)
  useEffect(() => {
    if (initializedRef.current || authLoading || !userId || convLoading) return;
    
    const initialize = async () => {
      if (conversations.length === 0) {
        // No conversations exist, create a new one
        if (!currentConversationId) {
          await startNewConversation();
        }
      } else {
        // Conversations exist, load the appropriate one
        const targetConvId = currentConversationId && conversations.find(c => c.id === currentConversationId)
          ? currentConversationId
          : conversations[0]?.id;
        
        if (targetConvId) {
          await handleConversationSelect(targetConvId);
        }
      }
      initializedRef.current = true;
    };

    initialize();
  }, [conversations.length, userId, authLoading, convLoading]);

  // Auto-save conversation when messages change (debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only save if we have messages and a conversation
    if (currentConversationId && messages.length > 0) {
      // Debounce the save by 2 seconds
      saveTimeoutRef.current = setTimeout(async () => {
        const currentConv = conversations.find(c => c.id === currentConversationId);
        const shouldUpdateTitle = currentConv && currentConv.title === "New Conversation" && messages.length >= 2;
        
        const title = shouldUpdateTitle ? generateTitle(messages) : undefined;
        await updateConversation(currentConversationId, messages, title);
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, currentConversationId, conversations, generateTitle, updateConversation]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    localStorage.setItem('sidebarOpen', (!sidebarOpen).toString());
  };

  // Ensure a conversation exists before sending
  const handleSendEnsured = async () => {
    if (!currentConversationId) {
      await startNewConversation();
    }
    await handleSend();
  };

  // Optimistically update sidebar lastMessage like ChatGPT when messages change
  useEffect(() => {
    if (!currentConversationId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last?.content) return;
    optimisticUpdatePreview(currentConversationId, last.content);
  }, [messages, currentConversationId, optimisticUpdatePreview]);
  const startNewConversation = async () => {
    const conversationId = await createConversation("New Conversation");
    if (conversationId) {
      const initialMessage: Message = {
        id: Date.now(),
        type: 'assistant',
        content: isAuthenticated 
          ? `Hello ${user?.email}! I'm StudyMind AI, your intelligent study companion. ✨ Ask me anything, share study materials, or upload files (PDF, TXT) and I'll help you learn! What would you like to study today?`
          : "Hello! I'm StudyMind AI, your intelligent study companion. ✨ Ask me anything, share study materials, or upload files (PDF, TXT) and I'll help you learn! What would you like to study today?",
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      await updateConversation(conversationId, [initialMessage]);
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    // Don't reload if we're already on this conversation
    if (conversationId === currentConversationId) return;
    
    // Clear messages while loading
    setMessages([]);
    setThreadLoading(true);
    
    const loadedMessages = await loadConversation(conversationId);
    if (loadedMessages) {
      setMessages(loadedMessages);
    }
    setThreadLoading(false);
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

        {/* Module Views - All require authentication */}
        {!isAuthenticated && activeTab !== 'chat' ? (
          // Login Required for all features
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-2xl max-w-md mx-4`}>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Authentication Required
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                  Please sign in to access StudyMind AI features.
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Sign In / Sign Up
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'content' && isAuthenticated && (
              <ContentGeneration
                isDark={isDark}
                userId={userId}
                ctxText={ctxText}
                setCtxText={setCtxText}
                setToast={setToast}
              />
            )}

            {activeTab === 'grading' && isAuthenticated && (
              <GradingFeedback isDark={isDark} />
            )}

            {activeTab === 'quiz' && isAuthenticated && (
              <QuizGenerator isDark={isDark} ctxText={ctxText} setToast={setToast} />
            )}

            {activeTab === 'admin' && isAuthenticated && (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                  <AdminTools isDark={isDark} />
                </div>
              </div>
            )}

            {activeTab === 'ideas' && isAuthenticated && (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                  <ProjectIdeas isDark={isDark} />
                </div>
              </div>
            )}

            {activeTab === 'help' && isAuthenticated && (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                  <HelpMentor isDark={isDark} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 overflow-y-auto">
            {!isAuthenticated ? (
              // Login Required Overlay
              <div className="flex items-center justify-center h-full">
                <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-2xl max-w-md mx-4`}>
                  <div className="mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      Authentication Required
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                      Please sign in to access StudyMind AI and start your learning journey.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {threadLoading ? (
                  <div className="py-8">
                    <div className={`h-6 w-40 mb-4 rounded ${isDark ? 'bg-gray-800/50' : 'bg-gray-200/70'} animate-pulse`} />
                    <div className={`space-y-4`}>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`h-20 rounded-xl ${isDark ? 'bg-gray-800/30' : 'bg-gray-100/70'} animate-pulse`} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        index={index}
                        isDark={isDark}
                      />
                    ))}
                  </>
                )}

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

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Chat Input Area - Only show if authenticated */}
        {activeTab === 'chat' && isAuthenticated && (
          <ChatInput
            isDark={isDark}
            inputText={inputText}
            loading={loading}
            isTyping={isTyping}
            inputRef={inputRef}
            setInputText={setInputText}
            handleSend={handleSendEnsured}
            handleKeyPress={handleKeyPress}
            handleInputResize={handleInputResize}
            handleFileUpload={handleFileUpload}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-md shadow ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-900 text-white'}`} onAnimationEnd={() => setToast("")}>
            {toast}
          </div>
        )}
      </div>

      {/* Auth Modal - Cannot close if not authenticated */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => {
          // Only allow closing if user is authenticated
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