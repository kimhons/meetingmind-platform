const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const meetingRoutes = require('./routes/meetings');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');

// Import services
const DatabaseService = require('./services/DatabaseService');
const NotificationService = require('./services/NotificationService');
const AnalyticsService = require('./services/AnalyticsService');

class MeetingMindServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            }
        });
        
        this.port = process.env.PORT || 8000;
        this.isDevelopment = process.env.NODE_ENV === 'development';
        
        this.initializeDatabase();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeWebSocket();
        this.initializeServices();
        this.initializeErrorHandling();
    }

    async initializeDatabase() {
        try {
            await DatabaseService.initialize();
            console.log('✅ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            process.exit(1);
        }
    }

    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'", "wss:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        this.app.use(cors({
            origin: this.isDevelopment ? 
                ['http://localhost:3000', 'http://localhost:3001'] : 
                [process.env.FRONTEND_URL],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: this.isDevelopment ? 1000 : 100, // requests per window
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Compression
        this.app.use(compression());

        // Logging
        if (this.isDevelopment) {
            this.app.use(morgan('dev'));
        } else {
            this.app.use(morgan('combined'));
        }

        // Custom request logging
        this.app.use(requestLogger);

        // Serve static files
        this.app.use('/static', express.static(path.join(__dirname, '../public')));
    }

    initializeRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.5.0',
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                database: DatabaseService.isConnected() ? 'connected' : 'disconnected'
            });
        });

        // API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/users', authMiddleware, userRoutes);
        this.app.use('/api/meetings', authMiddleware, meetingRoutes);
        this.app.use('/api/ai', authMiddleware, aiRoutes);
        this.app.use('/api/analytics', authMiddleware, analyticsRoutes);
        this.app.use('/api/notifications', authMiddleware, notificationRoutes);

        // API documentation
        this.app.get('/api', (req, res) => {
            res.json({
                name: 'MeetingMind API',
                version: '1.5.0',
                description: 'AI-Powered Meeting Assistant with Manus 1.5 Enhancement',
                endpoints: {
                    auth: '/api/auth',
                    users: '/api/users',
                    meetings: '/api/meetings',
                    ai: '/api/ai',
                    analytics: '/api/analytics',
                    notifications: '/api/notifications'
                },
                documentation: '/api/docs',
                health: '/health'
            });
        });

        // Catch-all for undefined routes
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                message: `The requested endpoint ${req.originalUrl} does not exist.`,
                availableEndpoints: [
                    '/health',
                    '/api',
                    '/api/auth',
                    '/api/users',
                    '/api/meetings',
                    '/api/ai',
                    '/api/analytics',
                    '/api/notifications'
                ]
            });
        });
    }

    initializeWebSocket() {
        this.io.use((socket, next) => {
            // WebSocket authentication
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`✅ User ${socket.userId} connected via WebSocket`);
            
            // Join user to their personal room
            socket.join(`user_${socket.userId}`);
            
            // Handle meeting room joins
            socket.on('join_meeting', (meetingId) => {
                socket.join(`meeting_${meetingId}`);
                socket.to(`meeting_${meetingId}`).emit('user_joined', {
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle meeting room leaves
            socket.on('leave_meeting', (meetingId) => {
                socket.leave(`meeting_${meetingId}`);
                socket.to(`meeting_${meetingId}`).emit('user_left', {
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle real-time meeting updates
            socket.on('meeting_update', (data) => {
                socket.to(`meeting_${data.meetingId}`).emit('meeting_updated', {
                    ...data,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`❌ User ${socket.userId} disconnected`);
            });
        });

        // Store io instance for use in other modules
        this.app.set('io', this.io);
    }

    initializeServices() {
        // Initialize notification service with WebSocket
        NotificationService.initialize(this.io);
        
        // Initialize analytics service
        AnalyticsService.initialize();
        
        console.log('✅ Services initialized successfully');
    }

    initializeErrorHandling() {
        // Global error handler
        this.app.use(errorHandler);

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            // Don't exit the process in production, just log the error
            if (this.isDevelopment) {
                process.exit(1);
            }
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            // Gracefully shutdown
            this.shutdown();
        });

        // Handle SIGTERM and SIGINT for graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    async shutdown() {
        console.log('🔄 Gracefully shutting down server...');
        
        try {
            // Close WebSocket connections
            this.io.close();
            
            // Close database connections
            await DatabaseService.close();
            
            // Close HTTP server
            this.server.close(() => {
                console.log('✅ Server shutdown complete');
                process.exit(0);
            });
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`
🚀 MeetingMind Server 1.5 is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${this.port}
📊 Health: http://localhost:${this.port}/health
📚 API: http://localhost:${this.port}/api
🔌 WebSocket: ws://localhost:${this.port}
            `);
        });
    }
}

// Create and start server
const server = new MeetingMindServer();
server.start();

module.exports = server;
