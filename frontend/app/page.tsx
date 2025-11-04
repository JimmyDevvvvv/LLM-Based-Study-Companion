"use client";

import { useState, useEffect } from "react";
import { Conversation, Message } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { useChat } from "@/hooks/useChat";
import { useTone } from "@/hooks/useTone";
import { useChatHistory } from "@/hooks/useChatHistory";
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
import HistoryView from "@/components/HistoryView";
import UploadView from "@/components/UploadView";

export default function StudyMind() {
  const [userId] = useState<string>("default_user");
  const { isDark, mounted } = useTheme();
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

  const {
    conversations,
    currentConversationId,
    createConversation,
    loadConversation,
    updateConversation,
    deleteConversation,
    setCurrentConversationId,
    generateTitle,
  } = useChatHistory(userId);

  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    setSidebarOpen(savedSidebarState !== 'false');
  }, []);

  // Initialize with a conversation if none exists
  useEffect(() => {
    if (conversations.length === 0 && !currentConversationId) {
      startNewConversation();
    }
  }, [conversations.length, currentConversationId]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (currentConversationId && messages.length > 1) {
      // Generate title from first user message if it's a new conversation
      const currentConv = conversations.find(c => c.id === currentConversationId);
      const shouldUpdateTitle = currentConv && currentConv.title === "New Conversation" && messages.length >= 2;
      
      const title = shouldUpdateTitle ? generateTitle(messages) : undefined;
      updateConversation(currentConversationId, messages, title);
    }
  }, [messages, currentConversationId]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    localStorage.setItem('sidebarOpen', (!sidebarOpen).toString());
  };

  const startNewConversation = async () => {
    const conversationId = await createConversation("New Conversation");
    if (conversationId) {
      const initialMessage: Message = {
        id: Date.now(),
        type: 'assistant',
        content: "Hello! I'm StudyMind AI, your intelligent study companion. ✨ Ask me anything, share study materials, or upload files (PDF, TXT) and I'll help you learn! What would you like to study today?",
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      // Update the conversation with the initial message
      await updateConversation(conversationId, [initialMessage]);
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    const loadedMessages = await loadConversation(conversationId);
    if (loadedMessages) {
      setMessages(loadedMessages);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const success = await deleteConversation(conversationId);
    if (success && conversationId === currentConversationId) {
      // Start a new conversation after deleting the current one
      startNewConversation();
    }
  };

  if (!mounted) return null;

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
        />

        {/* Module Views */}
        {activeTab === 'content' && (
          <ContentGeneration
            isDark={isDark}
            userId={userId}
            ctxText={ctxText}
            setCtxText={setCtxText}
            setToast={setToast}
          />
        )}

        {activeTab === 'grading' && (
          <GradingFeedback isDark={isDark} />
        )}

        {activeTab === 'quiz' && (
          <QuizGenerator isDark={isDark} ctxText={ctxText} setToast={setToast} />
        )}

        {activeTab === 'admin' && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
              <AdminTools isDark={isDark} />
            </div>
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
              <ProjectIdeas isDark={isDark} />
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
              <HelpMentor isDark={isDark} />
            </div>
          </div>
        )}


        {/* Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  index={index}
                  isDark={isDark}
                />
              ))}

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
          </div>
        )}

        {/* Chat Input Area */}
        {activeTab === 'chat' && (
          <ChatInput
            isDark={isDark}
            inputText={inputText}
            loading={loading}
            isTyping={isTyping}
            inputRef={inputRef}
            setInputText={setInputText}
            handleSend={handleSend}
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
