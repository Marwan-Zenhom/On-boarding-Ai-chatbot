/**
 * Tools Registry Tests
 * Tests tool definitions, validation, and utility functions
 */

import { 
  availableTools, 
  getToolByName, 
  validateToolParameters, 
  requiresApproval,
  getActionDescription 
} from '../../services/tools/toolsRegistry.js';

describe('Tools Registry', () => {
  describe('availableTools', () => {
    it('exports an array of tool definitions', () => {
      expect(Array.isArray(availableTools)).toBe(true);
      expect(availableTools.length).toBeGreaterThan(0);
    });

    it('each tool has required properties', () => {
      availableTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.parameters).toBe('object');
      });
    });

    it('includes expected tools', () => {
      const toolNames = availableTools.map(t => t.name);
      
      expect(toolNames).toContain('check_calendar');
      expect(toolNames).toContain('book_calendar_event');
      expect(toolNames).toContain('send_email');
      expect(toolNames).toContain('get_team_members');
      expect(toolNames).toContain('get_supervisor_info');
      expect(toolNames).toContain('get_vacation_policy');
      expect(toolNames).toContain('search_knowledge_base');
    });
  });

  describe('getToolByName', () => {
    it('returns tool definition for valid name', () => {
      const tool = getToolByName('check_calendar');
      
      expect(tool).toBeDefined();
      expect(tool.name).toBe('check_calendar');
    });

    it('returns undefined for invalid name', () => {
      const tool = getToolByName('nonexistent_tool');
      
      expect(tool).toBeUndefined();
    });

    it('is case-sensitive', () => {
      const tool = getToolByName('CHECK_CALENDAR');
      
      expect(tool).toBeUndefined();
    });
  });

  describe('validateToolParameters', () => {
    it('validates required parameters', () => {
      expect(() => validateToolParameters('check_calendar', {
        start_date: '2024-01-01',
        end_date: '2024-01-05'
      })).not.toThrow();
    });

    it('throws for missing required parameters', () => {
      expect(() => validateToolParameters('check_calendar', {
        start_date: '2024-01-01'
        // missing end_date
      })).toThrow('Missing required parameters');
    });

    it('throws for unknown tool', () => {
      expect(() => validateToolParameters('unknown_tool', {}))
        .toThrow('Unknown tool');
    });

    it('validates send_email parameters', () => {
      expect(() => validateToolParameters('send_email', {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body'
      })).not.toThrow();
    });

    it('throws for missing send_email required params', () => {
      expect(() => validateToolParameters('send_email', {
        to: 'test@example.com'
        // missing subject and body
      })).toThrow('Missing required parameters');
    });

    it('validates book_calendar_event parameters', () => {
      expect(() => validateToolParameters('book_calendar_event', {
        title: 'Vacation',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-05T23:59:59Z'
      })).not.toThrow();
    });
  });

  describe('requiresApproval', () => {
    it('returns true for send_email', () => {
      expect(requiresApproval('send_email')).toBe(true);
    });

    it('returns true for book_calendar_event', () => {
      expect(requiresApproval('book_calendar_event')).toBe(true);
    });

    it('returns false for check_calendar', () => {
      expect(requiresApproval('check_calendar')).toBe(false);
    });

    it('returns false for search_knowledge_base', () => {
      expect(requiresApproval('search_knowledge_base')).toBe(false);
    });

    it('returns false for get_team_members', () => {
      expect(requiresApproval('get_team_members')).toBe(false);
    });

    it('returns false for get_supervisor_info', () => {
      expect(requiresApproval('get_supervisor_info')).toBe(false);
    });

    it('returns false for get_vacation_policy', () => {
      expect(requiresApproval('get_vacation_policy')).toBe(false);
    });

    it('returns false for unknown tools', () => {
      expect(requiresApproval('unknown_tool')).toBe(false);
    });
  });

  describe('getActionDescription', () => {
    it('describes send_email action', () => {
      const description = getActionDescription('send_email', {
        to: 'boss@company.com',
        subject: 'Vacation Request'
      });
      
      expect(description).toContain('boss@company.com');
      expect(description).toContain('Vacation Request');
    });

    it('describes book_calendar_event action', () => {
      const description = getActionDescription('book_calendar_event', {
        title: 'Annual Leave',
        start_date: '2024-12-20T00:00:00Z',
        end_date: '2024-12-27T23:59:59Z'
      });
      
      expect(description).toContain('Annual Leave');
      expect(description).toContain('Book calendar event');
    });

    it('describes check_calendar action', () => {
      const description = getActionDescription('check_calendar', {
        start_date: '2024-01-01',
        end_date: '2024-01-05'
      });
      
      expect(description).toContain('Check calendar');
      expect(description).toContain('2024-01-01');
    });

    it('describes get_team_members action', () => {
      const description = getActionDescription('get_team_members', {
        department: 'Engineering'
      });
      
      expect(description).toContain('team members');
      expect(description).toContain('Engineering');
    });

    it('describes get_team_members without filters', () => {
      const description = getActionDescription('get_team_members', {});
      
      expect(description).toContain('Get team members');
    });

    it('describes get_supervisor_info action', () => {
      const description = getActionDescription('get_supervisor_info', {
        employee_name: 'John Doe'
      });
      
      expect(description).toContain('supervisor');
      expect(description).toContain('John Doe');
    });

    it('describes get_vacation_policy action', () => {
      const description = getActionDescription('get_vacation_policy', {
        policy_type: 'vacation_days'
      });
      
      expect(description).toContain('vacation days');
      expect(description).toContain('policy');
    });

    it('describes search_knowledge_base action', () => {
      const description = getActionDescription('search_knowledge_base', {
        query: 'remote work policy'
      });
      
      expect(description).toContain('Search');
      expect(description).toContain('remote work policy');
    });

    it('provides default for unknown tools', () => {
      const description = getActionDescription('unknown_tool', {});
      
      expect(description).toContain('Execute');
      expect(description).toContain('unknown_tool');
    });
  });
});

