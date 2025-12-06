/**
 * Tool Executor
 * Executes tools/functions called by the AI agent
 * Handles Google API integration and knowledge base queries
 * Uses HYBRID approach: SQL for structured queries, embeddings for semantic search
 */

import { google } from 'googleapis';
import { supabase, supabaseAdmin } from '../../config/database.js';
import { searchKnowledgeBase } from '../knowledgeBaseService.js';
import * as kbQuery from '../knowledgeQueryService.js';
import logger from '../../config/logger.js';

// Manager ID mappings for placeholder manager IDs (M00X format)
const MANAGER_MAPPINGS = {
  'M002': { name: 'Engineering Manager', email: 'engineering.manager@novatech.com', department: 'Engineering' },
  'M003': { name: 'HR Director', email: 'hr.director@novatech.com', department: 'HR' },
  'M004': { name: 'IT Director', email: 'it.director@novatech.com', department: 'IT' },
  'CEO': { name: 'Chief Executive Officer', email: 'ceo@novatech.com', department: 'Executive' }
};

export class ToolExecutor {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Resolve a Manager_ID to actual manager information
   * Uses HYBRID approach: SQL first (fast), then embeddings as fallback
   * Handles: Employee IDs (E001), placeholder IDs (M002), and CEO
   * @param {string} managerId - The manager ID from the employee record
   * @returns {Object} Manager info with name and email
   */
  async resolveManagerById(managerId) {
    if (!managerId) {
      return { name: 'Not specified', email: null };
    }

    // Check if it's a known placeholder ID
    if (MANAGER_MAPPINGS[managerId]) {
      return MANAGER_MAPPINGS[managerId];
    }

    // If it starts with 'E', it's an employee ID
    if (managerId.startsWith('E')) {
      // Try SQL first (faster, more accurate)
      try {
        const result = await kbQuery.getEmployeeById(managerId);
        if (result?.employee) {
          return {
            name: result.employee.full_name,
            email: result.employee.email,
            department: result.employee.department,
            role: result.employee.role,
            employeeId: result.employee.id
          };
        }
      } catch (sqlError) {
        logger.warn('SQL lookup failed for manager, trying embeddings', { managerId, error: sqlError.message });
      }

      // Fallback to embedding search
      try {
        const results = await searchKnowledgeBase(managerId, 10);
        const manager = results.find(result => 
          result.category === 'employees' && 
          result.metadata?.Employee_ID === managerId
        );

        if (manager?.metadata) {
          return {
            name: manager.metadata.Full_Name || `${manager.metadata.First_Name} ${manager.metadata.Last_Name}`,
            email: manager.metadata.Email,
            department: manager.metadata.Department,
            role: manager.metadata.Role
          };
        }
      } catch (error) {
        logger.warn('Failed to resolve manager by employee ID', { managerId, error: error.message });
      }
    }

    // Fallback: return the ID as the name
    return { name: managerId, email: null };
  }

  /**
   * Execute a tool by name with given parameters
   */
  async execute(toolName, parameters) {
    const startTime = Date.now();
    
    logger.info('Executing tool', { 
      userId: this.userId, 
      toolName, 
      parameters: JSON.stringify(parameters) 
    });

    try {
      let result;
      
      switch (toolName) {
        case 'check_calendar':
          result = await this.checkCalendar(parameters);
          break;
        
        case 'book_calendar_event':
          result = await this.bookCalendarEvent(parameters);
          break;
        
        case 'send_email':
          result = await this.sendEmail(parameters);
          break;
        
        case 'get_team_members':
          result = await this.getTeamMembers(parameters);
          break;
        
        case 'get_supervisor_info':
          result = await this.getSupervisorInfo(parameters);
          break;
        
        case 'get_vacation_policy':
          result = await this.getVacationPolicy(parameters);
          break;
        
        case 'search_knowledge_base':
          result = await this.searchKnowledgeBase(parameters);
          break;
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      const executionTime = Date.now() - startTime;
      logger.info('Tool executed successfully', { 
        toolName, 
        executionTime: `${executionTime}ms` 
      });

      return {
        success: true,
        data: result.data,
        summary: result.summary,
        executionTimeMs: executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Tool execution failed', { 
        toolName, 
        error: error.message,
        executionTime: `${executionTime}ms`
      });

      throw error;
    }
  }

