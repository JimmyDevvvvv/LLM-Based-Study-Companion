"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/types";

export function useChat(userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: "Hello! I'm StudyMind AI, your intelligent study companion. ✨ Ask me anything, share study materials, or upload files (PDF, TXT) and I'll help you learn! What would you like to study today?",
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputText.trim() && !uploadedFile) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: uploadedFile ? `📎 ${uploadedFile.name}\n\n${inputText}` : inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText;
    setInputText("");
    setIsTyping(true);
    
    try {
      let textToSend = messageText;
      
      // Handle file upload if present
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        
        const uploadRes = await fetch('http://127.0.0.1:5000/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const extractedContent = uploadData.extracted_text || "";
          const charCount = uploadData.char_count || 0;
          
          console.log(`File upload: ${uploadData.filename}`);
          console.log(`Extraction status: ${uploadData.extraction_status}`);
          console.log(`Characters extracted: ${charCount}`);
          
          // Check if extraction failed
          if (!extractedContent || charCount < 50) {
            setIsTyping(false);
            const errorMsg: Message = {
              id: Date.now() + 1,
              type: 'assistant',
              content: `⚠️ **PDF Extraction Failed**\n\nI couldn't extract text from "${uploadData.filename}".\n\n**Possible reasons:**\n- The PDF contains only images/scanned content (requires OCR)\n- The PDF is encrypted or password-protected\n- The PDF has an unusual structure\n\n**Solutions:**\n- Try converting the PDF to text first\n- Use a PDF with selectable text\n- Check if the PDF opens correctly in a PDF reader`,
              timestamp: new Date(),
              isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
            setUploadedFile(null);
            return;
          }
          
          // Format the message clearly for the AI
          if (messageText && messageText.trim()) {
            textToSend = `File: ${uploadData.filename}\n\nExtracted content:\n${extractedContent}\n\nUser question: ${messageText}`;
          } else {
            textToSend = `File: ${uploadData.filename}\n\nExtracted content:\n${extractedContent}\n\nUser question: Please analyze this file and provide a comprehensive summary of its content, including key topics, main concepts, and important points.`;
          }
        }
        setUploadedFile(null);
      }
      
      // Send to chat endpoint
      const res = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend,
          user_id: userId,
          history: messages.slice(-5).map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }))
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      setIsTyping(false);
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.response || 'Sorry, I could not generate a response.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setIsTyping(false);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `🔌 Error: ${err instanceof Error ? err.message : 'Failed to connect to backend'}. Please check your connection and try again!`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat Error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file);
  };

  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
  };

  return {
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
    handleFileUpload,
    uploadedFile
  };
}
