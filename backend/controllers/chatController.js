import { generateResponse, generateStreamResponse } from '../services/geminiService.js';
import { supabase } from '../config/database.js';

const FIXED_USER_ID = process.env.FIXED_USER_ID || '550e8400-e29b-41d4-a716-446655440000';

// POST /api/chat/message
export const sendMessage = async (req, res) => {
  try {
    const { message, conversationId, files } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Get conversation history for context
    let conversationHistory = [];
    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
      
      conversationHistory = messages || [];
    }

    // Generate AI response using Gemini
    const aiResponse = await generateResponse(message.trim(), conversationHistory);

    // Create conversation if it doesn't exist
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const title = message.length > 30 
        ? message.substring(0, 30) + '...' 
        : message;
      
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert([{
          user_id: FIXED_USER_ID,
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

    // Save both user message and AI response to database
    const messagesToInsert = [
      {
        conversation_id: currentConversationId,
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
        files: files || null
      },
      {
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        files: null
      }
    ];

    const { error: messageError } = await supabase
      .from('messages')
      .insert(messagesToInsert);

    if (messageError) {
      throw new Error(`Failed to save messages: ${messageError.message}`);
    }

    // Return response
    res.json({
      success: true,
      conversationId: currentConversationId,
      userMessage: {
        role: 'user',
        content: message.trim(),
        timestamp: messagesToInsert[0].timestamp,
        files: files || null
      },
      aiResponse: {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: messagesToInsert[1].timestamp,
        model: aiResponse.model
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process message'
    });
  }
};

// POST /api/chat/regenerate
export const regenerateResponse = async (req, res) => {
  try {
    const { conversationId, messageId } = req.body;

    if (!conversationId || !messageId) {
      return res.status(400).json({ 
        success: false, 
        error: 'conversationId and messageId are required' 
      });
    }

    // Get conversation history up to the message being regenerated
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (!messages || messages.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    // Find the user message that needs a new response
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message not found' 
      });
    }

    const userMessage = messages[messageIndex];
    if (userMessage.role !== 'user') {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only regenerate responses to user messages' 
      });
    }

    // Get conversation history up to that point
    const conversationHistory = messages
      .slice(0, messageIndex)
      .map(msg => ({ role: msg.role, content: msg.content }));

    // Generate new AI response
    const aiResponse = await generateResponse(userMessage.content, conversationHistory);

    // Delete old assistant response if it exists
    const oldAssistantMessage = messages[messageIndex + 1];
    if (oldAssistantMessage && oldAssistantMessage.role === 'assistant') {
      await supabase
        .from('messages')
        .delete()
        .eq('id', oldAssistantMessage.id);
    }

    // Save new AI response
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        files: null
      }])
      .select()
      .single();

    if (messageError) {
      throw new Error(`Failed to save regenerated message: ${messageError.message}`);
    }

    res.json({
      success: true,
      aiResponse: {
        id: newMessage.id,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: newMessage.timestamp,
        model: aiResponse.model
      }
    });

  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to regenerate response'
    });
  }
};

// GET /api/chat/conversations
export const getConversations = async (req, res) => {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (*)
      `)
      .eq('user_id', FIXED_USER_ID)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    res.json({
      success: true,
      conversations: conversations || []
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch conversations'
    });
  }
};

// PUT /api/chat/conversations/:id
export const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', FIXED_USER_ID);

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Conversation updated successfully'
    });

  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update conversation'
    });
  }
};

// DELETE /api/chat/conversations/:id
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete messages first (due to foreign key constraint)
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id);
    
    // Then delete conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', FIXED_USER_ID);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete conversation'
    });
  }
}; 