/**
 * Chat Controller
 * Handles HTTP requests for chat functionality
 * Business logic delegated to services
 */

import { generateResponse } from '../services/geminiService.js';
import { AIAgent } from '../services/agentService.js';
import * as conversationService from '../services/conversationService.js';
import { 
  successResponse, 
  errorResponse,
  internalError, 
  notFoundError,
  forbiddenError,
  validationError
} from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { ERROR_CODES, SUCCESS_MESSAGES } from '../constants/index.js';
import logger from '../config/logger.js';

/**
 * POST /api/chat/message
 * Send a new message and get AI response
 */
export const sendMessage = async (req, res) => {
  const userId = req.user.id;
  const { message, conversationId, files } = req.body;
  
  // Track the actual conversation ID (may differ from request if new conversation created)
  let currentConversationId = conversationId;

  try {
    // Get conversation history if exists
    let conversationHistory = [];
    if (conversationId) {
      try {
        conversationHistory = await conversationService.getConversationHistory(
          conversationId, 
          userId
        );
      } catch (error) {
        if (error.code === ERROR_CODES.RESOURCE_ACCESS_DENIED) {
          return forbiddenError(res, 'Unauthorized access to conversation');
        }
        throw error;
      }
    }

    // Create conversation if needed
    if (!currentConversationId) {
      const newConversation = await conversationService.createConversation(
        userId, 
        message.trim()
      );
      currentConversationId = newConversation.id;
    }

    // Process with AI Agent (with fallback to old service)
    let agentResponse;
    try {
      const agent = new AIAgent(userId, currentConversationId);
      agentResponse = await agent.processRequest(message.trim(), conversationHistory);
    } catch (agentError) {
      logger.warn('Agent failed, falling back to Gemini service', { error: agentError.message });
      const oldResponse = await generateResponse(message.trim(), conversationHistory);
      agentResponse = {
        success: oldResponse.success,
        content: oldResponse.content,
        requiresApproval: false,
        executedActions: []
      };
    }

    // Handle approval required response
    if (agentResponse.requiresApproval) {
      await conversationService.saveUserMessage(currentConversationId, message.trim());

      return successResponse(res, {
        conversationId: currentConversationId,
        requiresApproval: true,
        pendingActions: agentResponse.pendingActions,
        content: agentResponse.content,
        executedActions: agentResponse.executedActions || []
      });
    }

    // Ensure valid content
    const aiContent = agentResponse.content || 
      'I apologize, but I could not generate a response. Please try again.';

    // Save messages with distinct timestamps to ensure proper ordering
    // User message gets current timestamp, assistant message gets +1ms
    const userTimestamp = new Date().toISOString();
    const assistantTimestamp = new Date(Date.now() + 1).toISOString();
    
    await conversationService.saveMessages(currentConversationId, [
      { role: 'user', content: message.trim(), timestamp: userTimestamp },
      { role: 'assistant', content: aiContent, timestamp: assistantTimestamp }
    ]);

    logger.info('Chat message processed successfully', { 
      conversationId: currentConversationId,
      userId 
    });

    return successResponse(res, {
      conversationId: currentConversationId,
      userMessage: {
        role: 'user',
        content: message.trim(),
        timestamp: userTimestamp
      },
      aiResponse: {
        role: 'assistant',
        content: aiContent,
        timestamp: assistantTimestamp,
        model: 'ai-agent'
      },
      executedActions: agentResponse.executedActions || []
    });

  } catch (error) {
    logger.error('Chat error', { 
      error: error.message, 
      userId, 
      conversationId: currentConversationId,
      code: error.code,
      statusCode: error.statusCode
    });

    // Handle service errors with proper status codes
    if (error.name === 'ServiceError') {
      return errorResponse(
        res, 
        error.message, 
        error.code, 
        error.statusCode || HTTP_STATUS.INTERNAL_ERROR
      );
    }

    return internalError(res, 'Failed to process message');
  }
};

