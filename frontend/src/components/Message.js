import React from 'react';
import { User, Bot, Check, X, FileText } from 'lucide-react';
import { MessageActions } from './UtilityComponents';

const Message = React.memo(({ 
  msg, 
  editingMessageId, 
  editingText, 
  setEditingText, 
  saveMessageEdit, 
  setEditingMessageId,
  displayedContent,
  typingMessageId,
  copyToClipboard,
  handleMessageEdit,
  handleMessageReaction,
  regenerateResponse
}) => {
  return (
    <div className={`message ${msg.role}`}>
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
              {msg.role === 'assistant' && displayedContent[msg.id] !== undefined
                ? displayedContent[msg.id]
                : msg.content}
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
  );
});

Message.displayName = 'Message';

export default Message;
