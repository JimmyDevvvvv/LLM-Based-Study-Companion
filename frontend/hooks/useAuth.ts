// hooks/useAuth.ts
"use client";

import { useState, useEffect } from 'react';
import { authHelpers, User, Session } from '@/utils/authClient';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authHelpers.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { unsubscribe } = authHelpers.onAuthStateChange((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await authHelpers.signIn(email, password);
    return { 
      data: result.session ? { session: result.session, user: result.user } : null, 
      error: result.error 
    };
  };

  const signUp = async (email: string, password: string) => {
    const result = await authHelpers.signUp(email, password);
    return { 
      data: result.session ? { session: result.session, user: result.user } : null, 
      error: result.error 
    };
  };

  const signOut = async () => {
    const { error } = await authHelpers.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      // Clear guest ID on sign out
      localStorage.removeItem('guest_user_id');
    }
    return { error };
  };

  const continueAsGuest = async () => {
    const result = await authHelpers.continueAsGuest();
    return {
      data: result.session ? { session: result.session, user: result.user } : null,
      error: result.error
    };
  };

  // Get access token for API requests
  const getAccessToken = () => {
    return session?.access_token || null;
  };

  // Get user ID (for API requests)
  const getUserId = () => {
    return user?.id || 'default_user';
  };

  // Check if user is guest
  const isGuest = () => {
    return authHelpers.isGuest();
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    continueAsGuest,
    getAccessToken,
    getUserId,
    isGuest,
    isAuthenticated: !!user, // Both authenticated and guest users are considered "authenticated" for UI purposes
  };
}