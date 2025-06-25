const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
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