import { supabase } from '../supabaseClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getAuthToken() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }
      
      if (!session) {
        console.warn('No active session found');
        return null;
      }
      
      return session.access_token || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
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
          // Check if we have a session - if not, it might just be timing
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            // No session at all - redirect to login
            console.warn('No session found, redirecting to login');
            window.location.href = '/login';
            throw new Error('Session expired. Please login again.');
          } else {
            // We have a session but token might be invalid - try refreshing
            console.warn('Session exists but token invalid, might be timing issue');
            throw new Error(data.error || 'Authentication failed. Please try again.');
          }
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