import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

/**
 * Authentication Middleware
 * Validates JWT token from Supabase and extracts user information
 */
export const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
        message: 'Please login to access this resource'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token using Supabase JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    
    if (!jwtSecret) {
      logger.error('SUPABASE_JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Decode and verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Extract user information from JWT payload
    // Supabase JWT structure: { sub: user_id, email, ... }
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'authenticated',
      ...decoded
    };

    // Proceed to next middleware/route handler
    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message, path: req.originalUrl });

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Invalid authentication token. Please login again.'
      });
    }

    // Generic authentication error
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Unable to authenticate. Please login again.'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Adds user info if token is provided, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.SUPABASE_JWT_SECRET;
      
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role || 'authenticated',
          ...decoded
        };
      }
    }
    
    // Continue regardless of auth status
    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Please login to access this resource'
      });
    }

    const userRole = req.user.role || 'authenticated';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

export default authenticateUser;



