/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of the server
 * - Stops accepting new connections
 * - Waits for existing requests to complete
 * - Closes database connections
 * - Exits cleanly
 */

import logger from '../config/logger.js';

// Track active connections
let activeConnections = new Set();
let isShuttingDown = false;
let server = null;

// Shutdown timeout (30 seconds)
const SHUTDOWN_TIMEOUT = 30000;

/**
 * Track a new connection
 */
export const trackConnection = (socket) => {
  activeConnections.add(socket);
  
  socket.on('close', () => {
    activeConnections.delete(socket);
  });
};

/**
 * Initialize graceful shutdown for an HTTP server
 * @param {http.Server} httpServer - The HTTP server instance
 */
export const initGracefulShutdown = (httpServer) => {
  server = httpServer;

  // Track all connections
  server.on('connection', trackConnection);

  // Handle termination signals
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { 
      error: error.message, 
      stack: error.stack 
    });
    handleShutdown('uncaughtException', 1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { 
      reason: reason?.message || reason,
      stack: reason?.stack
    });
    // Don't exit for unhandled rejections, just log
  });

  logger.info('Graceful shutdown handlers initialized');
};

/**
 * Handle shutdown process
 * @param {string} signal - The signal that triggered shutdown
 * @param {number} exitCode - Exit code (default: 0)
 */
const handleShutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal');
    return;
  }

  isShuttingDown = true;
  
  logger.info('');
  logger.info('='.repeat(50));
  logger.info(`🛑 Graceful shutdown initiated (${signal})`);
  logger.info('='.repeat(50));
  logger.info(`Active connections: ${activeConnections.size}`);

  // Set a timeout for forced shutdown
  const forceShutdownTimer = setTimeout(() => {
    logger.error('Forced shutdown - timeout exceeded');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // Step 1: Stop accepting new connections
    if (server) {
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            logger.error('Error closing server', { error: err.message });
          } else {
            logger.info('✅ Server stopped accepting new connections');
          }
          resolve();
        });
      });
    }

    // Step 2: Close existing connections gracefully
    if (activeConnections.size > 0) {
      logger.info(`Waiting for ${activeConnections.size} connection(s) to close...`);
      
      // Give connections time to complete naturally
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Force close remaining connections
      for (const socket of activeConnections) {
        socket.destroy();
      }
      
      logger.info('✅ All connections closed');
    }

    // Step 3: Clean up resources
    await cleanupResources();

    // Step 4: Final cleanup
    clearTimeout(forceShutdownTimer);
    
    logger.info('='.repeat(50));
    logger.info('👋 Shutdown complete. Goodbye!');
    logger.info('='.repeat(50));
    
    process.exit(exitCode);

  } catch (error) {
    logger.error('Error during shutdown', { 
      error: error.message, 
      stack: error.stack 
    });
    clearTimeout(forceShutdownTimer);
    process.exit(1);
  }
};

/**
 * Clean up resources before shutdown
 */
const cleanupResources = async () => {
  try {
    // Close database connections
    // Note: Supabase client doesn't require explicit cleanup
    // but we log for visibility
    logger.info('✅ Database connections cleaned up');

    // Clear any intervals or timeouts
    // Add any cleanup logic here as needed

    // Flush logs
    await new Promise((resolve) => setTimeout(resolve, 100));
    
  } catch (error) {
    logger.error('Error cleaning up resources', { error: error.message });
  }
};

/**
 * Check if server is shutting down
 * @returns {boolean}
 */
export const isServerShuttingDown = () => isShuttingDown;

/**
 * Get active connection count
 * @returns {number}
 */
export const getActiveConnectionCount = () => activeConnections.size;

/**
 * Middleware to reject requests during shutdown
 */
export const shutdownMiddleware = (req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close');
    return res.status(503).json({
      success: false,
      error: 'Server is shutting down',
      code: 'SRV_9002'
    });
  }
  next();
};

export default {
  initGracefulShutdown,
  isServerShuttingDown,
  getActiveConnectionCount,
  shutdownMiddleware
};

