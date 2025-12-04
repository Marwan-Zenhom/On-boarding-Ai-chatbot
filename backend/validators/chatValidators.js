/**
 * Chat API Validation Schemas
 * Using Joi for robust input validation
 */

import Joi from 'joi';
import { REQUEST_LIMITS, SUPPORTED_FILE_TYPES } from '../constants/index.js';

/**
 * Send Message Validation Schema
 */
export const sendMessageSchema = Joi.object({
  message: Joi.string()
    .trim()
    .min(REQUEST_LIMITS.MIN_MESSAGE_LENGTH)
    .max(REQUEST_LIMITS.MAX_MESSAGE_LENGTH)
    .required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.min': 'Message must be at least 1 character',
      'string.max': `Message cannot exceed ${REQUEST_LIMITS.MAX_MESSAGE_LENGTH} characters`,
      'any.required': 'Message is required'
    }),
  
  conversationId: Joi.string()
    .uuid()
    .allow(null)
    .optional()
    .messages({
      'string.guid': 'Invalid conversation ID format'
    }),
  
  files: Joi.any()
    .optional()
    .default(null)
});

/**
 * Regenerate Response Validation Schema
 */
export const regenerateSchema = Joi.object({
  conversationId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid conversation ID format',
      'any.required': 'Conversation ID is required'
    }),
  
  messageId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid message ID format',
      'any.required': 'Message ID is required'
    })
});

/**
 * Update Conversation Validation Schema
 */
export const updateConversationSchema = Joi.object({
  title: Joi.string()
    .trim()
    .max(REQUEST_LIMITS.MAX_TITLE_LENGTH)
    .optional()
    .messages({
      'string.max': `Title cannot exceed ${REQUEST_LIMITS.MAX_TITLE_LENGTH} characters`
    }),
  
  is_favourite: Joi.boolean().optional(),
  
  is_archived: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Conversation ID Parameter Validation
 */
export const conversationIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid conversation ID format',
      'any.required': 'Conversation ID is required'
    })
});

/**
 * Approve Actions Validation Schema
 */
export const approveActionsSchema = Joi.object({
  actionIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one action ID is required',
      'any.required': 'Action IDs are required'
    }),
  
  conversationId: Joi.string()
    .uuid()
    .optional()
});

/**
 * Reject Actions Validation Schema
 */
export const rejectActionsSchema = Joi.object({
  actionIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one action ID is required',
      'any.required': 'Action IDs are required'
    })
});

export default {
  sendMessageSchema,
  regenerateSchema,
  updateConversationSchema,
  conversationIdSchema,
  approveActionsSchema,
  rejectActionsSchema
};

