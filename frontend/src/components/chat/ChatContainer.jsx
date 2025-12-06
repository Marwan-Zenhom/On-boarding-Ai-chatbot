import React, { useState, useMemo } from 'react';
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
  showScrollToBottom
}) => {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

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
            <div className="input-wrapper">
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
                placeholder={isGenerating || typingMessageId ? "Generating response..." : "Message ChatGPT..."}
                className="message-input"
                rows={1}
                disabled={isGenerating || typingMessageId}
              />
              
              <div className="input-actions-right">
                {/* Language selector */}
                {!input.trim() && (
                  <div className="language-selector-container">
                    <button
                      type="button"
                      onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                      className="language-toggle"
                      title={autoDetectLanguage ? "Auto-detecting language" : "Select speech language"}
                    >
                      {autoDetectLanguage ? '🌐' : (supportedLanguages.find(lang => lang.code === speechLanguage)?.flag || '🌐')}
                    </button>
                    
                    {showLanguageSelector && (
                      <LanguageSelector
                        autoDetectLanguage={autoDetectLanguage}
                        setAutoDetectLanguage={setAutoDetectLanguage}
                        detectedLanguage={detectedLanguage}
                        speechLanguage={speechLanguage}
                        supportedLanguages={supportedLanguages}
                        handleLanguageSelect={(code) => {
                          handleLanguageSelect(code);
                          setShowLanguageSelector(false);
                        }}
                        onClose={() => setShowLanguageSelector(false)}
                      />
                    )}
                  </div>
                )}
                
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
            <span>ChatGPT can make mistakes. Check important info.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Language selector sub-component
const LanguageSelector = ({
  autoDetectLanguage,
  setAutoDetectLanguage,
  detectedLanguage,
  speechLanguage,
  supportedLanguages,
  handleLanguageSelect,
  onClose
}) => (
  <div className="language-selector">
    <div className="language-mode-toggle">
      <button
        onClick={() => setAutoDetectLanguage(!autoDetectLanguage)}
        className={`mode-toggle-btn ${autoDetectLanguage ? 'active' : ''}`}
      >
        🤖 Auto-detect
      </button>
      <button
        onClick={() => setAutoDetectLanguage(false)}
        className={`mode-toggle-btn ${!autoDetectLanguage ? 'active' : ''}`}
      >
        🎯 Manual
      </button>
    </div>
    
    {detectedLanguage && autoDetectLanguage && (
      <div className="detected-language">
        <span className="detected-label">Last detected:</span>
        <span className="detected-flag">
          {supportedLanguages.find(lang => lang.code === detectedLanguage)?.flag}
        </span>
        <span className="detected-name">
          {supportedLanguages.find(lang => lang.code === detectedLanguage)?.name}
        </span>
      </div>
    )}
    
    {!autoDetectLanguage && (
      <>
        {supportedLanguages.map(language => (
          <button
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            className={`language-option ${speechLanguage === language.code ? 'active' : ''}`}
            title={language.name}
          >
            <span className="language-flag">{language.flag}</span>
            <span className="language-name">{language.name}</span>
          </button>
        ))}
      </>
    )}
  </div>
);

export default ChatContainer;

