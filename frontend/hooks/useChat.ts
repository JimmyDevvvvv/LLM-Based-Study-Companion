// hooks/useChat.ts
import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types';
import { API_ENDPOINTS, apiUtils } from '@/config/api';

export function useChat(userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if ((!inputText.trim() && !uploadedFile) || loading || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setIsTyping(true);

    try {
      let messageContent = inputText.trim();

      // Handle file upload
      if (uploadedFile) {
        const uploadResponse = await apiUtils.uploadFile(uploadedFile);
        
        if (uploadResponse.extraction_status === 'success' && uploadResponse.extracted_text) {
          setExtractedText(uploadResponse.extracted_text);
          
          // Include file content in the message
          messageContent = messageContent 
            ? `${messageContent}\n\nFile: ${uploadedFile.name}\n\nExtracted content:\n${uploadResponse.extracted_text}`
            : `Please analyze this file:\n\nFile: ${uploadedFile.name}\n\nExtracted content:\n${uploadResponse.extracted_text}`;
        } else {
          throw new Error('Failed to extract text from file');
        }
      }

      // Send to chat endpoint
      const chatHistory = messages.map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const response = await apiUtils.post(API_ENDPOINTS.chat, {
        message: messageContent,
        user_id: userId,
        history: chatHistory.slice(-5) // Last 5 messages for context
      });

      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Clear uploaded file after successful send
      setUploadedFile(null);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure the backend is running.`,
        isError: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsTyping(false);
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file);
    if (file) {
      console.log('File selected:', file.name);
    }
  };

  return {
    messages,
    setMessages,
    inputText,
    setInputText,
    loading,
    isTyping,
    uploadedFile,
    extractedText,
    messagesEndRef,
    inputRef,
    handleSend,
    handleKeyPress,
    handleInputResize,
    handleFileUpload,
  };
}