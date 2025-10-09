/**
 * Intelligence WebSocket Server
 * 
 * Provides real-time intelligence updates to clients during meetings
 * with efficient connection management and message routing.
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const IntelligenceOrchestrator = require('../services/intelligence-orchestrator');

class IntelligenceWebSocketServer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      port: options.port || 3001,
      heartbeatInterval: 30000, // 30 seconds
      maxConnections: 1000,
      messageRateLimit: 100, // messages per minute
      ...options
    };
    
    this.wss = null;
    this.connections = new Map(); // connectionId -> connection info
    this.meetingRooms = new Map(); // meetingId -> Set of connectionIds
    this.messageRouter = new MessageRouter();
    this.rateLimiter = new RateLimiter(this.options.messageRateLimit);
    
    // Intelligence orchestrator
    this.orchestrator = new IntelligenceOrchestrator();
    
    // Performance metrics
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      messagesProcessed: 0,
      messagesSent: 0,
      errors: 0
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the WebSocket server
   */
  async initialize() {
    try {
      console.log('Initializing Intelligence WebSocket Server...');
      
      // Initialize intelligence orchestrator
      await this.orchestrator.initialize();
      
      // Create WebSocket server
      this.wss = new WebSocket.Server({
        port: this.options.port,
        perMessageDeflate: false,
        maxPayload: 1024 * 1024 // 1MB max message size
      });
      
      // Set up WebSocket event handlers
      this.setupWebSocketHandlers();
      
      // Set up orchestrator event handlers
      this.setupOrchestratorHandlers();
      
      // Start heartbeat mechanism
      this.startHeartbeat();
      
      // Start cleanup routine
      this.startCleanupRoutine();
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log(`✓ Intelligence WebSocket Server listening on port ${this.options.port}`);
      
    } catch (error) {
      console.error('✗ Failed to initialize Intelligence WebSocket Server:', error);
      throw error;
    }
  }
  
  /**
   * Set up WebSocket server event handlers
   */
  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, request) => {
      this.handleNewConnection(ws, request);
    });
    
    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
      this.metrics.errors++;
      this.emit('error', error);
    });
    
    this.wss.on('close', () => {
      console.log('WebSocket server closed');
      this.emit('closed');
    });
  }
  
  /**
   * Set up intelligence orchestrator event handlers
   */
  setupOrchestratorHandlers() {
    this.orchestrator.on('intelligenceProcessed', (data) => {
      this.broadcastToMeeting(data.meetingId, 'intelligenceUpdate', data);
    });
    
    this.orchestrator.on('intelligenceError', (data) => {
      this.broadcastToMeeting(data.meetingId, 'intelligenceError', data);
    });
    
    this.orchestrator.on('serviceResult', (data) => {
      // Optional: broadcast individual service results for debugging
      if (process.env.NODE_ENV === 'development') {
        this.broadcastToMeeting(data.meetingId, 'serviceResult', data);
      }
    });
  }
  
  /**
   * Handle new WebSocket connection
   */
  handleNewConnection(ws, request) {
    // Check connection limit
    if (this.connections.size >= this.options.maxConnections) {
      ws.close(1013, 'Server at capacity');
      return;
    }
    
    const connectionId = this.generateConnectionId();
    const clientIP = request.socket.remoteAddress;
    
    // Create connection info
    const connection = {
      id: connectionId,
      ws,
      ip: clientIP,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      meetingId: null,
      userId: null,
      subscriptions: new Set(),
      messageCount: 0,
      isAlive: true
    };
    
    // Store connection
    this.connections.set(connectionId, connection);
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
    
    // Set up connection event handlers
    this.setupConnectionHandlers(connection);
    
    // Send welcome message
    this.sendMessage(connectionId, 'connected', {
      connectionId,
      serverTime: Date.now(),
      capabilities: ['real-time-intelligence', 'meeting-insights', 'contextual-suggestions']
    });
    
    console.log(`New WebSocket connection: ${connectionId} from ${clientIP}`);
    this.emit('connectionEstablished', { connectionId, ip: clientIP });
  }
  
  /**
   * Set up individual connection event handlers
   */
  setupConnectionHandlers(connection) {
    const { ws, id: connectionId } = connection;
    
    // Message handler
    ws.on('message', async (data) => {
      try {
        await this.handleMessage(connectionId, data);
      } catch (error) {
        console.error(`Error handling message from ${connectionId}:`, error);
        this.sendError(connectionId, 'Message processing failed', error.message);
      }
    });
    
    // Close handler
    ws.on('close', (code, reason) => {
      this.handleConnectionClose(connectionId, code, reason);
    });
    
    // Error handler
    ws.on('error', (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error);
      this.metrics.errors++;
    });
    
    // Pong handler for heartbeat
    ws.on('pong', () => {
      connection.isAlive = true;
      connection.lastActivity = Date.now();
    });
  }
  
  /**
   * Handle incoming message from client
   */
  async handleMessage(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    // Rate limiting
    if (!this.rateLimiter.checkLimit(connectionId)) {
      this.sendError(connectionId, 'Rate limit exceeded', 'Too many messages');
      return;
    }
    
    // Update activity
    connection.lastActivity = Date.now();
    connection.messageCount++;
    this.metrics.messagesProcessed++;
    
    // Parse message
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      this.sendError(connectionId, 'Invalid JSON', 'Message must be valid JSON');
      return;
    }
    
    // Route message
    await this.messageRouter.route(connectionId, message, this);
  }
  
  /**
   * Handle connection close
   */
  handleConnectionClose(connectionId, code, reason) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    // Remove from meeting room
    if (connection.meetingId) {
      this.leaveMeeting(connectionId, connection.meetingId);
    }
    
    // Remove connection
    this.connections.delete(connectionId);
    this.metrics.activeConnections--;
    
    console.log(`WebSocket connection closed: ${connectionId} (code: ${code}, reason: ${reason})`);
    this.emit('connectionClosed', { connectionId, code, reason });
  }
  
  /**
   * Join a meeting room
   */
  joinMeeting(connectionId, meetingId, userId = null) {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;
    
    // Leave current meeting if any
    if (connection.meetingId) {
      this.leaveMeeting(connectionId, connection.meetingId);
    }
    
    // Join new meeting
    connection.meetingId = meetingId;
    connection.userId = userId;
    
    if (!this.meetingRooms.has(meetingId)) {
      this.meetingRooms.set(meetingId, new Set());
    }
    
    this.meetingRooms.get(meetingId).add(connectionId);
    
    // Send confirmation
    this.sendMessage(connectionId, 'meetingJoined', {
      meetingId,
      participantCount: this.meetingRooms.get(meetingId).size
    });
    
    console.log(`Connection ${connectionId} joined meeting ${meetingId}`);
    return true;
  }
  
  /**
   * Leave a meeting room
   */
  leaveMeeting(connectionId, meetingId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;
    
    const room = this.meetingRooms.get(meetingId);
    if (room) {
      room.delete(connectionId);
      
      // Clean up empty rooms
      if (room.size === 0) {
        this.meetingRooms.delete(meetingId);
      }
    }
    
    connection.meetingId = null;
    connection.userId = null;
    
    // Send confirmation
    this.sendMessage(connectionId, 'meetingLeft', { meetingId });
    
    console.log(`Connection ${connectionId} left meeting ${meetingId}`);
    return true;
  }
  
  /**
   * Start intelligence analysis for a meeting
   */
  async startIntelligenceAnalysis(connectionId, meetingId, context) {
    try {
      const result = await this.orchestrator.processIntelligenceRequest(
        meetingId,
        context,
        'real_time',
        'high'
      );
      
      this.sendMessage(connectionId, 'intelligenceStarted', {
        meetingId,
        result
      });
      
      return result;
      
    } catch (error) {
      this.sendError(connectionId, 'Intelligence analysis failed', error.message);
      throw error;
    }
  }
  
  /**
   * Process real-time context update
   */
  async processContextUpdate(connectionId, meetingId, contextData) {
    try {
      const result = await this.orchestrator.processIntelligenceRequest(
        meetingId,
        contextData,
        'real_time',
        'medium'
      );
      
      // Broadcast to all meeting participants
      this.broadcastToMeeting(meetingId, 'contextUpdate', {
        meetingId,
        insights: result,
        timestamp: Date.now()
      });
      
      return result;
      
    } catch (error) {
      this.sendError(connectionId, 'Context processing failed', error.message);
      throw error;
    }
  }
  
  /**
   * Send message to specific connection
   */
  sendMessage(connectionId, type, payload = {}) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    const message = {
      type,
      payload,
      timestamp: Date.now()
    };
    
    try {
      connection.ws.send(JSON.stringify(message));
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`Error sending message to ${connectionId}:`, error);
      return false;
    }
  }
  
  /**
   * Send error message to connection
   */
  sendError(connectionId, error, details = null) {
    this.sendMessage(connectionId, 'error', {
      error,
      details,
      timestamp: Date.now()
    });
  }
  
  /**
   * Broadcast message to all connections in a meeting
   */
  broadcastToMeeting(meetingId, type, payload = {}) {
    const room = this.meetingRooms.get(meetingId);
    if (!room) return 0;
    
    let sentCount = 0;
    
    room.forEach(connectionId => {
      if (this.sendMessage(connectionId, type, payload)) {
        sentCount++;
      }
    });
    
    return sentCount;
  }
  
  /**
   * Broadcast message to all connections
   */
  broadcastToAll(type, payload = {}) {
    let sentCount = 0;
    
    this.connections.forEach((connection, connectionId) => {
      if (this.sendMessage(connectionId, type, payload)) {
        sentCount++;
      }
    });
    
    return sentCount;
  }
  
  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    setInterval(() => {
      this.connections.forEach((connection, connectionId) => {
        if (!connection.isAlive) {
          // Connection is dead, terminate it
          connection.ws.terminate();
          this.handleConnectionClose(connectionId, 1006, 'Heartbeat timeout');
          return;
        }
        
        // Mark as potentially dead and send ping
        connection.isAlive = false;
        connection.ws.ping();
      });
    }, this.options.heartbeatInterval);
  }
  
  /**
   * Start cleanup routine
   */
  startCleanupRoutine() {
    setInterval(() => {
      this.cleanupStaleConnections();
      this.cleanupEmptyRooms();
    }, 60000); // Run every minute
  }
  
  /**
   * Clean up stale connections
   */
  cleanupStaleConnections() {
    const staleThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes
    
    this.connections.forEach((connection, connectionId) => {
      if (connection.lastActivity < staleThreshold) {
        console.log(`Cleaning up stale connection: ${connectionId}`);
        connection.ws.terminate();
        this.handleConnectionClose(connectionId, 1006, 'Stale connection');
      }
    });
  }
  
  /**
   * Clean up empty meeting rooms
   */
  cleanupEmptyRooms() {
    this.meetingRooms.forEach((room, meetingId) => {
      if (room.size === 0) {
        this.meetingRooms.delete(meetingId);
        console.log(`Cleaned up empty meeting room: ${meetingId}`);
      }
    });
  }
  
  /**
   * Generate unique connection ID
   */
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get server status and metrics
   */
  getStatus() {
    return {
      initialized: this.initialized,
      activeConnections: this.metrics.activeConnections,
      totalConnections: this.metrics.totalConnections,
      activeMeetings: this.meetingRooms.size,
      metrics: this.metrics,
      orchestratorStatus: this.orchestrator.getStatus()
    };
  }
  
  /**
   * Shutdown server gracefully
   */
  async shutdown() {
    console.log('Shutting down Intelligence WebSocket Server...');
    
    // Notify all clients
    this.broadcastToAll('serverShutdown', {
      message: 'Server is shutting down',
      timestamp: Date.now()
    });
    
    // Close all connections
    this.connections.forEach((connection) => {
      connection.ws.close(1001, 'Server shutdown');
    });
    
    // Shutdown orchestrator
    await this.orchestrator.shutdown();
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }
    
    this.emit('shutdown');
    console.log('✓ Intelligence WebSocket Server shutdown complete');
  }
}

