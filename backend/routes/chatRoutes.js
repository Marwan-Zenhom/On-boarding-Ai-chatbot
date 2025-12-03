import express from 'express';
import { sendMessage, regenerateResponse, getConversations, updateConversation, deleteConversation } from '../controllers/chatController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { validateMessage, validateConversationUpdate } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(authenticateUser);

// Chat routes (all protected with validation)
router.post('/message', validateMessage, sendMessage);
router.post('/regenerate', regenerateResponse);
router.get('/conversations', getConversations);
router.put('/conversations/:id', validateConversationUpdate, updateConversation);
router.delete('/conversations/:id', deleteConversation);

export default router; 