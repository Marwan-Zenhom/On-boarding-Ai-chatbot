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
import logger from '../config/logger.js';
import { AI_MODELS, AGENT_CONFIG, ERROR_CODES } from '../constants/index.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Custom error classes for better error handling
 */
export class AgentError extends Error {
  constructor(message, code, isRecoverable = false, details = {}) {
    super(message);
    this.name = 'AgentError';
    this.code = code;
    this.isRecoverable = isRecoverable;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ToolExecutionError extends AgentError {
  constructor(toolName, originalError, details = {}) {
    super(
      `Tool '${toolName}' execution failed: ${originalError.message}`,
      ERROR_CODES.AI_TOOL_EXECUTION_FAILED,
      true, // Tool errors are often recoverable
      { toolName, originalError: originalError.message, ...details }
    );
    this.name = 'ToolExecutionError';
  }
}

export class MaxIterationsError extends AgentError {
  constructor(iterations, userId) {
    super(
      `Agent reached maximum iterations (${iterations})`,
      ERROR_CODES.AI_MAX_ITERATIONS,
      false,
      { iterations, userId }
    );
    this.name = 'MaxIterationsError';
  }
}

export class AIServiceError extends AgentError {
  constructor(originalError) {
    const isRateLimit = originalError.message?.includes('429') || 
                        originalError.message?.toLowerCase().includes('rate limit');
    const isQuotaExceeded = originalError.message?.toLowerCase().includes('quota');
    
    let userMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
    let code = ERROR_CODES.AI_SERVICE_UNAVAILABLE;
    
    if (isRateLimit) {
      userMessage = 'AI service is experiencing high demand. Please wait a moment and try again.';
      code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
    } else if (isQuotaExceeded) {
      userMessage = 'AI service quota has been exceeded. Please contact support.';
    }
    
    super(userMessage, code, isRateLimit, { originalError: originalError.message });
    this.name = 'AIServiceError';
  }
}

export class AIAgent {
  constructor(userId, conversationId = null) {
    this.userId = userId;
    this.conversationId = conversationId;
    this.toolExecutor = new ToolExecutor(userId);
    this.maxIterations = AGENT_CONFIG.MAX_ITERATIONS;
    this.executedActions = []; // Track what was executed
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
        systemInstruction: this.getSystemInstruction()
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
              const toolError = new ToolExecutionError(call.name, error);
              
              logger.error('Tool execution failed', { 
                toolName: call.name, 
                error: error.message,
                errorCode: toolError.code,
                isRecoverable: toolError.isRecoverable,
                userId: this.userId
              });

              // Log failed execution
              await this.logAction(call.name, call.args, null, 'failed', error.message);

              // Provide user-friendly error message based on tool type
              const userMessage = this.getToolErrorMessage(call.name, error);

              return {
                success: false,
                content: userMessage,
                error: error.message,
                errorCode: toolError.code,
                isRecoverable: toolError.isRecoverable,
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
        const maxIterError = new MaxIterationsError(iteration, this.userId);
        
        logger.warn('Agent hit max iterations', { 
          userId: this.userId, 
          iterations: iteration,
          errorCode: maxIterError.code,
          executedActionsCount: this.executedActions.length
        });
        
        return {
          success: false,
          content: '⚠️ This request requires more steps than I can handle in one go. Here\'s what I suggest:\n\n' +
                   '1. Try breaking your request into smaller, specific tasks\n' +
                   '2. Ask me to do one thing at a time\n' +
                   '3. If you were asking about multiple topics, please ask about each separately\n\n' +
                   'I\'ve already completed ' + this.executedActions.length + ' action(s) for you.',
          error: maxIterError.message,
          errorCode: maxIterError.code,
          isRecoverable: false,
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
      // Classify the error
      const classifiedError = this.classifyError(error);
      
      logger.error('Agent processing error', { 
        userId: this.userId, 
        error: error.message,
        errorCode: classifiedError.code,
        isRecoverable: classifiedError.isRecoverable,
        stack: error.stack,
        executedActionsCount: this.executedActions.length
      });

      return {
        success: false,
        content: classifiedError.userMessage,
        error: error.message,
        errorCode: classifiedError.code,
        isRecoverable: classifiedError.isRecoverable,
        executedActions: this.executedActions
      };
    }
  }

  /**
   * Classify an error and determine user-friendly messaging
   */
  classifyError(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    
    // AI Service errors (rate limits, quota, etc.)
    if (errorMessage.includes('429') || 
        errorMessage.includes('rate limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('too many requests')) {
      return {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        isRecoverable: true,
        userMessage: '⏳ The AI service is experiencing high demand right now. Please wait a moment and try again.'
      };
    }
    
    // Network/connectivity errors
    if (errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('socket')) {
      return {
        code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
        isRecoverable: true,
        userMessage: '🔌 I\'m having trouble connecting to the AI service. Please check your connection and try again.'
      };
    }
    
    // Authentication errors (Google OAuth)
    if (errorMessage.includes('token') ||
        errorMessage.includes('oauth') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('authentication')) {
      return {
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        isRecoverable: true,
        userMessage: '🔐 There was an authentication issue with one of your connected services. Please check your Google connection in Settings.'
      };
    }
    
    // Database errors
    if (errorMessage.includes('database') ||
        errorMessage.includes('supabase') ||
        errorMessage.includes('postgres') ||
        errorMessage.includes('sql')) {
      return {
        code: ERROR_CODES.DATABASE_ERROR,
        isRecoverable: true,
        userMessage: '💾 There was a temporary issue saving data. Please try again.'
      };
    }
    
    // Default: unknown error
    return {
      code: ERROR_CODES.AI_GENERATION_FAILED,
      isRecoverable: false,
      userMessage: `😔 I encountered an unexpected error: "${error.message}". If this continues, please try:\n\n` +
                   '• Refreshing the page\n' +
                   '• Starting a new conversation\n' +
                   '• Contacting support if the issue persists'
    };
  }

  /**
   * Get user-friendly error message for specific tool failures
   */
  getToolErrorMessage(toolName, error) {
    const errorMessage = error.message?.toLowerCase() || '';
    
    switch (toolName) {
      case 'check_calendar':
      case 'book_calendar_event':
        if (errorMessage.includes('not connected') || errorMessage.includes('oauth')) {
          return '📅 I couldn\'t access your Google Calendar. Please make sure your Google account is connected in Settings.';
        }
        return `❌ I had trouble with your calendar: ${error.message}. Please verify your Google Calendar connection.`;
        
      case 'send_email':
        if (errorMessage.includes('not connected') || errorMessage.includes('oauth')) {
          return '📧 I couldn\'t send the email because your Gmail isn\'t connected. Please connect your Google account in Settings.';
        }
        if (errorMessage.includes('invalid') && errorMessage.includes('email')) {
          return '📧 The email address appears to be invalid. Please check the recipient address.';
        }
        return `❌ I couldn\'t send the email: ${error.message}. Please verify the email details and your Gmail connection.`;
        
      case 'search_knowledge_base':
      case 'get_team_members':
      case 'get_supervisor_info':
      case 'get_vacation_policy':
        return `📚 I had trouble searching our knowledge base: ${error.message}. Please try rephrasing your question.`;
        
      default:
        return `❌ I encountered an error while trying to ${toolName.replace(/_/g, ' ')}: ${error.message}`;
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
        // Classify the error for better logging
        const classifiedError = this.classifyError(error);
        
        logger.error('Action execution failed', { 
          actionId, 
          error: error.message,
          errorCode: classifiedError.code,
          isRecoverable: classifiedError.isRecoverable,
          userId: this.userId
        });

        // Update action with error
        try {
          await supabaseAdmin
            .from('agent_actions')
            .update({
              status: 'failed',
              error_message: error.message
            })
            .eq('id', actionId);
        } catch (dbError) {
          logger.error('Failed to update action status', { 
            actionId, 
            dbError: dbError.message 
          });
        }

        results.push({ 
          actionId, 
          success: false, 
          error: error.message,
          errorCode: classifiedError.code,
          isRecoverable: classifiedError.isRecoverable
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
   * Get system instruction for the agent
   */
  getSystemInstruction() {
    return `You are Nova, an intelligent AI assistant for NovaTech employees. You have the ability to:

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

**Example Workflow (Vacation Request):**

Turn 1:
User: "I want to take vacation Nov 1-11. Can you check if it's available and book it?"
You: [Call check_calendar for Nov 1-11]
"I've checked your calendar for November 1-11. Those dates are completely free! Would you like me to book this vacation on your calendar?"

Turn 2:
User: "Yes, book it"
You: [Call book_calendar_event for Nov 1-11]
"Perfect! I've booked your vacation from November 1-11 on your calendar. Would you like me to send an email to your supervisor to notify them?"

Turn 3:
User: "Yes, send the email"
You: [Call send_email to supervisor]
"Done! I've sent an email to your supervisor about your vacation request from November 1-11."

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