describe('Tool Parameter Schemas', () => {
  describe('check_calendar', () => {
    const tool = getToolByName('check_calendar');
    
    it('requires start_date and end_date', () => {
      expect(tool.parameters.required).toContain('start_date');
      expect(tool.parameters.required).toContain('end_date');
    });

    it('has optional calendar_ids', () => {
      expect(tool.parameters.properties).toHaveProperty('calendar_ids');
    });
  });

  describe('book_calendar_event', () => {
    const tool = getToolByName('book_calendar_event');
    
    it('requires title, start_date, end_date', () => {
      expect(tool.parameters.required).toContain('title');
      expect(tool.parameters.required).toContain('start_date');
      expect(tool.parameters.required).toContain('end_date');
    });

    it('has optional description, attendees, reminders', () => {
      expect(tool.parameters.properties).toHaveProperty('description');
      expect(tool.parameters.properties).toHaveProperty('attendees');
      expect(tool.parameters.properties).toHaveProperty('reminders');
    });
  });

  describe('send_email', () => {
    const tool = getToolByName('send_email');
    
    it('requires to, subject, body', () => {
      expect(tool.parameters.required).toContain('to');
      expect(tool.parameters.required).toContain('subject');
      expect(tool.parameters.required).toContain('body');
    });

    it('has optional cc and bcc', () => {
      expect(tool.parameters.properties).toHaveProperty('cc');
      expect(tool.parameters.properties).toHaveProperty('bcc');
    });
  });

  describe('search_knowledge_base', () => {
    const tool = getToolByName('search_knowledge_base');
    
    it('requires query', () => {
      expect(tool.parameters.required).toContain('query');
    });

    it('has category enum', () => {
      expect(tool.parameters.properties.category.enum).toContain('employees');
      expect(tool.parameters.properties.category.enum).toContain('faqs');
      expect(tool.parameters.properties.category.enum).toContain('all');
    });
  });
});




