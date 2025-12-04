import React from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Edit3 } from 'lucide-react';

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

export default MessageActions;

