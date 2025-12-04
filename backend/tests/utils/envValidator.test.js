/**
 * Environment Validator Tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Store original env
const originalEnv = { ...process.env };

describe('Environment Validator', () => {
  let validateEnv;
  
  beforeEach(async () => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    
    // Set minimum required env vars for tests
    process.env.NODE_ENV = 'test';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'a'.repeat(150);
    process.env.SUPABASE_JWT_SECRET = 'a'.repeat(40);
    process.env.GEMINI_API_KEY = 'AItest123456789012345';
    
    // Dynamic import to get fresh module
    const module = await import('../../utils/envValidator.js');
    validateEnv = module.validateEnv;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  describe('validateEnv()', () => {
    it('should pass with all required variables set correctly', async () => {
      const result = validateEnv();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;
      
      const result = validateEnv();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.variable === 'SUPABASE_URL')).toBe(true);
    });

    it('should fail when GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      
      const result = validateEnv();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.variable === 'GEMINI_API_KEY')).toBe(true);
    });

    it('should fail when SUPABASE_JWT_SECRET is too short', async () => {
      process.env.SUPABASE_JWT_SECRET = 'short';
      
      const result = validateEnv();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.variable === 'SUPABASE_JWT_SECRET')).toBe(true);
    });

    it('should validate SUPABASE_URL format', async () => {
      process.env.SUPABASE_URL = 'invalid-url';
      
      const result = validateEnv();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.variable === 'SUPABASE_URL')).toBe(true);
    });

    it('should set default values for optional variables', async () => {
      delete process.env.PORT;
      delete process.env.FRONTEND_URL;
      
      validateEnv();
      
      expect(process.env.PORT).toBe('8000');
      expect(process.env.FRONTEND_URL).toBe('http://localhost:3000');
    });

    it('should validate NODE_ENV values', async () => {
      process.env.NODE_ENV = 'invalid';
      
      const result = validateEnv();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.variable === 'NODE_ENV')).toBe(true);
    });

    it('should accept valid NODE_ENV values', async () => {
      const validEnvs = ['development', 'production', 'test'];
      
      for (const env of validEnvs) {
        process.env.NODE_ENV = env;
        const result = validateEnv();
        expect(result.errors.filter(e => e.variable === 'NODE_ENV')).toHaveLength(0);
      }
    });
  });

  describe('Google OAuth validation', () => {
    it('should require GOOGLE_CLIENT_SECRET when GOOGLE_CLIENT_ID is set', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-id.apps.googleusercontent.com';
      delete process.env.GOOGLE_CLIENT_SECRET;
      
      const result = validateEnv();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.variable === 'GOOGLE_CLIENT_SECRET')).toBe(true);
    });

    it('should require GOOGLE_REDIRECT_URI when GOOGLE_CLIENT_ID is set', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-id.apps.googleusercontent.com';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
      delete process.env.GOOGLE_REDIRECT_URI;
      
      const result = validateEnv();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.variable === 'GOOGLE_REDIRECT_URI')).toBe(true);
    });

    it('should validate GOOGLE_REDIRECT_URI format', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-id.apps.googleusercontent.com';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
      process.env.GOOGLE_REDIRECT_URI = 'http://localhost:8000/wrong-path';
      
      const result = validateEnv();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.variable === 'GOOGLE_REDIRECT_URI')).toBe(true);
    });

    it('should pass with complete Google OAuth config', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-id.apps.googleusercontent.com';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
      process.env.GOOGLE_REDIRECT_URI = 'http://localhost:8000/api/google-auth/callback';
      
      const result = validateEnv();
      
      expect(result.errors.filter(e => e.variable.startsWith('GOOGLE'))).toHaveLength(0);
    });
  });

  describe('Warnings', () => {
    it('should warn when HUGGINGFACE_API_KEY is not set', async () => {
      delete process.env.HUGGINGFACE_API_KEY;
      
      const result = validateEnv();
      
      expect(result.warnings.some(w => w.variable === 'HUGGINGFACE_API_KEY')).toBe(true);
    });
  });
});

