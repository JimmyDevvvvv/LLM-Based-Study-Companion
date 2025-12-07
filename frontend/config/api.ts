// config/api.ts
// Centralized API configuration for easy deployment switching

/**
 * Resolve API base URL so Netlify production hits the bundled function
 * while local development keeps using the Flask server.
 * This function is called at runtime to ensure window is available.
 */
const LOCAL_API_PORT = process.env.NEXT_PUBLIC_API_PORT?.trim() || '5000';

const resolveApiBaseUrl = (): string => {
  // First check for explicit environment variable (highest priority)
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    console.log('[API Config] Using NEXT_PUBLIC_API_URL:', envUrl);
    return envUrl;
  }

  // In browser, detect environment
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const normalizedHost = hostname?.toLowerCase();
    
    // Check if running on Netlify
    const isNetlify = normalizedHost.includes('netlify.app') || 
                      normalizedHost.includes('netlify.com');
    
    // Check if running on localhost/private network
    const isLoopbackHost =
      normalizedHost === 'localhost' ||
      normalizedHost === '127.0.0.1' ||
      normalizedHost === '::1';
    const isPrivateNetworkHost =
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    // For localhost/private network, use local backend
    if (isLoopbackHost || isPrivateNetworkHost) {
      const apiUrl = `${protocol}//${hostname}:${LOCAL_API_PORT}`;
      console.log('[API Config] Detected local/private network, using:', apiUrl);
      return apiUrl;
    }
    
    // For Netlify deployment, use /api which proxies to Netlify Functions
    if (isNetlify) {
      console.log('[API Config] Running on Netlify, using /api proxy to Netlify Functions');
      return '/api';
    }
    
    // For other public domains, use /api (assumes proxy setup)
    console.log('[API Config] Using default /api proxy for:', hostname);
  }

  // Default for Netlify/serverless (proxied through Redirects to the serverless function)
  // Also used during SSR when window is not available
  return '/api';
};

// Make API_BASE_URL a getter function that resolves at runtime
export const getApiBaseUrl = (): string => resolveApiBaseUrl();

// For backward compatibility, export a computed value (but it will be recomputed on client)
export const API_BASE_URL = typeof window !== 'undefined' ? resolveApiBaseUrl() : '/api';

/**
 * Helper to build endpoint URL with runtime base URL resolution
 */
const endpoint = (path: string): string => {
  const base = getApiBaseUrl();
  // Handle paths that already start with / or http
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // If base already ends with /api and path starts with /, avoid double slash
  if (base.endsWith('/api') && path.startsWith('/')) {
    return base + path;
  }
  // If base doesn't end with / and path doesn't start with /, add /
  if (!base.endsWith('/') && !path.startsWith('/')) {
    return `${base}/${path}`;
  }
  return base + path;
};

/**
 * API Endpoints - all resolve base URL at runtime
 */
export const API_ENDPOINTS = {
  // Auth
  get auth() {
    return {
      signup: endpoint('/auth/signup'),
      login: endpoint('/auth/login'),
      logout: endpoint('/auth/logout'),
    };
  },

  // Health & Status
  get health() {
    return endpoint('/health');
  },
  
  // Chat & Generation
  get generate() {
    return endpoint('/generate');
  },
  get chat() {
    return endpoint('/chat');
  },
  
  // Content Generation
  get contentCreate() {
    return endpoint('/content/create');
  },
  get contentSlide() {
    return endpoint('/content/slide');
  },
  get contentAdjust() {
    return endpoint('/content/adjust');
  },
  get contentSave() {
    return endpoint('/content/save');
  },
  
  // Grading & Quiz
  get grade() {
    return endpoint('/grade');
  },
  get quiz() {
    return endpoint('/quiz');
  },
  
  // File Upload
  get upload() {
    return endpoint('/upload');
  },
  get file() {
    return endpoint('/file');
  },
  
  // Memory & Personalization
  memory: (userId: string) => endpoint(`/memory/${userId}`),
  tone: (userId: string) => endpoint(`/tone/${userId}`),
  
  // Conversations
  conversations: (userId: string) => endpoint(`/conversations/${userId}`),
  conversation: (userId: string, convId: string) => endpoint(`/conversations/${userId}/${convId}`),
  
  // Admin & Tools
  get adminTemplate() {
    return endpoint('/admin/template');
  },
  get ideas() {
    return endpoint('/ideas');
  },
  get help() {
    return endpoint('/help');
  },
  get history() {
    return endpoint('/history');
  },
  
  // Orchestration
  get studyAssist() {
    return endpoint('/study/assist');
  },
  get orchestrationStats() {
    return endpoint('/orchestration/stats');
  },
};

