import express from 'express';
import { sendMessage, regenerateResponse, getConversations, updateConversation, deleteConversation } from '../controllers/chatController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(authenticateUser);

// Chat routes (all protected)
router.post('/message', sendMessage);
router.post('/regenerate', regenerateResponse);
router.get('/conversations', getConversations);
router.put('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

export default router; 