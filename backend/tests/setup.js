/**
 * Jest Test Setup
 * Configures test environment, mocks, and utilities
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '8001';
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test_anon_key_that_is_long_enough_to_pass_validation_check_12345678901234567890';
process.env.SUPABASE_JWT_SECRET = 'test_jwt_secret_that_is_at_least_32_chars_long';
process.env.GEMINI_API_KEY = 'AItest_gemini_api_key_12345';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Global test timeout
jest.setTimeout(10000);

// Mock logger to prevent console noise during tests
jest.unstable_mockModule('../config/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    stream: { write: jest.fn() },
    logError: jest.fn()
  }
}));

// Mock Supabase client
export const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
  data: null,
  error: null
};

// Helper to reset all mocks between tests
export const resetMocks = () => {
  jest.clearAllMocks();
  mockSupabaseClient.data = null;
  mockSupabaseClient.error = null;
};

// Helper to create mock request object
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { id: 'test-user-id' },
  ...overrides
});

// Helper to create mock response object
export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    statusCode: 200
  };
  return res;
};

// Helper to create mock next function
export const createMockNext = () => jest.fn();

// Test data factories
export const testData = {
  user: {
    id: 'test-user-uuid',
    email: 'test@example.com',
    name: 'Test User'
  },
  
  conversation: {
    id: 'test-conversation-uuid',
    user_id: 'test-user-uuid',
    title: 'Test Conversation',
    is_favourite: false,
    is_archived: false,
    created_at: new Date().toISOString()
  },
  
  message: {
    id: 'test-message-uuid',
    conversation_id: 'test-conversation-uuid',
    role: 'user',
    content: 'Hello, this is a test message',
    timestamp: new Date().toISOString()
  },
  
  aiResponse: {
    id: 'test-ai-message-uuid',
    conversation_id: 'test-conversation-uuid',
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: new Date().toISOString()
  }
};

// Export for use in tests
export default {
  mockSupabaseClient,
  resetMocks,
  createMockRequest,
  createMockResponse,
  createMockNext,
  testData
};

