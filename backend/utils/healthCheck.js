/**
 * Health Check Utility
 * Provides comprehensive health status of all services
 */

import { supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';

// Track server start time
const startTime = Date.now();

/**
 * Format uptime into human-readable string
 */
const formatUptime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Check database connectivity
 */
const checkDatabase = async () => {
  const start = Date.now();
  try {
    // Simple query to test connection
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('count')
      .limit(1);

    if (error) throw error;

    return {
      status: 'healthy',
      latency: `${Date.now() - start}ms`
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      latency: `${Date.now() - start}ms`
    };
  }
};

/**
 * Check Gemini API availability
 */
const checkGeminiAPI = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      status: 'unconfigured',
      error: 'API key not set'
    };
  }

  // We don't actually call the API to avoid quota usage
  // Just verify the key is configured
  return {
    status: 'configured',
    note: 'API key present (not tested to preserve quota)'
  };
};

/**
 * Check Google OAuth configuration
 */
const checkGoogleOAuth = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return {
      status: 'unconfigured',
      configured: {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        redirectUri: !!redirectUri
      }
    };
  }

  return {
    status: 'configured',
    redirectUri: redirectUri
  };
};

/**
 * Check Hugging Face configuration
 */
const checkHuggingFace = () => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  return {
    status: apiKey ? 'configured' : 'unconfigured',
    note: apiKey ? 'Embeddings enabled' : 'RAG functionality limited'
  };
};

/**
 * Get memory usage statistics
 */
const getMemoryUsage = () => {
  const used = process.memoryUsage();
  return {
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(used.external / 1024 / 1024)}MB`,
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`
  };
};

/**
 * Perform comprehensive health check
 * @param {boolean} detailed - Include detailed service checks
 * @returns {Object} Health status
 */
export const performHealthCheck = async (detailed = false) => {
  const uptime = Date.now() - startTime;
  
  // Basic health info
  const health = {
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: formatUptime(uptime),
    uptimeMs: uptime,
    timestamp: new Date().toISOString()
  };

  if (!detailed) {
    // Quick health check - just return basic status
    return health;
  }

  // Detailed health check
  const [dbHealth, geminiHealth] = await Promise.all([
    checkDatabase(),
    checkGeminiAPI()
  ]);

  const googleOAuthHealth = checkGoogleOAuth();
  const huggingFaceHealth = checkHuggingFace();

  // Determine overall status
  const services = {
    database: dbHealth,
    gemini: geminiHealth,
    googleOAuth: googleOAuthHealth,
    huggingFace: huggingFaceHealth
  };

  // Overall status is unhealthy if critical services are down
  if (dbHealth.status === 'unhealthy') {
    health.status = 'unhealthy';
  } else if (geminiHealth.status === 'unconfigured') {
    health.status = 'degraded';
  }

  return {
    ...health,
    services,
    memory: getMemoryUsage(),
    nodeVersion: process.version,
    pid: process.pid
  };
};

/**
 * Liveness probe - is the server running?
 */
export const livenessCheck = () => ({
  status: 'alive',
  timestamp: new Date().toISOString()
});

/**
 * Readiness probe - is the server ready to accept requests?
 */
export const readinessCheck = async () => {
  try {
    const dbHealth = await checkDatabase();
    
    if (dbHealth.status === 'unhealthy') {
      return {
        status: 'not_ready',
        reason: 'Database connection failed',
        timestamp: new Date().toISOString()
      };
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'not_ready',
      reason: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export default {
  performHealthCheck,
  livenessCheck,
  readinessCheck,
  formatUptime
};

