// Custom Authentication Client for StudyMind AI
// Replaces Supabase with custom backend authentication

import { API_ENDPOINTS } from '@/config/api';

export interface User {
  id: string;
  email: string | null;
  isGuest?: boolean;
}

export interface Session {
  user: User;
  access_token?: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

class AuthClient {
  private session: Session | null = null;
  private listeners: Array<(session: Session | null) => void> = [];

  constructor() {
    // Load session from localStorage on init
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('auth_session');
      if (savedSession) {
        try {
          this.session = JSON.parse(savedSession);
        } catch (e) {
          console.error('Failed to parse saved session', e);
        }
      }
    }
  }

  private saveSession(session: Session | null) {
    this.session = session;
    if (typeof window !== 'undefined') {
      if (session) {
        localStorage.setItem('auth_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('auth_session');
      }
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.session));
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current session
    callback(this.session);
    
    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter(l => l !== callback);
      }
    };
  }

  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.signup, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          user: null,
          session: null,
          error: new Error(data.error || 'Signup failed'),
        };
      }

      const session: Session = {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        access_token: data.token,
      };

      this.saveSession(session);

      return {
        user: session.user,
        session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          user: null,
          session: null,
          error: new Error(data.error || 'Login failed'),
        };
      }

      const session: Session = {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        access_token: data.token,
      };

      this.saveSession(session);

      return {
        user: session.user,
        session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    this.saveSession(null);
    return { error: null };
  }

  getSession(): Session | null {
    return this.session;
  }

  getUser(): User | null {
    return this.session?.user || null;
  }

  getAccessToken(): string | null {
    return this.session?.access_token || null;
  }

  /**
   * Continue as guest - creates a guest session with a unique guest ID
   */
  async continueAsGuest(): Promise<AuthResponse> {
    try {
      // Generate or retrieve guest ID from localStorage
      let guestId = localStorage.getItem('guest_user_id');
      if (!guestId) {
        guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('guest_user_id', guestId);
      }

      const session: Session = {
        user: {
          id: guestId,
          email: null,
          isGuest: true,
        },
        // No access_token for guests
      };

      this.saveSession(session);

      return {
        user: session.user,
        session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  /**
   * Check if current user is a guest
   */
  isGuest(): boolean {
    return this.session?.user?.isGuest === true;
  }
}

// Export singleton instance
export const authClient = new AuthClient();

// Helper functions for compatibility
export const authHelpers = {
  signUp: (email: string, password: string) => authClient.signUp(email, password),
  signIn: (email: string, password: string) => authClient.signIn(email, password),
  signOut: () => authClient.signOut(),
  continueAsGuest: () => authClient.continueAsGuest(),
  getSession: () => Promise.resolve(authClient.getSession()),
  getUser: () => authClient.getUser(),
  isGuest: () => authClient.isGuest(),
  onAuthStateChange: (callback: (session: Session | null) => void) => 
    authClient.onAuthStateChange(callback),
};
