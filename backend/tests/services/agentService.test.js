/**
 * Agent Service Integration Tests
 * Tests the AI Agent orchestration logic with mocked dependencies
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE importing the module
jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: jest.fn(() => ({
      startChat: jest.fn(() => ({
        sendMessage: jest.fn()
      }))
    }))
  }))
}));

jest.unstable_mockModule('../../config/database.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { enable_agent: true }, error: null }))
        }))
      }))
    }))
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: [{ id: 'action-1' }], error: null }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                id: 'action-1', 
                action_type: 'check_calendar',
                input_params: { start_date: '2024-01-01', end_date: '2024-01-05' },
                status: 'pending',
                user_id: 'test-user'
              }, 
              error: null 
            }))
          }))
        }))
      }))
    }))
  }
}));

jest.unstable_mockModule('../../config/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

jest.unstable_mockModule('../../services/tools/toolExecutor.js', () => ({
  ToolExecutor: jest.fn().mockImplementation(() => ({
    execute: jest.fn()
  }))
}));

// Now import the module under test
const { AIAgent } = await import('../../services/agentService.js');
const { GoogleGenerativeAI } = await import('@google/generative-ai');
const { ToolExecutor } = await import('../../services/tools/toolExecutor.js');

describe('AIAgent Service', () => {
  let agent;
  let mockToolExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new AIAgent('test-user-id', 'test-conversation-id');
    mockToolExecutor = agent.toolExecutor;
  });

  describe('Constructor', () => {
    it('initializes with correct user and conversation IDs', () => {
      const testAgent = new AIAgent('user-123', 'conv-456');
      
      expect(testAgent.userId).toBe('user-123');
      expect(testAgent.conversationId).toBe('conv-456');
      expect(testAgent.maxIterations).toBeDefined();
      expect(testAgent.executedActions).toEqual([]);
    });

    it('initializes with null conversation ID', () => {
      const testAgent = new AIAgent('user-123');
      
      expect(testAgent.conversationId).toBe(null);
    });

    it('creates a ToolExecutor instance', () => {
      expect(ToolExecutor).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('buildChatHistory', () => {
    it('converts conversation history to Gemini format', () => {
      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ];

      const result = agent.buildChatHistory(history);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ role: 'user', parts: [{ text: 'Hello' }] });
      expect(result[1]).toEqual({ role: 'model', parts: [{ text: 'Hi there!' }] });
      expect(result[2]).toEqual({ role: 'user', parts: [{ text: 'How are you?' }] });
    });

    it('handles empty history', () => {
      const result = agent.buildChatHistory([]);
      expect(result).toEqual([]);
    });
  });

  describe('getSystemInstruction', () => {
    it('returns a comprehensive system instruction', () => {
      const instruction = agent.getSystemInstruction();

      expect(typeof instruction).toBe('string');
      expect(instruction.length).toBeGreaterThan(100);
      expect(instruction).toContain('Nova');
      expect(instruction).toContain('NovaTech');
      expect(instruction).toContain('check_calendar');
      expect(instruction).toContain('book_calendar_event');
      expect(instruction).toContain('send_email');
    });

    it('includes guidelines for multi-step workflows', () => {
      const instruction = agent.getSystemInstruction();

      expect(instruction).toContain('Multi-Step');
      expect(instruction).toContain('ONE STEP AT A TIME');
      expect(instruction).toContain('confirmation');
    });
  });

  describe('fallbackToRegularChat', () => {
    it('returns disabled message when agent features are off', async () => {
      const result = await agent.fallbackToRegularChat('Hello', []);

      expect(result.success).toBe(true);
      expect(result.content).toContain('Agent features are currently disabled');
      expect(result.requiresApproval).toBe(false);
      expect(result.executedActions).toEqual([]);
    });
  });

  describe('Error Response Format', () => {
    it('returns properly structured error response', () => {
      const errorResponse = {
        success: false,
        content: 'Error message',
        error: 'Error details',
        executedActions: []
      };

      expect(errorResponse).toHaveProperty('success', false);
      expect(errorResponse).toHaveProperty('content');
      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse).toHaveProperty('executedActions');
    });
  });

  describe('Success Response Format', () => {
    it('returns properly structured success response', () => {
      const successResponse = {
        success: true,
        content: 'Response content',
        requiresApproval: false,
        executedActions: []
      };

      expect(successResponse).toHaveProperty('success', true);
      expect(successResponse).toHaveProperty('content');
      expect(successResponse).toHaveProperty('requiresApproval');
      expect(successResponse).toHaveProperty('executedActions');
    });
  });

  describe('Approval Response Format', () => {
    it('returns properly structured approval response', () => {
      const approvalResponse = {
        success: true,
        content: 'Partial response',
        requiresApproval: true,
        pendingActions: [{ tool: 'send_email', actionId: 'action-1' }],
        executedActions: [],
        message: 'Please review'
      };

      expect(approvalResponse).toHaveProperty('requiresApproval', true);
      expect(approvalResponse).toHaveProperty('pendingActions');
      expect(approvalResponse.pendingActions).toBeInstanceOf(Array);
    });
  });
});

describe('AIAgent Constants', () => {
  it('uses AGENT_CONFIG for max iterations', async () => {
    const { AGENT_CONFIG } = await import('../../constants/index.js');
    const testAgent = new AIAgent('user-123');
    
    expect(testAgent.maxIterations).toBe(AGENT_CONFIG.MAX_ITERATIONS);
  });
});

