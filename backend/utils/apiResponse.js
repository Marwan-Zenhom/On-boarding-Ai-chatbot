/**
 * Standardized API Response Utilities
 * Ensures consistent response format across all endpoints
 */

import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';

/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (res, data = {}, message = null, statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
    ...data
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Created Response (201)
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Optional success message
 */
export const createdResponse = (res, data = {}, message = null) => {
  return successResponse(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {string} code - Error code from ERROR_CODES
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details (only in development)
 */
export const errorResponse = (res, error, code = ERROR_CODES.INTERNAL_ERROR, statusCode = HTTP_STATUS.INTERNAL_ERROR, details = null) => {
  const response = {
    success: false,
    error,
    code
  };
  
  // Only include details in development mode
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Validation Error Response (400)
 */
export const validationError = (res, error, details = null) => {
  return errorResponse(res, error, ERROR_CODES.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST, details);
};

/**
 * Unauthorized Error Response (401)
 */
export const unauthorizedError = (res, error = 'Authentication required', code = ERROR_CODES.AUTH_TOKEN_MISSING) => {
  return errorResponse(res, error, code, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Forbidden Error Response (403)
 */
export const forbiddenError = (res, error = 'Access denied', code = ERROR_CODES.RESOURCE_ACCESS_DENIED) => {
  return errorResponse(res, error, code, HTTP_STATUS.FORBIDDEN);
};

/**
 * Not Found Error Response (404)
 */
export const notFoundError = (res, error = 'Resource not found', code = ERROR_CODES.RESOURCE_NOT_FOUND) => {
  return errorResponse(res, error, code, HTTP_STATUS.NOT_FOUND);
};

/**
 * Conflict Error Response (409)
 */
export const conflictError = (res, error, code = ERROR_CODES.DATABASE_ERROR) => {
  return errorResponse(res, error, code, HTTP_STATUS.CONFLICT);
};

/**
 * Rate Limit Error Response (429)
 */
export const rateLimitError = (res, error = 'Too many requests, please try again later') => {
  return errorResponse(res, error, ERROR_CODES.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS);
};

/**
 * Internal Server Error Response (500)
 */
export const internalError = (res, error = 'Internal server error', details = null) => {
  return errorResponse(res, error, ERROR_CODES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_ERROR, details);
};

/**
 * Database Error Response
 */
export const databaseError = (res, error, dbError = null) => {
  let code = ERROR_CODES.DATABASE_ERROR;
  
  // Map specific database error codes
  if (dbError?.code === '23503') {
    code = ERROR_CODES.DATABASE_FOREIGN_KEY_VIOLATION;
  }
  
  return errorResponse(res, error, code, HTTP_STATUS.INTERNAL_ERROR, dbError);
};

/**
 * AI Service Error Response
 */
export const aiError = (res, error, code = ERROR_CODES.AI_GENERATION_FAILED) => {
  return errorResponse(res, error, code, HTTP_STATUS.INTERNAL_ERROR);
};

export default {
  successResponse,
  createdResponse,
  errorResponse,
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  conflictError,
  rateLimitError,
  internalError,
  databaseError,
  aiError
};

