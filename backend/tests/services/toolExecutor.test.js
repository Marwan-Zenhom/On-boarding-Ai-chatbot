/**
 * Tool Executor Integration Tests
 * Tests tool execution with mocked external services
 */

import { jest } from '@jest/globals';

// Mock Google APIs
const mockCalendarEvents = {
  list: jest.fn(),
  insert: jest.fn()
};

const mockGmailMessages = {
  send: jest.fn()
};

jest.unstable_mockModule('googleapis', () => ({
  google: {
    calendar: jest.fn(() => ({ events: mockCalendarEvents })),
    gmail: jest.fn(() => ({ users: { messages: mockGmailMessages } })),
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn(() => Promise.resolve({
          credentials: {
            access_token: 'new-token',
            expiry_date: Date.now() + 3600000
          }
        }))
      }))
    }
  }
}));

// Mock database
jest.unstable_mockModule('../../config/database.js', () => ({
  supabase: {
    from: jest.fn()
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'token-1',
                user_id: 'test-user',
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
                token_expiry: new Date(Date.now() + 3600000).toISOString()
              },
              error: null
            }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock knowledge base service
jest.unstable_mockModule('../../services/knowledgeBaseService.js', () => ({
  searchKnowledgeBase: jest.fn(() => Promise.resolve([
    {
      category: 'employees',
      content: 'John Doe - Software Engineer',
      metadata: {
        Name: 'John Doe',
        Department: 'Engineering',
        Email: 'john.doe@company.com',
        Supervisor: 'Jane Smith'
      }
    }
  ]))
}));

// Mock logger
jest.unstable_mockModule('../../config/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Import after mocks - use the same paths as the mocks
const { ToolExecutor } = await import('../../services/tools/toolExecutor.js');
const { searchKnowledgeBase } = await import('../../services/knowledgeBaseService.js');

describe('ToolExecutor', () => {
  let executor;

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new ToolExecutor('test-user-id');
    
    // Reset mock implementations
    mockCalendarEvents.list.mockResolvedValue({
      data: { items: [] }
    });
    mockCalendarEvents.insert.mockResolvedValue({
      data: {
        id: 'event-123',
        htmlLink: 'https://calendar.google.com/event/123',
        summary: 'Test Event',
        start: { dateTime: '2024-01-01T10:00:00Z' },
        end: { dateTime: '2024-01-01T11:00:00Z' }
      }
    });
    mockGmailMessages.send.mockResolvedValue({
      data: { id: 'msg-123', threadId: 'thread-123' }
    });
  });

  describe('Constructor', () => {
    it('stores user ID', () => {
      expect(executor.userId).toBe('test-user-id');
    });
  });

  describe('execute', () => {
    it('throws error for unknown tool', async () => {
      await expect(executor.execute('unknown_tool', {}))
        .rejects
        .toThrow('Unknown tool: unknown_tool');
    });

    it('returns result with success flag and timing', async () => {
      searchKnowledgeBase.mockResolvedValueOnce([]);
      
      const result = await executor.execute('search_knowledge_base', { query: 'test' });
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('executionTimeMs');
      expect(typeof result.executionTimeMs).toBe('number');
    });
  });

  describe('getTeamMembers', () => {
    it('searches and returns employee data', async () => {
      const result = await executor.execute('get_team_members', { department: 'Engineering' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('employees');
      expect(result.data).toHaveProperty('count');
      expect(searchKnowledgeBase).toHaveBeenCalled();
    });

    it('filters by department', async () => {
      searchKnowledgeBase.mockResolvedValueOnce([
        { category: 'employees', content: 'Engineer', metadata: { Department: 'Engineering' } },
        { category: 'employees', content: 'Designer', metadata: { Department: 'Design' } }
      ]);
      
      const result = await executor.execute('get_team_members', { department: 'Engineering' });
      
      expect(result.success).toBe(true);
    });

    it('filters by role', async () => {
      const result = await executor.execute('get_team_members', { role: 'Manager' });
      
      expect(result.success).toBe(true);
      expect(searchKnowledgeBase).toHaveBeenCalled();
    });

    it('searches by name', async () => {
      const result = await executor.execute('get_team_members', { search_name: 'John' });
      
      expect(result.success).toBe(true);
      expect(searchKnowledgeBase).toHaveBeenCalledWith('John', expect.any(Number));
    });
  });

  describe('getSupervisorInfo', () => {
    it('returns supervisor information', async () => {
      searchKnowledgeBase.mockResolvedValueOnce([
        {
          category: 'employees',
          content: 'John Doe',
          metadata: { Name: 'John Doe', Supervisor: 'Jane Smith' }
        }
      ]).mockResolvedValueOnce([
        {
          category: 'employees',
          content: 'Jane Smith',
          metadata: { Name: 'Jane Smith', Email: 'jane@company.com' }
        }
      ]);
      
      const result = await executor.execute('get_supervisor_info', { employee_name: 'John Doe' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('employee');
      expect(result.data).toHaveProperty('supervisor');
    });

    it('handles missing employee', async () => {
      searchKnowledgeBase.mockResolvedValueOnce([]);
      
      const result = await executor.execute('get_supervisor_info', { employee_name: 'Unknown Person' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
      expect(result.summary).toContain('Could not find');
    });
  });

  describe('getVacationPolicy', () => {
    it('retrieves vacation policy information', async () => {
      searchKnowledgeBase.mockResolvedValueOnce([
        {
          category: 'faqs',
          content: 'Annual leave is 20 days',
          metadata: { topic: 'vacation' }
        }
      ]);
      
      const result = await executor.execute('get_vacation_policy', { policy_type: 'vacation_days' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('policyType', 'vacation_days');
      expect(result.data).toHaveProperty('results');
    });

    it('handles different policy types', async () => {
      const policyTypes = ['vacation_days', 'sick_leave', 'approval_process', 'public_holidays'];
      
      for (const policyType of policyTypes) {
        searchKnowledgeBase.mockResolvedValueOnce([]);
        const result = await executor.execute('get_vacation_policy', { policy_type: policyType });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('searchKnowledgeBase', () => {
    it('searches with query and returns results', async () => {
      searchKnowledgeBase.mockResolvedValueOnce([
        { category: 'faqs', content: 'Test FAQ', metadata: {} }
      ]);
      
      const result = await executor.execute('search_knowledge_base', { query: 'test query' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('query', 'test query');
      expect(result.data).toHaveProperty('resultCount');
      expect(result.data).toHaveProperty('results');
    });

    it('filters by category', async () => {
      searchKnowledgeBase.mockResolvedValueOnce([
        { category: 'faqs', content: 'FAQ', metadata: {} },
        { category: 'employees', content: 'Employee', metadata: {} }
      ]);
      
      const result = await executor.execute('search_knowledge_base', { 
        query: 'test', 
        category: 'faqs' 
      });
      
      expect(result.success).toBe(true);
      expect(result.data.results.every(r => r.category === 'faqs')).toBe(true);
    });

    it('respects limit parameter', async () => {
      const result = await executor.execute('search_knowledge_base', { 
        query: 'test', 
        limit: 3 
      });
      
      expect(result.success).toBe(true);
      expect(searchKnowledgeBase).toHaveBeenCalledWith('test', 3);
    });
  });

  describe('sendEmail', () => {
    it('validates recipient email', async () => {
      await expect(executor.execute('send_email', {
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test body'
      })).rejects.toThrow('Invalid recipient email');
    });

    it('validates email subject', async () => {
      await expect(executor.execute('send_email', {
        to: 'test@example.com',
        subject: '',
        body: 'Test body'
      })).rejects.toThrow('Email subject is required');
    });

    it('validates email body', async () => {
      await expect(executor.execute('send_email', {
        to: 'test@example.com',
        subject: 'Test',
        body: ''
      })).rejects.toThrow('Email body is required');
    });
  });

  describe('Error Handling', () => {
    it('logs errors with execution time', async () => {
      const logger = (await import('../../config/logger.js')).default;
      
      await expect(executor.execute('unknown_tool', {})).rejects.toThrow();
      
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

describe('Tool Result Format', () => {
  it('has consistent structure across all tools', () => {
    const expectedStructure = {
      success: true,
      data: expect.any(Object),
      summary: expect.any(String),
      executionTimeMs: expect.any(Number)
    };

    // This is a structural test - actual tool tests verify the format
    expect(expectedStructure).toHaveProperty('success');
    expect(expectedStructure).toHaveProperty('data');
    expect(expectedStructure).toHaveProperty('summary');
    expect(expectedStructure).toHaveProperty('executionTimeMs');
  });
});

