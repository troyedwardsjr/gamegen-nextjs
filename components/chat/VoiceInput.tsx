"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { GlassmorphicButton } from '@/components/ui/GlassmorphicButton';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  language?: string;
  className?: string;
}

interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  error: string | null;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
];

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscription,
  onError,
  disabled = false,
  language = 'en-US',
  className,
}) => {
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    hasPermission: false,
    currentTranscript: '',
    finalTranscript: '',
    confidence: 0,
    error: null,
  });

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [audioLevel, setAudioLevel] = useState(0);

  // Check browser support and initialize
  useEffect(() => {
    const checkSupport = async () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          error: 'Speech recognition not supported in this browser',
        }));
        return;
      }

      // Check microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
        
        setState(prev => ({
          ...prev,
          isSupported: true,
          hasPermission: true,
          error: null,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSupported: true,
          hasPermission: false,
          error: 'Microphone permission required',
        }));
      }
    };

    checkSupport();
  }, []);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    
    // Configuration
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      
      // Auto-restart if we were actively listening (but stopped due to timeout)
      if (recognitionRef.current && state.isListening) {
        restartTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && state.isListening) {
            recognition.start();
          }
        }, 100);
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error;
      let errorMessage = 'Speech recognition error';
      
      switch (error) {
        case 'network':
          errorMessage = 'Network error occurred';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied';
          setState(prev => ({ ...prev, hasPermission: false }));
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Try speaking louder.';
          break;
        case 'audio-capture':
          errorMessage = 'Audio capture failed';
          break;
        case 'aborted':
          // Ignore aborted errors (usually from stopping manually)
          return;
        default:
          errorMessage = `Speech recognition error: ${error}`;
      }

      setState(prev => ({
        ...prev,
        isListening: false,
        error: errorMessage,
      }));

      onError?.(errorMessage);
      
      toast({
        title: "Voice Input Error",
        description: errorMessage,
        variant: "destructive",
      });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let bestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          bestConfidence = Math.max(bestConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        currentTranscript: interimTranscript,
        finalTranscript: prev.finalTranscript + finalTranscript,
        confidence: bestConfidence,
      }));

      // If we have final transcript, send it
      if (finalTranscript.trim()) {
        onTranscription(finalTranscript.trim());
      }

      // Reset auto-stop timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Auto-stop after 30 seconds of silence
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          stopListening();
        }
      }, 30000);
    };

    recognition.onaudiostart = () => {
      // Start audio level monitoring (simulated)
      const audioLevelInterval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);

      recognition.onaudioend = () => {
        clearInterval(audioLevelInterval);
        setAudioLevel(0);
      };
    };

    return recognition;
  }, [selectedLanguage, onTranscription, onError, toast, state.isListening]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!state.isSupported || disabled) return;

    // Request microphone permission if not granted
    if (!state.hasPermission) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setState(prev => ({ ...prev, hasPermission: true }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          hasPermission: false,
          error: 'Microphone permission required',
        }));
        return;
      }
    }

    try {
      recognitionRef.current = initializeRecognition();
      if (recognitionRef.current) {
        setState(prev => ({
          ...prev,
          currentTranscript: '',
          finalTranscript: '',
          error: null,
        }));
        recognitionRef.current.start();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to start voice recognition',
        isListening: false,
      }));
    }
  }, [state.isSupported, state.hasPermission, disabled, initializeRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    setState(prev => ({ ...prev, isListening: false }));
    setAudioLevel(0);
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Send current transcript
  const sendCurrentTranscript = useCallback(() => {
    const fullTranscript = (state.finalTranscript + ' ' + state.currentTranscript).trim();
    if (fullTranscript) {
      onTranscription(fullTranscript);
      setState(prev => ({
        ...prev,
        currentTranscript: '',
        finalTranscript: '',
      }));
    }
  }, [state.finalTranscript, state.currentTranscript, onTranscription]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTranscript: '',
      finalTranscript: '',
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Get current language info
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

  if (!state.isSupported) {
    return null; // Don't render if not supported
  }

  const hasTranscript = state.currentTranscript || state.finalTranscript;
  const fullTranscript = (state.finalTranscript + ' ' + state.currentTranscript).trim();

  return (
    <div className={clsx("voice-input", className)}>
      {/* Main voice button */}
      <div className="relative">
        <GlassmorphicButton
          variant={state.isListening ? "accent-cyan" : "glass-subtle"}
          onClick={toggleListening}
          disabled={disabled || !state.hasPermission}
          className={clsx(
            "relative transition-all duration-200",
            state.isListening && "animate-pulse"
          )}
          title={state.isListening ? "Stop voice input" : "Start voice input"}
        >
          {/* Microphone icon */}
          <div className="relative">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
              />
            </svg>
            
            {/* Audio level indicator */}
            {state.isListening && (
              <motion.div
                className="absolute -inset-2 rounded-full border-2 border-cyan-400"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  opacity: audioLevel / 100,
                }}
              />
            )}
          </div>
        </GlassmorphicButton>

        {/* Language selector button */}
        <GlassmorphicButton
          size="xs"
          variant="glass-ghost"
          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
          className="absolute -top-1 -right-1 text-xs"
          title={`Change language (${currentLanguage?.name})`}
        >
          {currentLanguage?.flag}
        </GlassmorphicButton>
      </div>

      {/* Language selector dropdown */}
      <AnimatePresence>
        {showLanguageSelector && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute bottom-full mb-2 left-0 z-50"
          >
            <GlassmorphicCard variant="glass-subtle" className="p-2 w-48 max-h-64 overflow-y-auto">
              <div className="space-y-1">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                      setShowLanguageSelector(false);
                      if (recognitionRef.current) {
                        stopListening();
                      }
                    }}
                    className={clsx(
                      "w-full text-left px-2 py-1 rounded text-sm hover:bg-white/10 transition-colors flex items-center space-x-2",
                      selectedLanguage === lang.code && "bg-cyan-500/20 text-cyan-400"
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </GlassmorphicCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript display */}
      <AnimatePresence>
        {hasTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 right-0 z-40"
          >
            <GlassmorphicCard variant="glass-subtle" className="p-3">
              {/* Transcript text */}
              <div className="text-sm text-white/90 mb-3">
                <span className="text-white font-medium">
                  {state.finalTranscript}
                </span>
                <span className="text-white/60 italic">
                  {state.currentTranscript}
                </span>
                {state.isListening && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-1 h-4 bg-cyan-400 ml-1"
                  />
                )}
              </div>

              {/* Confidence indicator */}
              {state.confidence > 0 && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex-1 h-1 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                      style={{ width: `${state.confidence * 100}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${state.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/60">
                    {Math.round(state.confidence * 100)}%
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <GlassmorphicButton
                    size="xs"
                    variant="accent-cyan"
                    onClick={sendCurrentTranscript}
                    disabled={!fullTranscript}
                  >
                    Send
                  </GlassmorphicButton>
                  <GlassmorphicButton
                    size="xs"
                    variant="glass-ghost"
                    onClick={clearTranscript}
                  >
                    Clear
                  </GlassmorphicButton>
                </div>
                
                <div className="text-xs text-white/40">
                  {state.isListening ? 'Listening...' : 'Paused'}
                </div>
              </div>
            </GlassmorphicCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-1 left-0 right-0 z-40"
          >
            <GlassmorphicCard variant="glass-danger" className="p-2">
              <div className="text-xs text-red-400 flex items-center space-x-1">
                <span>⚠️</span>
                <span>{state.error}</span>
                <button
                  onClick={() => setState(prev => ({ ...prev, error: null }))}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </GlassmorphicCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;