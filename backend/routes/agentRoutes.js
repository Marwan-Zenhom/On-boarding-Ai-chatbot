/**
 * Agent Routes
 * Handles AI agent functionality endpoints
 * All routes protected by authentication with input validation
 */

import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { 
  sendMessageSchema, 
  approveActionsSchema, 
  rejectActionsSchema 
} from '../validators/chatValidators.js';
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
router.post(
  '/message', 
  validateBody(sendMessageSchema), 
  sendAgentMessage
);

// Action management with validation
router.post(
  '/actions/approve', 
  validateBody(approveActionsSchema), 
  approveActions
);

router.post(
  '/actions/reject', 
  validateBody(rejectActionsSchema), 
  rejectActions
);

router.get('/actions', getActions);

// Statistics and preferences
router.get('/stats', getAgentStats);
router.get('/preferences', getAgentPreferences);
router.put('/preferences', updateAgentPreferences);

export default router;
