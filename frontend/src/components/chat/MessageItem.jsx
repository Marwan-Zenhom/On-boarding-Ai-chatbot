import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Check, X, FileText, CheckCircle, XCircle, Calendar } from 'lucide-react';
import MessageActions from '../MessageActions';

const MessageItem = memo(({
  message,
  displayedContent,
  typingMessageId,
  editingMessageId,
  editingText,
  setEditingText,
  saveMessageEdit,
  cancelMessageEdit,
  onCopy,
  onEdit,
  onReact,
  onRegenerate,
  user
}) => {
  const isEditing = editingMessageId === message.id;
  const isTyping = typingMessageId === message.id;
  const content = displayedContent[message.id] !== undefined
    ? displayedContent[message.id]
    : message.content;

  return (
    <div className={`message ${message.role}`}>
      <div className="message-avatar">
        {message.role === 'user' ? (
          user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="avatar user-avatar-img"
            />
          ) : (
            <div className="avatar user-avatar-chat">
              <User className="icon" />
            </div>
          )
        ) : (
          <div className="avatar assistant-avatar">
            <Bot className="icon" />
          </div>
        )}
      </div>
      <div className="message-content">
        {isEditing ? (
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
              <button onClick={cancelMessageEdit} className="edit-cancel">
                <X className="icon-sm" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`message-text ${message.isExecutionConfirmation ? 'execution-confirmation' : ''}`}>
              {message.role === 'assistant' ? (
                message.isExecutionConfirmation ? (
                  <ExecutionConfirmation results={message.executionResults} />
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
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
                    {content}
                  </ReactMarkdown>
                )
              ) : (
                <>{message.content}</>
              )}
              {isTyping && <span className="typing-cursor">|</span>}
              {message.isEdited && <span className="edited-indicator">(edited)</span>}
              {message.reaction && (
                <span className={`reaction ${message.reaction}`}>
                  {message.reaction === 'like' ? '👍' : '👎'}
                </span>
              )}
            </div>
            
            {message.files && (
              <div className="message-files">
                {message.files.map(file => (
                  <div key={file.id} className="file-attachment">
                    <FileText className="icon-sm" />
                    <span>{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* For assistant messages, show meta inside content */}
            {message.role === 'assistant' && (
              <div className="message-meta">
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <MessageActions
                  message={message}
                  onCopy={onCopy}
                  onEdit={onEdit}
                  onReact={onReact}
                  onRegenerate={onRegenerate}
                />
              </div>
            )}
          </>
        )}
      </div>
      
      {/* For user messages, show meta outside the bubble */}
      {message.role === 'user' && !isEditing && (
        <div className="message-meta user-meta">
          <div className="message-time">
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <MessageActions
            message={message}
            onCopy={onCopy}
            onEdit={onEdit}
            onReact={onReact}
            onRegenerate={onRegenerate}
          />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.reaction === nextProps.message.reaction &&
    prevProps.message.isEdited === nextProps.message.isEdited &&
    prevProps.displayedContent[prevProps.message.id] === nextProps.displayedContent[nextProps.message.id] &&
    prevProps.typingMessageId === nextProps.typingMessageId &&
    prevProps.editingMessageId === nextProps.editingMessageId &&
    prevProps.editingText === nextProps.editingText
  );
});

MessageItem.displayName = 'MessageItem';

// Execution confirmation sub-component
const ExecutionConfirmation = memo(({ results }) => (
  <div className="execution-confirmation-card">
    <div className="execution-header">
      <div className="execution-icon">
        <CheckCircle size={24} style={{ color: '#10b981' }} />
      </div>
      <h3 className="execution-title">Actions Executed</h3>
    </div>
    
    <div className="execution-actions">
      {results?.map((result, index) => (
        <div key={index} className={`execution-action-item ${result.success ? 'success' : 'error'}`}>
          <div className="action-status">
            {result.success ? (
              <CheckCircle size={20} style={{ color: '#10b981' }} />
            ) : (
              <XCircle size={20} style={{ color: '#ef4444' }} />
            )}
          </div>
          <div className="action-content">
            <div className="action-title">{result.description || 'Action'}</div>
            {result.success && result.result?.summary && (
              <div className="action-summary">{result.result.summary}</div>
            )}
            {result.success && result.result?.data?.htmlLink && (
              <a 
                href={result.result.data.htmlLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="action-link"
              >
                <Calendar size={16} />
                View on Google Calendar
              </a>
            )}
            {!result.success && (
              <div className="action-error">Error: {result.error}</div>
            )}
          </div>
        </div>
      ))}
    </div>
    
    <div className="execution-footer">
      {results?.every(r => r.success) ? (
        <div className="execution-success-message">
          <span className="success-emoji">🎉</span>
          <span className="success-text">All actions completed successfully!</span>
        </div>
      ) : (
        <div className="execution-warning-message">
          <span className="warning-emoji">⚠️</span>
          <span className="warning-text">
            {results?.filter(r => r.success).length}/{results?.length} actions completed
          </span>
        </div>
      )}
    </div>
  </div>
));

ExecutionConfirmation.displayName = 'ExecutionConfirmation';

export default MessageItem;
