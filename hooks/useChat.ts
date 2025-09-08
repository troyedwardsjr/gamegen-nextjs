"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { createClient } from "@/lib/supabase/client";
import { ChatWebSocket, WebSocketStatus } from "@/lib/chat/websocket";
import { useAuth } from "@/lib/auth/context";
import { useToast } from "@/hooks/use-toast";

// Types
export interface ChatMessage {
  id: string;
  session_id: string;
  parent_message_id?: string;
  sequence_number: number;
  message_type: "user" | "ai" | "system" | "error";
  content: string;
  raw_content?: string;
  metadata?: Record<string, any>;
  model_used?: string;
  provider_id?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost_cents?: number;
  status: "sending" | "sent" | "delivered" | "error" | "regenerating";
  is_streaming?: boolean;
  is_favorite?: boolean;
  is_edited?: boolean;
  edit_history?: any[];
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  context_type: "game-design" | "code-help" | "art-generation" | "general";
  game_id?: string;
  status: "active" | "archived" | "completed";
  metadata?: Record<string, any>;
  settings?: Record<string, any>;
  total_messages: number;
  total_tokens_used: number;
  total_cost_cents: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface ChatContext {
  id: string;
  name: string;
  type: "game-design" | "code-help" | "art-generation" | "general";
  icon: string;
  description?: string;
}

export interface UseChatOptions {
  sessionId?: string;
  contextType?: ChatContext["type"];
  gameId?: string;
  autoConnect?: boolean;
  enableWebSocket?: boolean;
}

export interface ChatState {
  // Session data
  session: ChatSession | null;
  messages: ChatMessage[];

  // UI state
  isLoading: boolean;
  isConnecting: boolean;
  isSending: boolean;
  error: string | null;

  // WebSocket state
  wsStatus: WebSocketStatus;
  isConnected: boolean;
  typingUsers: string[];

  // Message state
  currentMessage: string;
  editingMessageId: string | null;
  replyToMessageId: string | null;

  // Pagination
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
}

export interface ChatActions {
  // Session management
  createSession: (
    contextType: ChatContext["type"],
    gameId?: string,
  ) => Promise<ChatSession>;
  loadSession: (sessionId: string) => Promise<void>;
  updateSession: (updates: Partial<ChatSession>) => Promise<void>;
  archiveSession: () => Promise<void>;

  // Message management
  sendMessage: (content: string, parentId?: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;

  // Message actions
  toggleFavorite: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, reactionType: string) => Promise<void>;
  removeReaction: (messageId: string, reactionType: string) => Promise<void>;
  copyMessage: (messageId: string) => Promise<void>;
  shareMessage: (messageId: string) => Promise<string>;

  // UI actions
  setCurrentMessage: (message: string) => void;
  setEditingMessage: (messageId: string | null) => void;
  setReplyToMessage: (messageId: string | null) => void;
  clearError: () => void;

  // WebSocket actions
  sendTypingIndicator: (isTyping: boolean) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const MESSAGES_PER_PAGE = 50;
const DEFAULT_CONTEXTS: ChatContext[] = [
  {
    id: "game-design",
    name: "Game Design",
    type: "game-design",
    icon: "🎮",
    description: "Get help with game mechanics, story, and design",
  },
  {
    id: "code-help",
    name: "Code Help",
    type: "code-help",
    icon: "💻",
    description: "Programming assistance and code reviews",
  },
  {
    id: "art-generation",
    name: "Art Generation",
    type: "art-generation",
    icon: "🎨",
    description: "Create pixel art and game assets",
  },
  {
    id: "general",
    name: "General",
    type: "general",
    icon: "💬",
    description: "General conversation and brainstorming",
  },
];

export function useChat(options: UseChatOptions = {}): ChatState & ChatActions {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  // State
  const [state, setState] = useState<ChatState>({
    session: null,
    messages: [],
    isLoading: false,
    isConnecting: false,
    isSending: false,
    error: null,
    wsStatus: "disconnected",
    isConnected: false,
    typingUsers: [],
    currentMessage: "",
    editingMessageId: null,
    replyToMessageId: null,
    hasMoreMessages: true,
    isLoadingMore: false,
  });

  // Refs
  const wsRef = useRef<ChatWebSocket | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);

