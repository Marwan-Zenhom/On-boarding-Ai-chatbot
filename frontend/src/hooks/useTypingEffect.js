import { useState, useCallback, useRef } from 'react';

export const useTypingEffect = () => {
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [displayedContent, setDisplayedContent] = useState({});
  const typingTimeoutIdsRef = useRef([]);

  const typeMessage = useCallback((messageId, content, onComplete) => {
    setTypingMessageId(messageId);
    setDisplayedContent(prev => ({ ...prev, [messageId]: '' }));
    
    let currentIndex = 0;
    const typingSpeed = 8;
    const timeoutIds = [];
    
    const typeChar = () => {
      if (currentIndex < content.length) {
        setDisplayedContent(prev => ({
          ...prev,
          [messageId]: content.slice(0, currentIndex + 1)
        }));
        currentIndex++;
        const timeoutId = setTimeout(typeChar, typingSpeed);
        timeoutIds.push(timeoutId);
        typingTimeoutIdsRef.current = [...typingTimeoutIdsRef.current, timeoutId];
      } else {
        setTypingMessageId(null);
        setDisplayedContent(prev => ({ ...prev, [messageId]: content }));
        typingTimeoutIdsRef.current = typingTimeoutIdsRef.current.filter(id => !timeoutIds.includes(id));
        if (onComplete) onComplete();
      }
    };
    
    typeChar();
  }, []);

  const stopTyping = useCallback(() => {
    typingTimeoutIdsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    typingTimeoutIdsRef.current = [];
    setTypingMessageId(null);
  }, []);

  const clearDisplayedContent = useCallback((messageId) => {
    setDisplayedContent(prev => {
      const newContent = { ...prev };
      delete newContent[messageId];
      return newContent;
    });
  }, []);

  return {
    typingMessageId,
    displayedContent,
    typeMessage,
    stopTyping,
    clearDisplayedContent
  };
};

export default useTypingEffect;

