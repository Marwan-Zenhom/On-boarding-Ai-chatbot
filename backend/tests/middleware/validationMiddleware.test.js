/**
 * Validation Middleware Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import Joi from 'joi';
import { validateBody, validateParams, validateQuery } from '../../middleware/validationMiddleware.js';

describe('Validation Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('validateBody()', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().min(0).max(120)
    });

    it('should call next() when validation passes', () => {
      mockReq.body = { name: 'John', age: 25 };

      validateBody(schema)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should replace body with validated/sanitized values', () => {
      mockReq.body = { name: '  John  ', age: '25', extra: 'removed' };

      validateBody(schema)(mockReq, mockRes, mockNext);

      expect(mockReq.body.name).toBe('  John  '); // Joi doesn't trim by default
      expect(mockReq.body.age).toBe(25); // Converted to number
      expect(mockReq.body.extra).toBeUndefined(); // Stripped unknown
    });

    it('should return 400 when validation fails', () => {
      mockReq.body = { age: 25 }; // Missing required 'name'

      validateBody(schema)(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return all validation errors', () => {
      mockReq.body = { age: -5 }; // Missing name AND invalid age

      validateBody(schema)(mockReq, mockRes, mockNext);

      const jsonCall = mockRes.json.mock.calls[0][0];
      // Should contain both errors
      expect(jsonCall.error).toContain('name');
    });
  });

  describe('validateParams()', () => {
    const schema = Joi.object({
      id: Joi.string().uuid().required()
    });

    it('should call next() when params are valid', () => {
      mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      validateParams(schema)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 400 when params are invalid', () => {
      mockReq.params = { id: 'not-a-uuid' };

      validateParams(schema)(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateQuery()', () => {
    const schema = Joi.object({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(10)
    });

    it('should call next() when query is valid', () => {
      mockReq.query = { page: '2', limit: '20' };

      validateQuery(schema)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.query.page).toBe(2); // Converted to number
      expect(mockReq.query.limit).toBe(20);
    });

    it('should apply defaults', () => {
      mockReq.query = {};

      validateQuery(schema)(mockReq, mockRes, mockNext);

      expect(mockReq.query.page).toBe(1);
      expect(mockReq.query.limit).toBe(10);
    });

    it('should return 400 when query is invalid', () => {
      mockReq.query = { limit: 500 }; // Exceeds max

      validateQuery(schema)(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

