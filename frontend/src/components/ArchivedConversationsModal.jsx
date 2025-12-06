import React from 'react';
import { X, Archive, Trash2 } from 'lucide-react';

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
                      {new Date(conv.created_at || conv.createdAt).toLocaleDateString()}
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

export default ArchivedConversationsModal;

