/**
 * Application Constants
 * Centralized configuration values to avoid magic strings/numbers
 */

// AI Model Configuration
export const AI_MODELS = {
  GEMINI_FLASH: 'gemini-2.0-flash',
  GEMINI_PRO: 'gemini-pro',
  DEFAULT: 'gemini-2.0-flash'
};

// Rate Limiting
export const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 10
  },
  CHAT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 20
  }
};

// Request Limits
export const REQUEST_LIMITS = {
  MAX_MESSAGE_LENGTH: 10000,
  MAX_TITLE_LENGTH: 100,
  MIN_MESSAGE_LENGTH: 1,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_MESSAGE: 5,
  MAX_CONVERSATION_HISTORY: 50,
  BODY_SIZE_LIMIT: '1mb'
};

// Agent Configuration
export const AGENT_CONFIG = {
  MAX_ITERATIONS: 10,
  CONFIDENCE_THRESHOLD: 0.7,
  AUTO_STOP_TIMEOUT_MS: 10000
};

// Conversation Configuration
export const CONVERSATION_CONFIG = {
  DEFAULT_TITLE_LENGTH: 30,
  TITLE_SUFFIX: '...'
};

// Supported File Types
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// HTTP Status Codes (for clarity)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error Codes for API responses
export const ERROR_CODES = {
  // Authentication Errors (1xxx)
  AUTH_TOKEN_MISSING: 'AUTH_1001',
  AUTH_TOKEN_INVALID: 'AUTH_1002',
  AUTH_TOKEN_EXPIRED: 'AUTH_1003',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_1004',
  AUTH_USER_NOT_FOUND: 'AUTH_1005',
  
  // Validation Errors (2xxx)
  VALIDATION_FAILED: 'VAL_2001',
  VALIDATION_MESSAGE_REQUIRED: 'VAL_2002',
  VALIDATION_MESSAGE_TOO_LONG: 'VAL_2003',
  VALIDATION_INVALID_CONVERSATION_ID: 'VAL_2004',
  VALIDATION_INVALID_FILE_TYPE: 'VAL_2005',
  VALIDATION_FILE_TOO_LARGE: 'VAL_2006',
  
  // Resource Errors (3xxx)
  RESOURCE_NOT_FOUND: 'RES_3001',
  RESOURCE_CONVERSATION_NOT_FOUND: 'RES_3002',
  RESOURCE_MESSAGE_NOT_FOUND: 'RES_3003',
  RESOURCE_USER_NOT_FOUND: 'RES_3004',
  RESOURCE_ACCESS_DENIED: 'RES_3005',
  
  // Database Errors (4xxx)
  DATABASE_ERROR: 'DB_4001',
  DATABASE_INSERT_FAILED: 'DB_4002',
  DATABASE_UPDATE_FAILED: 'DB_4003',
  DATABASE_DELETE_FAILED: 'DB_4004',
  DATABASE_FOREIGN_KEY_VIOLATION: 'DB_4005',
  
  // AI/Agent Errors (5xxx)
  AI_GENERATION_FAILED: 'AI_5001',
  AI_MAX_ITERATIONS: 'AI_5002',
  AI_TOOL_EXECUTION_FAILED: 'AI_5003',
  AI_APPROVAL_REQUIRED: 'AI_5004',
  AI_SERVICE_UNAVAILABLE: 'AI_5005',
  
  // Rate Limiting (6xxx)
  RATE_LIMIT_EXCEEDED: 'RATE_6001',
  
  // Server Errors (9xxx)
  INTERNAL_ERROR: 'SRV_9001',
  SERVICE_UNAVAILABLE: 'SRV_9002',
  CONFIGURATION_ERROR: 'SRV_9003'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CONVERSATION_CREATED: 'Conversation created successfully',
  CONVERSATION_UPDATED: 'Conversation updated successfully',
  CONVERSATION_DELETED: 'Conversation deleted successfully',
  MESSAGE_SENT: 'Message sent successfully',
  MESSAGE_REGENERATED: 'Response regenerated successfully',
  ACTIONS_EXECUTED: 'Actions executed successfully',
  ACTIONS_CANCELLED: 'Actions cancelled'
};

export default {
  AI_MODELS,
  RATE_LIMITS,
  REQUEST_LIMITS,
  AGENT_CONFIG,
  CONVERSATION_CONFIG,
  SUPPORTED_FILE_TYPES,
  HTTP_STATUS,
  ERROR_CODES,
  SUCCESS_MESSAGES
};