/**
 * POST /api/chat/regenerate
 * Regenerate AI response for a message
 */
export const regenerateResponse = async (req, res) => {
  const userId = req.user.id;
  const { conversationId, messageId } = req.body;

  try {
    // Get messages for regeneration (verifies user owns the conversation)
    const { userMessage, conversationHistory, oldAssistantMessage } = 
      await conversationService.getMessagesForRegeneration(conversationId, messageId, userId);

    // Generate new response
    const aiResponse = await generateResponse(userMessage.content, conversationHistory);

    // Delete old assistant response if exists
    if (oldAssistantMessage && oldAssistantMessage.role === 'assistant') {
      await conversationService.deleteMessage(oldAssistantMessage.id);
    }

    // Save new response
    const newMessage = await conversationService.saveAIResponse(
      conversationId, 
      aiResponse.content
    );

    logger.info('Response regenerated', { conversationId, messageId, userId });

    return successResponse(res, {
      aiResponse: {
        id: newMessage.id,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: newMessage.timestamp,
        model: aiResponse.model
      }
    }, SUCCESS_MESSAGES.MESSAGE_REGENERATED);

  } catch (error) {
    logger.error('Regenerate error', { 
      error: error.message, 
      userId, 
      conversationId,
      code: error.code,
      statusCode: error.statusCode
    });

    // Handle service errors with proper status codes
    if (error.name === 'ServiceError') {
      return errorResponse(
        res, 
        error.message, 
        error.code, 
        error.statusCode || HTTP_STATUS.INTERNAL_ERROR
      );
    }

    return internalError(res, 'Failed to regenerate response');
  }
};

/**
 * GET /api/chat/conversations
 * Get all conversations for authenticated user
 */
export const getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await conversationService.getUserConversations(userId);

    return successResponse(res, { conversations });

  } catch (error) {
    logger.error('Get conversations error', { 
      error: error.message, 
      userId,
      code: error.code,
      statusCode: error.statusCode
    });

    if (error.name === 'ServiceError') {
      return errorResponse(
        res, 
        error.message, 
        error.code, 
        error.statusCode || HTTP_STATUS.INTERNAL_ERROR
      );
    }

    return internalError(res, 'Failed to fetch conversations');
  }
};

/**
 * PUT /api/chat/conversations/:id
 * Update a conversation (title, favourite, archived)
 */
export const updateConversation = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updates = req.body;

  try {
    await conversationService.updateConversation(id, userId, updates);

    logger.info('Conversation updated', { conversationId: id, userId });

    return successResponse(res, {}, SUCCESS_MESSAGES.CONVERSATION_UPDATED);

  } catch (error) {
    logger.error('Update conversation error', { 
      error: error.message, 
      userId, 
      conversationId: id,
      code: error.code,
      statusCode: error.statusCode
    });

    if (error.name === 'ServiceError') {
      return errorResponse(
        res, 
        error.message, 
        error.code, 
        error.statusCode || HTTP_STATUS.INTERNAL_ERROR
      );
    }

    return internalError(res, 'Failed to update conversation');
  }
};

/**
 * DELETE /api/chat/conversations/:id
 * Delete a conversation and all its messages
 */
export const deleteConversation = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    await conversationService.deleteConversation(id, userId);

    logger.info('Conversation deleted', { conversationId: id, userId });

    return successResponse(res, {}, SUCCESS_MESSAGES.CONVERSATION_DELETED);

  } catch (error) {
    logger.error('Delete conversation error', { 
      error: error.message, 
      userId, 
      conversationId: id,
      code: error.code,
      statusCode: error.statusCode
    });

    if (error.name === 'ServiceError') {
      return errorResponse(
        res, 
        error.message, 
        error.code, 
        error.statusCode || HTTP_STATUS.INTERNAL_ERROR
      );
    }

    return internalError(res, 'Failed to delete conversation');
  }
};

export default {
  sendMessage,
  regenerateResponse,
  getConversations,
  updateConversation,
  deleteConversation
};
