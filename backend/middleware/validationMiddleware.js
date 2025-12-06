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
 * Input sanitization middleware (intentionally a pass-through)
 * 
 * NOTE: This middleware deliberately does NOT sanitize inputs because:
 * 1. User messages are sent to the AI and may contain legitimate special characters
 * 2. AI responses are safely rendered using ReactMarkdown on the frontend
 * 3. Database inputs are parameterized via Supabase client (prevents SQL injection)
 * 
 * If you need XSS sanitization for a different use case, implement it in
 * the specific route handler or use a library like DOMPurify on the frontend.
 */
export const sanitizeInputs = (req, res, next) => {
  next();
};

export default {
  validateBody,
  validateParams,
  validateQuery,
  sanitizeInputs
};