  /**
   * Check Google Calendar for events
   */
  async checkCalendar({ start_date, end_date, calendar_ids = [] }) {
    const oauth2Client = await this.getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const eventsData = [];
    const calendarIdsToCheck = calendar_ids.length > 0 ? calendar_ids : ['primary'];

    for (const calendarId of calendarIdsToCheck) {
      try {
        const response = await calendar.events.list({
          calendarId: calendarId,
          timeMin: new Date(start_date).toISOString(),
          timeMax: new Date(end_date).toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 50
        });

        const events = response.data.items || [];
        
        eventsData.push({
          calendarId,
          calendarName: calendarId === 'primary' ? 'Your Calendar' : calendarId,
          eventCount: events.length,
          events: events.map(event => ({
            id: event.id,
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description,
            attendees: event.attendees?.map(a => a.email) || []
          }))
        });

      } catch (error) {
        logger.warn('Failed to check calendar', { 
          calendarId, 
          error: error.message 
        });
        
        eventsData.push({
          calendarId,
          error: error.message,
          eventCount: 0,
          events: []
        });
      }
    }

    const totalEvents = eventsData.reduce((sum, cal) => sum + cal.eventCount, 0);
    
    // Analyze for conflicts
    const hasConflicts = totalEvents > 0;
    const conflictDates = hasConflicts ? 
      eventsData.flatMap(cal => cal.events.map(e => e.start)).slice(0, 5) : [];

    return {
      data: {
        calendars: eventsData,
        totalEvents,
        hasConflicts,
        conflictDates,
        dateRange: { start: start_date, end: end_date }
      },
      summary: hasConflicts ? 
        `Found ${totalEvents} event(s) during ${start_date} to ${end_date}. There may be conflicts.` :
        `No events found during ${start_date} to ${end_date}. Calendar is clear.`
    };
  }

