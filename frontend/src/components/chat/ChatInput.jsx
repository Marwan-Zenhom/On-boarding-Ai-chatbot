import React, { useRef, useEffect, useState } from 'react';
import { Send, Mic, MicOff, Paperclip, StopCircle, Globe, ChevronDown, Check } from 'lucide-react';

const ChatInput = ({
  inputText,
  setInputText,
  onSubmit,
  onFileUpload,
  isLoading,
  isRecording,
  toggleVoiceMode,
  speechLanguage,
  autoDetectLanguage,
  setAutoDetectLanguage,
  supportedLanguages,
  onLanguageSelect,
  detectedLanguage,
  agentEnabled
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) {
        onSubmit(e);
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  const selectedLanguage = supportedLanguages?.find(lang => lang.code === speechLanguage);

  return (
    <div className="input-container-wrapper">
      <form onSubmit={onSubmit} className="input-container">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
          style={{ display: 'none' }}
        />
        
        <button
          type="button"
          className="input-action-btn"
          onClick={handleFileClick}
          title="Attach file"
          disabled={isLoading}
        >
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={agentEnabled ? "Ask me anything, I can take actions..." : "Type a message..."}
          rows={1}
          disabled={isLoading}
          className="chat-input"
        />

        {/* Voice Recording Section */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Language Selector Button */}
          <button
            type="button"
            className="input-action-btn"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            title="Language settings"
            style={{
              padding: '6px 8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Globe size={16} />
            <span style={{ fontSize: '14px' }}>
              {autoDetectLanguage ? '🔄' : selectedLanguage?.flag || '🌐'}
            </span>
            <ChevronDown size={12} />
          </button>

          {/* Language Dropdown */}
          {showLanguageDropdown && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 998
                }}
                onClick={() => setShowLanguageDropdown(false)}
              />
              <div style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: '8px',
                background: 'var(--card-background)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                zIndex: 999,
                minWidth: '220px',
                maxHeight: '300px',
                overflow: 'hidden'
              }}>
                {/* Auto-detect option */}
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoDetectLanguage(true);
                      setShowLanguageDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: autoDetectLanguage ? 'var(--hover-color)' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <span>🔄 Auto-detect language</span>
                    {autoDetectLanguage && <Check size={16} style={{ color: 'var(--accent-color)' }} />}
                  </button>
                </div>
                
                {/* Language list */}
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '8px'
                }}>
                  {supportedLanguages?.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setAutoDetectLanguage(false);
                        onLanguageSelect(lang.code);
                        setShowLanguageDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: !autoDetectLanguage && speechLanguage === lang.code 
                          ? 'var(--hover-color)' 
                          : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        marginBottom: '2px'
                      }}
                    >
                      <span>{lang.flag} {lang.name}</span>
                      {!autoDetectLanguage && speechLanguage === lang.code && (
                        <Check size={16} style={{ color: 'var(--accent-color)' }} />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Detected language info */}
                {detectedLanguage && (
                  <div style={{
                    padding: '8px 12px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '11px',
                    color: 'var(--text-secondary)'
                  }}>
                    Last detected: {supportedLanguages?.find(l => l.code === detectedLanguage)?.name}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Voice Recording Button */}
          <button
            type="button"
            className={`input-action-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleVoiceMode}
            disabled={isLoading}
            title={isRecording ? 'Stop recording' : 'Voice input'}
            style={{
              background: isRecording ? '#ef4444' : undefined,
              color: isRecording ? 'white' : undefined,
              animation: isRecording ? 'pulse 1.5s infinite' : undefined
            }}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>

        {/* Send/Stop Button */}
        <button
          type="submit"
          className="send-btn"
          disabled={!inputText.trim() && !isLoading}
          title={isLoading ? 'Stop generating' : 'Send message'}
        >
          {isLoading ? <StopCircle size={20} /> : <Send size={20} />}
        </button>
      </form>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default ChatInput;

