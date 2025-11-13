"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Conversation, Message } from "@/types";
import { API_ENDPOINTS, apiUtils } from "@/config/api";

export function useChatHistory(userId: string, accessToken?: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`currentConversationId_${userId}`);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const creatingRef = useRef<boolean>(false);

  const dedupeById = (items: Conversation[]): Conversation[] => {
    const seen = new Set<string>();
    const result: Conversation[] = [];
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  };

  // Load all conversations for the user
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await apiUtils.get<{ conversations: any[] }>(API_ENDPOINTS.conversations(userId), accessToken);
      // Normalize data to match frontend types
      const normalizedRaw: Conversation[] = (data.conversations || []).map((c: any) => ({
        id: String(c.id),
        title: c.title || "New Conversation",
        lastMessage: c.lastMessage || "",
        timestamp: c.timestamp || new Date().toISOString(),
        messages: c.messages
      }));
      const normalized = dedupeById(normalizedRaw);
      setConversations(normalized);
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

  // Persist currentConversationId to localStorage
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(`currentConversationId_${userId}`, currentConversationId);
    } else {
      localStorage.removeItem(`currentConversationId_${userId}`);
    }
  }, [currentConversationId, userId]);

  // Create a new conversation
  const createConversation = async (title: string = "New Conversation"): Promise<string | null> => {
    if (!userId) return null;
    if (creatingRef.current) {
      return currentConversationId; // Avoid duplicate creates
    }
    try {
      creatingRef.current = true;
      const data = await apiUtils.post<{ conversation: any }>(API_ENDPOINTS.conversations(userId), { title }, accessToken);
      const newConversation = data.conversation;
      
      setConversations(prev => {
        const merged = [
          {
            id: String(newConversation.id),
            title: newConversation.title || "New Conversation",
            lastMessage: newConversation.lastMessage || "",
            timestamp: newConversation.timestamp || new Date().toISOString(),
            messages: newConversation.messages || []
          },
          ...prev
        ];
        return dedupeById(merged);
      });
      setCurrentConversationId(newConversation.id);
      
      return newConversation.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation");
      console.error("Error creating conversation:", err);
      return null;
    } finally {
      creatingRef.current = false;
    }
  };

  // Load a specific conversation
  const loadConversation = async (conversationId: string): Promise<Message[] | null> => {
    if (!userId || !conversationId) return null;
    try {
      const data = await apiUtils.get<{ conversation: any }>(API_ENDPOINTS.conversation(userId, conversationId), accessToken);
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
    if (!userId || !conversationId) return false;
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

      const data = await apiUtils.put<{ conversation: any }>(
        API_ENDPOINTS.conversation(userId, conversationId),
        {
          messages: messagesData,
          ...(title && { title }),
        },
        accessToken
      );
      const updatedConversation = data.conversation;
      
      // Update the conversation in the list
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                id: String(updatedConversation.id),
                title: updatedConversation.title || conv.title,
                lastMessage: updatedConversation.lastMessage || conv.lastMessage || "",
                timestamp: updatedConversation.timestamp || conv.timestamp,
                messages: updatedConversation.messages || conv.messages
              }
            : conv
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
    if (!userId || !conversationId) return false;
    // Store the current conversations in case we need to restore
    const previousConversations = conversations;
    
    try {
      // Optimistically remove from UI
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Clear current conversation if it's the one being deleted
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
      
      // Make the API request
      await apiUtils.delete(API_ENDPOINTS.conversation(userId, conversationId), accessToken);
      
      setError(null);
      return true;
    } catch (err) {
      // Restore conversations on error
      setConversations(previousConversations);
      const errorMsg = err instanceof Error ? err.message : "Failed to delete conversation";
      setError(errorMsg);
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
    optimisticUpdatePreview: (conversationId: string, lastMessage: string) => {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, lastMessage: lastMessage || conv.lastMessage, timestamp: new Date().toISOString() }
            : conv
        )
      );
    },
    createConversation,
    loadConversation,
    updateConversation,
    deleteConversation,
    setCurrentConversationId,
    loadConversations,
    generateTitle,
    deletingIds,
  };
}