  /**
   * Book a calendar event
   */
  async bookCalendarEvent({ title, start_date, end_date, description = '', attendees = [], reminders = [], all_day = null }) {
    const oauth2Client = await this.getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Default reminders if none provided
    const eventReminders = reminders.length > 0 ? {
      useDefault: false,
      overrides: reminders
    } : {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 } // 1 hour before
      ]
    };

    // Detect if this should be an all-day event
    // All-day if: explicitly set, or title contains vacation/leave/holiday/PTO keywords
    const titleLower = title.toLowerCase();
    const isAllDay = all_day === true || 
      all_day !== false && (
        titleLower.includes('vacation') ||
        titleLower.includes('leave') ||
        titleLower.includes('holiday') ||
        titleLower.includes('pto') ||
        titleLower.includes('day off') ||
        titleLower.includes('time off')
      );

    let event;
    
    if (isAllDay) {
      // For all-day events, use 'date' format (YYYY-MM-DD)
      // Google Calendar all-day events use EXCLUSIVE end dates
      // So for Dec 7-8 vacation, end_date should be Dec 9
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);
      
      // Format as YYYY-MM-DD
      const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Add one day to end date because Google Calendar end date is exclusive
      const exclusiveEndDate = new Date(endDateObj);
      exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
      
      event = {
        summary: title,
        description: description,
        start: {
          date: formatDate(startDateObj),
        },
        end: {
          date: formatDate(exclusiveEndDate), // Exclusive end date
        },
        attendees: attendees.map(email => ({ email })),
        reminders: eventReminders,
        colorId: '11' // Red color for vacation/important events
      };
      
      logger.info('Creating all-day event', {
        title,
        startDate: formatDate(startDateObj),
        endDate: formatDate(exclusiveEndDate),
        note: 'End date is exclusive in Google Calendar'
      });
    } else {
      // For timed events, use 'dateTime' format
      event = {
        summary: title,
        description: description,
        start: {
          dateTime: new Date(start_date).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        },
        end: {
          dateTime: new Date(end_date).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        },
        attendees: attendees.map(email => ({ email })),
        reminders: eventReminders,
        colorId: '11' // Red color for vacation/important events
      };
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: attendees.length > 0 ? 'all' : 'none'
    });

    const createdEvent = response.data;
    
    // For display, show the actual vacation dates (not the exclusive end)
    const displayStartDate = new Date(start_date).toLocaleDateString();
    const displayEndDate = new Date(end_date).toLocaleDateString();

    return {
      data: {
        eventId: createdEvent.id,
        htmlLink: createdEvent.htmlLink,
        title: createdEvent.summary,
        start: createdEvent.start.dateTime || createdEvent.start.date,
        end: createdEvent.end.dateTime || createdEvent.end.date,
        attendees: createdEvent.attendees?.map(a => a.email) || [],
        isAllDay
      },
      summary: `✅ Calendar event "${title}" booked successfully from ${displayStartDate} to ${displayEndDate}.`
    };
  }

  /**
   * Send an email via Gmail
   */
  async sendEmail({ to, subject, body, cc = [], bcc = [] }) {
    // Basic input validation to avoid Gmail API errors with undefined/empty fields
    const isValidEmail = (email) => typeof email === 'string' && /.+@.+\..+/.test(email);
    if (!isValidEmail(to)) {
      throw new Error('Invalid recipient email address.');
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      throw new Error('Email subject is required.');
    }
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      throw new Error('Email body is required.');
    }

    const oauth2Client = await this.getGoogleAuth();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Build email message
    const messageParts = [
      `To: ${to}`,
      Array.isArray(cc) && cc.length > 0 ? `Cc: ${cc.join(', ')}` : '',
      Array.isArray(bcc) && bcc.length > 0 ? `Bcc: ${bcc.join(', ')}` : '',
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body
    ].filter(line => line !== '');

    const message = messageParts.join('\n');

    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
      });

      return {
        data: {
          messageId: response.data.id,
          threadId: response.data.threadId,
          to,
          cc,
          subject
        },
        summary: `✅ Email sent successfully to ${to} with subject "${subject}".`
      };
    } catch (err) {
      // Surface helpful Gmail error details when available
      const gmailErrorMessage = err?.response?.data?.error?.message || err?.message || 'Unknown error';
      throw new Error(`Failed to send email via Gmail: ${gmailErrorMessage}`);
    }
  }

  /**
   * Get team members - uses SQL for department/name lookups, embeddings for semantic search
   */
  async getTeamMembers({ department, role, search_name }) {
    let employees = [];
    let usedMethod = 'sql';

    // Try SQL first for structured queries
    try {
      if (search_name) {
        // Search by name using SQL
        employees = await kbQuery.searchEmployeesByName(search_name);
      } else if (department) {
        // Get team by department using SQL
        employees = await kbQuery.getTeamByDepartment(department);
        // Filter by role if specified
        if (role) {
          employees = employees.filter(emp => 
            emp.role?.toLowerCase().includes(role.toLowerCase())
          );
        }
      }
    } catch (sqlError) {
      logger.warn('SQL lookup failed for team members, using embeddings', { error: sqlError.message });
      usedMethod = 'embeddings';
    }

    // Fallback to embeddings if SQL didn't find results or failed
    if (employees.length === 0) {
      usedMethod = 'embeddings';
      let query = '';
      
      if (search_name) {
        query = search_name;
      } else {
        const parts = [];
        if (department) parts.push(department);
        if (role) parts.push(role);
        query = parts.join(' ');
      }

      const results = await searchKnowledgeBase(query || 'employees', 20);
      
      // Filter to only employee records
      const embeddingEmployees = results.filter(result => 
        result.category === 'employees'
      );

      // Further filter by department/role if specified
      let filteredEmployees = embeddingEmployees;
      if (department || role || search_name) {
        filteredEmployees = embeddingEmployees.filter(emp => {
          const content = emp.content.toLowerCase();
          const metadata = JSON.stringify(emp.metadata).toLowerCase();
          const searchText = (content + ' ' + metadata).toLowerCase();
          
          const matches = [];
          if (department) matches.push(searchText.includes(department.toLowerCase()));
          if (role) matches.push(searchText.includes(role.toLowerCase()));
          if (search_name) matches.push(searchText.includes(search_name.toLowerCase()));
          
          return matches.length === 0 || matches.every(Boolean);
        });
      }

      employees = filteredEmployees.slice(0, 20).map(emp => ({
        ...emp.metadata,
        source: 'embeddings'
      }));
    } else {
      // Format SQL results
      employees = employees.map(emp => ({
        ...emp,
        source: 'sql'
      }));
    }

    return {
      data: {
        count: employees.length,
        employees: employees,
        queryMethod: usedMethod
      },
      summary: `Found ${employees.length} team member(s)${department ? ` in ${department}` : ''}${role ? ` with role ${role}` : ''}.`
    };
  }

  /**
   * Get supervisor info for an employee - uses SQL first, embeddings as fallback
   */
  async getSupervisorInfo({ employee_name }) {
    let employeeData = null;
    let managerData = null;

    // Try SQL first for direct lookup
    try {
      const sqlResults = await kbQuery.searchEmployeesByName(employee_name);
      if (sqlResults && sqlResults.length > 0) {
        // Get the best match (first result)
        const empId = sqlResults[0].id;
        const fullResult = await kbQuery.getEmployeeWithManager(empId);
        
        if (fullResult) {
          employeeData = fullResult;
          managerData = fullResult.manager;
          
          // If no manager from SQL (manager_id was placeholder), resolve it
          if (!managerData && fullResult.manager_id) {
            // Check if it's a placeholder
            if (MANAGER_MAPPINGS[fullResult.manager_id]) {
              managerData = MANAGER_MAPPINGS[fullResult.manager_id];
            }
          }
          
          if (employeeData) {
            return {
              data: {
                employee: employeeData,
                supervisor: managerData || { name: 'Not specified', email: null },
                queryMethod: 'sql'
              },
              summary: `${employeeData.full_name}'s supervisor is ${managerData?.full_name || managerData?.name || 'not specified'}${managerData?.email ? ` (${managerData.email})` : ''}.`
            };
          }
        }
      }
    } catch (sqlError) {
      logger.warn('SQL lookup failed for supervisor info, using embeddings', { employee_name, error: sqlError.message });
    }

    // Fallback to embeddings search
    const employeeResults = await searchKnowledgeBase(employee_name, 5);
    
    const employee = employeeResults.find(result => 
      result.category === 'employees' &&
      result.content.toLowerCase().includes(employee_name.toLowerCase())
    );

    if (!employee || !employee.metadata) {
      return {
        data: null,
        summary: `Could not find employee information for "${employee_name}".`
      };
    }

    // Get Manager_ID from employee metadata
    const managerId = employee.metadata.Manager_ID || employee.metadata.Supervisor || employee.metadata.supervisor;
    
    if (!managerId) {
      return {
        data: { employee: employee.metadata, supervisor: null, queryMethod: 'embeddings' },
        summary: `No supervisor information found for ${employee_name}.`
      };
    }

    // Resolve manager using the helper
    const supervisor = await this.resolveManagerById(managerId);

    return {
      data: {
        employee: employee.metadata,
        supervisor: {
          ...supervisor,
          managerId: managerId
        },
        queryMethod: 'embeddings'
      },
      summary: `${employee_name}'s supervisor is ${supervisor.name}${supervisor.email ? ` (${supervisor.email})` : ''}.`
    };
  }

  /**
   * Get vacation policy information
   */
  async getVacationPolicy({ policy_type, specific_question }) {
    const policyQueries = {
      vacation_days: 'vacation days annual leave entitlement',
      sick_leave: 'sick leave sick days illness policy',
      approval_process: 'vacation approval request process supervisor',
      public_holidays: 'public holidays company holidays'
    };

    const query = specific_question || policyQueries[policy_type] || 'vacation policy';
    
    const results = await searchKnowledgeBase(query, 5);
    
    // Filter to FAQ category
    const policyInfo = results.filter(result => 
      result.category === 'faqs' || result.category === 'policy'
    );

    return {
      data: {
        policyType: policy_type,
        results: policyInfo.map(info => ({
          content: info.content,
          metadata: info.metadata,
          category: info.category
        }))
      },
      summary: `Retrieved ${policyInfo.length} policy document(s) about ${policy_type.replace('_', ' ')}.`
    };
  }

  /**
   * Search knowledge base (general)
   */
  async searchKnowledgeBase({ query, category = 'all', limit = 5 }) {
    const results = await searchKnowledgeBase(query, limit);
    
    // Filter by category if specified
    let filteredResults = results;
    if (category !== 'all') {
      filteredResults = results.filter(result => result.category === category);
    }

    return {
      data: {
        query,
        category,
        resultCount: filteredResults.length,
        results: filteredResults.map(result => ({
          category: result.category,
          content: result.content,
          metadata: result.metadata
        }))
      },
      summary: `Found ${filteredResults.length} result(s) for "${query}"${category !== 'all' ? ` in ${category}` : ''}.`
    };
  }

  /**
   * Get Google OAuth client for the user
   */
  async getGoogleAuth() {
    // Fetch user's OAuth tokens from database using admin client to bypass RLS
    const { data: tokenData, error } = await supabaseAdmin
      .from('user_oauth_tokens')
      .select('*')
      .eq('user_id', this.userId)
      .eq('provider', 'google')
      .single();

    if (error || !tokenData) {
      throw new Error('Google account not connected. Please connect your Google account in settings to use calendar and email features.');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });

    // Check if token is expired and refresh if needed
    const tokenExpiry = tokenData.token_expiry ? new Date(tokenData.token_expiry) : null;
    const isExpired = tokenExpiry && tokenExpiry < new Date();

    if (isExpired && tokenData.refresh_token) {
      try {
        logger.info('Refreshing expired Google token', { userId: this.userId });
        
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update tokens in database using admin client to bypass RLS
        await supabaseAdmin
          .from('user_oauth_tokens')
          .update({
            access_token: credentials.access_token,
            token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', tokenData.id);

        oauth2Client.setCredentials(credentials);
        logger.info('Google token refreshed successfully', { userId: this.userId });
        
      } catch (refreshError) {
        logger.error('Failed to refresh Google token', { 
          userId: this.userId, 
          error: refreshError.message 
        });
        throw new Error('Google token expired and could not be refreshed. Please reconnect your Google account.');
      }
    }

    return oauth2Client;
  }
}

export default ToolExecutor;

