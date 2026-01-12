import React, { useMemo, useEffect, useCallback } from 'react';
import { 
  Sidebar as SidebarIcon, 
  ArrowUp, Mic, MicOff, Square, 
  Paperclip, FileText, X 
} from 'lucide-react';
import WelcomeScreen from './WelcomeScreen';
import ChatMessages from './ChatMessages';

const ChatContainer = ({
  // Chat state
  messages,
  input,
  setInput,
  isLoading,
  isGenerating,
  typingMessageId,
  displayedContent,
  editingMessageId,
  editingText,
  setEditingText,
  uploadedFiles,
  
  // Refs
  chatContainerRef,
  inputRef,
  chatEndRef,
  
  // Speech recognition
  isRecording,
  toggleVoiceMode,
  speechLanguage,
  autoDetectLanguage,
  setAutoDetectLanguage,
  supportedLanguages,
  handleLanguageSelect,
  detectedLanguage,
  
  // Actions
  handleSubmit,
  handleKeyDown,
  saveMessageEdit,
  cancelMessageEdit,
  copyToClipboard,
  handleMessageEdit,
  handleMessageReaction,
  regenerateResponse,
  stopGeneration,
  scrollToBottom,
  removeFile,
  
  // Sidebar
  toggleSidebar,
  isSidebarOpen,
  isSidebarHidden,
  
  // Conversation
  currentConversationId,
  pastConversations,
  showScrollToBottom,
  
  // User
  user
}) => {
  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef?.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight (content height)
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputRef]);

  // Adjust height when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Get current conversation title
  const currentTitle = useMemo(() => {
    if (currentConversationId) {
      return pastConversations.find(c => c.id === currentConversationId)?.title || 'Chat';
    }
    return 'Onboarding Assistant';
  }, [currentConversationId, pastConversations]);

  // Get input button config
  const getInputButton = () => {
    if (isGenerating || typingMessageId) {
      return {
        icon: Square,
        onClick: stopGeneration,
        className: "stop-button",
        title: "Stop generation",
        disabled: false
      };
    } else if (input.trim()) {
      return {
        icon: ArrowUp,
        onClick: (e) => {
          e.preventDefault();
          handleSubmit();
        },
        className: "send-button",
        title: "Send message",
        disabled: isLoading || isGenerating || typingMessageId
      };
    } else {
      return {
        icon: isRecording ? MicOff : Mic,
        onClick: toggleVoiceMode,
        className: `voice-btn ${isRecording ? 'recording' : ''}`,
        title: isRecording ? "Stop recording" : "Start voice input",
        disabled: isLoading || isGenerating || typingMessageId
      };
    }
  };

  const buttonConfig = getInputButton();
  const IconComponent = buttonConfig.icon;

  return (
    <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''} ${isSidebarHidden ? 'sidebar-hidden' : ''}`}>
      {/* Header */}
      <div className="chat-header">
        <button onClick={toggleSidebar} className="sidebar-toggle">
          <SidebarIcon className="icon" />
        </button>
        <h1 className="chat-title">{currentTitle}</h1>
      </div>

      {/* Chat Container */}
      <div className="chat-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={setInput} />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            displayedContent={displayedContent}
            typingMessageId={typingMessageId}
            editingMessageId={editingMessageId}
            editingText={editingText}
            setEditingText={setEditingText}
            saveMessageEdit={saveMessageEdit}
            cancelMessageEdit={cancelMessageEdit}
            onCopy={copyToClipboard}
            onEdit={handleMessageEdit}
            onReact={handleMessageReaction}
            onRegenerate={regenerateResponse}
            chatEndRef={chatEndRef}
            user={user}
          />
        )}
      </div>

      {/* Input Section */}
      <div className="input-section">
        <div className="input-container">
          {showScrollToBottom && (
            <button 
              onClick={scrollToBottom}
              className={`scroll-to-bottom ${showScrollToBottom ? 'visible' : ''}`}
              title="Scroll to bottom"
            >
              <ArrowUp className="icon" style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
          
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              {uploadedFiles.map(file => (
                <div key={file.id} className="uploaded-file">
                  <FileText className="icon-sm" />
                  <span>{file.name}</span>
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="remove-file"
                  >
                    <X className="icon-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-wrapper" onClick={() => inputRef?.current?.focus()}>
              <div className="input-actions-left">
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="file-btn disabled"
                  title="Coming soon"
                  disabled
                  style={{ cursor: 'not-allowed', opacity: 0.5 }}
                >
                  <Paperclip className="icon" />
                </button>
              </div>
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isGenerating || typingMessageId ? "Generating response..." : "Ask anything"}
                className="message-input"
                rows={1}
                disabled={isGenerating || typingMessageId}
              />
              
              <div className="input-actions-right">
                <button
                  type={buttonConfig.className === "send-button" ? "submit" : "button"}
                  onClick={buttonConfig.className === "send-button" ? undefined : buttonConfig.onClick}
                  disabled={buttonConfig.disabled}
                  className={buttonConfig.className}
                  title={buttonConfig.title}
                >
                  <IconComponent className="icon" />
                </button>
              </div>
            </div>
          </form>
          <div className="input-footer">
            <span>NovaTech Agent can make mistakes. Check important info.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;

