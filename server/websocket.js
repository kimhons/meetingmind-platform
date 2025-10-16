const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const DatabaseService = require('./services/DatabaseService');
const NotificationService = require('./services/NotificationService');
const AnalyticsService = require('./services/AnalyticsService');

class WebSocketServer {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> { socket, lastSeen, subscriptions }
        this.rooms = new Map(); // roomId -> Set of userIds
        this.analytics = {
            connections: 0,
            totalConnections: 0,
            messagesSent: 0,
            messagesReceived: 0
        };
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupMiddleware();
        this.setupEventHandlers();
        this.setupCleanupTasks();

        console.log('🔌 WebSocket server initialized');
    }

    setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                
                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await DatabaseService.findById('users', decoded.userId);
                
                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.userId = user.id;
                socket.user = user;
                socket.organizationId = user.organization_id;
                
                next();
            } catch (error) {
                console.error('WebSocket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });

        // Rate limiting middleware
        this.io.use((socket, next) => {
            const userId = socket.userId;
            const now = Date.now();
            
            if (!socket.rateLimitData) {
                socket.rateLimitData = {
                    messages: [],
                    connections: []
                };
            }

            // Check connection rate (max 5 connections per minute)
            socket.rateLimitData.connections = socket.rateLimitData.connections.filter(
                time => now - time < 60000
            );
            
            if (socket.rateLimitData.connections.length >= 5) {
                return next(new Error('Connection rate limit exceeded'));
            }
            
            socket.rateLimitData.connections.push(now);
            next();
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    handleConnection(socket) {
        const userId = socket.userId;
        const user = socket.user;
        
        console.log(`🔌 User connected: ${user.email} (${userId})`);
        
        // Update analytics
        this.analytics.connections++;
        this.analytics.totalConnections++;

        // Store connection
        this.connectedUsers.set(userId, {
            socket,
            lastSeen: new Date(),
            subscriptions: new Set(),
            user
        });

        // Add to notification service
        NotificationService.addClient(userId, socket);

        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to MeetingMind real-time service',
            userId,
            features: this.getAvailableFeatures(user.subscription_tier),
            timestamp: new Date().toISOString()
        });

        // Handle events
        this.setupSocketEventHandlers(socket);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, reason);
        });
    }

    setupSocketEventHandlers(socket) {
        const userId = socket.userId;
        const user = socket.user;

        // Subscribe to real-time updates
        socket.on('subscribe', (data) => {
            this.handleSubscription(socket, data);
        });

        // Unsubscribe from updates
        socket.on('unsubscribe', (data) => {
            this.handleUnsubscription(socket, data);
        });

        // Join meeting room
        socket.on('join.meeting', (data) => {
            this.handleJoinMeeting(socket, data);
        });

        // Leave meeting room
        socket.on('leave.meeting', (data) => {
            this.handleLeaveMeeting(socket, data);
        });

        // Request real-time analytics
        socket.on('analytics.subscribe', (data) => {
            this.handleAnalyticsSubscription(socket, data);
        });

        // Ping/pong for connection health
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });

        // Notification acknowledgment
        socket.on('notification.ack', (notificationId) => {
            NotificationService.markNotificationAsRead(userId, notificationId);
        });

        // Request notification history
        socket.on('notifications.history', async (options = {}) => {
            try {
                const notifications = await NotificationService.getNotificationHistory(userId, options);
                socket.emit('notifications.history', notifications);
            } catch (error) {
                socket.emit('error', {
                    type: 'notifications.history.failed',
                    message: 'Failed to retrieve notification history'
                });
            }
        });

        // Rate limited message handler
        socket.on('message', (data) => {
            if (!this.checkMessageRateLimit(socket)) {
                socket.emit('error', {
                    type: 'rate_limit_exceeded',
                    message: 'Message rate limit exceeded'
                });
                return;
            }

            this.handleMessage(socket, data);
            this.analytics.messagesReceived++;
        });

        // Error handling
        socket.on('error', (error) => {
            console.error(`WebSocket error for user ${userId}:`, error);
        });
    }

    handleSubscription(socket, data) {
        const { type, target } = data;
        const userId = socket.userId;
        const connection = this.connectedUsers.get(userId);
        
        if (!connection) return;

        const subscriptionKey = `${type}:${target || 'global'}`;
        connection.subscriptions.add(subscriptionKey);

        // Join appropriate rooms
        switch (type) {
            case 'meeting':
                if (target) {
                    socket.join(`meeting:${target}`);
                }
                break;
            case 'organization':
                if (socket.organizationId) {
                    socket.join(`org:${socket.organizationId}`);
                }
                break;
            case 'analytics':
                if (['pro', 'enterprise'].includes(socket.user.subscription_tier)) {
                    socket.join(`analytics:${userId}`);
                }
                break;
            case 'notifications':
                socket.join(`notifications:${userId}`);
                break;
        }

        socket.emit('subscribed', {
            type,
            target,
            message: `Subscribed to ${type} updates`
        });

        console.log(`📡 User ${userId} subscribed to ${subscriptionKey}`);
    }

    handleUnsubscription(socket, data) {
        const { type, target } = data;
        const userId = socket.userId;
        const connection = this.connectedUsers.get(userId);
        
        if (!connection) return;

        const subscriptionKey = `${type}:${target || 'global'}`;
        connection.subscriptions.delete(subscriptionKey);

        // Leave appropriate rooms
        switch (type) {
            case 'meeting':
                if (target) {
                    socket.leave(`meeting:${target}`);
                }
                break;
            case 'organization':
                if (socket.organizationId) {
                    socket.leave(`org:${socket.organizationId}`);
                }
                break;
            case 'analytics':
                socket.leave(`analytics:${userId}`);
                break;
            case 'notifications':
                socket.leave(`notifications:${userId}`);
                break;
        }

        socket.emit('unsubscribed', {
            type,
            target,
            message: `Unsubscribed from ${type} updates`
        });

        console.log(`📡 User ${userId} unsubscribed from ${subscriptionKey}`);
    }

    handleJoinMeeting(socket, data) {
        const { meetingId } = data;
        const userId = socket.userId;

        // Verify meeting access
        this.verifyMeetingAccess(userId, meetingId)
            .then(hasAccess => {
                if (hasAccess) {
                    socket.join(`meeting:${meetingId}`);
                    
                    // Notify other participants
                    socket.to(`meeting:${meetingId}`).emit('meeting.participant.joined', {
                        userId,
                        user: {
                            id: socket.user.id,
                            name: `${socket.user.first_name} ${socket.user.last_name}`,
                            email: socket.user.email
                        },
                        timestamp: new Date().toISOString()
                    });

                    socket.emit('meeting.joined', {
                        meetingId,
                        message: 'Successfully joined meeting room'
                    });

                    console.log(`👥 User ${userId} joined meeting ${meetingId}`);
                } else {
                    socket.emit('error', {
                        type: 'meeting.access_denied',
                        message: 'Access denied to meeting'
                    });
                }
            })
            .catch(error => {
                console.error('Meeting access verification error:', error);
                socket.emit('error', {
                    type: 'meeting.verification_failed',
                    message: 'Failed to verify meeting access'
                });
            });
    }

    handleLeaveMeeting(socket, data) {
        const { meetingId } = data;
        const userId = socket.userId;

        socket.leave(`meeting:${meetingId}`);
        
        // Notify other participants
        socket.to(`meeting:${meetingId}`).emit('meeting.participant.left', {
            userId,
            user: {
                id: socket.user.id,
                name: `${socket.user.first_name} ${socket.user.last_name}`,
                email: socket.user.email
            },
            timestamp: new Date().toISOString()
        });

        socket.emit('meeting.left', {
            meetingId,
            message: 'Left meeting room'
        });

        console.log(`👥 User ${userId} left meeting ${meetingId}`);
    }

    handleAnalyticsSubscription(socket, data) {
        const userId = socket.userId;
        const { timeRange = '30d' } = data;

        // Check subscription tier
        if (!['pro', 'enterprise'].includes(socket.user.subscription_tier)) {
            socket.emit('error', {
                type: 'subscription_required',
                message: 'Real-time analytics requires Pro or Enterprise subscription'
            });
            return;
        }

        // Send initial analytics data
        AnalyticsService.getDashboardOverview(userId, socket.organizationId, timeRange)
            .then(overview => {
                socket.emit('analytics.data', {
                    type: 'overview',
                    data: overview,
                    timestamp: new Date().toISOString()
                });
            })
            .catch(error => {
                console.error('Analytics subscription error:', error);
                socket.emit('error', {
                    type: 'analytics.failed',
                    message: 'Failed to retrieve analytics data'
                });
            });

        // Join analytics room for real-time updates
        socket.join(`analytics:${userId}`);
        
        socket.emit('analytics.subscribed', {
            message: 'Subscribed to real-time analytics',
            timeRange
        });
    }

    handleMessage(socket, data) {
        const userId = socket.userId;
        
        // Echo message back (for testing)
        socket.emit('message.echo', {
            original: data,
            timestamp: new Date().toISOString(),
            userId
        });

        this.analytics.messagesSent++;
    }

    handleDisconnection(socket, reason) {
        const userId = socket.userId;
        const user = socket.user;
        
        console.log(`🔌 User disconnected: ${user?.email} (${userId}) - Reason: ${reason}`);
        
        // Update analytics
        this.analytics.connections--;

        // Remove from connected users
        this.connectedUsers.delete(userId);

        // Update last seen
        if (user) {
            DatabaseService.update('users', userId, {
                last_seen: new Date()
            }).catch(error => {
                console.error('Failed to update last seen:', error);
            });
        }
    }

    // Broadcasting methods
    broadcastToUser(userId, event, data) {
        const connection = this.connectedUsers.get(userId);
        if (connection) {
            connection.socket.emit(event, data);
            this.analytics.messagesSent++;
        }
    }

    broadcastToMeeting(meetingId, event, data, excludeUserId = null) {
        if (excludeUserId) {
            const connection = this.connectedUsers.get(excludeUserId);
            if (connection) {
                connection.socket.to(`meeting:${meetingId}`).emit(event, data);
            }
        } else {
            this.io.to(`meeting:${meetingId}`).emit(event, data);
        }
        this.analytics.messagesSent++;
    }

    broadcastToOrganization(organizationId, event, data, excludeUserId = null) {
        if (excludeUserId) {
            const connection = this.connectedUsers.get(excludeUserId);
            if (connection) {
                connection.socket.to(`org:${organizationId}`).emit(event, data);
            }
        } else {
            this.io.to(`org:${organizationId}`).emit(event, data);
        }
        this.analytics.messagesSent++;
    }

    // Utility methods
    async verifyMeetingAccess(userId, meetingId) {
        try {
            const meeting = await DatabaseService.query(
                'SELECT id FROM meetings WHERE id = $1 AND (host_id = $2 OR organization_id = (SELECT organization_id FROM users WHERE id = $2))',
                [meetingId, userId]
            );
            return meeting.rows.length > 0;
        } catch (error) {
            console.error('Meeting access verification error:', error);
            return false;
        }
    }

    checkMessageRateLimit(socket) {
        const now = Date.now();
        const limit = 30; // 30 messages per minute
        
        if (!socket.rateLimitData.messages) {
            socket.rateLimitData.messages = [];
        }

        // Remove old messages
        socket.rateLimitData.messages = socket.rateLimitData.messages.filter(
            time => now - time < 60000
        );

        if (socket.rateLimitData.messages.length >= limit) {
            return false;
        }

        socket.rateLimitData.messages.push(now);
        return true;
    }

    getAvailableFeatures(subscriptionTier) {
        const features = {
            free: ['notifications', 'basic_analytics'],
            basic: ['notifications', 'basic_analytics', 'meeting_updates'],
            pro: ['notifications', 'real_time_analytics', 'meeting_updates', 'advanced_notifications'],
            enterprise: ['notifications', 'real_time_analytics', 'meeting_updates', 'advanced_notifications', 'organization_broadcasts']
        };

        return features[subscriptionTier] || features.free;
    }

    setupCleanupTasks() {
        // Clean up inactive connections every 5 minutes
        setInterval(() => {
            const now = new Date();
            const timeout = 30 * 60 * 1000; // 30 minutes

            for (const [userId, connection] of this.connectedUsers.entries()) {
                if (now - connection.lastSeen > timeout) {
                    console.log(`🧹 Cleaning up inactive connection for user ${userId}`);
                    connection.socket.disconnect(true);
                    this.connectedUsers.delete(userId);
                }
            }
        }, 5 * 60 * 1000);

        // Update analytics every minute
        setInterval(() => {
            this.io.emit('server.stats', {
                connections: this.analytics.connections,
                totalConnections: this.analytics.totalConnections,
                messagesSent: this.analytics.messagesSent,
                messagesReceived: this.analytics.messagesReceived,
                timestamp: new Date().toISOString()
            });
        }, 60 * 1000);
    }

    getStatus() {
        return {
            connections: this.analytics.connections,
            totalConnections: this.analytics.totalConnections,
            messagesSent: this.analytics.messagesSent,
            messagesReceived: this.analytics.messagesReceived,
            rooms: this.io?.sockets.adapter.rooms.size || 0,
            connectedUsers: this.connectedUsers.size
        };
    }
}

module.exports = new WebSocketServer();
