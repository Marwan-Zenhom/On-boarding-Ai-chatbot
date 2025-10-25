import React from 'react';
import { X, Copy, ThumbsUp, ThumbsDown, RotateCcw, Edit3 } from 'lucide-react';

export const SkeletonLoader = React.memo(() => (
  <div className="skeleton-container">
    <div className="skeleton skeleton-avatar"></div>
    <div className="skeleton-content">
      <div className="skeleton skeleton-line long"></div>
      <div className="skeleton skeleton-line medium"></div>
      <div className="skeleton skeleton-line short"></div>
    </div>
  </div>
));

SkeletonLoader.displayName = 'SkeletonLoader';

export const Toast = React.memo(({ message, type, onClose }) => (
  <div className={`toast toast-${type}`}>
    <span>{message}</span>
    <button onClick={onClose} className="toast-close">
      <X className="icon-sm" />
    </button>
  </div>
));

Toast.displayName = 'Toast';

export const MessageActions = React.memo(({ message, onCopy, onEdit, onReact, onRegenerate }) => (
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
));

MessageActions.displayName = 'MessageActions';
