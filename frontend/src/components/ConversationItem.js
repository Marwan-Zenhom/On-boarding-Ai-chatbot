import React from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';
import ConversationDropdown from './ConversationDropdown';

const ConversationItem = React.memo(({ 
  conv, 
  isActive,
  isRenaming,
  renamingText,
  setRenamingText,
  saveRename,
  cancelRename,
  onClick,
  openDropdownId,
  toggleDropdown,
  closeDropdown,
  toggleConversationFavourite,
  archiveConversation,
  deleteConversation,
  startRenaming
}) => {
  return (
    <div 
      className={`conversation-item ${isActive ? 'active' : ''} ${conv.is_favourite ? 'favourite' : ''}`}
      onClick={onClick}
    >
      {isRenaming ? (
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
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
