"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { useChat, ChatContext } from "@/hooks/useChat";
import { MessageRenderer } from "@/components/chat/MessageRenderer";
import { VoiceInput } from "@/components/chat/VoiceInput";
import { CreditUsageDisplay } from "@/components/chat/CreditUsageDisplay";
import { GAME_PROMPT_TEMPLATES, GAME_CATEGORIES, getPromptsByCategory, getPopularPrompts } from "@/lib/chat/prompts";
import { useAuth } from "@/lib/auth/context";

interface ChatPanelProps {
  gameId?: string;
  initialContext?: ChatContext['type'];
  className?: string;
}

export function ChatPanel({ gameId, initialContext = 'game-design', className }: ChatPanelProps) {
  const { user } = useAuth();
  const {
    // State
    session,
    messages,
    isLoading,
    isSending,
    error,
    wsStatus,
    currentMessage,
    contexts,
    hasMoreMessages,
    isLoadingMore,
    
    // Actions
    createSession,
    sendMessage,
    regenerateMessage,
    copyMessage,
    toggleFavorite,
    setCurrentMessage,
    loadMoreMessages,
    sendTypingIndicator,
    clearError,
  } = useChat({
    gameId,
    contextType: initialContext,
    autoConnect: true,
    enableWebSocket: true,
  });

  // Local state
  const [selectedContext, setSelectedContext] = useState<ChatContext>(
    contexts.find(c => c.type === initialContext) || contexts[0]
  );
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const [showCreditUsage, setShowCreditUsage] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isVoiceInputEnabled, setIsVoiceInputEnabled] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle scroll to load more messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  // Create new session when context changes
  useEffect(() => {
    if (user && selectedContext.type !== session?.context_type && !session) {
      createSession(selectedContext.type, gameId);
    }
  }, [selectedContext.type, session?.context_type, user, gameId]);

  // Handle voice transcription
  const handleVoiceTranscription = useCallback((text: string) => {
    setCurrentMessage(prev => prev + (prev ? ' ' : '') + text);
    inputRef.current?.focus();
  }, []);

  // Handle prompt template selection
  const handleTemplateSelect = useCallback(async (template: any) => {
    setCurrentMessage(template.prompt_text);
    setShowPromptTemplates(false);
    inputRef.current?.focus();
    
    // Track template usage
    try {
      await fetch(`/api/chat/templates/${template.id}/use`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to track template usage:', error);
    }
  }, []);

  // Handle message actions
  const handleCopyMessage = useCallback(async (messageId: string) => {
    await copyMessage(messageId);
  }, [copyMessage]);

  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    await regenerateMessage(messageId);
  }, [regenerateMessage]);

  const handleToggleFavorite = useCallback(async (messageId: string) => {
    await toggleFavorite(messageId);
  }, [toggleFavorite]);

  const handleReactToMessage = useCallback(async (messageId: string, reaction: string) => {
    // TODO: Implement reaction functionality
    console.log('React to message:', messageId, reaction);
  }, []);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isSending || !session) return;

    await sendMessage(currentMessage);
    
    // Clear input and focus
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCurrentMessage(value);
    
    // Send typing indicator
    if (value.length > 0) {
      sendTypingIndicator(true);
    } else {
      sendTypingIndicator(false);
    }
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Stop typing indicator when user stops typing
  useEffect(() => {
    const timeout = setTimeout(() => {
      sendTypingIndicator(false);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [currentMessage]);

  const getPromptTemplates = () => {
    if (selectedCategory) {
      return getPromptsByCategory(selectedCategory as any);
    }
    return getPopularPrompts();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    return (
      <GlassmorphicCard {...GameGenCardPresets.chatPanel} className={clsx("h-full flex items-center justify-center", className)}>
        <div className="text-center text-white/60">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-lg mb-2">Sign in to start chatting</p>
          <p className="text-sm">Access the AI assistant to help create your games</p>
        </div>
      </GlassmorphicCard>
    );
  }

  return (
    <GlassmorphicCard {...GameGenCardPresets.chatPanel} className={clsx("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{selectedContext.icon}</div>
          <div>
            <h3 className="font-semibold text-white flex items-center space-x-2">
              <span>AI Assistant</span>
              {session?.title && session.title !== 'New Chat Session' && (
                <span className="text-sm text-white/60">- {session.title}</span>
              )}
            </h3>
            <p className="text-xs text-white/60">{selectedContext.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* WebSocket status */}
          <GlassmorphicBadge 
            variant={wsStatus === 'connected' ? 'gaming' : wsStatus === 'connecting' ? 'warning' : 'danger'} 
            size="sm"
          >
            {wsStatus === 'connected' && '🟢 Live'}
            {wsStatus === 'connecting' && '🟡 Connecting'}
            {wsStatus === 'disconnected' && '🔴 Offline'}
            {wsStatus === 'error' && '⚠️ Error'}
          </GlassmorphicBadge>
          
          {/* Credit usage toggle */}
          <GlassmorphicButton
            size="sm"
            variant="glass-ghost"
            onClick={() => setShowCreditUsage(!showCreditUsage)}
            title="Toggle credit usage display"
          >
            💳
          </GlassmorphicButton>
        </div>
      </div>

      {/* Credit Usage Display */}
      <AnimatePresence>
        {showCreditUsage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-white/10"
          >
            <div className="p-4">
              <CreditUsageDisplay compact sessionId={session?.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Selector & Tools */}
      <div className="p-3 border-b border-white/10 space-y-3">
        {/* Context buttons */}
        <div className="flex space-x-1">
          {contexts.map((context) => (
            <GlassmorphicButton
              key={context.id}
              variant={selectedContext.id === context.id ? "gaming" : "glass-ghost"}
              size="sm"
              onClick={() => setSelectedContext(context)}
              className="flex items-center space-x-1"
              title={context.description || context.name}
            >
              <span>{context.icon}</span>
              <span className="hidden sm:inline">{context.name}</span>
            </GlassmorphicButton>
          ))}
        </div>
        
        {/* Tools row */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {/* Prompt templates */}
            <GlassmorphicButton
              variant="glass-ghost"
              size="sm"
              onClick={() => setShowPromptTemplates(!showPromptTemplates)}
              className="flex items-center space-x-1"
              title="Browse prompt templates"
            >
              <span>📚</span>
              <span className="hidden sm:inline">Templates</span>
            </GlassmorphicButton>
            
            {/* Voice input toggle */}
            <GlassmorphicButton
              variant={isVoiceInputEnabled ? "accent-cyan" : "glass-ghost"}
              size="sm"
              onClick={() => setIsVoiceInputEnabled(!isVoiceInputEnabled)}
              className="flex items-center space-x-1"
              title="Toggle voice input"
            >
              <span>🎤</span>
              <span className="hidden sm:inline">Voice</span>
            </GlassmorphicButton>
          </div>
          
          {/* Message count */}
          {session && (
            <div className="text-xs text-white/40">
              {messages.length} messages
            </div>
          )}
        </div>
      </div>

      {/* Prompt Templates Dropdown */}
      <AnimatePresence>
        {showPromptTemplates && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-white/10"
          >
            <div className="p-4 space-y-3">
              {/* Category filter */}
              <div className="flex flex-wrap gap-1">
                <GlassmorphicButton
                  size="xs"
                  variant={selectedCategory === null ? "gaming" : "glass-ghost"}
                  onClick={() => setSelectedCategory(null)}
                >
                  Popular
                </GlassmorphicButton>
                {GAME_CATEGORIES.map((category) => (
                  <GlassmorphicButton
                    key={category.id}
                    size="xs"
                    variant={selectedCategory === category.id ? "gaming" : "glass-ghost"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center space-x-1"
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </GlassmorphicButton>
                ))}
              </div>
              
              {/* Template list */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {getPromptTemplates().map((template) => (
                  <motion.button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{template.icon}</span>
                          <h4 className="font-medium text-white text-sm">{template.name}</h4>
                          {template.isPopular && (
                            <GlassmorphicBadge variant="accent-cyan" size="xs">Popular</GlassmorphicBadge>
                          )}
                        </div>
                        <p className="text-xs text-white/60 line-clamp-2">{template.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {template.difficulty && (
                            <span className="text-xs text-white/40">{template.difficulty}</span>
                          )}
                          {template.estimatedTime && (
                            <span className="text-xs text-white/40">• {template.estimatedTime}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="text-center py-2">
            <div className="inline-flex items-center space-x-2 text-white/60">
              <div className="w-4 h-4 animate-spin border-2 border-cyan-400 border-t-transparent rounded-full" />
              <span className="text-sm">Loading more messages...</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={clsx(
                "flex group",
                message.message_type === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={clsx(
                  "max-w-[80%] flex",
                  message.message_type === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                {message.message_type !== "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm mr-3 mt-1">
                    🤖
                  </div>
                )}

                {/* Message Content */}
                <GlassmorphicCard
                  variant={message.message_type === "user" ? "accent-cyan" : 
                          message.message_type === "ai" ? "gaming" : 
                          message.message_type === "system" ? "subtle" : "default"}
                  blur="md"
                  className={clsx(
                    "flex-1",
                    message.message_type === "user" && "ml-3"
                  )}
                >
                  <div className="p-3">
                    {/* Username and Timestamp */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-white/80">
                          {message.message_type === "user" ? "You" : "GameGen AI"}
                        </span>
                        {message.is_favorite && (
                          <span className="text-yellow-400 text-xs">⭐</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {message.total_tokens && (
                          <span className="text-xs text-white/40">
                            {message.total_tokens} tokens
                          </span>
                        )}
                        <span className="text-xs text-white/50">
                          {formatTimestamp(message.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Message Content */}
                    <MessageRenderer
                      message={message}
                      onCopy={handleCopyMessage}
                      onRegenerate={handleRegenerateMessage}
                      onToggleFavorite={handleToggleFavorite}
                      onReact={handleReactToMessage}
                    />
                  </div>
                </GlassmorphicCard>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {(isSending || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm mr-3">
                🤖
              </div>
              <GlassmorphicCard variant="gaming" blur="md">
                <div className="p-3 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-white/60">AI is thinking...</span>
                </div>
              </GlassmorphicCard>
            </div>
          </motion.div>
        )}

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex justify-center"
            >
              <GlassmorphicCard variant="glass-danger" className="p-3 max-w-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="text-sm text-red-400">{error}</span>
                  </div>
                  <GlassmorphicButton
                    size="xs"
                    variant="glass-ghost"
                    onClick={clearError}
                  >
                    ✕
                  </GlassmorphicButton>
                </div>
              </GlassmorphicCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={currentMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your game..."
              className="w-full bg-black/20 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-white/50 resize-none focus:outline-none focus:border-cyan-400 focus:bg-black/30 transition-all duration-200"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={isSending || !session}
              rows={1}
              aria-label="Chat message input"
            />
            
            {/* Voice input */}
            <AnimatePresence>
              {isVoiceInputEnabled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-2 top-2"
                >
                  <VoiceInput 
                    onTranscription={handleVoiceTranscription}
                    disabled={isSending || !session}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <GlassmorphicButton
            variant="gaming"
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isSending || !session}
            className="flex-shrink-0"
            aria-label="Send message"
          >
            {isSending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </GlassmorphicButton>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex space-x-2">
            <GlassmorphicButton 
              variant="glass-ghost" 
              size="sm"
              onClick={() => setCurrentMessage(currentMessage + "\n\nPlease generate pixel art sprites for:")}
            >
              🎨 Generate Art
            </GlassmorphicButton>
            <GlassmorphicButton 
              variant="glass-ghost" 
              size="sm"
              onClick={() => setCurrentMessage(currentMessage + "\n\nCan you help me code:")}
            >
              🔧 Code Help
            </GlassmorphicButton>
            <GlassmorphicButton 
              variant="glass-ghost" 
              size="sm"
              onClick={() => setCurrentMessage(currentMessage + "\n\nI need sound effects for:")}
            >
              🎵 Add Sound
            </GlassmorphicButton>
          </div>
          
          <div className="text-xs text-white/40">
            {session ? 'Shift+Enter for new line' : 'Create session to chat'}
          </div>
        </div>
      </div>
    </GlassmorphicCard>
  );
}

export default ChatPanel;