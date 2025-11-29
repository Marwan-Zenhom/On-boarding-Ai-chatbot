import { supabase } from '../supabaseClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      ...options,
    };

    // Merge headers if options has headers
    if (options.headers) {
      config.headers = {
        ...config.headers,
        ...options.headers,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Token expired or invalid - redirect to login
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Chat endpoints
  async sendMessage(message, conversationId = null, files = null) {
    return this.request('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationId,
        files
      }),
    });
  }

  async regenerateResponse(conversationId, messageId) {
    return this.request('/api/chat/regenerate', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        messageId
      }),
    });
  }

  async getConversations() {
    return this.request('/api/chat/conversations');
  }

  async updateConversation(id, updates) {
    return this.request(`/api/chat/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteConversation(id) {
    return this.request(`/api/chat/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }
}

export const apiService = new ApiService();
export default apiService; 