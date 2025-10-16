const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'meetingmind-server' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

class ErrorHandler {
    static handle(error, req, res, next) {
        // Log the error
        logger.error('Unhandled error:', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });

        // Don't log password or sensitive data
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
        if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
        
        logger.error('Request details:', {
            body: sanitizedBody,
            params: req.params,
            query: req.query
        });

        // Determine error type and respond accordingly
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'The provided data is invalid',
                details: error.details || error.message
            });
        }

        if (error.name === 'UnauthorizedError' || error.message.includes('jwt')) {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid or expired authentication token'
            });
        }

        if (error.name === 'ForbiddenError') {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'You do not have permission to perform this action'
            });
        }

        if (error.name === 'NotFoundError') {
            return res.status(404).json({
                error: 'Not Found',
                message: 'The requested resource was not found'
            });
        }

        if (error.name === 'ConflictError') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'The request conflicts with the current state of the resource'
            });
        }

        if (error.code === '23505') { // PostgreSQL unique violation
            return res.status(409).json({
                error: 'Duplicate Entry',
                message: 'A record with this information already exists'
            });
        }

        if (error.code === '23503') { // PostgreSQL foreign key violation
            return res.status(400).json({
                error: 'Invalid Reference',
                message: 'The referenced resource does not exist'
            });
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'External service is temporarily unavailable'
            });
        }

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: 'File Too Large',
                message: 'The uploaded file exceeds the maximum allowed size'
            });
        }

        // Rate limiting errors
        if (error.message.includes('rate limit')) {
            return res.status(429).json({
                error: 'Rate Limit Exceeded',
                message: 'Too many requests. Please try again later.',
                retryAfter: error.retryAfter || 60
            });
        }

        // Database connection errors
        if (error.message.includes('database') || error.code?.startsWith('28')) {
            return res.status(503).json({
                error: 'Database Error',
                message: 'Database is temporarily unavailable'
            });
        }

        // AI service errors
        if (error.message.includes('AI') || error.message.includes('model')) {
            return res.status(503).json({
                error: 'AI Service Error',
                message: 'AI processing service is temporarily unavailable'
            });
        }

        // Default server error
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred. Please try again later.',
            ...(isDevelopment && {
                details: error.message,
                stack: error.stack
            }),
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
        });
    }

    static notFound(req, res, next) {
        const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
        error.name = 'NotFoundError';
        error.status = 404;
        next(error);
    }

    static async(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}

// Custom error classes
class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}

class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

class NotFoundError extends Error {
    constructor(message = 'Not Found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

class ConflictError extends Error {
    constructor(message = 'Conflict') {
        super(message);
        this.name = 'ConflictError';
    }
}

module.exports = ErrorHandler.handle;
module.exports.ErrorHandler = ErrorHandler;
module.exports.ValidationError = ValidationError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.NotFoundError = NotFoundError;
module.exports.ConflictError = ConflictError;
