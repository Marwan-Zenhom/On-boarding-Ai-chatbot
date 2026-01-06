/**
 * Tools Registry
 * Defines all available tools/functions that the AI agent can use
 * These are passed to Gemini AI for function calling
 */

export const availableTools = [
  {
    name: 'check_calendar',
    description: 'Check Google Calendar for events in a specific date range. Use this to verify if team members have vacation or meetings scheduled. Can check multiple calendars at once.',
    parameters: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          format: 'date',
          description: 'Start date in YYYY-MM-DD format (e.g., "2024-12-20")'
        },
        end_date: {
          type: 'string',
          format: 'date',
          description: 'End date in YYYY-MM-DD format (e.g., "2024-12-27")'
        },
        calendar_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: List of calendar IDs to check. If not provided, checks primary calendar.'
        }
      },
      required: ['start_date', 'end_date']
    }
  },
  
  {
    name: 'book_calendar_event',
    description: 'Create a new event on the user\'s Google Calendar. Use this for booking vacation, meetings, or reminders. IMPORTANT: For date ranges like "December 7 to December 8", the end_date should be December 8 (the system will handle Google Calendar\'s exclusive end date automatically).',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Event title (e.g., "Vacation - Annual Leave")'
        },
        start_date: {
          type: 'string',
          format: 'date-time',
          description: 'Start date in ISO 8601 format (e.g., "2025-12-07T00:00:00Z"). For vacation/leave, use midnight of the first day.'
        },
        end_date: {
          type: 'string',
          format: 'date-time',
          description: 'End date in ISO 8601 format (e.g., "2025-12-08T00:00:00Z"). This should be the LAST day of the event, NOT the day after. For a vacation from Dec 7-8, use Dec 8.'
        },
        description: {
          type: 'string',
          description: 'Optional: Detailed description of the event'
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: Email addresses of attendees to invite'
        },
        reminders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: {
                type: 'string',
                enum: ['email', 'popup'],
                description: 'Reminder method'
              },
              minutes: {
                type: 'integer',
                description: 'Minutes before event to send reminder'
              }
            }
          },
          description: 'Optional: Custom reminders for the event'
        },
        all_day: {
          type: 'boolean',
          description: 'Optional: Set to true for all-day events like vacation. Auto-detected for titles containing vacation/leave/holiday/PTO.'
        }
      },
      required: ['title', 'start_date', 'end_date']
    }
  },
  
  {
    name: 'send_email',
    description: 'Send an email via Gmail. Use this to contact supervisors, team members, or HR. Always be professional and include relevant context.',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address (e.g., "supervisor@company.com")'
        },
        subject: {
          type: 'string',
          description: 'Email subject line'
        },
        body: {
          type: 'string',
          description: 'Email body content. Can include HTML formatting.'
        },
        cc: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: CC recipients'
        },
        bcc: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: BCC recipients'
        }
      },
      required: ['to', 'subject', 'body']
    }
  },
  
  {
    name: 'get_team_members',
    description: 'Get information about team members from the company knowledge base. Can filter by department, role, or search by name.',
    parameters: {
      type: 'object',
      properties: {
        department: {
          type: 'string',
          description: 'Optional: Filter by department (e.g., "Engineering", "HR", "Marketing")'
        },
        role: {
          type: 'string',
          description: 'Optional: Filter by job role (e.g., "Manager", "Developer", "Designer")'
        },
        search_name: {
          type: 'string',
          description: 'Optional: Search by employee name'
        }
      }
    }
  },
  
  {
    name: 'get_supervisor_info',
    description: 'Get the current user\'s supervisor information including email and contact details.',
    parameters: {
      type: 'object',
      properties: {
        employee_name: {
          type: 'string',
          description: 'The employee\'s name to look up their supervisor'
        }
      },
      required: ['employee_name']
    }
  },
  
  {
    name: 'get_vacation_policy',
    description: 'Get company vacation policy, sick leave policy, or approval process from the knowledge base.',
    parameters: {
      type: 'object',
      properties: {
        policy_type: {
          type: 'string',
          enum: ['vacation_days', 'sick_leave', 'approval_process', 'public_holidays'],
          description: 'Type of policy information to retrieve'
        },
        specific_question: {
          type: 'string',
          description: 'Optional: Specific question about the policy'
        }
      },
      required: ['policy_type']
    }
  },
  
  {
    name: 'search_knowledge_base',
    description: 'Search the company knowledge base for any information. Use this for general queries about company policies, procedures, or information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text'
        },
        category: {
          type: 'string',
          enum: ['employees', 'faqs', 'tasks', 'all'],
          description: 'Optional: Limit search to specific category'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          description: 'Optional: Number of results to return (default: 5)'
        }
      },
      required: ['query']
    }
  },
  
  {
    name: 'get_onboarding_tasks',
    description: 'Get onboarding tasks with structured filtering. Use this for specific questions about tasks by priority, deadline, or role. This is more accurate than search_knowledge_base for task queries.',
    parameters: {
      type: 'object',
      properties: {
        priority: {
          type: 'string',
          enum: ['High', 'Medium', 'Low'],
          description: 'Optional: Filter by priority level'
        },
        deadline: {
          type: 'string',
          enum: ['Day 1', 'Day 2', 'Week 1', 'Week 2'],
          description: 'Optional: Filter by deadline'
        },
        role: {
          type: 'string',
          description: 'Optional: Filter by role (e.g., "AI Research Assistant", "Software Engineer", "Head of AI"). Use this when asking about tasks for a specific job role.'
        }
      }
    }
  }
];

