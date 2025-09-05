"use client";

import React, { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";

interface ChatMessage {
  id: string;
  type: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
  avatar?: string;
  username?: string;
  isStreaming?: boolean;
}

interface ChatContext {
  id: string;
  name: string;
  type: "game-design" | "code-help" | "art-generation" | "general";
  icon: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "system",
      content: "Welcome to GameGen! I'm your AI assistant ready to help you create amazing pixel art games. What would you like to build today?",
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "2",
      type: "user",
      content: "I want to create a retro platformer game with a cyberpunk theme. Can you help me get started?",
      timestamp: new Date(Date.now() - 30000),
      username: "You",
    },
    {
      id: "3",
      type: "ai",
      content: "Absolutely! A cyberpunk platformer sounds exciting. Let's start by creating the basic character and setting up the neon-lit environment. I'll help you with:\n\n1. Character design (cybernetic protagonist)\n2. Level architecture (futuristic buildings)\n3. Color palette (neon blues and purples)\n4. Game mechanics (wall-jumping, dash abilities)\n\nShall we begin with the character sprite?",
      timestamp: new Date(Date.now() - 15000),
      username: "GameGen AI",
      avatar: "🤖",
    },
  ]);

  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ChatContext>({
    id: "game-design",
    name: "Game Design",
    type: "game-design",
    icon: "🎮",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const contexts: ChatContext[] = [
    { id: "game-design", name: "Game Design", type: "game-design", icon: "🎮" },
    { id: "code-help", name: "Code Help", type: "code-help", icon: "💻" },
    { id: "art-generation", name: "Art Generation", type: "art-generation", icon: "🎨" },
    { id: "general", name: "General", type: "general", icon: "💬" },
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
      username: "You",
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "I understand! Let me help you with that. Based on your request, I'll generate some suggestions and assets for your cyberpunk platformer...",
        timestamp: new Date(),
        username: "GameGen AI",
        avatar: "🤖",
        isStreaming: true,
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

      // Simulate streaming effect
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }, 2000);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageVariant = (message: ChatMessage) => {
    switch (message.type) {
      case "user":
        return "accent-cyan";
      case "ai":
        return "gaming";
      case "system":
        return "subtle";
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <GlassmorphicCard {...GameGenCardPresets.chatPanel} className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{selectedContext.icon}</div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-white/60">{selectedContext.name}</p>
          </div>
        </div>
        
        <GlassmorphicBadge variant="gaming" size="sm">
          Online
        </GlassmorphicBadge>
      </div>

      {/* Context Selector */}
      <div className="p-3 border-b border-white/10">
        <div className="flex space-x-1">
          {contexts.map((context) => (
            <GlassmorphicButton
              key={context.id}
              variant={selectedContext.id === context.id ? "gaming" : "glass-ghost"}
              size="sm"
              onClick={() => setSelectedContext(context)}
              className="flex items-center space-x-1"
            >
              <span>{context.icon}</span>
              <span className="hidden sm:inline">{context.name}</span>
            </GlassmorphicButton>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={clsx(
                "flex",
                message.type === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={clsx(
                  "max-w-[80%] flex",
                  message.type === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                {message.type !== "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm mr-3 mt-1">
                    {message.avatar || "AI"}
                  </div>
                )}

                {/* Message Content */}
                <GlassmorphicCard
                  variant={getMessageVariant(message)}
                  blur="md"
                  className={clsx(
                    "flex-1",
                    message.type === "user" && "ml-3"
                  )}
                >
                  <div className="p-3">
                    {/* Username and Timestamp */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white/80">
                        {message.username}
                      </span>
                      <span className="text-xs text-white/50">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>

                    {/* Message Text */}
                    <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                      {message.content}
                      {message.isStreaming && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="inline-block w-2 h-4 bg-purple-400 ml-1"
                        />
                      )}
                    </div>
                  </div>
                </GlassmorphicCard>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <GlassmorphicInput
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your game..."
              variant="gaming"
              className="resize-none"
              disabled={isLoading}
            />
          </div>
          
          <GlassmorphicButton
            variant="gaming"
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? (
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
            <GlassmorphicButton variant="glass-ghost" size="sm">
              🎨 Generate Art
            </GlassmorphicButton>
            <GlassmorphicButton variant="glass-ghost" size="sm">
              🔧 Code Help
            </GlassmorphicButton>
            <GlassmorphicButton variant="glass-ghost" size="sm">
              🎵 Add Sound
            </GlassmorphicButton>
          </div>
          
          <div className="text-xs text-white/40">
            Shift+Enter for new line
          </div>
        </div>
      </div>
    </GlassmorphicCard>
  );
}