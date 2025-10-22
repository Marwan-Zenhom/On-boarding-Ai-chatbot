import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Plus, ArrowUp, User, Bot, Sun, Moon, 
  Edit3, Trash2, Search, Copy, Mic, MicOff, 
  Heart, Archive, Sidebar, LogOut,
  ThumbsUp, ThumbsDown, RotateCcw, X, Check, Upload, 
  FileText, Paperclip, MoreHorizontal, Square
} from 'lucide-react';
import apiService from './services/apiService';

// --- Custom Hooks ---
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
};





// --- File Upload Component ---
const FileUpload = ({ onFileSelect, acceptedTypes = ".pdf,.docx,.txt,.csv,.json,.png,.jpg,.jpeg" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    onFileSelect(files);
  };

  return (
    <div
      className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <Upload className="icon" />
      <div className="upload-text">
        <span className="upload-primary">Drop files here or click to upload</span>
        <span className="upload-secondary">Supports PDF, DOCX, TXT, CSV, JSON, Images</span>
      </div>
    </div>
  );
};

// --- Archived Conversations Modal ---
const ArchivedConversationsModal = ({ isOpen, onClose, conversations, onViewChat, onUnarchive, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content archived-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Archived Chats</h2>
          <button onClick={onClose} className="modal-close">
            <X className="icon" />
          </button>
        </div>
        <div className="archived-modal-content">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <Archive className="empty-icon" />
              <p>No archived conversations</p>
              <span>Conversations you archive will appear here</span>
            </div>
          ) : (
            <div className="archived-table">
              <div className="archived-table-header">
                <div className="archived-table-col-name">Name</div>
                <div className="archived-table-col-date">Date created</div>
                <div className="archived-table-col-actions"></div>
              </div>
              <div className="archived-table-body">
                {conversations.map(conv => (
                  <div key={conv.id} className="archived-table-row">
                    <div className="archived-table-col-name">
                      <button
                        onClick={() => onViewChat(conv)}
                        className="archived-chat-name"
                        title="Click to view conversation"
                      >
                        {conv.title}
                      </button>
                    </div>
                    <div className="archived-table-col-date">
                      {new Date(conv.createdAt).toLocaleDateString()}
                    </div>
                    <div className="archived-table-col-actions">
                      <button
                        onClick={() => onUnarchive(conv.id)}
                        className="archived-icon-btn"
                        title="Unarchive conversation"
                      >
                        <Archive className="icon-sm" />
                      </button>
                      <button
                        onClick={() => onDelete(conv.id)}
                        className="archived-icon-btn danger"
                        title="Delete conversation"
                      >
                        <Trash2 className="icon-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Conversation Dropdown Component ---
const ConversationDropdown = ({ conversation, isOpen, onClose, onFavourite, onArchive, onDelete, onRename }) => {
  if (!isOpen) return null;

  return (
    <div className="conversation-dropdown">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename();
          onClose();
        }}
        className="dropdown-item"
      >
        <Edit3 className="icon-sm" />
        <span>Rename</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavourite();
          onClose();
        }}
        className="dropdown-item"
      >
        <Heart className="icon-sm" />
        <span>{conversation.isFavourite ? 'Remove from favourites' : 'Add to favourites'}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onArchive();
          onClose();
        }}
        className="dropdown-item"
      >
        <Archive className="icon-sm" />
        <span>Archive</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="dropdown-item danger"
      >
        <Trash2 className="icon-sm" />
        <span>Delete</span>
      </button>
    </div>
  );
};

// --- Utility Components ---
const SkeletonLoader = () => (
  <div className="skeleton-container">
    <div className="skeleton skeleton-avatar"></div>
    <div className="skeleton-content">
      <div className="skeleton skeleton-line long"></div>
      <div className="skeleton skeleton-line medium"></div>
      <div className="skeleton skeleton-line short"></div>
    </div>
  </div>
);

const Toast = ({ message, type, onClose }) => (
  <div className={`toast toast-${type}`}>
    <span>{message}</span>
    <button onClick={onClose} className="toast-close">
      <X className="icon-sm" />
    </button>
  </div>
);