/**
 * Get tool definition by name
 */
export function getToolByName(toolName) {
  return availableTools.find(tool => tool.name === toolName);
}

/**
 * Validate tool parameters against schema
 */
export function validateToolParameters(toolName, parameters) {
  const tool = getToolByName(toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  const required = tool.parameters.required || [];
  const missing = required.filter(param => !parameters.hasOwnProperty(param));
  
  if (missing.length > 0) {
    throw new Error(`Missing required parameters for ${toolName}: ${missing.join(', ')}`);
  }

  return true;
}

/**
 * Check if tool requires user approval
 */
export function requiresApproval(toolName) {
  // Tools that modify data or send communications need approval
  const approvalRequired = [
    'send_email',
    'book_calendar_event',
  ];
  
  return approvalRequired.includes(toolName);
}

/**
 * Get user-friendly description of what a tool will do
 */
export function getActionDescription(toolName, parameters) {
  switch (toolName) {
    case 'send_email':
      return `Send email to ${parameters.to} with subject "${parameters.subject}"`;
    
    case 'book_calendar_event':
      const startDate = new Date(parameters.start_date).toLocaleDateString();
      const endDate = new Date(parameters.end_date).toLocaleDateString();
      return `Book calendar event "${parameters.title}" from ${startDate} to ${endDate}`;
    
    case 'check_calendar':
      return `Check calendar from ${parameters.start_date} to ${parameters.end_date}`;
    
    case 'get_team_members':
      const filters = [];
      if (parameters.department) filters.push(`department: ${parameters.department}`);
      if (parameters.role) filters.push(`role: ${parameters.role}`);
      return `Get team members${filters.length > 0 ? ` (${filters.join(', ')})` : ''}`;
    
    case 'get_supervisor_info':
      return `Get supervisor information for ${parameters.employee_name}`;
    
    case 'get_vacation_policy':
      return `Get ${parameters.policy_type.replace('_', ' ')} policy information`;
    
    case 'search_knowledge_base':
      return `Search knowledge base for: "${parameters.query}"`;
    
    case 'get_onboarding_tasks':
      const taskFilters = [];
      if (parameters.priority) taskFilters.push(`priority: ${parameters.priority}`);
      if (parameters.deadline) taskFilters.push(`deadline: ${parameters.deadline}`);
      if (parameters.role) taskFilters.push(`role: ${parameters.role}`);
      return `Get onboarding tasks${taskFilters.length > 0 ? ` (${taskFilters.join(', ')})` : ''}`;
    
    default:
      return `Execute ${toolName}`;
  }
}







