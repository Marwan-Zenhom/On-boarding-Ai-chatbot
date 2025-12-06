import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { X } from 'lucide-react';
import apiService from './services/apiService';

// Components
import Sidebar from './components/sidebar/Sidebar';
import ChatContainer from './components/chat/ChatContainer';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

// Hooks
import useChat from './hooks/useChat';
import useSpeechRecognition from './hooks/useSpeechRecognition';
import { useTheme } from './contexts/ThemeContext';

// Lazy loaded components (heavy modals)
const ActionApprovalModal = lazy(() => import('./components/ActionApprovalModal'));
const FileUpload = lazy(() => import('./components/FileUpload'));
const ArchivedConversationsModal = lazy(() => import('./components/ArchivedConversationsModal'));
const ProfileSettingsModal = lazy(() => import('./components/ProfileSettingsModal'));

// Loading fallback for lazy components
const ModalLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: 'var(--text-secondary)'
  }}>
    Loading...
  </div>
);

function App({ user, onSignOut, authFunctions }) {
  // Theme from context
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Chat hook
  const chat = useChat(showToast);

  // Speech recognition hook
  const handleSpeechTranscript = useCallback((transcript) => {
    chat.setInput(prev => prev + transcript);
  }, [chat]);

  const speech = useSpeechRecognition(handleSpeechTranscript, showToast);

  // Conversations state
  const [pastConversations, setPastConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [conversationFilter, setConversationFilter] = useState('all');
  
  // Dropdown & renaming state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [renamingConversationId, setRenamingConversationId] = useState(null);
  const [renamingText, setRenamingText] = useState('');
  
  // Modals
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Load conversations
  useEffect(() => {
    if (!user) {
      setConversationsLoading(false);
      return;
    }

    const loadConversations = async () => {
      try {
        setConversationsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 100));
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
  }, [user]);

  // Resize handler
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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isSidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.sidebar-toggle')) {
        setIsSidebarOpen(false);
      }
      if (openDropdownId && !event.target.closest('.conversation-dropdown') && !event.target.closest('.dropdown-toggle')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isSidebarOpen, openDropdownId]);

  // Scroll handler
  useEffect(() => {
    const chatContainer = chat.chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom && chat.messages.length > 0);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, [chat.messages.length, chat.chatContainerRef]);

  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    let filtered = pastConversations.filter(conv => !conv.is_archived);
    
    if (conversationFilter === 'favourites') {
      filtered = filtered.filter(conv => conv.is_favourite);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => {
      if (a.is_favourite && !b.is_favourite) return -1;
      if (!a.is_favourite && b.is_favourite) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [pastConversations, searchQuery, conversationFilter]);

  const archivedConversations = useMemo(() => {
    return pastConversations.filter(conv => conv.is_archived)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [pastConversations]);

  const conversationGroups = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const groups = { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] };

    filteredConversations.forEach(conv => {
      const convDate = new Date(conv.created_at);
      const convDateOnly = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());
      
      if (convDateOnly.getTime() === today.getTime()) groups.today.push(conv);
      else if (convDateOnly.getTime() === yesterday.getTime()) groups.yesterday.push(conv);
      else if (convDate >= lastWeek) groups.lastWeek.push(conv);
      else if (convDate >= lastMonth) groups.lastMonth.push(conv);
      else groups.older.push(conv);
    });

    return groups;
  }, [filteredConversations]);

  // Handlers
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(prev => !prev);
      if (!isSidebarOpen) setIsSidebarHidden(false);
    } else {
      setIsSidebarHidden(prev => !prev);
      if (isSidebarHidden) setIsSidebarCollapsed(false);
    }
  }, [isMobile, isSidebarOpen, isSidebarHidden]);

  const handleConversationClick = useCallback((conversation) => {
    if (conversation.is_archived) {
      showToast('This conversation is archived. Unarchive it first to view.', 'error');
      return;
    }
    chat.loadConversation(conversation);
    if (isMobile) setIsSidebarOpen(false);
  }, [chat, isMobile, showToast]);

  const handleNewChat = useCallback(() => {
    chat.handleNewChat();
    if (isMobile) setIsSidebarOpen(false);
  }, [chat, isMobile]);

  const reloadConversations = useCallback(async () => {
    try {
      const response = await apiService.getConversations();
      if (response.success) {
        setPastConversations(response.conversations);
      }
    } catch (error) {
      console.error('Failed to reload conversations:', error);
    }
  }, []);

  const toggleConversationFavourite = useCallback(async (convId, e) => {
    e.stopPropagation();
    try {
      const conversation = pastConversations.find(c => c.id === convId);
      await apiService.updateConversation(convId, { is_favourite: !conversation.is_favourite });
      setPastConversations(prev => prev.map(conv => 
        conv.id === convId ? { ...conv, is_favourite: !conv.is_favourite } : conv
      ));
      showToast(conversation?.is_favourite ? 'Removed from favourites!' : 'Added to favourites!');
    } catch (error) {
      showToast('Failed to update favourite status', 'error');
    }
  }, [pastConversations, showToast]);

  const archiveConversation = useCallback(async (convId, e) => {
    e.stopPropagation();
    try {
      await apiService.updateConversation(convId, { is_archived: true });
      setPastConversations(prev => prev.map(conv => 
        conv.id === convId ? { ...conv, is_archived: true } : conv
      ));
      if (chat.currentConversationId === convId) handleNewChat();
      showToast('Conversation archived!');
    } catch (error) {
      showToast('Failed to archive conversation', 'error');
    }
  }, [chat.currentConversationId, handleNewChat, showToast]);

  const deleteConversation = useCallback(async (convId, e) => {
    e.stopPropagation();
    try {
      await apiService.deleteConversation(convId);
      setPastConversations(prev => prev.filter(conv => conv.id !== convId));
      if (chat.currentConversationId === convId) handleNewChat();
      showToast('Conversation deleted!');
    } catch (error) {
      showToast('Failed to delete conversation', 'error');
    }
  }, [chat.currentConversationId, handleNewChat, showToast]);

  const toggleDropdown = useCallback((convId, e) => {
    e.stopPropagation();
    setOpenDropdownId(prev => prev === convId ? null : convId);
  }, []);

  const closeDropdown = useCallback(() => setOpenDropdownId(null), []);

  const startRenaming = useCallback((convId) => {
    const conversation = pastConversations.find(c => c.id === convId);
    if (conversation) {
      setRenamingConversationId(convId);
      setRenamingText(conversation.title);
    }
  }, [pastConversations]);

  const saveRename = useCallback(async () => {
    if (renamingText.trim()) {
      try {
        await apiService.updateConversation(renamingConversationId, { title: renamingText.trim() });
        setPastConversations(prev => prev.map(conv => 
          conv.id === renamingConversationId ? { ...conv, title: renamingText.trim() } : conv
        ));
        showToast('Conversation renamed!');
      } catch (error) {
        showToast('Failed to rename conversation', 'error');
      }
    }
    setRenamingConversationId(null);
    setRenamingText('');
  }, [renamingConversationId, renamingText, showToast]);

  const cancelRename = useCallback(() => {
    setRenamingConversationId(null);
    setRenamingText('');
  }, []);

  const viewArchivedChat = useCallback((conversation) => {
    chat.loadConversation(conversation);
    setShowArchivedModal(false);
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsSidebarHidden(true);
    }
  }, [chat, isMobile]);

  const unarchiveConversation = useCallback(async (convId) => {
    try {
      await apiService.updateConversation(convId, { is_archived: false });
      setPastConversations(prev => prev.map(conv => 
        conv.id === convId ? { ...conv, is_archived: false } : conv
      ));
      showToast('Conversation unarchived!');
    } catch (error) {
      showToast('Failed to unarchive conversation', 'error');
    }
  }, [showToast]);

  const deleteArchivedConversation = useCallback(async (convId) => {
    try {
      await apiService.deleteConversation(convId);
      setPastConversations(prev => prev.filter(conv => conv.id !== convId));
      showToast('Conversation deleted!');
    } catch (error) {
      showToast('Failed to delete conversation', 'error');
    }
  }, [showToast]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chat.handleSubmit(e, reloadConversations);
    }
  }, [chat, reloadConversations]);

  const handleSubmit = useCallback((e) => {
    chat.handleSubmit(e, reloadConversations);
  }, [chat, reloadConversations]);

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* File Upload Modal - Lazy loaded */}
      {showFileUpload && (
        <div className="modal-overlay" onClick={() => setShowFileUpload(false)}>
          <div className="modal-content file-upload-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Files</h2>
              <button onClick={() => setShowFileUpload(false)} className="modal-close">
                <X className="icon" />
              </button>
            </div>
            <Suspense fallback={<ModalLoader />}>
              <FileUpload onFileSelect={(files) => {
                chat.handleFileSelect(files);
                setShowFileUpload(false);
              }} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Archived Conversations Modal - Lazy loaded */}
      <Suspense fallback={null}>
        <ArchivedConversationsModal
          isOpen={showArchivedModal}
          onClose={() => setShowArchivedModal(false)}
          conversations={archivedConversations}
          onViewChat={viewArchivedChat}
          onUnarchive={unarchiveConversation}
          onDelete={deleteArchivedConversation}
        />
      </Suspense>

      {/* Sidebar */}
      <ErrorBoundary>
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          isSidebarOpen={isSidebarOpen}
          isSidebarHidden={isSidebarHidden}
          isDarkMode={isDarkMode}
          user={user}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchFocused={isSearchFocused}
          setIsSearchFocused={setIsSearchFocused}
          conversationFilter={conversationFilter}
          setConversationFilter={setConversationFilter}
          conversationsLoading={conversationsLoading}
          conversationGroups={conversationGroups}
          pastConversations={pastConversations}
          currentConversationId={chat.currentConversationId}
          archivedConversations={archivedConversations}
          renamingConversationId={renamingConversationId}
          renamingText={renamingText}
          setRenamingText={setRenamingText}
          saveRename={saveRename}
          cancelRename={cancelRename}
          startRenaming={startRenaming}
          openDropdownId={openDropdownId}
          toggleDropdown={toggleDropdown}
          closeDropdown={closeDropdown}
          handleNewChat={handleNewChat}
          handleConversationClick={handleConversationClick}
          toggleConversationFavourite={toggleConversationFavourite}
          archiveConversation={archiveConversation}
          deleteConversation={deleteConversation}
          toggleTheme={toggleTheme}
          handleSignOut={onSignOut}
          setShowArchivedModal={setShowArchivedModal}
          setShowProfileSettings={setShowProfileSettings}
        />
      </ErrorBoundary>

      {/* Chat Container */}
      <ErrorBoundary>
        <ChatContainer
          messages={chat.messages}
          input={chat.input}
          setInput={chat.setInput}
          isLoading={chat.isLoading}
          isGenerating={chat.isGenerating}
          typingMessageId={chat.typingMessageId}
          displayedContent={chat.displayedContent}
          editingMessageId={chat.editingMessageId}
          editingText={chat.editingText}
          setEditingText={chat.setEditingText}
          uploadedFiles={chat.uploadedFiles}
          chatContainerRef={chat.chatContainerRef}
          inputRef={chat.inputRef}
          chatEndRef={chat.chatEndRef}
          isRecording={speech.isRecording}
          toggleVoiceMode={speech.toggleVoiceMode}
          speechLanguage={speech.speechLanguage}
          autoDetectLanguage={speech.autoDetectLanguage}
          setAutoDetectLanguage={speech.setAutoDetectLanguage}
          supportedLanguages={speech.supportedLanguages}
          handleLanguageSelect={speech.handleLanguageSelect}
          detectedLanguage={speech.detectedLanguage}
          handleSubmit={handleSubmit}
          handleKeyDown={handleKeyDown}
          saveMessageEdit={chat.saveMessageEdit}
          cancelMessageEdit={chat.cancelMessageEdit}
          copyToClipboard={chat.copyToClipboard}
          handleMessageEdit={chat.handleMessageEdit}
          handleMessageReaction={chat.handleMessageReaction}
          regenerateResponse={chat.regenerateResponse}
          stopGeneration={chat.stopGeneration}
          scrollToBottom={chat.scrollToBottom}
          removeFile={chat.removeFile}
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          isSidebarHidden={isSidebarHidden}
          currentConversationId={chat.currentConversationId}
          pastConversations={pastConversations}
          showScrollToBottom={showScrollToBottom}
        />
      </ErrorBoundary>

      {/* Profile Settings Modal - Lazy loaded */}
      {showProfileSettings && (
        <Suspense fallback={<ModalLoader />}>
          <ProfileSettingsModal
            user={user}
            isDarkMode={isDarkMode}
            onClose={() => setShowProfileSettings(false)}
            onUpdate={(updatedData) => {
              console.log('Profile updated:', updatedData);
              setShowProfileSettings(false);
            }}
            authFunctions={authFunctions}
          />
        </Suspense>
      )}

      {/* Action Approval Modal - Lazy loaded */}
      <Suspense fallback={null}>
        <ActionApprovalModal
          actions={chat.pendingActions}
          isOpen={chat.showApprovalModal}
          onApprove={chat.handleApproveActions}
          onReject={chat.handleRejectActions}
          onClose={() => chat.setShowApprovalModal(false)}
        />
      </Suspense>
    </div>
  );
}

export default App;
