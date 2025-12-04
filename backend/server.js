import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import logger from './config/logger.js';
import { validateEnvOrExit } from './utils/envValidator.js';
import { performHealthCheck, livenessCheck, readinessCheck } from './utils/healthCheck.js';
import { initGracefulShutdown, shutdownMiddleware } from './utils/gracefulShutdown.js';

// Load environment variables
dotenv.config();

// Validate environment variables (exits if invalid)
if (process.env.NODE_ENV !== 'test') {
  validateEnvOrExit();
}

const app = express();
const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Security: Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Shutdown middleware - reject requests during shutdown
app.use(shutdownMiddleware);

// Security: Helmet with enhanced options
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
}));

// Security: CORS with specific origins
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging: Morgan with Winston stream
app.use(morgan('combined', { stream: logger.stream }));

// Security: Limit request body size
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Routes (auth routes get stricter rate limiting)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/google-auth', googleAuthRoutes);

// ============================================================================
// Health Check Endpoints
// ============================================================================

/**
 * GET /api/health
 * Comprehensive health check - returns detailed status of all services
 * Query params:
 *   ?detailed=true - Include service-level details
 */
app.get('/api/health', async (req, res) => {
  try {
    const detailed = req.query.detailed === 'true';
    const health = await performHealthCheck(detailed);
    
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      ...health
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

/**
 * GET /api/health/live
 * Kubernetes liveness probe - is the server running?
 */
app.get('/api/health/live', (req, res) => {
  const status = livenessCheck();
  res.status(200).json(status);
});

/**
 * GET /api/health/ready
 * Kubernetes readiness probe - is the server ready to accept requests?
 */
app.get('/api/health/ready', async (req, res) => {
  try {
    const status = await readinessCheck();
    const statusCode = status.status === 'ready' ? 200 : 503;
    res.status(statusCode).json(status);
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message
    });
  }
});

// ============================================================================
// Error Handling
// ============================================================================

// Error handling middleware
app.use((err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.userId || 'anonymous',
  });
  
  res.status(err.status || 500).json({
    success: false, 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    code: 'SRV_9001'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    code: 'RES_3001'
  });
});

// ============================================================================
// Server Startup
// ============================================================================

const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info('🚀 Onboarding Chat Backend Started');
      logger.info('='.repeat(50));
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Frontend URL: ${FRONTEND_URL}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${process.env.SUPABASE_URL ? 'Connected ✅' : 'Not configured ❌'}`);
      logger.info(`Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Not configured ❌'}`);
      logger.info(`Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured ✅' : 'Not configured ⚠️'}`);
      logger.info(`AI Agent: Enabled ✅`);
      logger.info(`Graceful Shutdown: Enabled ✅`);
      logger.info('='.repeat(50));
      logger.info('Health endpoints:');
      logger.info(`  GET /api/health          - Full health check`);
      logger.info(`  GET /api/health?detailed=true - Detailed check`);
      logger.info(`  GET /api/health/live     - Liveness probe`);
      logger.info(`  GET /api/health/ready    - Readiness probe`);
      logger.info('='.repeat(50));
    });

    // Initialize graceful shutdown handlers
    initGracefulShutdown(server);

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();

export default app;