const MessageActions = ({ message, onCopy, onEdit, onReact, onRegenerate }) => (
  <div className="message-actions">
    <button className="action-btn" onClick={() => onCopy(message.content)} title="Copy message">
      <Copy className="icon-sm" />
    </button>
    {message.role === 'assistant' && (
      <>
        <button className="action-btn" onClick={() => onReact(message.id, 'like')} title="Good response">
          <ThumbsUp className="icon-sm" />
        </button>
        <button className="action-btn" onClick={() => onReact(message.id, 'dislike')} title="Poor response">
          <ThumbsDown className="icon-sm" />
        </button>
        <button className="action-btn" onClick={() => onRegenerate(message.id)} title="Regenerate">
          <RotateCcw className="icon-sm" />
        </button>
      </>
    )}
    {message.role === 'user' && (
      <button className="action-btn" onClick={() => onEdit(message.id)} title="Edit message">
        <Edit3 className="icon-sm" />
      </button>
    )}
  </div>
);

// --- Main App Component ---
function App({ user, onSignOut }) {
  // --- State Management ---
  const [pastConversations, setPastConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [multiRecognitions, setMultiRecognitions] = useState([]);
  const [speechLanguage, setSpeechLanguage] = useState(() => {
    // Try to match browser language with supported languages
    const browserLang = navigator.language || 'en-US';
    const supportedCodes = [
      'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 
      'pt-PT', 'nl-NL', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN', 'ar-SA'
    ];
    return supportedCodes.includes(browserLang) ? browserLang : 'en-US';
  });
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [displayedContent, setDisplayedContent] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [renamingConversationId, setRenamingConversationId] = useState(null);
  const [renamingText, setRenamingText] = useState('');
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [conversationFilter, setConversationFilter] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTimeoutId, setGenerationTimeoutId] = useState(null);
  const [typingTimeoutIds, setTypingTimeoutIds] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Load conversations on app start
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setConversationsLoading(true);
        const response = await apiService.getConversations();
        if (response.success) {
          setPastConversations(response.conversations);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setConversationsLoading(false);
      }
    };

    loadConversations();
  }, []);



  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Supported languages for speech recognition
  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'de-DE', name: 'German', flag: '🇩🇪' },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
    { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
    { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt-PT', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
    { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' }
  ];

  // --- Memoized Values ---
  const filteredConversations = useMemo(() => {
    let filtered = pastConversations.filter(conv => !conv.is_archived);
    
    if (conversationFilter === 'favourites') {
      filtered = filtered.filter(conv => conv.is_favourite);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.messages?.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered.sort((a, b) => {
      if (a.is_favourite && !b.is_favourite) return -1;
      if (!a.is_favourite && b.is_favourite) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [pastConversations, searchQuery, conversationFilter]);

  const archivedConversations = useMemo(() => {
    let archived = pastConversations.filter(conv => conv.is_archived);
    
    if (searchQuery) {
      archived = archived.filter(conv => 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.messages?.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return archived.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [pastConversations, searchQuery]);

  const groupConversationsByDate = (conversations) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: []
    };

    conversations.forEach(conv => {
      const convDate = new Date(conv.created_at);
      const convDateOnly = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());
      
      if (convDateOnly.getTime() === today.getTime()) {
        groups.today.push(conv);
      } else if (convDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conv);
      } else if (convDate >= lastWeek) {
        groups.lastWeek.push(conv);
      } else if (convDate >= lastMonth) {
        groups.lastMonth.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const conversationGroups = useMemo(() => groupConversationsByDate(filteredConversations), [filteredConversations]);

  // --- Effects ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (!mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isSidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.sidebar-toggle')) {
        setIsSidebarOpen(false);
      }
      if (openDropdownId && !event.target.closest('.conversation-dropdown') && !event.target.closest('.dropdown-toggle')) {
        setOpenDropdownId(null);
      }
      if (showLanguageSelector && !event.target.closest('.language-selector') && !event.target.closest('.language-toggle')) {
        setShowLanguageSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isSidebarOpen, openDropdownId, showLanguageSelector]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom && messages.length > 0);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  // --- Essential Callbacks ---
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (autoDetectLanguage) {
        // Create multiple recognition instances for auto-detection
        const primaryLanguages = ['en-US', 'de-DE', 'fr-FR', 'es-ES', 'it-IT'];
        const recognitionInstances = [];
        
        primaryLanguages.forEach(langCode => {
          const recognitionInstance = new SpeechRecognition();
          recognitionInstance.continuous = false;
          recognitionInstance.interimResults = true;
          recognitionInstance.lang = langCode;
          
          recognitionInstance.onresult = (event) => {
            let finalTranscript = '';
            let confidence = 0;
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                finalTranscript += result[0].transcript;
                confidence = result[0].confidence || 0;
              }
            }
            
            if (finalTranscript && confidence > 0.7) {
              // Stop all recognition instances
              recognitionInstances.forEach(rec => {
                try { rec.stop(); } catch (e) {}
              });
              
              const detectedLang = supportedLanguages.find(lang => lang.code === langCode);
              setDetectedLanguage(langCode);
              setSpeechLanguage(langCode);
              setInput(prev => prev + finalTranscript);
              setIsRecording(false);
              showToast(`Detected ${detectedLang?.name || langCode}: "${finalTranscript.substring(0, 30)}..."`, 'success');
            }
          };
          
          recognitionInstance.onerror = (event) => {
            if (event.error !== 'aborted' && event.error !== 'no-speech') {
              console.error(`Speech recognition error (${langCode}):`, event.error);
            }
          };
          
          recognitionInstances.push(recognitionInstance);
        });
        
        setMultiRecognitions(recognitionInstances);
      } else {
        // Single language recognition (manual selection)
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = speechLanguage;
        
        recognitionInstance.onstart = () => {
          setIsRecording(true);
          const selectedLanguage = supportedLanguages.find(lang => lang.code === speechLanguage);
          showToast(`Listening in ${selectedLanguage?.name || speechLanguage}... Speak now`, 'info');
        };
        
        recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setInput(prev => prev + finalTranscript);
          }
        };
        
        recognitionInstance.onend = () => {
          setIsRecording(false);
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          
          let errorMessage = 'Speech recognition error';
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Try again.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage = 'Network error. Check your connection.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          showToast(errorMessage, 'error');
        };
        
        setRecognition(recognitionInstance);
      }
    }
  }, [showToast, speechLanguage, supportedLanguages, autoDetectLanguage]);

  const typeMessage = useCallback((messageId, content) => {
    setTypingMessageId(messageId);
    setDisplayedContent(prev => ({ ...prev, [messageId]: '' }));
    
    let currentIndex = 0;
    const typingSpeed = 8;
    const timeoutIds = [];
    
    const typeChar = () => {
      if (currentIndex < content.length) {
        setDisplayedContent(prev => ({
          ...prev,
          [messageId]: content.slice(0, currentIndex + 1)
        }));
        currentIndex++;
        const timeoutId = setTimeout(typeChar, typingSpeed);
        timeoutIds.push(timeoutId);
        setTypingTimeoutIds(prev => [...prev, timeoutId]);
      } else {
        setTypingMessageId(null);
        setDisplayedContent(prev => ({ ...prev, [messageId]: content }));
        setTypingTimeoutIds(prev => prev.filter(id => !timeoutIds.includes(id)));
        setIsGenerating(false);
      }
    };
    
    typeChar();
  }, []);

  const regenerateResponse = useCallback(async (messageId) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;
    
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex === -1) return;
    
    const userMessage = messages[userMessageIndex];
    const messagesUpToUser = messages.slice(0, messageIndex);
    setMessages(messagesUpToUser);
    
    setDisplayedContent(prev => {
      const newContent = { ...prev };
      delete newContent[messageId];
      return newContent;
    });
    
    setIsLoading(true);
    setIsGenerating(true);
    showToast('Regenerating response...');

    try {
      // Call backend API to regenerate response
      const response = await apiService.regenerateResponse(currentConversationId, userMessage.id);
      
      if (response.success) {
        const newBotResponseId = Date.now().toString();
        const botMessage = {
          id: newBotResponseId,
          role: 'assistant',
          content: response.aiResponse.content,
          timestamp: response.aiResponse.timestamp,
          reaction: null,
          isEdited: false,
          model: response.aiResponse.model
        };
        
        const finalMessages = [...messagesUpToUser, botMessage];
        setMessages(finalMessages);
        
        setTimeout(() => {
          typeMessage(newBotResponseId, response.aiResponse.content);
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

  // --- Helper Functions ---
  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput('');
    setUploadedFiles([]);
    inputRef.current?.focus();
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };



  const handleConversationClick = (conversation) => {
    if (conversation.is_archived) {
      showToast('This conversation is archived. Unarchive it first to view.', 'error');
      return;
    }
    setCurrentConversationId(conversation.id);
    setMessages(conversation.messages || []);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
      if (!isSidebarOpen) {
        setIsSidebarHidden(false);
      }
    } else {
      setIsSidebarHidden(!isSidebarHidden);
      if (isSidebarHidden) {
        setIsSidebarCollapsed(false);
      }
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    });
  };

  const handleFileSelect = (files) => {
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setShowFileUpload(false);
    showToast(`${files.length} file(s) uploaded successfully!`);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageReaction = (messageId, reaction) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reaction: msg.reaction === reaction ? null : reaction }
        : msg
    ));
    showToast(`Message ${reaction === 'like' ? 'liked' : 'disliked'}!`);
  };

  const handleMessageEdit = (messageId) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditingText(message.content);
    }
  };

  const saveMessageEdit = () => {
    setMessages(prev => prev.map(msg => 
      msg.id === editingMessageId 
        ? { ...msg, content: editingText, isEdited: true }
        : msg
    ));
    setEditingMessageId(null);
    setEditingText('');
    showToast('Message updated!');
  };

  const toggleConversationFavourite = async (convId, e) => {
    e.stopPropagation();
    try {
      const conversation = pastConversations.find(c => c.id === convId);
      await apiService.updateConversation(convId, { is_favourite: !conversation.is_favourite });
      
      // Update local state
      setPastConversations(prev => prev.map(conv => 
        conv.id === convId 
          ? { ...conv, is_favourite: !conv.is_favourite }
          : conv
      ));
      
      showToast(conversation?.is_favourite ? 'Removed from favourites!' : 'Added to favourites!');
    } catch (error) {
      showToast('Failed to update favourite status', 'error');
    }
  };

  const archiveConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      const conversation = pastConversations.find(c => c.id === convId);
      await apiService.updateConversation(convId, { is_archived: !conversation.is_archived });
      
      // Update local state
      setPastConversations(prev => prev.map(conv => 
        conv.id === convId 
          ? { ...conv, is_archived: !conv.is_archived }
          : conv
      ));
      
      if (currentConversationId === convId) {
        handleNewChat();
      }
      showToast('Conversation archived!');
    } catch (error) {
      showToast('Failed to archive conversation', 'error');
    }
  };

  const deleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await apiService.deleteConversation(convId);
      
      // Update local state
      setPastConversations(prev => prev.filter(conv => conv.id !== convId));
      
      if (currentConversationId === convId) {
        handleNewChat();
      }
      showToast('Conversation deleted!');
    } catch (error) {
      showToast('Failed to delete conversation', 'error');
    }
  };

  const toggleDropdown = (convId, e) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === convId ? null : convId);
  };

  const closeDropdown = () => {
    setOpenDropdownId(null);
  };

  const startRenaming = (convId) => {
    const conversation = pastConversations.find(c => c.id === convId);
    if (conversation) {
      setRenamingConversationId(convId);
      setRenamingText(conversation.title);
    }
  };

  const saveRename = async () => {
    if (renamingText.trim()) {
      try {
        await apiService.updateConversation(renamingConversationId, { title: renamingText.trim() });
        
        // Update local state
        setPastConversations(prev => prev.map(conv => 
          conv.id === renamingConversationId 
            ? { ...conv, title: renamingText.trim() }
            : conv
        ));
        
        showToast('Conversation renamed!');
      } catch (error) {
        showToast('Failed to rename conversation', 'error');
      }
    }
    setRenamingConversationId(null);
    setRenamingText('');
  };

  const cancelRename = () => {
    setRenamingConversationId(null);
    setRenamingText('');
  };

  const viewArchivedChat = (conversation) => {
    setCurrentConversationId(conversation.id);
    setMessages(conversation.messages || []);
    setShowArchivedModal(false);
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsSidebarHidden(true);
    }
  };

  const unarchiveConversation = async (convId) => {
    try {
      await apiService.updateConversation(convId, { is_archived: false });
      
      // Update local state
      setPastConversations(prev => prev.map(conv => 
        conv.id === convId 
          ? { ...conv, is_archived: false }
          : conv
      ));
      
      showToast('Conversation unarchived!');
    } catch (error) {
      showToast('Failed to unarchive conversation', 'error');
    }
  };

  const deleteArchivedConversation = async (convId) => {
    try {
      await apiService.deleteConversation(convId);
      
      // Update local state
      setPastConversations(prev => prev.filter(conv => conv.id !== convId));
      
      showToast('Conversation deleted!');
    } catch (error) {
      showToast('Failed to delete conversation', 'error');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || isGenerating) return;

    const messageText = input.trim();
    const messageFiles = uploadedFiles.length > 0 ? [...uploadedFiles] : null;
    
    // Clear input immediately
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);
    setIsGenerating(true);

    // Add user message to UI immediately
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
      // Call backend API for real AI response
      const response = await apiService.sendMessage(messageText, currentConversationId, messageFiles);
      
      if (response.success) {
        // Update conversation ID if this was a new conversation
        if (!currentConversationId && response.conversationId) {
          setCurrentConversationId(response.conversationId);
        }

        // Add AI response to UI
        const botResponseId = Date.now().toString();
        const botMessage = {
          id: botResponseId,
          role: 'assistant',
          content: response.aiResponse.content,
          timestamp: response.aiResponse.timestamp,
          reaction: null,
          isEdited: false,
          model: response.aiResponse.model
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Start typing animation
        setTimeout(() => {
          typeMessage(botResponseId, response.aiResponse.content);
        }, 100);

        showToast('Response generated successfully!');
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }

    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      // Add error response
      const errorResponse = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting to our AI systems right now. Please try again in a moment, or reach out to your HR representative for immediate assistance.",
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
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleVoiceMode = () => {
    if (autoDetectLanguage) {
      // Auto-detection mode
      if (!multiRecognitions.length) {
        showToast('Speech recognition not supported in this browser', 'error');
        return;
      }

      if (isRecording) {
        // Stop all recognition instances
        multiRecognitions.forEach(rec => {
          try { rec.stop(); } catch (e) {}
        });
        setIsRecording(false);
        showToast('Voice recording stopped');
      } else {
        try {
          setIsRecording(true);
          showToast('Auto-detecting language... Speak now', 'info');
          
          // Start all recognition instances
          multiRecognitions.forEach(rec => {
            try { rec.start(); } catch (e) {}
          });
          
          // Auto-stop after 10 seconds if no detection
          setTimeout(() => {
            if (isRecording) {
              multiRecognitions.forEach(rec => {
                try { rec.stop(); } catch (e) {}
              });
              setIsRecording(false);
            }
          }, 10000);
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          showToast('Failed to start voice recording', 'error');
          setIsRecording(false);
        }
      }
    } else {
      // Manual selection mode
      if (!recognition) {
        showToast('Speech recognition not supported in this browser', 'error');
        return;
      }

      if (isRecording) {
        recognition.stop();
        showToast('Voice recording stopped');
      } else {
        try {
          recognition.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          showToast('Failed to start voice recording', 'error');
        }
      }
    }
  };

  const handleLanguageSelect = (languageCode) => {
    setSpeechLanguage(languageCode);
    setShowLanguageSelector(false);
    const selectedLanguage = supportedLanguages.find(lang => lang.code === languageCode);
    showToast(`Speech language changed to ${selectedLanguage?.name || languageCode}`);
  };

  const stopGeneration = () => {
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
  };

  const getInputButton = () => {
    if (isGenerating || typingMessageId) {
      return {
        icon: Square,
        onClick: stopGeneration,
        className: "stop-button",
        title: "Stop generation",
        disabled: false
      };
    } else if (input.trim()) {
      return {
        icon: ArrowUp,
        onClick: (e) => {
          e.preventDefault();
          handleSubmit();
        },
        className: "send-button",
        title: "Send message",
        disabled: isLoading || isGenerating || typingMessageId
      };
    } else {
      return {
        icon: isRecording ? MicOff : Mic,
        onClick: toggleVoiceMode,
        className: `voice-btn ${isRecording ? 'recording' : ''}`,
        title: isRecording ? "Stop recording" : "Start voice input",
        disabled: isLoading || isGenerating || typingMessageId
      };
    }
  };

  const renderConversationItem = (conv) => (
    <div 
      key={conv.id} 
      className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''} ${conv.is_favourite ? 'favourite' : ''}`}
      onClick={() => handleConversationClick(conv)}
    >
      {renamingConversationId === conv.id ? (
        <div className="rename-input-container">
          <input
            type="text"
            value={renamingText}
            onChange={(e) => setRenamingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename();
              if (e.key === 'Escape') cancelRename();
            }}
            onBlur={saveRename}
            autoFocus
            className="rename-input"
          />
        </div>
      ) : (
        <span className="conversation-text">{conv.title}</span>
      )}
      {conv.is_favourite && <Heart className="favourite-icon" />}
      <div className="conversation-actions">
        <button 
          className="dropdown-toggle"
          onClick={(e) => toggleDropdown(conv.id, e)}
          title="More options"
        >
          <MoreHorizontal className="icon-sm" />
        </button>
        <ConversationDropdown
          conversation={conv}
          isOpen={openDropdownId === conv.id}
          onClose={closeDropdown}
          onFavourite={() => toggleConversationFavourite(conv.id, { stopPropagation: () => {} })}
          onArchive={() => archiveConversation(conv.id, { stopPropagation: () => {} })}
          onDelete={() => deleteConversation(conv.id, { stopPropagation: () => {} })}
          onRename={() => startRenaming(conv.id)}
        />
      </div>
    </div>
  );

  // If in test mode, show the database test component
  // Test mode removed - now using proper backend API architecture

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Test mode removed - using backend API */}
      
      {/* Database errors now handled by backend API */}

      {showFileUpload && (
        <div className="modal-overlay" onClick={() => setShowFileUpload(false)}>
          <div className="modal-content file-upload-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Files</h2>
              <button onClick={() => setShowFileUpload(false)} className="modal-close">
                <X className="icon" />
              </button>
            </div>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ArchivedConversationsModal
        isOpen={showArchivedModal}
        onClose={() => setShowArchivedModal(false)}
        conversations={archivedConversations}
        onViewChat={viewArchivedChat}
        onUnarchive={unarchiveConversation}
        onDelete={deleteArchivedConversation}
      />

      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isSidebarOpen ? 'open' : ''} ${isSidebarHidden ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <button onClick={handleNewChat} className="new-chat-btn">
            <Plus className="icon" />
            {!isSidebarCollapsed && <span>New chat</span>}
          </button>
        </div>
        
        {!isSidebarCollapsed && (
          <>
            <div className="search-container">
              <div className={`search-wrapper ${isSearchFocused ? 'focused' : ''}`}>
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search chats"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="conversation-filters">
              <button
                className={`filter-btn ${conversationFilter === 'all' ? 'active' : ''}`}
                onClick={() => setConversationFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${conversationFilter === 'favourites' ? 'active' : ''}`}
                onClick={() => setConversationFilter('favourites')}
              >
                Favourites
              </button>
            </div>

            <div className="conversation-list">
              {conversationsLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Loading conversations...
                </div>
              ) : (
                <>
                  {conversationGroups.today.length > 0 && (
                    <div className="conversation-group">
                      <div className="group-label">Today</div>
                      {conversationGroups.today.map(renderConversationItem)}
                    </div>
                  )}

                  {conversationGroups.yesterday.length > 0 && (
                    <div className="conversation-group">
                      <div className="group-label">Yesterday</div>
                      {conversationGroups.yesterday.map(renderConversationItem)}
                    </div>
                  )}

                  {conversationGroups.lastWeek.length > 0 && (
                    <div className="conversation-group">
                      <div className="group-label">Previous 7 days</div>
                      {conversationGroups.lastWeek.map(renderConversationItem)}
                    </div>
                  )}

                  {conversationGroups.lastMonth.length > 0 && (
                    <div className="conversation-group">
                      <div className="group-label">Previous 30 days</div>
                      {conversationGroups.lastMonth.map(renderConversationItem)}
                    </div>
                  )}

                  {conversationGroups.older.length > 0 && (
                    <div className="conversation-group">
                      <div className="group-label">Older</div>
                      {conversationGroups.older.map(renderConversationItem)}
                    </div>
                  )}
                  
                  {pastConversations.length === 0 && !conversationsLoading && (
                    <div style={{ 
                      padding: '20px', 
                      textAlign: 'center', 
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      No conversations yet.<br />
                      Start a new chat to get started!
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
        
        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="theme-toggle">
            {isDarkMode ? <Sun className="icon" /> : <Moon className="icon" />}
            {!isSidebarCollapsed && <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>}
          </button>
          
          <button onClick={() => setShowArchivedModal(true)} className="archive-toggle-btn">
            <Archive className="icon" />
            {!isSidebarCollapsed && <span>Archived ({archivedConversations.length})</span>}
          </button>
          
          {!isSidebarCollapsed && user && (
            <div className="user-section" style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '8px',
                  background: showUserMenu ? 'var(--hover-color)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!showUserMenu) e.currentTarget.style.background = 'var(--hover-color)';
                }}
                onMouseLeave={(e) => {
                  if (!showUserMenu) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '16px',
                  flexShrink: 0
                }}>
                  {(user.user_metadata?.display_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'left'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.email}
                  </div>
                </div>
                <MoreHorizontal size={18} style={{ color: '#999', flexShrink: 0 }} />
              </button>

              {showUserMenu && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998
                    }}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 4px)',
                    left: '8px',
                    right: '8px',
                    background: 'var(--sidebar-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 999,
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <LogOut size={18} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''} ${isSidebarHidden ? 'sidebar-hidden' : ''}`}>
        <div className="chat-header">
          <button onClick={toggleSidebar} className="sidebar-toggle">
            <Sidebar className="icon" />
          </button>
          <h1 className="chat-title">
            {currentConversationId 
              ? pastConversations.find(c => c.id === currentConversationId)?.title || 'Chat'
              : 'Onboarding Assistant'
            }
          </h1>
        </div>

        <div className="chat-container" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">
                <Bot size={48} />
              </div>
              <h1 className="welcome-title">How can I help you today?</h1>
              <p className="welcome-subtitle">
                I'm your onboarding assistant. Ask me anything about company policies, benefits, procedures, or getting started at the company.
              </p>

              <div className="suggestion-cards">
                <div className="suggestion-card" onClick={() => setInput("What are the company's vacation policies?")}>
                  <span>📅 Vacation</span>
                </div>
                <div className="suggestion-card" onClick={() => setInput("How do I set up my IT equipment?")}>
                  <span>💻 IT Setup</span>
                </div>
                <div className="suggestion-card" onClick={() => setInput("What benefits do I have access to?")}>
                  <span>🏥 Benefits</span>
                </div>
                <div className="suggestion-card" onClick={() => setInput("Who are my team members?")}>
                  <span>👥 Team</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={msg.id || index} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? (
                      <div className="avatar user-avatar-chat">
                        <User className="icon" />
                      </div>
                    ) : (
                      <div className="avatar assistant-avatar">
                        <Bot className="icon" />
                      </div>
                    )}
                  </div>
                  <div className="message-content">
                    {editingMessageId === msg.id ? (
                      <div className="edit-container">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="edit-textarea"
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button onClick={saveMessageEdit} className="edit-save">
                            <Check className="icon-sm" /> Save
                          </button>
                          <button onClick={() => setEditingMessageId(null)} className="edit-cancel">
                            <X className="icon-sm" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="message-text">
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // Custom styling for markdown elements
                                p: ({node, ...props}) => <p style={{marginBottom: '0.8em'}} {...props} />,
                                strong: ({node, ...props}) => <strong style={{fontWeight: 600, color: 'var(--text-primary)'}} {...props} />,
                                ul: ({node, ...props}) => <ul style={{marginLeft: '1.2em', marginBottom: '0.8em'}} {...props} />,
                                ol: ({node, ...props}) => <ol style={{marginLeft: '1.2em', marginBottom: '0.8em'}} {...props} />,
                                li: ({node, ...props}) => <li style={{marginBottom: '0.4em'}} {...props} />,
                                // eslint-disable-next-line jsx-a11y/heading-has-content
                                h1: ({node, ...props}) => <h1 style={{fontSize: '1.4em', fontWeight: 600, marginBottom: '0.5em'}} {...props} />,
                                // eslint-disable-next-line jsx-a11y/heading-has-content
                                h2: ({node, ...props}) => <h2 style={{fontSize: '1.2em', fontWeight: 600, marginBottom: '0.5em'}} {...props} />,
                                // eslint-disable-next-line jsx-a11y/heading-has-content
                                h3: ({node, ...props}) => <h3 style={{fontSize: '1.1em', fontWeight: 600, marginBottom: '0.4em'}} {...props} />,
                                code: ({node, inline, ...props}) => 
                                  inline 
                                    ? <code style={{background: 'var(--surface-secondary)', padding: '0.2em 0.4em', borderRadius: '3px', fontSize: '0.9em'}} {...props} />
                                    : <code style={{display: 'block', background: 'var(--surface-secondary)', padding: '1em', borderRadius: '6px', overflow: 'auto', fontSize: '0.9em'}} {...props} />
                              }}
                            >
                              {displayedContent[msg.id] !== undefined
                                ? displayedContent[msg.id]
                                : msg.content}
                            </ReactMarkdown>
                          ) : (
                            <>
                              {msg.content}
                            </>
                          )}
                          {typingMessageId === msg.id && (
                            <span className="typing-cursor">|</span>
                          )}
                          {msg.isEdited && <span className="edited-indicator">(edited)</span>}
                          {msg.reaction && (
                            <span className={`reaction ${msg.reaction}`}>
                              {msg.reaction === 'like' ? '👍' : '👎'}
                            </span>
                          )}
                        </div>
                        
                        {msg.files && (
                          <div className="message-files">
                            {msg.files.map(file => (
                              <div key={file.id} className="file-attachment">
                                <FileText className="icon-sm" />
                                <span>{file.name}</span>
                                <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="message-meta">
                          <div className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <MessageActions
                            message={msg}
                            onCopy={copyToClipboard}
                            onEdit={handleMessageEdit}
                            onReact={handleMessageReaction}
                            onRegenerate={regenerateResponse}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message assistant">
                  <div className="message-avatar">
                    <div className="avatar assistant-avatar">
                      <Bot className="icon" />
                    </div>
                  </div>
                  <div className="message-content">
                    <SkeletonLoader />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div className="input-section">
          <div className="input-container">
            {showScrollToBottom && (
              <button 
                onClick={scrollToBottom}
                className={`scroll-to-bottom ${showScrollToBottom ? 'visible' : ''}`}
                title="Scroll to bottom"
              >
                <ArrowUp className="icon" style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
            
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="uploaded-file">
                    <FileText className="icon-sm" />
                    <span>{file.name}</span>
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="remove-file"
                    >
                      <X className="icon-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <div className="input-actions-left">
                  <button
                    type="button"
                    onClick={() => setShowFileUpload(true)}
                    className="file-btn"
                    title="Upload files"
                  >
                    <Paperclip className="icon" />
                  </button>
                </div>
                
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isGenerating || typingMessageId ? "Generating response..." : "Message ChatGPT..."}
                  className="message-input"
                  rows={1}
                  disabled={isGenerating || typingMessageId}
                />
                
                <div className="input-actions-right">
                  {/* Language selector for speech recognition */}
                  {!input.trim() && (
                    <div className="language-selector-container">
                      <button
                        type="button"
                        onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                        className="language-toggle"
                        title={autoDetectLanguage ? "Auto-detecting language" : "Select speech language"}
                      >
                        {autoDetectLanguage ? '🌐' : (supportedLanguages.find(lang => lang.code === speechLanguage)?.flag || '🌐')}
                      </button>
                      
                      {showLanguageSelector && (
                        <div className="language-selector">
                          <div className="language-mode-toggle">
                            <button
                              onClick={() => setAutoDetectLanguage(!autoDetectLanguage)}
                              className={`mode-toggle-btn ${autoDetectLanguage ? 'active' : ''}`}
                            >
                              🤖 Auto-detect
                            </button>
                            <button
                              onClick={() => setAutoDetectLanguage(false)}
                              className={`mode-toggle-btn ${!autoDetectLanguage ? 'active' : ''}`}
                            >
                              🎯 Manual
                            </button>
                          </div>
                          
                          {detectedLanguage && autoDetectLanguage && (
                            <div className="detected-language">
                              <span className="detected-label">Last detected:</span>
                              <span className="detected-flag">
                                {supportedLanguages.find(lang => lang.code === detectedLanguage)?.flag}
                              </span>
                              <span className="detected-name">
                                {supportedLanguages.find(lang => lang.code === detectedLanguage)?.name}
                              </span>
                            </div>
                          )}
                          
                          {!autoDetectLanguage && (
                            <>
                              {supportedLanguages.map(language => (
                                <button
                                  key={language.code}
                                  onClick={() => handleLanguageSelect(language.code)}
                                  className={`language-option ${speechLanguage === language.code ? 'active' : ''}`}
                                  title={language.name}
                                >
                                  <span className="language-flag">{language.flag}</span>
                                  <span className="language-name">{language.name}</span>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(() => {
                    const buttonConfig = getInputButton();
                    const IconComponent = buttonConfig.icon;
                    return (
                      <button
                        type={buttonConfig.className === "send-button" ? "submit" : "button"}
                        onClick={buttonConfig.className === "send-button" ? undefined : buttonConfig.onClick}
                        disabled={buttonConfig.disabled}
                        className={buttonConfig.className}
                        title={buttonConfig.title}
                      >
                        <IconComponent className="icon" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </form>
            <div className="input-footer">
              <span>ChatGPT can make mistakes. Check important info.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
