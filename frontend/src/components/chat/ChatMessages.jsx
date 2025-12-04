import React, { memo } from 'react';
import { Bot } from 'lucide-react';
import MessageItem from './MessageItem';
import SkeletonLoader from '../SkeletonLoader';

const ChatMessages = memo(({
  messages,
  isLoading,
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
  chatEndRef
}) => {
  return (
    <div className="chat-messages">
      {messages.map((msg, index) => (
        <MessageItem
          key={msg.id || index}
          message={msg}
          displayedContent={displayedContent}
          typingMessageId={typingMessageId}
          editingMessageId={editingMessageId}
          editingText={editingText}
          setEditingText={setEditingText}
          saveMessageEdit={saveMessageEdit}
          cancelMessageEdit={cancelMessageEdit}
          onCopy={onCopy}
          onEdit={onEdit}
          onReact={onReact}
          onRegenerate={onRegenerate}
        />
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
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