/**
 * Message Router for handling different message types
 */
class MessageRouter {
  async route(connectionId, message, server) {
    const { type, payload } = message;
    
    switch (type) {
      case 'joinMeeting':
        return this.handleJoinMeeting(connectionId, payload, server);
      
      case 'leaveMeeting':
        return this.handleLeaveMeeting(connectionId, payload, server);
      
      case 'startIntelligence':
        return this.handleStartIntelligence(connectionId, payload, server);
      
      case 'contextUpdate':
        return this.handleContextUpdate(connectionId, payload, server);
      
      case 'suggestionInteraction':
        return this.handleSuggestionInteraction(connectionId, payload, server);
      
      case 'ping':
        return server.sendMessage(connectionId, 'pong', { timestamp: Date.now() });
      
      default:
        return server.sendError(connectionId, 'Unknown message type', `Type '${type}' not supported`);
    }
  }
  
  async handleJoinMeeting(connectionId, payload, server) {
    const { meetingId, userId } = payload;
    
    if (!meetingId) {
      return server.sendError(connectionId, 'Missing meetingId', 'meetingId is required');
    }
    
    return server.joinMeeting(connectionId, meetingId, userId);
  }
  
  async handleLeaveMeeting(connectionId, payload, server) {
    const { meetingId } = payload;
    return server.leaveMeeting(connectionId, meetingId);
  }
  
