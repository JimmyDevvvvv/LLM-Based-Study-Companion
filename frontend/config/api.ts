// config/api.ts
// Centralized API configuration for easy deployment switching

/**
 * Resolve API base URL so Netlify production hits the bundled function
 * while local development keeps using the Flask server.
 */
const resolveApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:5000';
    }
  }

  // Default for Netlify (proxied through Redirects to the serverless function)
  return '/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Health & Status
  health: `${API_BASE_URL}/health`,
  
  // Chat & Generation
  generate: `${API_BASE_URL}/generate`,
  chat: `${API_BASE_URL}/chat`,
  
  // Content Generation
  contentCreate: `${API_BASE_URL}/content/create`,
  contentSlide: `${API_BASE_URL}/content/slide`,
  contentAdjust: `${API_BASE_URL}/content/adjust`,
  contentSave: `${API_BASE_URL}/content/save`,
  
  // Grading & Quiz
  grade: `${API_BASE_URL}/grade`,
  quiz: `${API_BASE_URL}/quiz`,
  
  // File Upload
  upload: `${API_BASE_URL}/upload`,
  file: `${API_BASE_URL}/file`,
  
  // Memory & Personalization
  memory: (userId: string) => `${API_BASE_URL}/memory/${userId}`,
  tone: (userId: string) => `${API_BASE_URL}/tone/${userId}`,
  
  // Conversations
  conversations: (userId: string) => `${API_BASE_URL}/conversations/${userId}`,
  conversation: (userId: string, convId: string) => `${API_BASE_URL}/conversations/${userId}/${convId}`,
  
  // Admin & Tools
  adminTemplate: `${API_BASE_URL}/admin/template`,
  ideas: `${API_BASE_URL}/ideas`,
  help: `${API_BASE_URL}/help`,
  history: `${API_BASE_URL}/history`,
};

/**
 * API Utility Functions
 */
export const apiUtils = {
  /**
   * Get auth headers (if user is logged in)
   */
  getAuthHeaders(accessToken?: string | null): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
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
    const headers: HeadersInit = { 'Accept': 'application/json' };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
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
    const headers: HeadersInit = { 'Accept': 'application/json' };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
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
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
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