/**
 * API Utility Functions
 */
export const apiUtils = {
  /**
   * Attempt to read access token from saved client session if not provided.
   */
  getSavedAccessToken(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem('auth_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.access_token || null;
    } catch {
      return null;
    }
  },
  /**
   * Get guest user ID from localStorage if available
   */
  getGuestUserId(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      const guestId = localStorage.getItem('guest_user_id');
      return guestId;
    } catch {
      return null;
    }
  },

  /**
   * Get auth headers (if user is logged in) or include guest user ID
   */
  getAuthHeaders(accessToken?: string | null): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    const token = accessToken ?? this.getSavedAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  },

  /**
   * Check if API is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(API_ENDPOINTS.health);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  /**
   * Generic POST request helper with optional auth
   */
  async post<T = any>(endpoint: string, body: any, accessToken?: string | null): Promise<T> {
    // Include guest_user_id if user is a guest and not already in body
    const token = accessToken ?? this.getSavedAccessToken();
    if (!token) {
      const guestId = this.getGuestUserId();
      if (guestId && body && typeof body === 'object' && !body.guest_user_id) {
        body = { ...body, guest_user_id: guestId };
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Generic GET request helper with optional auth
   */
  async get<T = any>(endpoint: string, accessToken?: string | null): Promise<T> {
    const headers: HeadersInit = this.getAuthHeaders(accessToken);
    delete (headers as any)['Content-Type'];

    // Include guest_user_id as header if user is a guest
    const token = accessToken ?? this.getSavedAccessToken();
    if (!token) {
      const guestId = this.getGuestUserId();
      if (guestId) {
        headers['X-Guest-User-Id'] = guestId;
      }
    }

    const response = await fetch(endpoint, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Generic PUT request helper with optional auth
   */
  async put<T = any>(endpoint: string, body: any, accessToken?: string | null): Promise<T> {
    // Include guest_user_id if user is a guest and not already in body
    const token = accessToken ?? this.getSavedAccessToken();
    if (!token) {
      const guestId = this.getGuestUserId();
      if (guestId && body && typeof body === 'object' && !body.guest_user_id) {
        body = { ...body, guest_user_id: guestId };
      }
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Generic DELETE request helper with optional auth
   */
  async delete<T = any>(endpoint: string, accessToken?: string | null): Promise<T> {
    const headers: HeadersInit = this.getAuthHeaders(accessToken);
    delete (headers as any)['Content-Type'];

    // Include guest_user_id as header if user is a guest
    const token = accessToken ?? this.getSavedAccessToken();
    if (!token) {
      const guestId = this.getGuestUserId();
      if (guestId) {
        headers['X-Guest-User-Id'] = guestId;
      }
    }

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * File upload helper with optional auth
   */
  async uploadFile(file: File, accessToken?: string | null): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    const token = accessToken ?? this.getSavedAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Include guest_user_id as header if user is a guest
      const guestId = this.getGuestUserId();
      if (guestId) {
        headers['X-Guest-User-Id'] = guestId;
      }
    }

    const response = await fetch(API_ENDPOINTS.upload, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

/**
 * Test API connection on app start
 */
if (typeof window !== 'undefined') {
  apiUtils.checkHealth().then(healthy => {
    if (healthy) {
      console.log('✅ API connection successful!');
    } else {
      console.warn('⚠️ API connection failed. Please check if backend is running.');
    }
  });
}