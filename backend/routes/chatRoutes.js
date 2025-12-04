/**
 * Chat Routes
 * All routes protected by authentication
 * Input validation applied to POST/PUT endpoints
 */

import express from 'express';
import { 
  sendMessage, 
  regenerateResponse, 
  getConversations, 
  updateConversation, 
  deleteConversation 
} from '../controllers/chatController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { validateBody, validateParams } from '../middleware/validationMiddleware.js';
import { 
  sendMessageSchema, 
  regenerateSchema, 
  updateConversationSchema,
  conversationIdSchema 
} from '../validators/chatValidators.js';

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(authenticateUser);

// Send a new message
router.post(
  '/message', 
  validateBody(sendMessageSchema), 
  sendMessage
);

// Regenerate AI response
router.post(
  '/regenerate', 
  validateBody(regenerateSchema), 
  regenerateResponse
);

// Get all conversations
router.get('/conversations', getConversations);

// Update a conversation
router.put(
  '/conversations/:id', 
  validateParams(conversationIdSchema),
  validateBody(updateConversationSchema), 
  updateConversation
);

// Delete a conversation
router.delete(
  '/conversations/:id', 
  validateParams(conversationIdSchema),
  deleteConversation
);

export default router;
