/**
 * Conversation Service
 * Business logic for conversation and message management
 * Separates data access from HTTP layer
 */

import { supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';
import { CONVERSATION_CONFIG, ERROR_CODES } from '../constants/index.js';

/**
 * Custom error class for service-level errors
 */
export class ServiceError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ServiceError';
  }
}

/**
 * Get conversation history
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} - Array of messages
 */
export const getConversationHistory = async (conversationId, userId) => {
  // First verify user owns this conversation
  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (convError || !conversation) {
    throw new ServiceError(
      'Conversation not found or access denied',
      ERROR_CODES.RESOURCE_ACCESS_DENIED,
      403
    );
  }

  // Get messages
  const { data: messages, error: msgError } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (msgError) {
    logger.error('Failed to fetch conversation history', { error: msgError.message });
    throw new ServiceError(
      'Failed to fetch conversation history',
      ERROR_CODES.DATABASE_ERROR,
      500
    );
  }

  return messages || [];
};

/**
 * Create a new conversation
 * @param {string} userId - User UUID
 * @param {string} firstMessage - First message for title generation
 * @returns {Promise<Object>} - Created conversation
 */
export const createConversation = async (userId, firstMessage) => {
  const title = firstMessage.length > CONVERSATION_CONFIG.DEFAULT_TITLE_LENGTH
    ? firstMessage.substring(0, CONVERSATION_CONFIG.DEFAULT_TITLE_LENGTH) + CONVERSATION_CONFIG.TITLE_SUFFIX
    : firstMessage;

  const { data: newConversation, error } = await supabaseAdmin
    .from('conversations')
    .insert([{
      user_id: userId,
      title,
      is_favourite: false,
      is_archived: false
    }])
    .select()
    .single();

  if (error) {
    logger.error('Failed to create conversation', {
      userId,
      error: error.message,
      code: error.code
    });

    // Handle foreign key violation
    if (error.code === '23503') {
      throw new ServiceError(
        'User account not properly set up. Please try logging out and back in.',
        ERROR_CODES.DATABASE_FOREIGN_KEY_VIOLATION,
        400
      );
    }

    throw new ServiceError(
      'Failed to create conversation',
      ERROR_CODES.DATABASE_INSERT_FAILED,
      500
    );
  }

  return newConversation;
};

/**
 * Get all conversations for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} - Array of conversations with messages
 */
export const getUserConversations = async (userId) => {
  const { data: conversations, error } = await supabaseAdmin
    .from('conversations')
    .select(`
      *,
      messages (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch conversations', { error: error.message, userId });
    throw new ServiceError(
      'Failed to fetch conversations',
      ERROR_CODES.DATABASE_ERROR,
      500
    );
  }

  return conversations || [];
};

/**
 * Update a conversation
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - User UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateConversation = async (conversationId, userId, updates) => {
  const { error } = await supabaseAdmin
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to update conversation', { error: error.message, conversationId });
    throw new ServiceError(
      'Failed to update conversation',
      ERROR_CODES.DATABASE_UPDATE_FAILED,
      500
    );
  }
};

/**
 * Delete a conversation (messages deleted via CASCADE)
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
export const deleteConversation = async (conversationId, userId) => {
  const { error } = await supabaseAdmin
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete conversation', { error: error.message, conversationId });
    throw new ServiceError(
      'Failed to delete conversation',
      ERROR_CODES.DATABASE_DELETE_FAILED,
      500
    );
  }
};

/**
 * Save messages to a conversation
 * @param {string} conversationId - Conversation UUID
 * @param {Array} messages - Array of message objects
 * @returns {Promise<void>}
 */
export const saveMessages = async (conversationId, messages) => {
  const messagesToInsert = messages.map(msg => ({
    conversation_id: conversationId,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp || new Date().toISOString()
  }));

  const { error } = await supabaseAdmin
    .from('messages')
    .insert(messagesToInsert);

  if (error) {
    logger.error('Failed to save messages', {
      error: error.message,
      conversationId,
      code: error.code
    });
    throw new ServiceError(
      'Failed to save messages',
      ERROR_CODES.DATABASE_INSERT_FAILED,
      500
    );
  }
};

/**
 * Save a single user message
 * @param {string} conversationId - Conversation UUID
 * @param {string} content - Message content
 * @returns {Promise<Object>} - Saved message with timestamp
 */
export const saveUserMessage = async (conversationId, content) => {
  const timestamp = new Date().toISOString();
  
  const { error } = await supabaseAdmin
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      role: 'user',
      content,
      timestamp
    }]);

  if (error) {
    logger.error('Failed to save user message', { error: error.message, conversationId });
    throw new ServiceError(
      'Failed to save message',
      ERROR_CODES.DATABASE_INSERT_FAILED,
      500
    );
  }

  return { role: 'user', content, timestamp };
};

/**
 * Get messages for regeneration
 * @param {string} conversationId - Conversation UUID
 * @param {string} messageId - Message UUID to regenerate from
 * @returns {Promise<Object>} - User message and history
 */
export const getMessagesForRegeneration = async (conversationId, messageId) => {
  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error || !messages || messages.length === 0) {
    throw new ServiceError(
      'Conversation not found',
      ERROR_CODES.RESOURCE_CONVERSATION_NOT_FOUND,
      404
    );
  }

  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  if (messageIndex === -1) {
    throw new ServiceError(
      'Message not found',
      ERROR_CODES.RESOURCE_MESSAGE_NOT_FOUND,
      404
    );
  }

  const userMessage = messages[messageIndex];
  if (userMessage.role !== 'user') {
    throw new ServiceError(
      'Can only regenerate responses to user messages',
      ERROR_CODES.VALIDATION_FAILED,
      400
    );
  }

  // Get history up to the user message
  const conversationHistory = messages
    .slice(0, messageIndex)
    .map(msg => ({ role: msg.role, content: msg.content }));

  // Get the old assistant response if it exists
  const oldAssistantMessage = messages[messageIndex + 1];

  return {
    userMessage,
    conversationHistory,
    oldAssistantMessage
  };
};

/**
 * Delete a message by ID
 * @param {string} messageId - Message UUID
 * @returns {Promise<void>}
 */
export const deleteMessage = async (messageId) => {
  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    logger.error('Failed to delete message', { error: error.message, messageId });
    throw new ServiceError(
      'Failed to delete message',
      ERROR_CODES.DATABASE_DELETE_FAILED,
      500
    );
  }
};

/**
 * Save regenerated AI response
 * @param {string} conversationId - Conversation UUID
 * @param {string} content - AI response content
 * @returns {Promise<Object>} - Saved message
 */
export const saveAIResponse = async (conversationId, content) => {
  const { data: newMessage, error } = await supabaseAdmin
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    logger.error('Failed to save AI response', { error: error.message, conversationId });
    throw new ServiceError(
      'Failed to save regenerated message',
      ERROR_CODES.DATABASE_INSERT_FAILED,
      500
    );
  }

  return newMessage;
};

export default {
  ServiceError,
  getConversationHistory,
  createConversation,
  getUserConversations,
  updateConversation,
  deleteConversation,
  saveMessages,
  saveUserMessage,
  getMessagesForRegeneration,
  deleteMessage,
  saveAIResponse
};

