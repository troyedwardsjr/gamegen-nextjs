/**
 * Toxoid WebSocket Manager
 *
 * Real-time WebSocket communication system for hot-reloading Toxoid scripts.
 * Provides bidirectional communication between the GameGen editor and
 * running game instances with version control and error handling.
 */

import { WebSocket } from "ws";

import { ScriptHotReloadEvent, WebSocketScriptMessage } from "@/types/toxoid";

interface WebSocketClient {
  id: string;
  socket: WebSocket;
  userId?: string;
  sessionId?: string;
  subscribedScripts: Set<string>;
  lastPing: number;
  isAlive: boolean;
}

interface ScriptVersion {
  scriptId: string;
  version: number;
  content: string;
  timestamp: Date;
  userId?: string;
  validated: boolean;
  errors?: string[];
}

interface HotReloadSession {
  sessionId: string;
  clients: Set<string>;
  scripts: Map<string, ScriptVersion>;
  rollbackVersions: Map<string, ScriptVersion[]>;
}

interface WebSocketConfig {
  port: number;
  pingInterval: number;
  maxConnections: number;
  maxScriptSize: number;
  enableCompression: boolean;
  corsOrigins: string[];
}

export class ToxoidWebSocketManager {
  private wss: any; // WebSocket.Server
  private clients: Map<string, WebSocketClient>;
  private sessions: Map<string, HotReloadSession>;
  private config: WebSocketConfig;
  private pingTimer: NodeJS.Timeout | null;
  private isShuttingDown: boolean;

  constructor(config?: Partial<WebSocketConfig>) {
    this.clients = new Map();
    this.sessions = new Map();
    this.isShuttingDown = false;
    this.pingTimer = null;

    this.config = {
      port: 8080,
      pingInterval: 30000, // 30 seconds
      maxConnections: 100,
      maxScriptSize: 1024 * 1024, // 1MB
      enableCompression: true,
      corsOrigins: ["http://localhost:3000", "https://gamegen.dev"],
      ...config,
    };
  }

