const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Configure request logger
const requestLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'meetingmind-requests' },
    transports: [
        new winston.transports.File({ filename: 'logs/requests.log' })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    requestLogger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

function requestLoggerMiddleware(req, res, next) {
    // Generate unique request ID
    req.id = uuidv4();
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.id);

    // Capture start time
    const startTime = Date.now();

    // Sanitize request body (remove sensitive data)
    const sanitizedBody = sanitizeRequestBody(req.body);

    // Log request start
    requestLogger.info('Request started', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: getClientIP(req),
        userId: req.user?.id || null,
        organizationId: req.user?.organizationId || null,
        contentLength: req.get('Content-Length') || 0,
        referer: req.get('Referer') || null,
        body: sanitizedBody,
        query: req.query,
        params: req.params
    });

    // Capture original res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        
        // Log response
        requestLogger.info('Request completed', {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            userId: req.user?.id || null,
            responseSize: JSON.stringify(data).length,
            success: res.statusCode < 400
        });

        // Track performance metrics
        trackPerformanceMetrics(req, res, duration);

        // Call original json method
        return originalJson.call(this, data);
    };

    // Capture original res.send to log non-JSON responses
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        
        // Only log if json wasn't called
        if (!res.headersSent || !res.getHeader('Content-Type')?.includes('application/json')) {
            requestLogger.info('Request completed', {
                requestId: req.id,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration,
                userId: req.user?.id || null,
                responseSize: data ? data.length : 0,
                success: res.statusCode < 400
            });

            trackPerformanceMetrics(req, res, duration);
        }

        return originalSend.call(this, data);
    };

    // Handle request timeout
    const timeout = setTimeout(() => {
        requestLogger.warn('Request timeout', {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            duration: Date.now() - startTime,
            userId: req.user?.id || null
        });
    }, 30000); // 30 second timeout

    // Clear timeout when response finishes
    res.on('finish', () => {
        clearTimeout(timeout);
    });

    // Handle errors
    res.on('error', (error) => {
        const duration = Date.now() - startTime;
        
        requestLogger.error('Request error', {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            error: error.message,
            duration,
            userId: req.user?.id || null
        });
        
        clearTimeout(timeout);
    });

    next();
}

function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const sensitiveFields = [
        'password', 'token', 'secret', 'key', 'auth', 'authorization',
        'apiKey', 'api_key', 'accessToken', 'access_token', 'refreshToken',
        'refresh_token', 'clientSecret', 'client_secret'
    ];

    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

function getClientIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           'unknown';
}

function trackPerformanceMetrics(req, res, duration) {
    // Track slow requests
    if (duration > 5000) { // 5 seconds
        requestLogger.warn('Slow request detected', {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            duration,
            userId: req.user?.id || null,
            statusCode: res.statusCode
        });
    }

    // Track error rates
    if (res.statusCode >= 400) {
        requestLogger.warn('Error response', {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            userId: req.user?.id || null
        });
    }

    // Track API usage patterns
    if (req.originalUrl.startsWith('/api/')) {
        requestLogger.info('API usage', {
            requestId: req.id,
            endpoint: req.originalUrl,
            method: req.method,
            userId: req.user?.id || null,
            organizationId: req.user?.organizationId || null,
            subscriptionTier: req.user?.subscriptionTier || null,
            duration,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString()
        });
    }
}

// Middleware for security headers
function securityHeaders(req, res, next) {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Add request ID for tracking
    res.setHeader('X-Request-ID', req.id);
    
    next();
}

// Middleware for request size limiting
function requestSizeLimit(limit = '10mb') {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('Content-Length') || '0');
        const maxSize = parseSize(limit);
        
        if (contentLength > maxSize) {
            return res.status(413).json({
                error: 'Request too large',
                message: `Request size ${formatSize(contentLength)} exceeds limit of ${limit}`,
                maxSize: limit
            });
        }
        
        next();
    };
}

function parseSize(size) {
    if (typeof size === 'number') return size;
    
    const units = {
        'b': 1,
        'kb': 1024,
        'mb': 1024 * 1024,
        'gb': 1024 * 1024 * 1024
    };
    
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    return Math.floor(value * units[unit]);
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = requestLoggerMiddleware;
module.exports.securityHeaders = securityHeaders;
module.exports.requestSizeLimit = requestSizeLimit;
