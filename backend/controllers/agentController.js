/**
 * Agent Controller
 * Handles HTTP requests for AI agent functionality
 */

import { AIAgent } from '../services/agentService.js';
import { supabase, supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Send a message to the AI agent
 * POST /api/agent/message
 */
export const sendAgentMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Get conversation history if conversationId provided
    let conversationHistory = [];
    let currentConversationId = conversationId;

    if (conversationId) {
      // Verify user owns this conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (!conversation) {
        return res.status(403).json({ 
          success: false, 
          error: 'Unauthorized access to conversation' 
        });
      }

      // Get message history
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
      
      conversationHistory = messages || [];
    } else {
      // Create new conversation
      const title = message.length > 40 
        ? message.substring(0, 40) + '...' 
        : message;
      
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert([{
          user_id: userId,
          title,
          is_favourite: false,
          is_archived: false
        }])
        .select()
        .single();

      if (convError) {
        throw new Error(`Failed to create conversation: ${convError.message}`);
      }

      currentConversationId = newConversation.id;
    }

    // Create AI agent and process request
    const agent = new AIAgent(userId, currentConversationId);
    const result = await agent.processRequest(message.trim(), conversationHistory);

    // Save user message to database
    const userMessageData = {
      conversation_id: currentConversationId,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };

    await supabaseAdmin
      .from('messages')
      .insert([userMessageData]);

    // Save AI response to database (unless waiting for approval)
    if (!result.requiresApproval) {
      const aiMessageData = {
        conversation_id: currentConversationId,
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toISOString()
      };

      await supabaseAdmin
        .from('messages')
        .insert([aiMessageData]);
    }

    // Return response
    res.json({
      success: true,
      conversationId: currentConversationId,
      response: result,
      userMessage: userMessageData
    });

  } catch (error) {
    logger.error('Agent message error', { 
      error: error.message, 
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message'
    });
  }
};

/**
 * Approve pending actions
 * POST /api/agent/actions/approve
 */
export const approveActions = async (req, res) => {
  try {
    const { actionIds, conversationId } = req.body;
    const userId = req.user.id;

    if (!actionIds || !Array.isArray(actionIds) || actionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'actionIds array is required'
      });
    }

    // Mark actions as approved using admin client to bypass RLS
    const { error: updateError } = await supabaseAdmin
      .from('agent_actions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .in('id', actionIds)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to approve actions: ${updateError.message}`);
    }

    // Execute approved actions
    const agent = new AIAgent(userId, conversationId);
    const results = await agent.executeApprovedActions(actionIds);

    // Check if all actions succeeded
    const allSucceeded = results.every(r => r.success);
    const successCount = results.filter(r => r.success).length;

    // Generate summary message
    const summaryParts = results.map(r => {
      if (r.success) {
        return `✅ ${r.description || 'Action'}: ${r.result.summary}`;
      } else {
        return `❌ ${r.description || 'Action'}: ${r.error}`;
      }
    });

    const summaryMessage = `**Actions Executed:**\n\n${summaryParts.join('\n\n')}\n\n${allSucceeded ? '🎉 All actions completed successfully!' : `⚠️ ${successCount}/${results.length} actions completed.`}`;

    // Save summary message to conversation
    if (conversationId) {
      await supabaseAdmin
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          role: 'assistant',
          content: summaryMessage,
          timestamp: new Date().toISOString()
        }]);
    }

    res.json({
      success: true,
      results: results,
      summary: summaryMessage,
      successCount: successCount,
      totalCount: results.length
    });

  } catch (error) {
    logger.error('Approve actions error', { 
      error: error.message,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve actions'
    });
  }
};

/**
 * Reject/cancel pending actions
 * POST /api/agent/actions/reject
 */
export const rejectActions = async (req, res) => {
  try {
    const { actionIds } = req.body;
    const userId = req.user.id;

    if (!actionIds || !Array.isArray(actionIds)) {
      return res.status(400).json({
        success: false,
        error: 'actionIds array is required'
      });
    }

    // Update actions to cancelled status using admin client to bypass RLS
    const { error } = await supabaseAdmin
      .from('agent_actions')
      .update({ status: 'cancelled' })
      .in('id', actionIds)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Actions cancelled',
      cancelledCount: actionIds.length
    });

  } catch (error) {
    logger.error('Reject actions error', { 
      error: error.message,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject actions'
    });
  }
};

/**
 * Get user's actions history
 * GET /api/agent/actions
 */
export const getActions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('agent_actions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: actions, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      actions: actions || [],
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error('Get actions error', { 
      error: error.message,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch actions'
    });
  }
};

/**
 * Get action statistics
 * GET /api/agent/stats
 */
export const getAgentStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .rpc('get_user_action_stats', { user_uuid: userId });

    if (error) throw error;

    const stats = data[0] || {
      total_actions: 0,
      pending_actions: 0,
      executed_actions: 0,
      failed_actions: 0,
      avg_execution_time_ms: 0
    };

    res.json({
      success: true,
      stats: {
        totalActions: parseInt(stats.total_actions) || 0,
        pendingActions: parseInt(stats.pending_actions) || 0,
        executedActions: parseInt(stats.executed_actions) || 0,
        failedActions: parseInt(stats.failed_actions) || 0,
        avgExecutionTimeMs: parseFloat(stats.avg_execution_time_ms) || 0
      }
    });

  } catch (error) {
    logger.error('Get agent stats error', { 
      error: error.message,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics'
    });
  }
};

/**
 * Get/Update user agent preferences
 * GET/PUT /api/agent/preferences
 */
export const getAgentPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: preferences, error } = await supabase
      .from('user_agent_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Create default preferences if none exist
    if (!preferences) {
      const { data: newPrefs, error: createError } = await supabase
        .from('user_agent_preferences')
        .insert([{ user_id: userId }])
        .select()
        .single();

      if (createError) throw createError;

      return res.json({
        success: true,
        preferences: newPrefs
      });
    }

    res.json({
      success: true,
      preferences: preferences
    });

  } catch (error) {
    logger.error('Get agent preferences error', { 
      error: error.message,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch preferences'
    });
  }
};

export const updateAgentPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const { data: preferences, error } = await supabase
      .from('user_agent_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      preferences: preferences,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    logger.error('Update agent preferences error', { 
      error: error.message,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update preferences'
    });
  }
};

