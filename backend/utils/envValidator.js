/**
 * Environment Variable Validator
 * Validates all required environment variables on startup
 * Fails fast with clear error messages if misconfigured
 */

import logger from '../config/logger.js';

/**
 * Environment variable configuration
 * Each variable has: required, description, and optional validation
 */
const ENV_CONFIG = {
  // Server
  PORT: {
    required: false,
    default: '8000',
    description: 'Server port number'
  },
  NODE_ENV: {
    required: false,
    default: 'development',
    description: 'Environment mode',
    validate: (value) => ['development', 'production', 'test'].includes(value),
    validationMessage: 'Must be one of: development, production, test'
  },

  // Supabase (Required)
  SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL',
    validate: (value) => value.startsWith('https://') && value.includes('supabase'),
    validationMessage: 'Must be a valid Supabase URL (https://xxx.supabase.co)'
  },
  SUPABASE_ANON_KEY: {
    required: true,
    description: 'Supabase anonymous/public key',
    validate: (value) => value.length > 100,
    validationMessage: 'Appears to be invalid (too short)'
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: false,
    description: 'Supabase service role key (for admin operations)',
    validate: (value) => !value || value.length > 100,
    validationMessage: 'Appears to be invalid (too short)'
  },
  SUPABASE_JWT_SECRET: {
    required: true,
    description: 'Supabase JWT secret for token verification',
    validate: (value) => value.length >= 32,
    validationMessage: 'Must be at least 32 characters'
  },

  // AI Services
  GEMINI_API_KEY: {
    required: true,
    description: 'Google Gemini API key',
    validate: (value) => value.startsWith('AI') || value.length > 20,
    validationMessage: 'Appears to be invalid'
  },
  HUGGINGFACE_API_KEY: {
    required: false,
    description: 'Hugging Face API token for embeddings',
    validate: (value) => !value || value.startsWith('hf_') || value.length > 20,
    validationMessage: 'Should start with hf_ or be a valid token'
  },

  // Google OAuth (Optional but validated if present)
  GOOGLE_CLIENT_ID: {
    required: false,
    description: 'Google OAuth client ID',
    validate: (value) => !value || value.includes('.apps.googleusercontent.com'),
    validationMessage: 'Should end with .apps.googleusercontent.com'
  },
  GOOGLE_CLIENT_SECRET: {
    required: false,
    description: 'Google OAuth client secret',
    dependsOn: 'GOOGLE_CLIENT_ID' // Required if GOOGLE_CLIENT_ID is set
  },
  GOOGLE_REDIRECT_URI: {
    required: false,
    description: 'Google OAuth redirect URI',
    dependsOn: 'GOOGLE_CLIENT_ID',
    validate: (value) => !value || value.includes('/api/google-auth/callback'),
    validationMessage: 'Must contain /api/google-auth/callback'
  },

  // Security
  FRONTEND_URL: {
    required: false,
    default: 'http://localhost:3000',
    description: 'Frontend URL for CORS',
    validate: (value) => value.startsWith('http://') || value.startsWith('https://'),
    validationMessage: 'Must be a valid URL starting with http:// or https://'
  }
};

/**
 * Validation result object
 */
class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.valid = true;
  }

  addError(variable, message) {
    this.errors.push({ variable, message });
    this.valid = false;
  }

  addWarning(variable, message) {
    this.warnings.push({ variable, message });
  }
}

/**
 * Validate all environment variables
 * @returns {ValidationResult}
 */
export const validateEnv = () => {
  const result = new ValidationResult();

  for (const [name, config] of Object.entries(ENV_CONFIG)) {
    const value = process.env[name];

    // Check if required variable is missing
    if (config.required && !value) {
      result.addError(name, `Missing required environment variable: ${config.description}`);
      continue;
    }

    // Check dependencies (e.g., GOOGLE_CLIENT_SECRET requires GOOGLE_CLIENT_ID)
    if (config.dependsOn && process.env[config.dependsOn] && !value) {
      result.addError(name, `Required when ${config.dependsOn} is set: ${config.description}`);
      continue;
    }

    // Apply default if not set
    if (!value && config.default) {
      process.env[name] = config.default;
    }

    // Run custom validation if value exists
    if (value && config.validate) {
      if (!config.validate(value)) {
        result.addError(name, config.validationMessage || `Invalid value for ${name}`);
      }
    }

    // Warn about optional but recommended variables
    if (!value && !config.required && name === 'HUGGINGFACE_API_KEY') {
      result.addWarning(name, 'Not set - RAG/embeddings functionality will be limited');
    }
  }

  // Check Google OAuth completeness
  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasGoogleRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;

  if (hasGoogleClientId && (!hasGoogleClientSecret || !hasGoogleRedirectUri)) {
    result.addWarning('GOOGLE_OAUTH', 
      'Google OAuth partially configured. Calendar/Gmail features may not work.');
  }

  return result;
};

/**
 * Validate environment and exit if invalid
 * Call this at server startup
 */
export const validateEnvOrExit = () => {
  const result = validateEnv();

  // Log warnings
  for (const warning of result.warnings) {
    logger.warn(`⚠️  ${warning.variable}: ${warning.message}`);
  }

  // Log errors and exit if invalid
  if (!result.valid) {
    logger.error('❌ Environment validation failed:');
    for (const error of result.errors) {
      logger.error(`   • ${error.variable}: ${error.message}`);
    }
    logger.error('');
    logger.error('Please check your .env file and ensure all required variables are set.');
    logger.error('See backend/env.example for reference.');
    process.exit(1);
  }

  logger.info('✅ Environment validation passed');
  return result;
};

/**
 * Get a summary of the current configuration (for logging)
 * Hides sensitive values
 */
export const getConfigSummary = () => {
  const mask = (value) => {
    if (!value) return '(not set)';
    if (value.length <= 8) return '****';
    return value.substring(0, 4) + '...' + value.substring(value.length - 4);
  };

  return {
    server: {
      port: process.env.PORT || '8000',
      env: process.env.NODE_ENV || 'development'
    },
    supabase: {
      url: process.env.SUPABASE_URL ? '✅ configured' : '❌ missing',
      auth: process.env.SUPABASE_JWT_SECRET ? '✅ configured' : '❌ missing'
    },
    ai: {
      gemini: process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing',
      huggingface: process.env.HUGGINGFACE_API_KEY ? '✅ configured' : '⚠️ optional'
    },
    googleOAuth: {
      status: process.env.GOOGLE_CLIENT_ID ? '✅ configured' : '⚠️ optional',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || '(not set)'
    },
    security: {
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
  };
};

export default {
  validateEnv,
  validateEnvOrExit,
  getConfigSummary,
  ENV_CONFIG
};

