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

