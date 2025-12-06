/**
 * Health Check Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the database module before importing healthCheck
jest.unstable_mockModule('../../config/database.js', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

// Mock logger
jest.unstable_mockModule('../../config/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Health Check Utility', () => {
  let performHealthCheck, livenessCheck, readinessCheck;

  beforeEach(async () => {
    // Reset env
    process.env.NODE_ENV = 'test';
    process.env.GEMINI_API_KEY = 'AItest123';
    process.env.GOOGLE_CLIENT_ID = 'test.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:8000/api/google-auth/callback';
    process.env.HUGGINGFACE_API_KEY = 'hf_test';

    // Dynamic import
    const module = await import('../../utils/healthCheck.js');
    performHealthCheck = module.performHealthCheck;
    livenessCheck = module.livenessCheck;
    readinessCheck = module.readinessCheck;
  });

  describe('livenessCheck()', () => {
    it('should return alive status', () => {
      const result = livenessCheck();

      expect(result.status).toBe('alive');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('performHealthCheck()', () => {
    it('should return basic health info when not detailed', async () => {
      const result = await performHealthCheck(false);

      expect(result.status).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.environment).toBe('test');
      expect(result.uptime).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should include services when detailed', async () => {
      const result = await performHealthCheck(true);

      expect(result.services).toBeDefined();
      expect(result.services.database).toBeDefined();
      expect(result.services.gemini).toBeDefined();
      expect(result.services.googleOAuth).toBeDefined();
      expect(result.services.huggingFace).toBeDefined();
    });

    it('should include memory info when detailed', async () => {
      const result = await performHealthCheck(true);

      expect(result.memory).toBeDefined();
      expect(result.memory.heapUsed).toBeDefined();
      expect(result.memory.heapTotal).toBeDefined();
    });

    it('should include node version when detailed', async () => {
      const result = await performHealthCheck(true);

      expect(result.nodeVersion).toBeDefined();
      expect(result.nodeVersion).toMatch(/^v\d+/);
    });
  });

  describe('uptime in response', () => {
    it('should include uptime in health check response', async () => {
      const result = await performHealthCheck(false);
      
      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('string');
      expect(result.uptimeMs).toBeDefined();
      expect(typeof result.uptimeMs).toBe('number');
    });
  });
});

