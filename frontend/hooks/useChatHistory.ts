"use client";

import { useState, useEffect, useCallback } from "react";
import { Conversation, Message } from "@/types";

const API_BASE_URL = "http://127.0.0.1:5000";

export function useChatHistory(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load all conversations for the user
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/conversations/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }
      const data = await response.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Create a new conversation
  const createConversation = async (title: string = "New Conversation"): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }
      
      const data = await response.json();
      const newConversation = data.conversation;
      
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      
      return newConversation.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation");
      console.error("Error creating conversation:", err);
      return null;
    }
  };

  // Load a specific conversation
  const loadConversation = async (conversationId: string): Promise<Message[] | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${userId}/${conversationId}`);
      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }
      
      const data = await response.json();
      const conversation = data.conversation;
      
      setCurrentConversationId(conversationId);
      
      // Convert message timestamps back to Date objects
      const messages = (conversation.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      
      return messages;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
      console.error("Error loading conversation:", err);
      return null;
    }
  };

  // Update a conversation with new messages
  const updateConversation = async (
    conversationId: string,
    messages: Message[],
    title?: string
  ): Promise<boolean> => {
    try {
      // Convert messages to plain objects with ISO timestamps
      const messagesData = messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        task: msg.task,
        isProcessing: msg.isProcessing,
        isError: msg.isError,
      }));

      const response = await fetch(`${API_BASE_URL}/conversations/${userId}/${conversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesData,
          ...(title && { title }),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update conversation");
      }
      
      const data = await response.json();
      const updatedConversation = data.conversation;
      
      // Update the conversation in the list
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? updatedConversation : conv
        )
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update conversation");
      console.error("Error updating conversation:", err);
      return false;
    }
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${userId}/${conversationId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation");
      console.error("Error deleting conversation:", err);
      return false;
    }
  };

  // Generate a smart title from the first user message
  const generateTitle = (messages: Message[]): string => {
    const firstUserMessage = messages.find(msg => msg.type === "user");
    if (!firstUserMessage) return "New Conversation";
    
    const content = firstUserMessage.content.trim();
    const maxLength = 50;
    
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength).trim() + "...";
  };

  return {
    conversations,
    currentConversationId,
    loading,
    error,
    createConversation,
    loadConversation,
    updateConversation,
    deleteConversation,
    setCurrentConversationId,
    loadConversations,
    generateTitle,
  };
}
