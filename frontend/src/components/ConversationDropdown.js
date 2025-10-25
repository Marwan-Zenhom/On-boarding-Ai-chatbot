import React from 'react';
import { Edit3, Heart, Archive, Trash2 } from 'lucide-react';

const ConversationDropdown = React.memo(({ conversation, isOpen, onClose, onFavourite, onArchive, onDelete, onRename }) => {
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
});

ConversationDropdown.displayName = 'ConversationDropdown';

export default ConversationDropdown;