  /**
   * Initialize WebSocket server
   */
  async initialize(): Promise<void> {
    try {
      // Import WebSocket server dynamically to avoid SSR issues
      const { WebSocketServer } = await import("ws");

      this.wss = new WebSocketServer({
        port: this.config.port,
        perMessageDeflate: this.config.enableCompression,
        maxPayload: this.config.maxScriptSize,
      });

      this.setupWebSocketHandlers();
      this.startPingTimer();

      console.log(
        `[WebSocket] Toxoid hot-reload server listening on port ${this.config.port}`,
      );
    } catch (error) {
      console.error("[WebSocket] Failed to initialize server:", error);
      throw new Error(
        `WebSocket server initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Shutdown WebSocket server gracefully
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Stop ping timer
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    // Close all client connections
    const closePromises = Array.from(this.clients.values()).map((client) =>
      this.closeClient(client.id, 1001, "Server shutting down"),
    );

    await Promise.all(closePromises);

    // Close server
    if (this.wss) {
      return new Promise((resolve) => {
        this.wss.close(() => {
          console.log("[WebSocket] Server shut down successfully");
          resolve();
        });
      });
    }
  }

  /**
   * Broadcast script update to all subscribed clients
   */
  async broadcastScriptUpdate(
    scriptId: string,
    content: string,
    userId?: string,
    sessionId?: string,
  ): Promise<void> {
    try {
      const session = sessionId ? this.sessions.get(sessionId) : null;
      const newVersion = this.createScriptVersion(scriptId, content, userId);

      // Update session if exists
      if (session) {
        // Store rollback version before updating
        const currentVersion = session.scripts.get(scriptId);

        if (currentVersion) {
          this.addRollbackVersion(session, scriptId, currentVersion);
        }

        session.scripts.set(scriptId, newVersion);
      }

      const event: ScriptHotReloadEvent = {
        type: "script_updated",
        scriptId,
        script: content,
        version: newVersion.version,
        timestamp: newVersion.timestamp,
      };

      // Broadcast to all subscribed clients
      const subscribedClients = Array.from(this.clients.values()).filter(
        (client) =>
          client.subscribedScripts.has(scriptId) &&
          (!sessionId || client.sessionId === sessionId),
      );

      const broadcastPromises = subscribedClients.map((client) =>
        this.sendToClient(client.id, {
          action: "update_script",
          scriptId,
          script: content,
          userId,
          sessionId,
        }),
      );

      await Promise.all(broadcastPromises);

      console.log(
        `[WebSocket] Broadcasted script update for ${scriptId} to ${subscribedClients.length} clients`,
      );
    } catch (error) {
      console.error("[WebSocket] Failed to broadcast script update:", error);
      throw error;
    }
  }

  /**
   * Send validation error to specific client or session
   */
  async sendValidationError(
    scriptId: string,
    errors: string[],
    clientId?: string,
    sessionId?: string,
  ): Promise<void> {
    const event: ScriptHotReloadEvent = {
      type: "script_error",
      scriptId,
      error: errors.join("\n"),
      version: Date.now(),
      timestamp: new Date(),
    };

    if (clientId) {
      await this.sendEventToClient(clientId, event);
    } else if (sessionId) {
      await this.broadcastToSession(sessionId, event);
    } else {
      console.warn(
        "[WebSocket] Cannot send validation error: no target specified",
      );
    }
  }

  /**
   * Rollback script to previous version
   */
  async rollbackScript(
    scriptId: string,
    sessionId: string,
    versionsBack: number = 1,
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      console.warn(`[WebSocket] Session ${sessionId} not found for rollback`);

      return false;
    }

    const rollbackVersions = session.rollbackVersions.get(scriptId);

    if (!rollbackVersions || rollbackVersions.length < versionsBack) {
      console.warn(
        `[WebSocket] Not enough rollback versions for script ${scriptId}`,
      );

      return false;
    }

    const targetVersion =
      rollbackVersions[rollbackVersions.length - versionsBack];

    // Update current version
    session.scripts.set(scriptId, { ...targetVersion, version: Date.now() });

    // Remove used rollback versions
    rollbackVersions.splice(-versionsBack);

    // Broadcast rollback
    await this.broadcastScriptUpdate(
      scriptId,
      targetVersion.content,
      targetVersion.userId,
      sessionId,
    );

    console.log(
      `[WebSocket] Rolled back script ${scriptId} by ${versionsBack} version(s)`,
    );

    return true;
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    clientCount: number;
    scriptCount: number;
    totalRollbackVersions: number;
  } | null {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    return {
      clientCount: session.clients.size,
      scriptCount: session.scripts.size,
      totalRollbackVersions: Array.from(
        session.rollbackVersions.values(),
      ).reduce((total, versions) => total + versions.length, 0),
    };
  }

  /**
   * Setup WebSocket server event handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on("connection", (socket: WebSocket, request: any) => {
      this.handleNewConnection(socket, request);
    });

    this.wss.on("error", (error: Error) => {
      console.error("[WebSocket] Server error:", error);
    });

    this.wss.on("listening", () => {
      console.log(
        `[WebSocket] Server is listening on port ${this.config.port}`,
      );
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleNewConnection(socket: WebSocket, request: any): void {
    if (this.isShuttingDown) {
      socket.close(1012, "Server is shutting down");

      return;
    }

    if (this.clients.size >= this.config.maxConnections) {
      socket.close(1013, "Maximum connections exceeded");

      return;
    }

    // Check origin if configured
    const origin = request.headers.origin;

    if (
      this.config.corsOrigins.length > 0 &&
      !this.config.corsOrigins.includes(origin)
    ) {
      console.warn(
        `[WebSocket] Rejected connection from unauthorized origin: ${origin}`,
      );
      socket.close(1008, "Unauthorized origin");

      return;
    }

    const clientId = this.generateClientId();
    const client: WebSocketClient = {
      id: clientId,
      socket,
      subscribedScripts: new Set(),
      lastPing: Date.now(),
      isAlive: true,
    };

    this.clients.set(clientId, client);

    // Setup client event handlers
    socket.on("message", (data: Buffer) => {
      this.handleClientMessage(clientId, data);
    });

    socket.on("close", (code: number, reason: Buffer) => {
      this.handleClientDisconnect(clientId, code, reason.toString());
    });

    socket.on("error", (error: Error) => {
      console.error(`[WebSocket] Client ${clientId} error:`, error);
      this.handleClientDisconnect(clientId, 1011, "Connection error");
    });

    socket.on("pong", () => {
      client.isAlive = true;
      client.lastPing = Date.now();
    });

    console.log(`[WebSocket] New client connected: ${clientId}`);

    // Send welcome message
    this.sendToClient(clientId, {
      action: "welcome",
      clientId,
      serverTime: new Date().toISOString(),
    });
  }

  /**
   * Handle message from client
   */
  private async handleClientMessage(
    clientId: string,
    data: Buffer,
  ): Promise<void> {
    const client = this.clients.get(clientId);

    if (!client) return;

    try {
      const message: WebSocketScriptMessage = JSON.parse(data.toString());

      switch (message.action) {
        case "subscribe":
          await this.handleSubscribe(clientId, message);
          break;
        case "unsubscribe":
          await this.handleUnsubscribe(clientId, message);
          break;
        case "update_script":
          await this.handleScriptUpdate(clientId, message);
          break;
        case "validate_script":
          await this.handleScriptValidation(clientId, message);
          break;
        default:
          console.warn(
            `[WebSocket] Unknown action from client ${clientId}: ${message.action}`,
          );
      }
    } catch (error) {
      console.error(
        `[WebSocket] Failed to handle message from client ${clientId}:`,
        error,
      );

      this.sendToClient(clientId, {
        action: "error",
        message: "Failed to process message",
      });
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(
    clientId: string,
    code: number,
    reason: string,
  ): void {
    const client = this.clients.get(clientId);

    if (!client) return;

    // Remove client from sessions
    this.sessions.forEach((session) => {
      session.clients.delete(clientId);
    });

    // Remove client
    this.clients.delete(clientId);

    console.log(
      `[WebSocket] Client ${clientId} disconnected (${code}): ${reason}`,
    );
  }

  /**
   * Handle subscription request
   */
  private async handleSubscribe(
    clientId: string,
    message: WebSocketScriptMessage,
  ): Promise<void> {
    const client = this.clients.get(clientId);

    if (!client || !message.scriptId) return;

    client.subscribedScripts.add(message.scriptId);

    if (message.userId) {
      client.userId = message.userId;
    }

    if (message.sessionId) {
      client.sessionId = message.sessionId;

      // Add client to session
      let session = this.sessions.get(message.sessionId);

      if (!session) {
        session = {
          sessionId: message.sessionId,
          clients: new Set(),
          scripts: new Map(),
          rollbackVersions: new Map(),
        };
        this.sessions.set(message.sessionId, session);
      }

      session.clients.add(clientId);
    }

    await this.sendToClient(clientId, {
      action: "subscribed",
      scriptId: message.scriptId,
      sessionId: message.sessionId,
    });

    console.log(
      `[WebSocket] Client ${clientId} subscribed to script ${message.scriptId}`,
    );
  }

  /**
   * Handle unsubscription request
   */
  private async handleUnsubscribe(
    clientId: string,
    message: WebSocketScriptMessage,
  ): Promise<void> {
    const client = this.clients.get(clientId);

    if (!client || !message.scriptId) return;

    client.subscribedScripts.delete(message.scriptId);

    await this.sendToClient(clientId, {
      action: "unsubscribed",
      scriptId: message.scriptId,
    });

    console.log(
      `[WebSocket] Client ${clientId} unsubscribed from script ${message.scriptId}`,
    );
  }

  /**
   * Handle script update from client
   */
  private async handleScriptUpdate(
    clientId: string,
    message: WebSocketScriptMessage,
  ): Promise<void> {
    if (!message.scriptId || !message.script) {
      await this.sendToClient(clientId, {
        action: "error",
        message: "Missing scriptId or script content",
      });

      return;
    }

    if (message.script.length > this.config.maxScriptSize) {
      await this.sendToClient(clientId, {
        action: "error",
        message: `Script too large (max ${this.config.maxScriptSize} bytes)`,
      });

      return;
    }

    // Broadcast update to other clients (not the sender)
    await this.broadcastScriptUpdate(
      message.scriptId,
      message.script,
      message.userId,
      message.sessionId,
    );
  }

  /**
   * Handle script validation request
   */
  private async handleScriptValidation(
    clientId: string,
    message: WebSocketScriptMessage,
  ): Promise<void> {
    if (!message.scriptId || !message.script) {
      await this.sendToClient(clientId, {
        action: "error",
        message: "Missing scriptId or script content",
      });

      return;
    }

    // In a full implementation, this would integrate with the script validator
    // For now, send a mock validation response
    const event: ScriptHotReloadEvent = {
      type: "script_validated",
      scriptId: message.scriptId,
      version: Date.now(),
      timestamp: new Date(),
    };

    await this.sendEventToClient(clientId, event);
  }

  /**
   * Send message to specific client
   */
  private async sendToClient(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);

    if (!client || client.socket.readyState !== WebSocket.OPEN) return;

    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(
        `[WebSocket] Failed to send message to client ${clientId}:`,
        error,
      );
      this.handleClientDisconnect(clientId, 1011, "Send failed");
    }
  }

  /**
   * Send event to specific client
   */
  private async sendEventToClient(
    clientId: string,
    event: ScriptHotReloadEvent,
  ): Promise<void> {
    await this.sendToClient(clientId, {
      action: "event",
      event,
    });
  }

  /**
   * Broadcast to all clients in session
   */
  private async broadcastToSession(
    sessionId: string,
    event: ScriptHotReloadEvent,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) return;

    const broadcastPromises = Array.from(session.clients).map((clientId) =>
      this.sendEventToClient(clientId, event),
    );

    await Promise.all(broadcastPromises);
  }

  /**
   * Close specific client connection
   */
  private async closeClient(
    clientId: string,
    code: number,
    reason: string,
  ): Promise<void> {
    const client = this.clients.get(clientId);

    if (!client) return;

    return new Promise((resolve) => {
      client.socket.close(code, reason);
      client.socket.on("close", () => resolve());
    });
  }

  /**
   * Start ping timer for keeping connections alive
   */
  private startPingTimer(): void {
    this.pingTimer = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (client.socket.readyState !== WebSocket.OPEN) {
          this.handleClientDisconnect(clientId, 1006, "Connection lost");

          return;
        }

        if (!client.isAlive) {
          console.warn(
            `[WebSocket] Client ${clientId} did not respond to ping, terminating`,
          );
          client.socket.terminate();

          return;
        }

        client.isAlive = false;
        client.socket.ping();
      });
    }, this.config.pingInterval);
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create new script version
   */
  private createScriptVersion(
    scriptId: string,
    content: string,
    userId?: string,
  ): ScriptVersion {
    return {
      scriptId,
      version: Date.now(),
      content,
      timestamp: new Date(),
      userId,
      validated: false,
    };
  }

  /**
   * Add version to rollback history
   */
  private addRollbackVersion(
    session: HotReloadSession,
    scriptId: string,
    version: ScriptVersion,
  ): void {
    let rollbackVersions = session.rollbackVersions.get(scriptId);

    if (!rollbackVersions) {
      rollbackVersions = [];
      session.rollbackVersions.set(scriptId, rollbackVersions);
    }

    rollbackVersions.push(version);

    // Keep only last 10 versions
    if (rollbackVersions.length > 10) {
      rollbackVersions.shift();
    }
  }
}

export default ToxoidWebSocketManager;
