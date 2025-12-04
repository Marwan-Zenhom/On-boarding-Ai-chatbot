/**
 * API Response Utilities Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError
} from '../../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_CODES } from '../../constants/index.js';

describe('API Response Utilities', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('successResponse()', () => {
    it('should return 200 status with success: true', () => {
      successResponse(mockRes, { data: 'test' });

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: 'test'
      });
    });

    it('should include message when provided', () => {
      successResponse(mockRes, { data: 'test' }, 'Operation successful');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: 'test',
        message: 'Operation successful'
      });
    });

    it('should allow custom status code', () => {
      successResponse(mockRes, {}, null, 202);

      expect(mockRes.status).toHaveBeenCalledWith(202);
    });
  });

  describe('createdResponse()', () => {
    it('should return 201 status', () => {
      createdResponse(mockRes, { id: '123' });

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        id: '123'
      });
    });
  });

  describe('errorResponse()', () => {
    it('should return error with code', () => {
      errorResponse(mockRes, 'Something went wrong', ERROR_CODES.INTERNAL_ERROR);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong',
        code: ERROR_CODES.INTERNAL_ERROR
      });
    });

    it('should include details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      errorResponse(mockRes, 'Error', ERROR_CODES.DATABASE_ERROR, 500, { query: 'SELECT *' });

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { query: 'SELECT *' }
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT include details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      errorResponse(mockRes, 'Error', ERROR_CODES.DATABASE_ERROR, 500, { query: 'SELECT *' });

      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('validationError()', () => {
    it('should return 400 with validation error code', () => {
      validationError(mockRes, 'Invalid input');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid input',
          code: ERROR_CODES.VALIDATION_FAILED
        })
      );
    });
  });

  describe('unauthorizedError()', () => {
    it('should return 401 status', () => {
      unauthorizedError(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: ERROR_CODES.AUTH_TOKEN_MISSING
        })
      );
    });

    it('should use custom message and code', () => {
      unauthorizedError(mockRes, 'Token expired', ERROR_CODES.AUTH_TOKEN_EXPIRED);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token expired',
          code: ERROR_CODES.AUTH_TOKEN_EXPIRED
        })
      );
    });
  });

  describe('forbiddenError()', () => {
    it('should return 403 status', () => {
      forbiddenError(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
    });
  });

  describe('notFoundError()', () => {
    it('should return 404 status', () => {
      notFoundError(mockRes, 'Conversation not found');

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Conversation not found'
        })
      );
    });
  });

  describe('internalError()', () => {
    it('should return 500 status with default message', () => {
      internalError(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          code: ERROR_CODES.INTERNAL_ERROR
        })
      );
    });
  });
});

