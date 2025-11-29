/**
 * Agent Routes
 * Handles AI agent functionality endpoints
 */

import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { validateMessage } from '../middleware/validationMiddleware.js';
import {
  sendAgentMessage,
  approveActions,
  rejectActions,
  getActions,
  getAgentStats,
  getAgentPreferences,
  updateAgentPreferences
} from '../controllers/agentController.js';

const router = express.Router();

// All agent routes require authentication
router.use(authenticateUser);

// Send message to AI agent
router.post('/message', validateMessage, sendAgentMessage);

// Action management
router.post('/actions/approve', approveActions);
router.post('/actions/reject', rejectActions);
router.get('/actions', getActions);

// Statistics and preferences
router.get('/stats', getAgentStats);
router.get('/preferences', getAgentPreferences);
router.put('/preferences', updateAgentPreferences);

export default router;







