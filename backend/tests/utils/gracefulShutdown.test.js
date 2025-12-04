/**
 * Graceful Shutdown Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock logger
jest.unstable_mockModule('../../config/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Graceful Shutdown Utility', () => {
  let shutdownMiddleware, isServerShuttingDown, getActiveConnectionCount;

  beforeEach(async () => {
    jest.resetModules();
    
    // Dynamic import
    const module = await import('../../utils/gracefulShutdown.js');
    shutdownMiddleware = module.shutdownMiddleware;
    isServerShuttingDown = module.isServerShuttingDown;
    getActiveConnectionCount = module.getActiveConnectionCount;
  });

  describe('isServerShuttingDown()', () => {
    it('should return false initially', () => {
      expect(isServerShuttingDown()).toBe(false);
    });
  });

  describe('getActiveConnectionCount()', () => {
    it('should return 0 when no connections', () => {
      expect(getActiveConnectionCount()).toBe(0);
    });
  });

  describe('shutdownMiddleware()', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should call next() when not shutting down', () => {
      shutdownMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});

