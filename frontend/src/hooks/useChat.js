import { useState, useCallback, useRef, useEffect } from 'react';
import apiService from '../services/apiService';

export const useChat = (showToast) => {
  // Core chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  // Typing effect state
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [displayedContent, setDisplayedContent] = useState({});
  const [typingTimeoutIds, setTypingTimeoutIds] = useState([]);
  const [generationTimeoutId, setGenerationTimeoutId] = useState(null);
  
  // Message editing state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  
  // Action approval state
  const [pendingActions, setPendingActions] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Refs
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Typing effect function with auto-scroll
  const typeMessage = useCallback((messageId, content) => {
    setTypingMessageId(messageId);
    setDisplayedContent(prev => ({ ...prev, [messageId]: '' }));
    
    let currentIndex = 0;
    const typingSpeed = 8;
    const timeoutIds = [];
    let lastScrollIndex = 0;
    
    const typeChar = () => {
      if (currentIndex < content.length) {
        setDisplayedContent(prev => ({
          ...prev,
          [messageId]: content.slice(0, currentIndex + 1)
        }));
        
        // Auto-scroll every 50 characters or on newlines
        const currentChar = content[currentIndex];
        if (currentIndex - lastScrollIndex >= 50 || currentChar === '\n') {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          lastScrollIndex = currentIndex;
        }
        
        currentIndex++;
        const timeoutId = setTimeout(typeChar, typingSpeed);
        timeoutIds.push(timeoutId);
        setTypingTimeoutIds(prev => [...prev, timeoutId]);
      } else {
        setTypingMessageId(null);
        setDisplayedContent(prev => ({ ...prev, [messageId]: content }));
        setTypingTimeoutIds(prev => prev.filter(id => !timeoutIds.includes(id)));
        setIsGenerating(false);
        // Final scroll to bottom
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };
    
    typeChar();
  }, []);

  // Stop generation
  const stopGeneration = useCallback(() => {
    if (generationTimeoutId) {
      clearTimeout(generationTimeoutId);
      setGenerationTimeoutId(null);
    }
    
    typingTimeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
    setTypingTimeoutIds([]);
    
    setIsGenerating(false);
    setIsLoading(false);
    setTypingMessageId(null);
    showToast('Generation stopped', 'error');
  }, [generationTimeoutId, typingTimeoutIds, showToast]);

  // Submit message
  const handleSubmit = useCallback(async (e, onConversationsUpdate) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || isGenerating) return;

    const messageText = input.trim();
    const messageFiles = uploadedFiles.length > 0 ? [...uploadedFiles] : null;
    
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);
    setIsGenerating(true);

    const userMessageId = Date.now().toString();
    const userMessage = { 
      id: userMessageId,
      role: 'user', 
      content: messageText, 
      timestamp: new Date().toISOString(),
      reaction: null,
      isEdited: false,
      files: messageFiles
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await apiService.sendMessage(messageText, currentConversationId, messageFiles);
      
      if (response.success) {
        const isNewConversation = !currentConversationId && response.conversationId;
        if (isNewConversation) {
          setCurrentConversationId(response.conversationId);
        }

        // Reload conversations
        if (onConversationsUpdate) {
          onConversationsUpdate();
        }

        const requiresApproval = response.requiresApproval || (response.aiResponse && response.aiResponse.requiresApproval);
        const pendingActionsData = response.pendingActions || (response.aiResponse && response.aiResponse.pendingActions);
        const content = response.content || (response.aiResponse && response.aiResponse.content);
        const timestamp = response.timestamp || (response.aiResponse && response.aiResponse.timestamp) || new Date().toISOString();

        if (requiresApproval && pendingActionsData) {
          const botResponseId = Date.now().toString();
          const botMessage = {
            id: botResponseId,
            role: 'assistant',
            content: content,
            timestamp: timestamp,
            reaction: null,
            isEdited: false
          };

          setMessages(prev => [...prev, botMessage]);
          setPendingActions(pendingActionsData);
          setShowApprovalModal(true);
          showToast('🔔 Action approval required');
        } else {
          const botResponseId = Date.now().toString();
          const botMessage = {
            id: botResponseId,
            role: 'assistant',
            content: content,
            timestamp: timestamp,
            reaction: null,
            isEdited: false
          };

          setMessages(prev => [...prev, botMessage]);
          
          setTimeout(() => {
            typeMessage(botResponseId, content);
          }, 100);

          const executedActions = response.executedActions || [];
          if (executedActions.length > 0) {
            const calendarBookings = executedActions.filter(
              action => action.tool === 'book_calendar_event' && action.status === 'executed'
            );
            
            if (calendarBookings.length > 0) {
              calendarBookings.forEach(booking => {
                if (booking.result?.data?.htmlLink) {
                  showToast('✅ Calendar event booked! View it on Google Calendar', 'success');
                }
              });
            }
          }
          
          showToast('Response generated successfully!');
        }
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }

    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      const errorResponse = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting to our AI systems right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        reaction: null,
        isEdited: false
      };
      
      setMessages(prev => [...prev, errorResponse]);
      showToast('Failed to get AI response. Please try again.', 'error');
      
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setGenerationTimeoutId(null);
      setTypingMessageId(null);
      typingTimeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
      setTypingTimeoutIds([]);
    }
  }, [input, isLoading, isGenerating, uploadedFiles, currentConversationId, typeMessage, showToast, typingTimeoutIds]);

  // Regenerate response - resends the user message to get a new AI response
  const regenerateResponse = useCallback(async (messageId) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;
    
    // Find the user message before this assistant message
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex === -1) return;
    
    const userMessage = messages[userMessageIndex];
    // Keep messages up to and including the user message
    const messagesUpToUser = messages.slice(0, messageIndex);
    setMessages(messagesUpToUser);
    
    // Clear displayed content for the old message
    setDisplayedContent(prev => {
      const newContent = { ...prev };
      delete newContent[messageId];
      return newContent;
    });
    
    setIsLoading(true);
    setIsGenerating(true);
    showToast('Regenerating response...');

    try {
      // Resend the user message to get a new response
      const response = await apiService.sendMessage(userMessage.content, currentConversationId, userMessage.files);
      
      if (response.success) {
        const content = response.content || (response.aiResponse && response.aiResponse.content);
        const timestamp = response.timestamp || (response.aiResponse && response.aiResponse.timestamp) || new Date().toISOString();
        
        const newBotResponseId = Date.now().toString();
        const botMessage = {
          id: newBotResponseId,
          role: 'assistant',
          content: content,
          timestamp: timestamp,
          reaction: null,
          isEdited: false
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        setTimeout(() => {
          typeMessage(newBotResponseId, content);
        }, 100);
        
        showToast('Response regenerated successfully!');
      } else {
        throw new Error(response.error || 'Failed to regenerate response');
      }

    } catch (error) {
      console.error("Failed to regenerate response:", error);
      showToast('Failed to regenerate response. Please try again.', 'error');
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setGenerationTimeoutId(null);
      setTypingMessageId(null);
    }
  }, [messages, currentConversationId, typeMessage, showToast]);

  // Approve actions
  const handleApproveActions = useCallback(async (actionIds) => {
    try {
      setShowApprovalModal(false);
      setIsLoading(true);
      showToast('Executing approved actions...', 'info');

      const response = await apiService.request('/api/agent/actions/approve', {
        method: 'POST',
        body: JSON.stringify({
          actionIds: actionIds,
          conversationId: currentConversationId
        })
      });

      if (response.success) {
        const botResponseId = Date.now().toString();
        const results = response.results || [];
        
        let enhancedContent = `**Actions Executed:**\n\n`;
        
        results.forEach((result, index) => {
          if (result.success) {
            enhancedContent += `✅ **${result.description || 'Action'}**\n`;
            if (result.result?.data?.htmlLink) {
              enhancedContent += `📅 [View on Google Calendar](${result.result.data.htmlLink})\n`;
            }
            if (result.result?.summary) {
              enhancedContent += `${result.result.summary}\n`;
            }
          } else {
            enhancedContent += `❌ **${result.description || 'Action'}**: ${result.error}\n`;
          }
          if (index < results.length - 1) enhancedContent += `\n`;
        });
        
        enhancedContent += `\n---\n\n`;
        if (response.successCount === response.totalCount) {
          enhancedContent += `🎉 **All actions completed successfully!**`;
        } else {
          enhancedContent += `⚠️ ${response.successCount}/${response.totalCount} actions completed.`;
        }
        
        const botMessage = {
          id: botResponseId,
          role: 'assistant',
          content: enhancedContent,
          timestamp: new Date().toISOString(),
          reaction: null,
          isEdited: false,
          isExecutionConfirmation: true,
          executionResults: results
        };

        setMessages(prev => [...prev, botMessage]);
        setPendingActions([]);
        showToast('✅ Actions executed successfully!');
      } else {
        throw new Error(response.error || 'Failed to execute actions');
      }
    } catch (error) {
      console.error('Failed to approve actions:', error);
      showToast('Failed to execute actions. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, showToast]);

  // Reject actions
  const handleRejectActions = useCallback(async () => {
    try {
      setShowApprovalModal(false);
      
      if (pendingActions.length > 0) {
        const actionIds = pendingActions.map(a => a.actionId);
        await apiService.request('/api/agent/actions/reject', {
          method: 'POST',
          body: JSON.stringify({ actionIds })
        });
      }

      setPendingActions([]);
      showToast('Actions cancelled');

      const botResponseId = Date.now().toString();
      const botMessage = {
        id: botResponseId,
        role: 'assistant',
        content: 'Actions cancelled. How else can I help you?',
        timestamp: new Date().toISOString(),
        reaction: null,
        isEdited: false
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to reject actions:', error);
      showToast('Failed to cancel actions', 'error');
    }
  }, [pendingActions, showToast]);

  // Message reactions
  const handleMessageReaction = useCallback((messageId, reaction) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reaction: msg.reaction === reaction ? null : reaction }
        : msg
    ));
    showToast(`Message ${reaction === 'like' ? 'liked' : 'disliked'}!`);
  }, [showToast]);

  // Message editing
  const handleMessageEdit = useCallback((messageId) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditingText(message.content);
    }
  }, [messages]);

  const saveMessageEdit = useCallback(async () => {
    if (!editingText.trim() || isLoading || isGenerating) return;
    
    const messageIndex = messages.findIndex(msg => msg.id === editingMessageId);
    if (messageIndex === -1) return;
    
    const editedMessage = messages[messageIndex];
    
    // Update the user message with edited content
    const updatedUserMessage = { 
      ...editedMessage, 
      content: editingText.trim(), 
      isEdited: true 
    };
    
    // Remove all messages after the edited message (including any assistant response)
    const messagesBeforeEdit = messages.slice(0, messageIndex);
    setMessages([...messagesBeforeEdit, updatedUserMessage]);
    
    setEditingMessageId(null);
    setEditingText('');
    setIsLoading(true);
    setIsGenerating(true);
    showToast('Resending edited message...');

    try {
      // Send the edited message to get a new response
      const response = await apiService.sendMessage(editingText.trim(), currentConversationId, editedMessage.files);
      
      if (response.success) {
        const content = response.content || (response.aiResponse && response.aiResponse.content);
        const timestamp = response.timestamp || (response.aiResponse && response.aiResponse.timestamp) || new Date().toISOString();
        
        const newBotResponseId = Date.now().toString();
        const botMessage = {
          id: newBotResponseId,
          role: 'assistant',
          content: content,
          timestamp: timestamp,
          reaction: null,
          isEdited: false
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        setTimeout(() => {
          typeMessage(newBotResponseId, content);
        }, 100);
        
        showToast('Response generated for edited message!');
      } else {
        throw new Error(response.error || 'Failed to get response');
      }

    } catch (error) {
      console.error("Failed to get response for edited message:", error);
      showToast('Failed to get response. Please try again.', 'error');
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setGenerationTimeoutId(null);
      setTypingMessageId(null);
    }
  }, [editingMessageId, editingText, messages, currentConversationId, isLoading, isGenerating, typeMessage, showToast]);

  const cancelMessageEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingText('');
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    });
  }, [showToast]);

  // File handling
  const handleFileSelect = useCallback((files) => {
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    showToast(`${files.length} file(s) uploaded successfully!`);
  }, [showToast]);

  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Scroll handling
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // New chat
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput('');
    setUploadedFiles([]);
    inputRef.current?.focus();
  }, []);

  // Load conversation
  const loadConversation = useCallback((conversation) => {
    setCurrentConversationId(conversation.id);
    setMessages(conversation.messages || []);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return {
    // State
    messages,
    input,
    setInput,
    isLoading,
    isGenerating,
    currentConversationId,
    typingMessageId,
    displayedContent,
    editingMessageId,
    editingText,
    setEditingText,
    pendingActions,
    showApprovalModal,
    setShowApprovalModal,
    uploadedFiles,
    
    // Refs
    chatEndRef,
    inputRef,
    chatContainerRef,
    
    // Actions
    handleSubmit,
    regenerateResponse,
    handleApproveActions,
    handleRejectActions,
    handleMessageReaction,
    handleMessageEdit,
    saveMessageEdit,
    cancelMessageEdit,
    copyToClipboard,
    handleFileSelect,
    removeFile,
    scrollToBottom,
    handleNewChat,
    loadConversation,
    stopGeneration
  };
};

export default useChat;

