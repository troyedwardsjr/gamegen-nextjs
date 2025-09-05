"use client";

import { RealtimeChannel, RealtimeClient } from '@supabase/supabase-js';

export interface ChatWebSocketConfig {
  sessionId: string;
  userId: string;
  onMessageReceived?: (message: any) => void;
  onMessageUpdated?: (message: any) => void;
  onUserTyping?: (data: { userId: string; isTyping: boolean }) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

export class ChatWebSocket {
  private client: RealtimeClient | null = null;
  private channel: RealtimeChannel | null = null;
  private config: ChatWebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private typingTimeout: NodeJS.Timeout | null = null;

  constructor(config: ChatWebSocketConfig) {
    this.config = config;
    this.init();
  }

  private async init() {
    try {
      this.config.onStatusChange?.('connecting');
      
      // Get Supabase URL and key from environment
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      // Create Supabase realtime client
      this.client = new RealtimeClient(
        `${supabaseUrl.replace('https://', 'wss://').replace('http://', 'ws://')}/realtime/v1`,
        {
          apikey: supabaseKey,
          params: {
            eventsPerSecond: 30, // Rate limit for events
          },
          heartbeatIntervalMs: 30000,
          reconnectAfterMs: (tries) => {
            return Math.min(1000 * Math.pow(2, tries), 30000);
          },
        }
      );

      // Set up connection event listeners
      this.client.onOpen(() => {
        console.log('WebSocket connected');
        this.config.onStatusChange?.('connected');
        this.reconnectAttempts = 0;
        this.setupHeartbeat();
      });

      this.client.onClose(() => {
        console.log('WebSocket disconnected');
        this.config.onStatusChange?.('disconnected');
        this.cleanup();
        this.attemptReconnect();
      });

      this.client.onError((error) => {
        console.error('WebSocket error:', error);
        this.config.onStatusChange?.('error');
        this.config.onError?.(new Error(`WebSocket error: ${error}`));
      });

      // Create channel for the specific chat session
      this.channel = this.client.channel(`chat_session_${this.config.sessionId}`, {
        config: {
          presence: { key: this.config.userId },
          broadcast: { self: true },
        },
      });

      this.setupChannelListeners();
      
      // Connect to the channel
      await this.client.connect();
      this.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to chat channel');
          this.joinPresence();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to chat channel');
          this.config.onError?.(new Error('Failed to subscribe to chat channel'));
        }
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.config.onError?.(error as Error);
      this.config.onStatusChange?.('error');
    }
  }

  private setupChannelListeners() {
    if (!this.channel) return;

    // Listen for new messages
    this.channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${this.config.sessionId}`,
      },
      (payload) => {
        console.log('New message received:', payload.new);
        this.config.onMessageReceived?.(payload.new);
      }
    );

    // Listen for message updates (e.g., streaming updates)
    this.channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${this.config.sessionId}`,
      },
      (payload) => {
        console.log('Message updated:', payload.new);
        this.config.onMessageUpdated?.(payload.new);
      }
    );

    // Listen for typing indicators via broadcast
    this.channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.userId !== this.config.userId) {
        this.config.onUserTyping?.(payload);
      }
    });

    // Listen for message streaming events
    this.channel.on('broadcast', { event: 'message_stream' }, ({ payload }) => {
      this.handleStreamingMessage(payload);
    });

    // Listen for user presence changes
    this.channel.on('presence', { event: 'sync' }, () => {
      const presenceState = this.channel?.presenceState();
      console.log('Presence sync:', presenceState);
    });

    this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('User joined:', newPresences);
    });

    this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('User left:', leftPresences);
    });
  }

  private handleStreamingMessage(payload: any) {
    // Handle real-time streaming of AI responses
    if (payload.type === 'stream_chunk') {
      this.config.onMessageReceived?.({
        ...payload.message,
        content: payload.message.content + payload.chunk,
        isStreaming: true,
      });
    } else if (payload.type === 'stream_complete') {
      this.config.onMessageUpdated?.({
        ...payload.message,
        isStreaming: false,
      });
    } else if (payload.type === 'stream_error') {
      this.config.onError?.(new Error(payload.error));
    }
  }

  private joinPresence() {
    if (!this.channel) return;

    this.channel.track({
      user_id: this.config.userId,
      online_at: new Date().toISOString(),
      typing: false,
    });
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.channel && this.client?.isConnected()) {
        this.channel.send({
          type: 'heartbeat',
          event: 'ping',
          payload: { timestamp: Date.now() },
        });
      }
    }, 30000);
  }

  private cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.config.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.client && !this.client.isConnected()) {
        this.client.connect();
      }
    }, delay);
  }

  // Public methods
  public sendTypingIndicator(isTyping: boolean) {
    if (!this.channel) return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Send typing indicator
    this.channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: this.config.userId,
        isTyping,
        timestamp: Date.now(),
      },
    });

    // Update presence
    this.channel.track({
      user_id: this.config.userId,
      online_at: new Date().toISOString(),
      typing: isTyping,
    });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      this.typingTimeout = setTimeout(() => {
        this.sendTypingIndicator(false);
      }, 3000);
    }
  }

  public sendStreamingChunk(messageId: string, chunk: string, isComplete: boolean = false) {
    if (!this.channel) return;

    this.channel.send({
      type: 'broadcast',
      event: 'message_stream',
      payload: {
        type: isComplete ? 'stream_complete' : 'stream_chunk',
        messageId,
        chunk,
        timestamp: Date.now(),
      },
    });
  }

  public sendStreamingError(messageId: string, error: string) {
    if (!this.channel) return;

    this.channel.send({
      type: 'broadcast',
      event: 'message_stream',
      payload: {
        type: 'stream_error',
        messageId,
        error,
        timestamp: Date.now(),
      },
    });
  }

  public getPresenceState() {
    return this.channel?.presenceState() || {};
  }

  public isConnected(): boolean {
    return this.client?.isConnected() ?? false;
  }

  public disconnect() {
    this.cleanup();
    
    if (this.channel) {
      this.channel.untrack();
      this.channel.unsubscribe();
    }

    if (this.client) {
      this.client.disconnect();
    }
  }

  public updateConfig(newConfig: Partial<ChatWebSocketConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Helper function to create WebSocket connection
export function createChatWebSocket(config: ChatWebSocketConfig): ChatWebSocket {
  return new ChatWebSocket(config);
}

// WebSocket status type
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Typing indicator interface
export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

// Streaming message interface
export interface StreamingMessage {
  id: string;
  content: string;
  isStreaming: boolean;
  streamingChunks?: string[];
}