import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export const useConversations = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getConversations();
      setConversations(response.conversations || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new conversation (handled by API when sending first message)
  const createConversation = async (title, messages = []) => {
    // This is handled automatically by the backend when sending the first message
    // We'll just refresh conversations to get the latest data
    await fetchConversations();
  };

  // Update conversation
  const updateConversation = async (id, updates) => {
    try {
      await apiService.updateConversation(id, updates);
      await fetchConversations(); // Refresh list
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete conversation
  const deleteConversation = async (id) => {
    try {
      await apiService.deleteConversation(id);
      await fetchConversations(); // Refresh list
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, fetchConversations]);

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    refreshConversations: fetchConversations
  };
}; 