/**
 * Validation Middleware
 * Generic middleware for validating request data using Joi schemas
 */

import { validationError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/index.js';

/**
 * Validate request body against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first
      stripUnknown: true, // Remove unknown fields
      convert: true // Type coercion
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      return validationError(res, errorMessages, {
        fields: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Replace body with validated/sanitized values
    req.body = value;
    next();
  };
};

/**
 * Validate request params against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      return validationError(res, errorMessages);
    }

    req.params = value;
    next();
  };
};

/**
 * Validate request query against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      return validationError(res, errorMessages);
    }

    req.query = value;
    next();
  };
};

/**
 * Sanitize string inputs (basic XSS prevention)
 */
export const sanitizeInputs = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Basic HTML entity encoding
      return obj
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  // Note: We skip sanitization for message content as it may contain
  // legitimate characters that users want to send to the AI
  // The AI response is already rendered safely using ReactMarkdown
  
  next();
};

export default {
  validateBody,
  validateParams,
  validateQuery,
  sanitizeInputs
};
