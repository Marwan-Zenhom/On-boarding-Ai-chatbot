import express from 'express';
import { sendMessage, regenerateResponse, getConversations, updateConversation, deleteConversation } from '../controllers/chatController.js';

const router = express.Router();

// Chat routes
router.post('/message', sendMessage);
router.post('/regenerate', regenerateResponse);
router.get('/conversations', getConversations);
router.put('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

export default router; 