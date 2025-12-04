/**
 * Constants Tests
 * Verifies that all required constants are defined and have correct types
 */

import { describe, it, expect } from '@jest/globals';
import {
  AI_MODELS,
  RATE_LIMITS,
  REQUEST_LIMITS,
  AGENT_CONFIG,
  CONVERSATION_CONFIG,
  HTTP_STATUS,
  ERROR_CODES,
  SUCCESS_MESSAGES
} from '../../constants/index.js';

describe('Constants', () => {
  describe('AI_MODELS', () => {
    it('should have DEFAULT model defined', () => {
      expect(AI_MODELS.DEFAULT).toBeDefined();
      expect(typeof AI_MODELS.DEFAULT).toBe('string');
    });

    it('should have GEMINI_FLASH model', () => {
      expect(AI_MODELS.GEMINI_FLASH).toBeDefined();
    });
  });

  describe('RATE_LIMITS', () => {
    it('should have GENERAL limits', () => {
      expect(RATE_LIMITS.GENERAL.WINDOW_MS).toBeGreaterThan(0);
      expect(RATE_LIMITS.GENERAL.MAX_REQUESTS).toBeGreaterThan(0);
    });

    it('should have AUTH limits', () => {
      expect(RATE_LIMITS.AUTH.WINDOW_MS).toBeGreaterThan(0);
      expect(RATE_LIMITS.AUTH.MAX_REQUESTS).toBeGreaterThan(0);
    });

    it('should have stricter AUTH limits than GENERAL', () => {
      expect(RATE_LIMITS.AUTH.MAX_REQUESTS).toBeLessThan(RATE_LIMITS.GENERAL.MAX_REQUESTS);
    });
  });

  describe('REQUEST_LIMITS', () => {
    it('should have message length limits', () => {
      expect(REQUEST_LIMITS.MAX_MESSAGE_LENGTH).toBeGreaterThan(0);
      expect(REQUEST_LIMITS.MIN_MESSAGE_LENGTH).toBeGreaterThanOrEqual(1);
      expect(REQUEST_LIMITS.MAX_MESSAGE_LENGTH).toBeGreaterThan(REQUEST_LIMITS.MIN_MESSAGE_LENGTH);
    });

    it('should have file limits', () => {
      expect(REQUEST_LIMITS.MAX_FILE_SIZE).toBeGreaterThan(0);
      expect(REQUEST_LIMITS.MAX_FILES_PER_MESSAGE).toBeGreaterThan(0);
    });

    it('should have conversation history limit', () => {
      expect(REQUEST_LIMITS.MAX_CONVERSATION_HISTORY).toBeGreaterThan(0);
    });
  });

  describe('AGENT_CONFIG', () => {
    it('should have max iterations defined', () => {
      expect(AGENT_CONFIG.MAX_ITERATIONS).toBeGreaterThan(0);
      expect(AGENT_CONFIG.MAX_ITERATIONS).toBeLessThanOrEqual(20); // Reasonable limit
    });

    it('should have confidence threshold', () => {
      expect(AGENT_CONFIG.CONFIDENCE_THRESHOLD).toBeGreaterThan(0);
      expect(AGENT_CONFIG.CONFIDENCE_THRESHOLD).toBeLessThanOrEqual(1);
    });
  });

  describe('CONVERSATION_CONFIG', () => {
    it('should have title length config', () => {
      expect(CONVERSATION_CONFIG.DEFAULT_TITLE_LENGTH).toBeGreaterThan(0);
      expect(typeof CONVERSATION_CONFIG.TITLE_SUFFIX).toBe('string');
    });
  });

  describe('HTTP_STATUS', () => {
    it('should have standard status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });
  });

  describe('ERROR_CODES', () => {
    it('should have authentication error codes', () => {
      expect(ERROR_CODES.AUTH_TOKEN_MISSING).toMatch(/^AUTH_/);
      expect(ERROR_CODES.AUTH_TOKEN_INVALID).toMatch(/^AUTH_/);
      expect(ERROR_CODES.AUTH_TOKEN_EXPIRED).toMatch(/^AUTH_/);
    });

    it('should have validation error codes', () => {
      expect(ERROR_CODES.VALIDATION_FAILED).toMatch(/^VAL_/);
      expect(ERROR_CODES.VALIDATION_MESSAGE_REQUIRED).toMatch(/^VAL_/);
    });

    it('should have resource error codes', () => {
      expect(ERROR_CODES.RESOURCE_NOT_FOUND).toMatch(/^RES_/);
      expect(ERROR_CODES.RESOURCE_ACCESS_DENIED).toMatch(/^RES_/);
    });

    it('should have database error codes', () => {
      expect(ERROR_CODES.DATABASE_ERROR).toMatch(/^DB_/);
    });

    it('should have AI error codes', () => {
      expect(ERROR_CODES.AI_GENERATION_FAILED).toMatch(/^AI_/);
    });

    it('should have unique error codes', () => {
      const codes = Object.values(ERROR_CODES);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('SUCCESS_MESSAGES', () => {
    it('should have conversation messages', () => {
      expect(typeof SUCCESS_MESSAGES.CONVERSATION_CREATED).toBe('string');
      expect(typeof SUCCESS_MESSAGES.CONVERSATION_UPDATED).toBe('string');
      expect(typeof SUCCESS_MESSAGES.CONVERSATION_DELETED).toBe('string');
    });

    it('should have message-related success messages', () => {
      expect(typeof SUCCESS_MESSAGES.MESSAGE_SENT).toBe('string');
      expect(typeof SUCCESS_MESSAGES.MESSAGE_REGENERATED).toBe('string');
    });
  });
});

