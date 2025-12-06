/**
 * AI Agent Service
 * Orchestrates multi-step workflows using Gemini's function calling
 * Handles tool execution, approval workflow, and context management
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { availableTools, requiresApproval, getActionDescription } from './tools/toolsRegistry.js';
import { ToolExecutor } from './tools/toolExecutor.js';
import { supabase, supabaseAdmin } from '../config/database.js';
import { searchKnowledgeBase } from './knowledgeBaseService.js';
import * as kbQuery from './knowledgeQueryService.js';
import logger from '../config/logger.js';
import { AI_MODELS, AGENT_CONFIG } from '../constants/index.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export class AIAgent {
  constructor(userId, conversationId = null) {
    this.userId = userId;
    this.conversationId = conversationId;
    this.toolExecutor = new ToolExecutor(userId);
    this.maxIterations = AGENT_CONFIG.MAX_ITERATIONS;
    this.executedActions = []; // Track what was executed
    this.userProfile = null; // Cached user employee profile
  }

  /**
   * Get the current user's employee profile from the knowledge base
   * Uses HYBRID approach: SQL first (fast), embeddings as fallback
   * Matches the user's auth email to employee records
   * @returns {Object|null} Employee profile data or null if not found
   */
  async getUserEmployeeProfile() {
    // Return cached profile if available
    if (this.userProfile !== null) {
      return this.userProfile;
    }

    try {
      // Get user email from auth metadata via supabaseAdmin
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(this.userId);
      
      const userEmail = authData?.user?.email;
      
      if (!userEmail) {
        logger.warn('Could not get user email for personalization', { userId: this.userId });
        this.userProfile = null;
        return null;
      }

      // =====================================================================
      // TRY SQL FIRST (faster, more reliable for exact email match)
      // =====================================================================
      try {
        const sqlResult = await kbQuery.getEmployeeByEmail(userEmail);
        
        if (sqlResult?.employee) {
          const employee = sqlResult.employee;
          const manager = sqlResult.manager;

          // Build profile from SQL result
          this.userProfile = {
            Employee_ID: employee.id,
            First_Name: employee.first_name,
            Last_Name: employee.last_name,
            Full_Name: employee.full_name,
            Email: employee.email,
            Department: employee.department,
            Role: employee.role,
            Manager_ID: employee.manager_id,
            Hire_Date: employee.hire_date,
            Work_Location: employee.work_location,
            Access_Level: employee.access_level,
            Preferred_Language: employee.preferred_language,
            Onboarding_Status: employee.onboarding_status,
            Required_Tools: employee.required_tools?.join(';') || '',
            resolvedManager: manager ? {
              name: manager.full_name,
              email: manager.email,
              department: manager.department,
              role: manager.role,
              employeeId: manager.id
            } : await this.toolExecutor.resolveManagerById(employee.manager_id),
            _source: 'sql'
          };

          logger.info('User employee profile loaded via SQL', { 
            userId: this.userId, 
            employeeId: this.userProfile.Employee_ID,
            department: this.userProfile.Department
          });
          
          return this.userProfile;
        }
      } catch (sqlError) {
        logger.warn('SQL lookup failed for user profile, trying embeddings', { 
          userId: this.userId, 
          email: userEmail,
          error: sqlError.message 
        });
      }

      // =====================================================================
      // FALLBACK TO EMBEDDINGS SEARCH
      // =====================================================================
      const results = await searchKnowledgeBase(userEmail, 10);
      
      const employeeRecord = results.find(result => 
        result.category === 'employees' && 
        result.metadata?.Email?.toLowerCase() === userEmail.toLowerCase()
      );

      if (employeeRecord?.metadata) {
        // Resolve manager information
        const managerId = employeeRecord.metadata.Manager_ID;
        let managerInfo = { name: 'Not specified', email: null };
        
        if (managerId) {
          managerInfo = await this.toolExecutor.resolveManagerById(managerId);
        }

        this.userProfile = {
          ...employeeRecord.metadata,
          resolvedManager: managerInfo,
          _source: 'embeddings'
        };
        
        logger.info('User employee profile loaded via embeddings', { 
          userId: this.userId, 
          employeeId: this.userProfile.Employee_ID,
          department: this.userProfile.Department
        });
        
        return this.userProfile;
      }

      logger.info('No employee record found for user', { userId: this.userId, email: userEmail });
      this.userProfile = null;
      return null;

    } catch (error) {
      logger.error('Failed to get user employee profile', { userId: this.userId, error: error.message });
      this.userProfile = null;
      return null;
    }
  }

  /**
   * Main method to process user requests with agentic capabilities
   */
  async processRequest(userMessage, conversationHistory = []) {
    logger.info('Agent processing request', { 
      userId: this.userId, 
      message: userMessage.substring(0, 100) + '...', 
      historyLength: conversationHistory.length 
    });
    
    // Debug logging
    if (conversationHistory.length > 0) {
      logger.info('Conversation context', {
        lastMessages: conversationHistory.slice(-3).map(m => `${m.role}: ${m.content?.substring(0, 50)}`)
      });
    }

    try {
      // Check if user has agent features enabled
      const agentEnabled = await this.isAgentEnabled();
      if (!agentEnabled) {
        logger.info('Agent features disabled for user', { userId: this.userId });
        // Fall back to regular chatbot behavior
        return await this.fallbackToRegularChat(userMessage, conversationHistory);
      }

      // Initialize Gemini with function calling capabilities
      const model = genAI.getGenerativeModel({
        model: AI_MODELS.DEFAULT,
        tools: [{ functionDeclarations: availableTools }],
        systemInstruction: await this.getSystemInstruction()
      });

      const chat = model.startChat({
        history: this.buildChatHistory(conversationHistory),
      });

      let iteration = 0;
      let currentMessage = userMessage;
      const pendingActions = [];
      let finalResponse = null;

      // Agent loop - iterate until task is complete or max iterations reached
      while (iteration < this.maxIterations) {
        iteration++;
        logger.info(`Agent iteration ${iteration}`, { userId: this.userId });

        const result = await chat.sendMessage(currentMessage);
        const response = result.response;

        // Check if AI wants to call functions
        const functionCalls = response.functionCalls();

        // No function calls - AI has provided final response
        if (!functionCalls || functionCalls.length === 0) {
          finalResponse = response.text();
          logger.info('Agent decided not to call functions', {
            responsePreview: finalResponse ? finalResponse.substring(0, 100) : 'NO RESPONSE TEXT',
            hasContent: !!finalResponse
          });
          
          // Ensure we have a valid response
          if (!finalResponse || finalResponse.trim() === '') {
            finalResponse = "I'm here to help! How can I assist you today?";
            logger.warn('Empty response from Gemini, using fallback');
          }
          break;
        }
        
        logger.info('Agent requesting function calls', {
          functions: functionCalls.map(fc => fc.name),
          count: functionCalls.length
        });

        // Collect function responses
        const functionResponses = [];

        // Process each function call
        for (const call of functionCalls) {
          logger.info('Function call requested', { 
            toolName: call.name, 
            params: JSON.stringify(call.args) 
          });

          // Check if this action requires approval
          const needsApproval = requiresApproval(call.name);

          if (needsApproval) {
            // Add to pending actions for user approval
            pendingActions.push({
              tool: call.name,
              parameters: call.args,
              description: getActionDescription(call.name, call.args),
              requiresApproval: true
            });

            logger.info('Action requires approval', { 
              toolName: call.name,
              description: getActionDescription(call.name, call.args)
            });

          } else {
            // Execute immediately (read-only operations)
            try {
              const toolResult = await this.toolExecutor.execute(call.name, call.args);
              
              // Log successful execution
              await this.logAction(call.name, call.args, toolResult, 'executed');
              
              this.executedActions.push({
                tool: call.name,
                parameters: call.args,
                result: toolResult,
                status: 'executed'
              });

              // Collect function response
              functionResponses.push({
                name: call.name,
                response: toolResult
              });

              logger.info('Tool executed successfully', { 
                toolName: call.name,
                summary: toolResult.summary 
              });

            } catch (error) {
              logger.error('Tool execution failed', { 
                toolName: call.name, 
                error: error.message 
              });

              // Log failed execution
              await this.logAction(call.name, call.args, null, 'failed', error.message);

              return {
                success: false,
                content: `❌ I encountered an error while trying to ${call.name}: ${error.message}`,
                error: error.message,
                executedActions: this.executedActions
              };
            }
          }
        }

        // If we executed any tools, send results back to AI
        if (functionResponses.length > 0) {
          // Map each function response to the correct format
          currentMessage = functionResponses.map(fr => ({
            functionResponse: fr
          }));
        }

        // If we have pending actions, pause and request approval
        if (pendingActions.length > 0) {
          // Get partial response from AI
          const partialResponse = response.text() || 
            'I need your approval to proceed with the following actions:';

          // Save pending actions to database
          const savedActions = await this.savePendingActions(pendingActions);

          return {
            success: true,
            content: partialResponse,
            requiresApproval: true,
            pendingActions: pendingActions.map((action, idx) => ({
              ...action,
              actionId: savedActions[idx].id
            })),
            executedActions: this.executedActions,
            message: '🔔 Please review and approve the actions above to continue.'
          };
        }
      }

      // Check if we hit max iterations
      if (iteration >= this.maxIterations) {
        logger.warn('Agent hit max iterations', { userId: this.userId, iterations: iteration });
        return {
          success: false,
          content: 'I apologize, but this request is too complex for me to handle. Please try breaking it down into smaller steps.',
          error: 'Max iterations reached',
          executedActions: this.executedActions
        };
      }

      // Success - return final response
      return {
        success: true,
        content: finalResponse || 'Task completed successfully.',
        requiresApproval: false,
        executedActions: this.executedActions
      };

    } catch (error) {
      logger.error('Agent processing error', { 
        userId: this.userId, 
        error: error.message,
        stack: error.stack 
      });

      return {
        success: false,
        content: `I apologize, but I encountered an error: ${error.message}. Please try again or contact support if the issue persists.`,
        error: error.message,
        executedActions: this.executedActions
      };
    }
  }

  /**
   * Execute actions that have been approved by the user
   */
  async executeApprovedActions(actionIds) {
    logger.info('Executing approved actions', { 
      userId: this.userId, 
      actionIds 
    });

    const results = [];

    for (const actionId of actionIds) {
      try {
        // Fetch action details
        const { data: action, error } = await supabaseAdmin
          .from('agent_actions')
          .select('*')
          .eq('id', actionId)
          .eq('user_id', this.userId)
          .single();

        if (error || !action) {
          logger.error('Action not found', { actionId, error });
          results.push({ 
            actionId, 
            success: false, 
            error: 'Action not found' 
          });
          continue;
        }

        // Verify action is in pending/approved state
        if (action.status !== 'pending' && action.status !== 'approved') {
          results.push({ 
            actionId, 
            success: false, 
            error: `Action already ${action.status}` 
          });
          continue;
        }

        // Execute the tool
        const startTime = Date.now();
        const result = await this.toolExecutor.execute(
          action.action_type,
          action.input_params
        );
        const executionTime = Date.now() - startTime;

        // Update action status
        await supabaseAdmin
          .from('agent_actions')
          .update({
            status: 'executed',
            output_result: result,
            executed_at: new Date().toISOString(),
            execution_duration_ms: executionTime
          })
          .eq('id', actionId);

        results.push({ 
          actionId, 
          success: true, 
          result,
          description: getActionDescription(action.action_type, action.input_params)
        });

        logger.info('Action executed successfully', { 
          actionId, 
          toolName: action.action_type,
          executionTime: `${executionTime}ms`
        });

      } catch (error) {
        logger.error('Action execution failed', { 
          actionId, 
          error: error.message 
        });

        // Update action with error
        await supabaseAdmin
          .from('agent_actions')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', actionId);

        results.push({ 
          actionId, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  /**
   * Save pending actions to database
   */
  async savePendingActions(actions) {
    const actionsToSave = actions.map(action => ({
      user_id: this.userId,
      conversation_id: this.conversationId,
      action_type: action.tool,
      status: 'pending',
      input_params: action.parameters,
      requires_approval: action.requiresApproval
    }));

    const { data: savedActions, error } = await supabaseAdmin
      .from('agent_actions')
      .insert(actionsToSave)
      .select();

    if (error) {
      logger.error('Failed to save pending actions', { error: error.message });
      throw new Error('Failed to save pending actions');
    }

    return savedActions;
  }

  /**
   * Log an action execution
   */
  async logAction(actionType, inputParams, outputResult, status, errorMessage = null) {
    try {
      await supabaseAdmin
        .from('agent_actions')
        .insert({
          user_id: this.userId,
          conversation_id: this.conversationId,
          action_type: actionType,
          status: status,
          input_params: inputParams,
          output_result: outputResult,
          error_message: errorMessage,
          requires_approval: requiresApproval(actionType),
          executed_at: status === 'executed' ? new Date().toISOString() : null,
          execution_duration_ms: outputResult?.executionTimeMs || null
        });
    } catch (error) {
      logger.error('Failed to log action', { error: error.message });
      // Don't throw - logging failure shouldn't stop execution
    }
  }

  /**
   * Check if agent features are enabled for user
   */
  async isAgentEnabled() {
    const { data: preferences, error } = await supabaseAdmin
      .from('user_agent_preferences')
      .select('enable_agent')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      // Default to enabled if no preferences found
      return true;
    }

    return preferences?.enable_agent !== false;
  }

  /**
   * Build chat history for Gemini
   */
  buildChatHistory(history) {
    return history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
  }

  /**
   * Get system instruction for the agent (personalized with user context)
   */
  async getSystemInstruction() {
    // Get current date/time information for the agent
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
    const currentYear = now.getFullYear();
    const isoDate = now.toISOString().split('T')[0];
    
    // Calculate some reference dates
    const tomorrow = new Date(now.getTime() + 86400000);
    const nextWeek = new Date(now.getTime() + 7 * 86400000);

    // Get personalized user context
    const userProfile = await this.getUserEmployeeProfile();
    
    let userContextSection = '';
    if (userProfile) {
      userContextSection = `
**CURRENT USER CONTEXT:**
You are speaking with a specific NovaTech employee. Use this information to personalize your responses:
- Name: ${userProfile.Full_Name || `${userProfile.First_Name} ${userProfile.Last_Name}`}
- Email: ${userProfile.Email}
- Employee ID: ${userProfile.Employee_ID}
- Department: ${userProfile.Department}
- Role: ${userProfile.Role}
- Access Level: ${userProfile.Access_Level || 'Standard'}
- Work Location: ${userProfile.Work_Location || 'Office'}
- Manager: ${userProfile.resolvedManager?.name || 'Not specified'}
- Manager Email: ${userProfile.resolvedManager?.email || 'Not specified'}
- Onboarding Status: ${userProfile.Onboarding_Status || 'Unknown'}
- Required Tools: ${userProfile.Required_Tools || 'Not specified'}
- Preferred Language: ${userProfile.Preferred_Language || 'English'}
- Hire Date: ${userProfile.Hire_Date || 'Not specified'}

**PERSONALIZATION RULES:**
1. Address the user by their first name (${userProfile.First_Name}) when appropriate
2. When they ask "who is my manager?" or "who is my supervisor?", respond with: "${userProfile.resolvedManager?.name}"${userProfile.resolvedManager?.email ? ` (${userProfile.resolvedManager.email})` : ''}
3. Filter FAQ answers to prioritize those relevant to their department (${userProfile.Department}) and role (${userProfile.Role})
4. Show onboarding tasks that match their role and department
5. For vacation/leave requests, automatically use their manager's email (${userProfile.resolvedManager?.email || 'not available'}) for notifications
6. Respect their access level (${userProfile.Access_Level || 'Standard'}) when providing sensitive information
7. If their onboarding status is "Not Started" or "In Progress", proactively offer help with onboarding tasks
8. Consider their work location (${userProfile.Work_Location}) when giving advice (e.g., VPN setup for remote workers)

`;
    } else {
      userContextSection = `
**USER CONTEXT:**
Unable to identify the current user's employee profile. Proceed with general assistance and ask for clarification when personalized information is needed.

`;
    }
    
    return `You are Nova, an intelligent AI assistant for NovaTech employees. You have the ability to:
${userContextSection}

**CURRENT DATE & TIME AWARENESS:**
- Today is: ${currentDate}
- Current time: ${currentTime}  
- ISO date: ${isoDate}
- Year: ${currentYear}

**IMPORTANT - Relative Date Handling:**
When users mention relative dates, YOU MUST calculate the actual calendar dates:
- "tomorrow" → ${tomorrow.toISOString().split('T')[0]}
- "day after tomorrow" → add 2 days to today
- "next week" → ${nextWeek.toISOString().split('T')[0]}
- "in X days" → add X days to ${isoDate}
- "for X days starting tomorrow" → from tomorrow for X consecutive days
- "next Monday/Tuesday/etc" → find the next occurrence of that weekday
- If user says a date without year (e.g., "December 15"), assume ${currentYear}. If that date has passed, use ${currentYear + 1}.

**Example Calculations:**
- User says "book vacation for tomorrow for 3 days"
  → Start: ${tomorrow.toISOString().split('T')[0]}
  → End: ${new Date(tomorrow.getTime() + 2 * 86400000).toISOString().split('T')[0]} (3 days = start day + 2 more)

1. **Answer Questions**: Use the knowledge base to answer questions about company policies, employees, and procedures
2. **Take Actions**: Execute tasks on behalf of users like sending emails, booking calendar events, checking schedules
3. **Multi-Step Workflows**: Handle complex requests that require multiple actions (e.g., vacation requests)
4. **Context Awareness**: Remember conversation history and understand follow-up questions

**Guidelines:**
- Be conversational: Work step-by-step with the user, not all at once
- Be transparent: Always explain what you're doing and what you found
- Ask for confirmation: After each major step, tell the user the result and ask if they want to proceed
- Be efficient: Use tools to get information instead of making assumptions
- Be helpful: If you need more information, ask clarifying questions
- Be professional: Maintain a friendly but professional tone
- **Always confirm dates**: Before booking, say "Just to confirm, you want [calculated dates]?"

**CRITICAL - Multi-Step Workflows:**
For tasks with multiple dependent steps (like vacation booking), work **ONE STEP AT A TIME**:

1. **Execute the first action** (e.g., check calendar)
2. **Tell the user the result** (e.g., "The dates are free")
3. **Ask for confirmation** (e.g., "Would you like me to book these dates?")
4. **WAIT for user response** - DO NOT proceed to the next step automatically
5. **On next user message** - If they confirm, do the next step

**DO NOT** try to do all steps in one turn. Each step should be a separate conversation turn.

**Available Tools:**
- check_calendar: Check Google Calendar for conflicts on specified dates
- book_calendar_event: Book vacation/events on user's calendar (use ONLY after checking and getting confirmation)
- send_email: Send emails via Gmail (use ONLY after getting confirmation)
- get_team_members: Get employee information
- get_supervisor_info: Get supervisor details  
- get_vacation_policy: Get company vacation policies
- search_knowledge_base: Search all company information

**Example Workflow (Vacation Request with Relative Dates):**

Turn 1:
User: "I want to take vacation starting tomorrow for 4 days"
You: [Calculate: tomorrow = ${tomorrow.toISOString().split('T')[0]}, 4 days ending = ${new Date(tomorrow.getTime() + 3 * 86400000).toISOString().split('T')[0]}]
[Call check_calendar for those dates]
"I've checked your calendar for ${tomorrow.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} through ${new Date(tomorrow.getTime() + 3 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (4 days). Those dates are free! Would you like me to book this vacation?"

Turn 2:
User: "Yes, book it"
You: [Call book_calendar_event with calculated dates]

**Important Rules:**
- NEVER call book_calendar_event without first calling check_calendar
- NEVER call send_email without first confirming with the user
- After each action, STOP and wait for user response
- Only proceed when user explicitly confirms (e.g., "yes", "go ahead", "book it")

**CRITICAL - Date Handling:**
- When users mention dates like "7-12-2025" or "7/12/2025", interpret based on context. In most regions, this means December 7, 2025 (DD-MM-YYYY format).
- Always use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) when calling tools.
- For vacation "from December 7 to December 8", the dates should be:
  - start_date: "2025-12-07T00:00:00Z" (December 7)
  - end_date: "2025-12-08T00:00:00Z" (December 8 - the LAST day of vacation)
- The end_date should be the LAST day the user wants off, NOT the day after.
- Confirm dates with the user if ambiguous (e.g., "Just to confirm, you want December 7th to 8th?")

Remember: You're having a **conversation** with the user, not executing a script! 🚀`;
  }

  /**
   * Fallback to regular chat if agent features disabled
   */
  async fallbackToRegularChat(userMessage, conversationHistory) {
    // This would call the original geminiService.generateResponse
    // For now, return a simple message
    return {
      success: true,
      content: 'Agent features are currently disabled. Please enable them in settings to use automated actions.',
      requiresApproval: false,
      executedActions: []
    };
  }
}

export default AIAgent;