  // WebSocket handlers
  const handleMessageReceived = useCallback((message: any) => {
    setState((prev) => {
      const existingIndex = prev.messages.findIndex((m) => m.id === message.id);

      if (existingIndex >= 0) {
        // Update existing message (for streaming)
        const updatedMessages = [...prev.messages];

        updatedMessages[existingIndex] = message;

        return { ...prev, messages: updatedMessages };
      } else {
        // Add new message
        return {
          ...prev,
          messages: [...prev.messages, message].sort(
            (a, b) => a.sequence_number - b.sequence_number,
          ),
        };
      }
    });
  }, []);

  const handleMessageUpdated = useCallback((message: any) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === message.id ? message : m)),
    }));
  }, []);

  const handleUserTyping = useCallback(
    (data: { userId: string; isTyping: boolean }) => {
      setState((prev) => ({
        ...prev,
        typingUsers: data.isTyping
          ? [
              ...prev.typingUsers.filter((id) => id !== data.userId),
              data.userId,
            ]
          : prev.typingUsers.filter((id) => id !== data.userId),
      }));
    },
    [],
  );

  const handleWebSocketError = useCallback(
    (error: Error) => {
      console.error("WebSocket error:", error);
      setState((prev) => ({ ...prev, error: error.message }));
      toast({
        title: "Connection Error",
        description:
          "Lost connection to chat server. Attempting to reconnect...",
        variant: "destructive",
      });
    },
    [toast],
  );

  const handleStatusChange = useCallback(
    (status: WebSocketStatus) => {
      setState((prev) => ({
        ...prev,
        wsStatus: status,
        isConnected: status === "connected",
      }));

      if (status === "connected") {
        toast({
          title: "Connected",
          description: "Successfully connected to chat server",
        });
      }
    },
    [toast],
  );

  // Initialize WebSocket
  const initializeWebSocket = useCallback(async () => {
    if (!user || !state.session?.id || !options.enableWebSocket) return;

    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    wsRef.current = new ChatWebSocket({
      sessionId: state.session.id,
      userId: user.id,
      onMessageReceived: handleMessageReceived,
      onMessageUpdated: handleMessageUpdated,
      onUserTyping: handleUserTyping,
      onError: handleWebSocketError,
      onStatusChange: handleStatusChange,
    });
  }, [
    user,
    state.session?.id,
    options.enableWebSocket,
    handleMessageReceived,
    handleMessageUpdated,
    handleUserTyping,
    handleWebSocketError,
    handleStatusChange,
  ]);

  // Session management
  const createSession = useCallback(
    async (
      contextType: ChatContext["type"],
      gameId?: string,
    ): Promise<ChatSession> => {
      if (!user) throw new Error("User not authenticated");

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const { data, error } = await (supabase as any)
          .from("chat_sessions")
          .insert({
            user_id: user.id,
            context_type: contextType,
            game_id: gameId,
            title: "New Chat Session",
          })
          .select()
          .single();

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          session: data,
          messages: [],
          isLoading: false,
        }));

        return data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create session";

        setState((prev) => ({ ...prev, error: message, isLoading: false }));
        throw error;
      }
    },
    [user, supabase],
  );

  const loadSession = useCallback(
    async (sessionId: string) => {
      if (!user) throw new Error("User not authenticated");

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Load session data
        const { data: session, error: sessionError } = await (supabase as any)
          .from("chat_sessions")
          .select("*")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single();

        if (sessionError) throw sessionError;

        // Load recent messages
        const { data: messages, error: messagesError } = await (supabase as any)
          .from("chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("sequence_number", { ascending: true })
          .limit(MESSAGES_PER_PAGE);

        if (messagesError) throw messagesError;

        setState((prev) => ({
          ...prev,
          session,
          messages: messages || [],
          isLoading: false,
          hasMoreMessages: (messages?.length || 0) >= MESSAGES_PER_PAGE,
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load session";

        setState((prev) => ({ ...prev, error: message, isLoading: false }));
        throw error;
      }
    },
    [user, supabase],
  );

  const loadMoreMessages = useCallback(async () => {
    if (!state.session || state.isLoadingMore || !state.hasMoreMessages) return;

    setState((prev) => ({ ...prev, isLoadingMore: true }));

    try {
      const oldestMessage = state.messages[0];
      const { data, error } = await (supabase as any)
        .from("chat_messages")
        .select("*")
        .eq("session_id", state.session.id)
        .lt("sequence_number", oldestMessage?.sequence_number || 0)
        .order("sequence_number", { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (error) throw error;

      const newMessages = (data || []).reverse();

      setState((prev) => ({
        ...prev,
        messages: [...newMessages, ...prev.messages],
        isLoadingMore: false,
        hasMoreMessages: newMessages.length >= MESSAGES_PER_PAGE,
      }));
    } catch (error) {
      console.error("Failed to load more messages:", error);
      setState((prev) => ({ ...prev, isLoadingMore: false }));
    }
  }, [
    state.session,
    state.messages,
    state.isLoadingMore,
    state.hasMoreMessages,
    supabase,
  ]);

  // Message management
  const sendMessage = useCallback(
    async (content: string, parentId?: string) => {
      if (!user || !state.session || !content.trim()) return;

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState((prev) => ({ ...prev, isSending: true, error: null }));

      try {
        // Create user message
        const userMessage: Omit<
          ChatMessage,
          "id" | "created_at" | "updated_at"
        > = {
          session_id: state.session.id,
          parent_message_id: parentId,
          sequence_number: 0, // Will be auto-assigned by trigger
          message_type: "user",
          content: content.trim(),
          status: "sending",
        };

        const { data: savedMessage, error: messageError } = await (
          supabase as any
        )
          .from("chat_messages")
          .insert(userMessage)
          .select()
          .single();

        if (messageError) throw messageError;

        // Update local state immediately
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, savedMessage],
          currentMessage: "",
        }));

        // Send to AI API
        const response = await fetch("/api/chat/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: state.session.id,
            messageId: savedMessage.id,
            content: content.trim(),
            contextType: state.session.context_type,
            gameId: state.session.game_id,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let aiMessage: ChatMessage | null = null;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === "message_start") {
                    aiMessage = data.message;
                    setState((prev) => ({
                      ...prev,
                      messages: [...prev.messages, aiMessage!],
                    }));
                  } else if (data.type === "content_delta" && aiMessage) {
                    aiMessage = {
                      ...aiMessage!,
                      content: aiMessage.content + data.delta,
                      is_streaming: true,
                    };
                    setState((prev) => ({
                      ...prev,
                      messages: prev.messages.map((m) =>
                        m.id === aiMessage!.id ? aiMessage! : m,
                      ),
                    }));
                  } else if (data.type === "message_stop" && aiMessage) {
                    aiMessage = {
                      ...aiMessage!,
                      is_streaming: false,
                      status: "delivered",
                      ...data.message,
                    };
                    setState((prev) => ({
                      ...prev,
                      messages: prev.messages.map((m) =>
                        m.id === aiMessage!.id ? aiMessage! : m,
                      ),
                    }));
                  } else if (data.type === "error") {
                    throw new Error(data.error);
                  }
                } catch (parseError) {
                  console.error("Failed to parse streaming data:", parseError);
                }
              }
            }
          }
        }

        setState((prev) => ({ ...prev, isSending: false }));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Request aborted");

          return;
        }

        console.error("Failed to send message:", error);
        const message =
          error instanceof Error ? error.message : "Failed to send message";

        setState((prev) => ({
          ...prev,
          error: message,
          isSending: false,
          messages: prev.messages.map((m) =>
            m.status === "sending" ? { ...m, status: "error" } : m,
          ),
        }));

        toast({
          title: "Failed to send message",
          description: message,
          variant: "destructive",
        });
      }
    },
    [user, state.session, supabase, toast],
  );

  // Other message actions
  const regenerateMessage = useCallback(
    async (messageId: string) => {
      // Find the message and its parent
      const message = state.messages.find((m) => m.id === messageId);

      if (!message || message.message_type !== "ai") return;

      const parentMessage = state.messages.find(
        (m) => m.id === message.parent_message_id,
      );

      if (!parentMessage) return;

      // Mark message as regenerating
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === messageId ? { ...m, status: "regenerating" } : m,
        ),
      }));

      // Resend parent message
      await sendMessage(parentMessage.content, parentMessage.parent_message_id);
    },
    [state.messages, sendMessage],
  );

  const toggleFavorite = useCallback(
    async (messageId: string) => {
      const message = state.messages.find((m) => m.id === messageId);

      if (!message) return;

      try {
        const { error } = await (supabase as any)
          .from("chat_messages")
          .update({ is_favorite: !message.is_favorite })
          .eq("id", messageId);

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === messageId ? { ...m, is_favorite: !m.is_favorite } : m,
          ),
        }));
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        toast({
          title: "Failed to update favorite",
          description: "Please try again",
          variant: "destructive",
        });
      }
    },
    [state.messages, supabase, toast],
  );

  const copyMessage = useCallback(
    async (messageId: string) => {
      const message = state.messages.find((m) => m.id === messageId);

      if (!message) return;

      try {
        await navigator.clipboard.writeText(message.content);
        toast({
          title: "Copied to clipboard",
          description: "Message content has been copied",
        });
      } catch (error) {
        console.error("Failed to copy message:", error);
        toast({
          title: "Failed to copy",
          description: "Please try selecting and copying manually",
          variant: "destructive",
        });
      }
    },
    [state.messages, toast],
  );

  // WebSocket actions
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    wsRef.current?.sendTypingIndicator(isTyping);
  }, []);

  const connect = useCallback(async () => {
    await initializeWebSocket();
  }, [initializeWebSocket]);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
  }, []);

  // Simple setters
  const setCurrentMessage = useCallback((message: string) => {
    setState((prev) => ({ ...prev, currentMessage: message }));
  }, []);

  const setEditingMessage = useCallback((messageId: string | null) => {
    setState((prev) => ({ ...prev, editingMessageId: messageId }));
  }, []);

  const setReplyToMessage = useCallback((messageId: string | null) => {
    setState((prev) => ({ ...prev, replyToMessageId: messageId }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Auto-initialize
  useEffect(() => {
    if (options.sessionId && user) {
      loadSession(options.sessionId);
    } else if (options.autoConnect && user && options.contextType) {
      createSession(options.contextType, options.gameId);
    }
  }, [
    options.sessionId,
    options.autoConnect,
    options.contextType,
    options.gameId,
    user,
  ]);

  // Initialize WebSocket when session is ready
  useEffect(() => {
    if (state.session && options.enableWebSocket) {
      initializeWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [state.session, options.enableWebSocket, initializeWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, []);

  // Computed values
  const contexts = useMemo(() => DEFAULT_CONTEXTS, []);
  const isConnected = useMemo(
    () => state.wsStatus === "connected",
    [state.wsStatus],
  );

  return {
    // State
    ...state,

    // Computed
    isConnected,

    // Actions
    createSession,
    loadSession,
    updateSession: async () => {}, // TODO: Implement
    archiveSession: async () => {}, // TODO: Implement
    sendMessage,
    regenerateMessage,
    editMessage: async () => {}, // TODO: Implement
    deleteMessage: async () => {}, // TODO: Implement
    loadMoreMessages,
    toggleFavorite,
    addReaction: async () => {}, // TODO: Implement
    removeReaction: async () => {}, // TODO: Implement
    copyMessage,
    shareMessage: async () => "", // TODO: Implement
    setCurrentMessage,
    setEditingMessage,
    setReplyToMessage,
    clearError,
    sendTypingIndicator,
    connect,
    disconnect,
  };
}

// Helper hook for chat contexts
export function useChatContexts() {
  return DEFAULT_CONTEXTS;
}
