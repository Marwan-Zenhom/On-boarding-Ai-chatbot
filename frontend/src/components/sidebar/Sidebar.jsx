import React from 'react';
import { Plus, Search, Sun, Moon, Archive, Heart, MoreHorizontal } from 'lucide-react';
import ConversationDropdown from '../ConversationDropdown';
import UserMenu from './UserMenu';

const Sidebar = ({
  // Sidebar state
  isSidebarCollapsed,
  isSidebarOpen,
  isSidebarHidden,
  isDarkMode,
  user,
  
  // Search
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  
  // Conversations
  conversationFilter,
  setConversationFilter,
  conversationsLoading,
  conversationGroups,
  pastConversations,
  currentConversationId,
  archivedConversations,
  
  // Renaming
  renamingConversationId,
  renamingText,
  setRenamingText,
  saveRename,
  cancelRename,
  startRenaming,
  
  // Dropdown
  openDropdownId,
  toggleDropdown,
  closeDropdown,
  
  // Actions
  handleNewChat,
  handleConversationClick,
  toggleConversationFavourite,
  archiveConversation,
  deleteConversation,
  toggleTheme,
  handleSignOut,
  setShowArchivedModal,
  setShowProfileSettings
}) => {
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

  return (
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
          <UserMenu
            user={user}
            isDarkMode={isDarkMode}
            onSignOut={handleSignOut}
            onOpenSettings={() => setShowProfileSettings(true)}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;

