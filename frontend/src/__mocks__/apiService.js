/**
 * Mock API Service for testing
 */

const mockApiService = {
  // Send message
  sendMessage: jest.fn().mockResolvedValue({
    success: true,
    conversationId: 'mock-conv-123',
    content: 'This is a mock AI response',
    timestamp: new Date().toISOString(),
  }),

  // Get conversations
  getConversations: jest.fn().mockResolvedValue({
    success: true,
    conversations: [
      {
        id: 'conv-1',
        title: 'Test Conversation 1',
        is_favourite: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        messages: [],
      },
      {
        id: 'conv-2',
        title: 'Test Conversation 2',
        is_favourite: true,
        is_archived: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        messages: [],
      },
    ],
  }),

  // Update conversation
  updateConversation: jest.fn().mockResolvedValue({
    success: true,
  }),

  // Delete conversation
  deleteConversation: jest.fn().mockResolvedValue({
    success: true,
  }),

  // Regenerate response
  regenerateResponse: jest.fn().mockResolvedValue({
    success: true,
    aiResponse: {
      content: 'This is a regenerated mock response',
      timestamp: new Date().toISOString(),
      model: 'gemini-2.0-flash',
    },
  }),

  // Generic request method
  request: jest.fn().mockResolvedValue({
    success: true,
  }),
};

export default mockApiService;

