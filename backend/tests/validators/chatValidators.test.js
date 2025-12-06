/**
 * Chat Validators Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  sendMessageSchema,
  regenerateSchema,
  updateConversationSchema,
  conversationIdSchema,
  approveActionsSchema,
  rejectActionsSchema
} from '../../validators/chatValidators.js';

describe('Chat Validators', () => {
  describe('sendMessageSchema', () => {
    it('should pass with valid message', () => {
      const { error, value } = sendMessageSchema.validate({
        message: 'Hello, how are you?'
      });

      expect(error).toBeUndefined();
      expect(value.message).toBe('Hello, how are you?');
    });

    it('should trim message whitespace', () => {
      const { error, value } = sendMessageSchema.validate({
        message: '  Hello  '
      });

      expect(error).toBeUndefined();
      expect(value.message).toBe('Hello');
    });

    it('should fail when message is empty', () => {
      const { error } = sendMessageSchema.validate({
        message: ''
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('empty');
    });

    it('should fail when message is missing', () => {
      const { error } = sendMessageSchema.validate({});

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('required');
    });

    it('should fail when message exceeds max length', () => {
      const { error } = sendMessageSchema.validate({
        message: 'a'.repeat(10001)
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('10000');
    });

    it('should pass with valid conversationId', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const { error, value } = sendMessageSchema.validate({
        message: 'Hello',
        conversationId: validUUID
      });

      expect(error).toBeUndefined();
      expect(value.conversationId).toBe(validUUID);
    });

    it('should fail with invalid conversationId format', () => {
      const { error } = sendMessageSchema.validate({
        message: 'Hello',
        conversationId: 'not-a-uuid'
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Invalid conversation ID');
    });

    it('should allow null conversationId', () => {
      const { error } = sendMessageSchema.validate({
        message: 'Hello',
        conversationId: null
      });

      expect(error).toBeUndefined();
    });

    it('should allow files to be null', () => {
      const { error } = sendMessageSchema.validate({
        message: 'Hello',
        files: null
      });

      expect(error).toBeUndefined();
    });

    it('should strip unknown fields', () => {
      const { error, value } = sendMessageSchema.validate({
        message: 'Hello',
        unknownField: 'should be removed'
      }, { stripUnknown: true });

      expect(error).toBeUndefined();
      expect(value.unknownField).toBeUndefined();
    });
  });

  describe('regenerateSchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('should pass with valid data', () => {
      const { error, value } = regenerateSchema.validate({
        conversationId: validUUID,
        messageId: validUUID
      });

      expect(error).toBeUndefined();
      expect(value.conversationId).toBe(validUUID);
      expect(value.messageId).toBe(validUUID);
    });

    it('should fail when conversationId is missing', () => {
      const { error } = regenerateSchema.validate({
        messageId: validUUID
      });

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('conversationId');
    });

    it('should fail when messageId is missing', () => {
      const { error } = regenerateSchema.validate({
        conversationId: validUUID
      });

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('messageId');
    });
  });

  describe('updateConversationSchema', () => {
    it('should pass with title update', () => {
      const { error, value } = updateConversationSchema.validate({
        title: 'New Title'
      });

      expect(error).toBeUndefined();
      expect(value.title).toBe('New Title');
    });

    it('should pass with is_favourite update', () => {
      const { error, value } = updateConversationSchema.validate({
        is_favourite: true
      });

      expect(error).toBeUndefined();
      expect(value.is_favourite).toBe(true);
    });

    it('should pass with is_archived update', () => {
      const { error, value } = updateConversationSchema.validate({
        is_archived: true
      });

      expect(error).toBeUndefined();
      expect(value.is_archived).toBe(true);
    });

    it('should fail when no fields provided', () => {
      const { error } = updateConversationSchema.validate({});

      expect(error).toBeDefined();
      expect(error.details[0].message.toLowerCase()).toContain('at least one');
    });

    it('should fail when title exceeds max length', () => {
      const { error } = updateConversationSchema.validate({
        title: 'a'.repeat(101)
      });

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('100');
    });

    it('should trim title whitespace', () => {
      const { error, value } = updateConversationSchema.validate({
        title: '  New Title  '
      });

      expect(error).toBeUndefined();
      expect(value.title).toBe('New Title');
    });
  });

  describe('conversationIdSchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('should pass with valid UUID', () => {
      const { error, value } = conversationIdSchema.validate({
        id: validUUID
      });

      expect(error).toBeUndefined();
      expect(value.id).toBe(validUUID);
    });

    it('should fail with invalid UUID', () => {
      const { error } = conversationIdSchema.validate({
        id: 'invalid'
      });

      expect(error).toBeDefined();
    });

    it('should fail when id is missing', () => {
      const { error } = conversationIdSchema.validate({});

      expect(error).toBeDefined();
    });
  });

  describe('approveActionsSchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('should pass with valid actionIds array', () => {
      const { error, value } = approveActionsSchema.validate({
        actionIds: [validUUID, validUUID]
      });

      expect(error).toBeUndefined();
      expect(value.actionIds).toHaveLength(2);
    });

    it('should fail when actionIds is empty', () => {
      const { error } = approveActionsSchema.validate({
        actionIds: []
      });

      expect(error).toBeDefined();
      expect(error.details[0].message.toLowerCase()).toContain('at least one');
    });

    it('should fail when actionIds is missing', () => {
      const { error } = approveActionsSchema.validate({});

      expect(error).toBeDefined();
    });
  });

  describe('rejectActionsSchema', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('should pass with valid actionIds array', () => {
      const { error, value } = rejectActionsSchema.validate({
        actionIds: [validUUID]
      });

      expect(error).toBeUndefined();
      expect(value.actionIds).toHaveLength(1);
    });
  });
});