  async handleStartIntelligence(connectionId, payload, server) {
    const { meetingId, context } = payload;
    
    if (!meetingId || !context) {
      return server.sendError(connectionId, 'Missing required fields', 'meetingId and context are required');
    }
    
    return await server.startIntelligenceAnalysis(connectionId, meetingId, context);
  }
  
  async handleContextUpdate(connectionId, payload, server) {
    const { meetingId, contextData } = payload;
    
    if (!meetingId || !contextData) {
      return server.sendError(connectionId, 'Missing required fields', 'meetingId and contextData are required');
    }
    
    return await server.processContextUpdate(connectionId, meetingId, contextData);
  }
  
  async handleSuggestionInteraction(connectionId, payload, server) {
    const { suggestionId, action, meetingId } = payload;
    
    // Log interaction for analytics
    console.log(`Suggestion interaction: ${suggestionId} ${action} in meeting ${meetingId}`);
    
    // Could trigger additional intelligence processing based on interaction
    return server.sendMessage(connectionId, 'interactionRecorded', {
      suggestionId,
      action,
      timestamp: Date.now()
    });
  }
}

/**
 * Rate Limiter for message throttling
 */
class RateLimiter {
  constructor(maxMessagesPerMinute = 100) {
    this.maxMessages = maxMessagesPerMinute;
    this.windows = new Map(); // connectionId -> message timestamps
  }
  
  checkLimit(connectionId) {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (!this.windows.has(connectionId)) {
      this.windows.set(connectionId, []);
    }
    
    const timestamps = this.windows.get(connectionId);
    
    // Remove old timestamps
    const recentTimestamps = timestamps.filter(ts => ts > windowStart);
    
    // Check limit
    if (recentTimestamps.length >= this.maxMessages) {
      return false;
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    this.windows.set(connectionId, recentTimestamps);
    
    return true;
  }
  
  cleanup() {
    const cutoff = Date.now() - 120000; // 2 minutes
    
    this.windows.forEach((timestamps, connectionId) => {
      const recentTimestamps = timestamps.filter(ts => ts > cutoff);
      
      if (recentTimestamps.length === 0) {
        this.windows.delete(connectionId);
      } else {
        this.windows.set(connectionId, recentTimestamps);
      }
    });
  }
}

module.exports = IntelligenceWebSocketServer;
