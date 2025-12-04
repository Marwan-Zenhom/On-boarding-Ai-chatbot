import { useState, useEffect, useCallback, useRef } from 'react';

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-PT', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' }
];

const getInitialLanguage = () => {
  const browserLang = navigator.language || 'en-US';
  const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);
  return supportedCodes.includes(browserLang) ? browserLang : 'en-US';
};

export const useSpeechRecognition = (onTranscript, showToast) => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState(getInitialLanguage);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  
  const recognitionRef = useRef(null);
  const multiRecognitionsRef = useRef([]);
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      multiRecognitionsRef.current.forEach(rec => {
        try { rec.stop(); } catch (e) {}
      });
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (autoDetectLanguage) {
      // Create multiple recognition instances for auto-detection
      const primaryLanguages = ['en-US', 'de-DE', 'fr-FR', 'es-ES', 'it-IT'];
      const recognitionInstances = [];

      primaryLanguages.forEach(langCode => {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = langCode;

        recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          let confidence = 0;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
              confidence = result[0].confidence || 0;
            }
          }

          if (finalTranscript && confidence > 0.7) {
            // Stop all recognition instances
            recognitionInstances.forEach(rec => {
              try { rec.stop(); } catch (e) {}
            });

            const detectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === langCode);
            setDetectedLanguage(langCode);
            setSpeechLanguage(langCode);
            setIsRecording(false);
            
            if (onTranscript) {
              onTranscript(finalTranscript);
            }
            
            if (showToast) {
              showToast(`Detected ${detectedLang?.name || langCode}: "${finalTranscript.substring(0, 30)}..."`, 'success');
            }
          }
        };

        recognitionInstance.onerror = (event) => {
          if (event.error !== 'aborted' && event.error !== 'no-speech') {
            console.error(`Speech recognition error (${langCode}):`, event.error);
          }
        };

        recognitionInstance.onend = () => {
          // Only set recording to false if all instances have ended
          const allEnded = recognitionInstances.every(rec => rec.ended !== false);
          if (allEnded) {
            setIsRecording(false);
          }
        };

        recognitionInstances.push(recognitionInstance);
      });

      multiRecognitionsRef.current = recognitionInstances;
    } else {
      // Single language recognition (manual selection)
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = speechLanguage;

      recognitionInstance.onstart = () => {
        setIsRecording(true);
        const selectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === speechLanguage);
        if (showToast) {
          showToast(`Listening in ${selectedLanguage?.name || speechLanguage}... Speak now`, 'info');
        }
      };

      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript && onTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);

        if (showToast) {
          let errorMessage = 'Speech recognition error';
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Try again.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage = 'Network error. Check your connection.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          showToast(errorMessage, 'error');
        }
      };

      recognitionRef.current = recognitionInstance;
    }
  }, [speechLanguage, autoDetectLanguage, onTranscript, showToast]);

  const toggleVoiceMode = useCallback(() => {
    if (autoDetectLanguage) {
      // Auto-detection mode
      if (multiRecognitionsRef.current.length === 0) {
        if (showToast) {
          showToast('Speech recognition not supported in this browser', 'error');
        }
        return;
      }

      if (isRecording) {
        // Stop all recognition instances
        multiRecognitionsRef.current.forEach(rec => {
          try { rec.stop(); } catch (e) {}
        });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setIsRecording(false);
        if (showToast) {
          showToast('Voice recording stopped');
        }
      } else {
        try {
          setIsRecording(true);
          if (showToast) {
            showToast('Auto-detecting language... Speak now', 'info');
          }

          // Start all recognition instances
          multiRecognitionsRef.current.forEach(rec => {
            try { rec.start(); } catch (e) {}
          });

          // Auto-stop after 10 seconds if no detection
          timeoutRef.current = setTimeout(() => {
            multiRecognitionsRef.current.forEach(rec => {
              try { rec.stop(); } catch (e) {}
            });
            setIsRecording(false);
          }, 10000);
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          if (showToast) {
            showToast('Failed to start voice recording', 'error');
          }
          setIsRecording(false);
        }
      }
    } else {
      // Manual selection mode
      if (!recognitionRef.current) {
        if (showToast) {
          showToast('Speech recognition not supported in this browser', 'error');
        }
        return;
      }

      if (isRecording) {
        recognitionRef.current.stop();
        if (showToast) {
          showToast('Voice recording stopped');
        }
      } else {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          if (showToast) {
            showToast('Failed to start voice recording', 'error');
          }
        }
      }
    }
  }, [autoDetectLanguage, isRecording, showToast]);

  const handleLanguageSelect = useCallback((languageCode) => {
    setSpeechLanguage(languageCode);
    const selectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    if (showToast) {
      showToast(`Speech language changed to ${selectedLanguage?.name || languageCode}`);
    }
  }, [showToast]);

  return {
    isRecording,
    speechLanguage,
    autoDetectLanguage,
    detectedLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    toggleVoiceMode,
    handleLanguageSelect,
    setAutoDetectLanguage
  };
};

export default useSpeechRecognition;
