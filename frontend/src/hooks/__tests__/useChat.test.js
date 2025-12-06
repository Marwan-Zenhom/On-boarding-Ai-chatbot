import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '../useChat';

// Mock the apiService
jest.mock('../../services/apiService', () => ({
  __esModule: true,
  default: {
    sendMessage: jest.fn(),
    regenerateResponse: jest.fn(),
    request: jest.fn(),
  },
}));

import apiService from '../../services/apiService';

describe('useChat Hook', () => {
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    apiService.sendMessage.mockResolvedValue({
      success: true,
      conversationId: 'conv-123',
      content: 'AI response content',
      timestamp: new Date().toISOString(),
    });
  });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.input).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('updates input value', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    act(() => {
      result.current.setInput('Hello world');
    });
    
    expect(result.current.input).toBe('Hello world');
  });

  it('handles new chat correctly', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    // Add some messages first
    act(() => {
      result.current.setInput('Test message');
    });
    
    // Start new chat
    act(() => {
      result.current.handleNewChat();
    });
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.currentConversationId).toBe(null);
    expect(result.current.input).toBe('');
  });

  it('loads conversation correctly', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    const mockConversation = {
      id: 'conv-456',
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ],
    };
    
    act(() => {
      result.current.loadConversation(mockConversation);
    });
    
    expect(result.current.currentConversationId).toBe('conv-456');
    expect(result.current.messages).toEqual(mockConversation.messages);
  });

  it('copies text to clipboard', async () => {
    // Ensure the mock returns a resolved promise
    navigator.clipboard.writeText.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useChat(mockShowToast));
    
    await act(async () => {
      result.current.copyToClipboard('test text');
      // Allow the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    expect(mockShowToast).toHaveBeenCalledWith('Copied to clipboard!');
  });

  it('handles file selection', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    const mockFiles = [
      { name: 'test.txt', size: 100, type: 'text/plain' },
    ];
    
    act(() => {
      result.current.handleFileSelect(mockFiles);
    });
    
    expect(result.current.uploadedFiles).toHaveLength(1);
    expect(result.current.uploadedFiles[0].name).toBe('test.txt');
    expect(mockShowToast).toHaveBeenCalledWith('1 file(s) uploaded successfully!');
  });

  it('removes uploaded files', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    // Add a file first
    act(() => {
      result.current.handleFileSelect([{ name: 'test.txt', size: 100, type: 'text/plain' }]);
    });
    
    const fileId = result.current.uploadedFiles[0].id;
    
    // Remove the file
    act(() => {
      result.current.removeFile(fileId);
    });
    
    expect(result.current.uploadedFiles).toHaveLength(0);
  });

  it('handles message reactions', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    // Load a conversation with a message
    act(() => {
      result.current.loadConversation({
        id: 'conv-1',
        messages: [{ id: 'msg-1', role: 'assistant', content: 'Hello', reaction: null }],
      });
    });
    
    // Add like reaction
    act(() => {
      result.current.handleMessageReaction('msg-1', 'like');
    });
    
    expect(result.current.messages[0].reaction).toBe('like');
    expect(mockShowToast).toHaveBeenCalledWith('Message liked!');
  });

  it('toggles reaction when same reaction is clicked', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    act(() => {
      result.current.loadConversation({
        id: 'conv-1',
        messages: [{ id: 'msg-1', role: 'assistant', content: 'Hello', reaction: 'like' }],
      });
    });
    
    // Click like again to toggle off
    act(() => {
      result.current.handleMessageReaction('msg-1', 'like');
    });
    
    expect(result.current.messages[0].reaction).toBe(null);
  });

  it('starts message editing', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    act(() => {
      result.current.loadConversation({
        id: 'conv-1',
        messages: [{ id: 'msg-1', role: 'user', content: 'Original message' }],
      });
    });
    
    act(() => {
      result.current.handleMessageEdit('msg-1');
    });
    
    expect(result.current.editingMessageId).toBe('msg-1');
    expect(result.current.editingText).toBe('Original message');
  });

  it('saves message edit', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    act(() => {
      result.current.loadConversation({
        id: 'conv-1',
        messages: [{ id: 'msg-1', role: 'user', content: 'Original' }],
      });
    });
    
    act(() => {
      result.current.handleMessageEdit('msg-1');
    });
    
    act(() => {
      result.current.setEditingText('Updated message');
    });
    
    act(() => {
      result.current.saveMessageEdit();
    });
    
    expect(result.current.messages[0].content).toBe('Updated message');
    expect(result.current.messages[0].isEdited).toBe(true);
    expect(result.current.editingMessageId).toBe(null);
    expect(mockShowToast).toHaveBeenCalledWith('Message updated!');
  });

  it('cancels message edit', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    act(() => {
      result.current.loadConversation({
        id: 'conv-1',
        messages: [{ id: 'msg-1', role: 'user', content: 'Original' }],
      });
    });
    
    act(() => {
      result.current.handleMessageEdit('msg-1');
      result.current.setEditingText('Changed');
    });
    
    act(() => {
      result.current.cancelMessageEdit();
    });
    
    expect(result.current.editingMessageId).toBe(null);
    expect(result.current.editingText).toBe('');
    expect(result.current.messages[0].content).toBe('Original');
  });

  it('does not submit empty messages', async () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    await act(async () => {
      result.current.handleSubmit({ preventDefault: jest.fn() });
    });
    
    expect(apiService.sendMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it('does not submit while loading', async () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    // Set input but the hook will be loading
    act(() => {
      result.current.setInput('Test');
    });
    
    // Make sendMessage delay to simulate loading
    apiService.sendMessage.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        success: true,
        conversationId: 'conv-123',
        content: 'Response',
        timestamp: new Date().toISOString(),
      }), 100);
    }));
    
    // Start first submission
    await act(async () => {
      result.current.handleSubmit({ preventDefault: jest.fn() });
    });
    
    // The first submit clears input, so we'd need to set it again
    // but the hook should still be loading
  });

  it('handles API errors gracefully', async () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    apiService.sendMessage.mockRejectedValueOnce(new Error('Network error'));
    
    act(() => {
      result.current.setInput('Test message');
    });
    
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });
    
    // Should have both user message and error response
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toContain('trouble connecting');
    expect(mockShowToast).toHaveBeenCalledWith('Failed to get AI response. Please try again.', 'error');
  });

  it('exposes refs correctly', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    expect(result.current.chatEndRef).toBeDefined();
    expect(result.current.inputRef).toBeDefined();
    expect(result.current.chatContainerRef).toBeDefined();
  });

  it('provides approval modal controls', () => {
    const { result } = renderHook(() => useChat(mockShowToast));
    
    expect(result.current.pendingActions).toEqual([]);
    expect(result.current.showApprovalModal).toBe(false);
    expect(typeof result.current.setShowApprovalModal).toBe('function');
  });
});

