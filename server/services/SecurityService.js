const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const moment = require('moment');

const DatabaseService = require('./DatabaseService');
const NotificationService = require('./NotificationService');

class SecurityService {
    constructor() {
        this.suspiciousActivities = new Map(); // IP -> { attempts, lastAttempt, blocked }
        this.apiKeyUsage = new Map(); // apiKey -> { requests, lastUsed, quota }
        this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
        this.securityEvents = [];
        this.blockedIPs = new Set();
        this.trustedIPs = new Set();
        
        // Initialize security monitoring
        this.initializeSecurityMonitoring();
    }

    // Data Encryption and Decryption
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
            cipher.setAAD(Buffer.from('meetingmind-security', 'utf8'));
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    decrypt(encryptedData) {
        try {
            const { encrypted, iv, authTag } = encryptedData;
            const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
            
            decipher.setAAD(Buffer.from('meetingmind-security', 'utf8'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    // Input Validation and Sanitization
    validateAndSanitizeInput(input, type, options = {}) {
        const validationRules = {
            email: (value) => validator.isEmail(value),
            password: (value) => this.validatePassword(value),
            name: (value) => validator.isAlpha(value.replace(/\s/g, ''), 'en-US'),
            phone: (value) => validator.isMobilePhone(value),
            url: (value) => validator.isURL(value),
            uuid: (value) => validator.isUUID(value),
            alphanumeric: (value) => validator.isAlphanumeric(value),
            json: (value) => {
                try {
                    JSON.parse(value);
                    return true;
                } catch {
                    return false;
                }
            }
        };

        if (!validationRules[type]) {
            throw new Error(`Unknown validation type: ${type}`);
        }

        // Sanitize input
        let sanitized = validator.escape(input.toString().trim());
        
        // Apply specific sanitization based on type
        switch (type) {
            case 'email':
                sanitized = validator.normalizeEmail(sanitized);
                break;
            case 'name':
                sanitized = sanitized.replace(/[^a-zA-Z\s]/g, '');
                break;
            case 'phone':
                sanitized = sanitized.replace(/[^0-9+\-\s()]/g, '');
                break;
        }

        // Validate sanitized input
        if (!validationRules[type](sanitized)) {
            throw new Error(`Invalid ${type} format`);
        }

        // Apply additional options
        if (options.maxLength && sanitized.length > options.maxLength) {
            throw new Error(`${type} exceeds maximum length of ${options.maxLength}`);
        }

        if (options.minLength && sanitized.length < options.minLength) {
            throw new Error(`${type} must be at least ${options.minLength} characters`);
        }

        return sanitized;
    }

    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];

        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            errors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('. '));
        }

        return true;
    }

    // Rate Limiting
    createRateLimiter(options = {}) {
        const {
            windowMs = 15 * 60 * 1000, // 15 minutes
            max = 100, // requests per window
            message = 'Too many requests',
            skipSuccessfulRequests = false,
            skipFailedRequests = false
        } = options;

        return rateLimit({
            windowMs,
            max: (req) => {
                // Dynamic limits based on user subscription
                const tier = req.user?.subscriptionTier || 'free';
                const multipliers = {
                    free: 1,
                    basic: 2,
                    pro: 5,
                    enterprise: 10
                };
                return max * (multipliers[tier] || 1);
            },
            message: {
                error: 'Rate limit exceeded',
                message,
                retryAfter: Math.ceil(windowMs / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests,
            skipFailedRequests,
            handler: (req, res) => {
                this.logSecurityEvent('rate_limit_exceeded', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path,
                    userId: req.user?.id
                });

                res.status(429).json({
                    error: 'Rate limit exceeded',
                    message,
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }
        });
    }

    // IP Security and Monitoring
    checkIPSecurity(ip, userAgent = '') {
        // Check if IP is blocked
        if (this.blockedIPs.has(ip)) {
            throw new Error('IP address is blocked');
        }

        // Check for suspicious activity
        const activity = this.suspiciousActivities.get(ip);
        if (activity && activity.blocked) {
            throw new Error('IP address is temporarily blocked due to suspicious activity');
        }

        // Log the access
        this.logIPAccess(ip, userAgent);

        return true;
    }

    logIPAccess(ip, userAgent) {
        const activity = this.suspiciousActivities.get(ip) || {
            attempts: 0,
            lastAttempt: null,
            blocked: false,
            userAgents: new Set()
        };

        activity.attempts++;
        activity.lastAttempt = new Date();
        activity.userAgents.add(userAgent);

        // Check for suspicious patterns
        if (this.detectSuspiciousActivity(activity)) {
            this.blockIP(ip, 'Suspicious activity detected');
        }

        this.suspiciousActivities.set(ip, activity);
    }

    detectSuspiciousActivity(activity) {
        const now = new Date();
        const oneHour = 60 * 60 * 1000;

        // Too many requests in short time
        if (activity.attempts > 100 && (now - activity.lastAttempt) < oneHour) {
            return true;
        }

        // Multiple user agents from same IP
        if (activity.userAgents.size > 10) {
            return true;
        }

        return false;
    }

    blockIP(ip, reason) {
        this.blockedIPs.add(ip);
        
        const activity = this.suspiciousActivities.get(ip);
        if (activity) {
            activity.blocked = true;
        }

        this.logSecurityEvent('ip_blocked', {
            ip,
            reason,
            timestamp: new Date()
        });

        // Auto-unblock after 24 hours
        setTimeout(() => {
            this.unblockIP(ip);
        }, 24 * 60 * 60 * 1000);
    }

    unblockIP(ip) {
        this.blockedIPs.delete(ip);
        
        const activity = this.suspiciousActivities.get(ip);
        if (activity) {
            activity.blocked = false;
        }

        this.logSecurityEvent('ip_unblocked', {
            ip,
            timestamp: new Date()
        });
    }

    // API Key Management
    generateAPIKey(userId, permissions = [], expiresIn = null) {
        const apiKey = 'mk_' + crypto.randomBytes(32).toString('hex');
        const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

        const keyData = {
            userId,
            hashedKey,
            permissions,
            createdAt: new Date(),
            expiresAt: expiresIn ? moment().add(expiresIn, 'days').toDate() : null,
            lastUsed: null,
            requestCount: 0,
            isActive: true
        };

        // Store in database
        DatabaseService.create('api_keys', keyData);

        return apiKey;
    }

    validateAPIKey(apiKey) {
        const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
        
        // Find key in database
        const keyData = DatabaseService.findByField('api_keys', 'hashed_key', hashedKey);
        
        if (!keyData || !keyData.is_active) {
            throw new Error('Invalid API key');
        }

        if (keyData.expires_at && keyData.expires_at < new Date()) {
            throw new Error('API key has expired');
        }

        // Update usage
        DatabaseService.update('api_keys', keyData.id, {
            last_used: new Date(),
            request_count: keyData.request_count + 1
        });

        return keyData;
    }

    revokeAPIKey(apiKey) {
        const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
        
        DatabaseService.updateByField('api_keys', 'hashed_key', hashedKey, {
            is_active: false,
            revoked_at: new Date()
        });
    }

    // Security Headers
    getSecurityHeaders() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'", "wss:", "https:"],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: []
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            },
            noSniff: true,
            frameguard: { action: 'deny' },
            xssFilter: true
        });
    }

    // Audit Logging
    logSecurityEvent(eventType, data = {}) {
        const event = {
            id: crypto.randomUUID(),
            type: eventType,
            timestamp: new Date(),
            data,
            severity: this.getEventSeverity(eventType)
        };

        this.securityEvents.push(event);

        // Keep only last 1000 events in memory
        if (this.securityEvents.length > 1000) {
            this.securityEvents.shift();
        }

        // Store in database for persistence
        DatabaseService.create('security_events', event);

        // Send alerts for high severity events
        if (event.severity === 'high') {
            this.sendSecurityAlert(event);
        }

        console.log(`Security Event [${event.severity.toUpperCase()}]: ${eventType}`, data);
    }

    getEventSeverity(eventType) {
        const severityMap = {
            'login_failed': 'medium',
            'account_locked': 'high',
            'password_changed': 'medium',
            'api_key_created': 'low',
            'api_key_revoked': 'medium',
            'rate_limit_exceeded': 'medium',
            'ip_blocked': 'high',
            'suspicious_activity': 'high',
            'data_breach_attempt': 'critical',
            'unauthorized_access': 'high'
        };

        return severityMap[eventType] || 'low';
    }

    async sendSecurityAlert(event) {
        try {
            // Get all admin users
            const admins = await DatabaseService.query(
                "SELECT id FROM users WHERE role IN ('owner', 'admin')"
            );

            for (const admin of admins.rows) {
                await NotificationService.sendToUser(admin.id, {
                    type: 'security.alert',
                    title: 'Security Alert',
                    message: `Security event detected: ${event.type}`,
                    priority: 'high',
                    data: event
                });
            }
        } catch (error) {
            console.error('Failed to send security alert:', error);
        }
    }

    // Data Privacy and Compliance
    anonymizeData(data, fields = []) {
        const anonymized = { ...data };
        
        for (const field of fields) {
            if (anonymized[field]) {
                if (field.includes('email')) {
                    anonymized[field] = this.anonymizeEmail(anonymized[field]);
                } else if (field.includes('phone')) {
                    anonymized[field] = this.anonymizePhone(anonymized[field]);
                } else {
                    anonymized[field] = '***REDACTED***';
                }
            }
        }

        return anonymized;
    }

    anonymizeEmail(email) {
        const [username, domain] = email.split('@');
        const anonymizedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
        return `${anonymizedUsername}@${domain}`;
    }

    anonymizePhone(phone) {
        return phone.replace(/\d(?=\d{4})/g, '*');
    }

    // GDPR Compliance
    async handleDataDeletionRequest(userId) {
        try {
            // Anonymize user data instead of hard delete to maintain referential integrity
            const anonymizedData = {
                email: `deleted_user_${userId}@example.com`,
                first_name: 'Deleted',
                last_name: 'User',
                phone: null,
                settings: null,
                deleted_at: new Date(),
                gdpr_deleted: true
            };

            await DatabaseService.update('users', userId, anonymizedData);

            // Delete or anonymize related data
            await this.anonymizeUserRelatedData(userId);

            this.logSecurityEvent('gdpr_deletion', {
                userId,
                timestamp: new Date()
            });

            return { message: 'User data deletion completed' };

        } catch (error) {
            console.error('GDPR deletion error:', error);
            throw error;
        }
    }

    async anonymizeUserRelatedData(userId) {
        // Anonymize meeting data
        await DatabaseService.query(
            'UPDATE meetings SET host_name = $1 WHERE host_id = $2',
            ['Deleted User', userId]
        );

        // Delete personal activity logs
        await DatabaseService.query(
            'DELETE FROM user_activities WHERE user_id = $1',
            [userId]
        );

        // Anonymize AI analysis data
        await DatabaseService.query(
            'UPDATE ai_analyses SET user_data = $1 WHERE user_id = $2',
            [null, userId]
        );
    }

    // Security Monitoring and Reporting
    getSecurityReport(timeRange = '24h') {
        const now = new Date();
        const startTime = moment().subtract(1, timeRange.slice(-1) === 'h' ? 'hours' : 'days').toDate();

        const recentEvents = this.securityEvents.filter(
            event => event.timestamp >= startTime
        );

        const eventsByType = {};
        const eventsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };

        recentEvents.forEach(event => {
            eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
            eventsBySeverity[event.severity]++;
        });

        return {
            timeRange,
            period: { start: startTime, end: now },
            summary: {
                totalEvents: recentEvents.length,
                blockedIPs: this.blockedIPs.size,
                suspiciousIPs: this.suspiciousActivities.size,
                activeAPIKeys: this.apiKeyUsage.size
            },
            eventsByType,
            eventsBySeverity,
            recentEvents: recentEvents.slice(-10) // Last 10 events
        };
    }

    // Security Middleware
    securityMiddleware() {
        return (req, res, next) => {
            try {
                // Check IP security
                this.checkIPSecurity(req.ip, req.get('User-Agent'));

                // Add security headers
                res.set({
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'X-XSS-Protection': '1; mode=block',
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                });

                next();
            } catch (error) {
                res.status(403).json({
                    error: 'Access denied',
                    message: error.message
                });
            }
        };
    }

    // Initialize security monitoring
    initializeSecurityMonitoring() {
        // Clean up expired data every hour
        setInterval(() => {
            this.cleanupExpiredData();
        }, 60 * 60 * 1000);

        // Generate security reports every 24 hours
        setInterval(() => {
            const report = this.getSecurityReport('24h');
            console.log('Daily Security Report:', report);
        }, 24 * 60 * 60 * 1000);
    }

    cleanupExpiredData() {
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;

        // Clean up old suspicious activities
        for (const [ip, activity] of this.suspiciousActivities.entries()) {
            if (now - activity.lastAttempt > oneDay) {
                this.suspiciousActivities.delete(ip);
            }
        }

        // Clean up old security events (keep only last 7 days)
        const sevenDaysAgo = new Date(now - 7 * oneDay);
        this.securityEvents = this.securityEvents.filter(
            event => event.timestamp > sevenDaysAgo
        );
    }

    // Get security status
    getSecurityStatus() {
        return {
            encryptionEnabled: !!this.encryptionKey,
            blockedIPs: this.blockedIPs.size,
            suspiciousActivities: this.suspiciousActivities.size,
            recentEvents: this.securityEvents.length,
            securityLevel: this.calculateSecurityLevel()
        };
    }

    calculateSecurityLevel() {
        const recentHighSeverityEvents = this.securityEvents.filter(
            event => event.severity === 'high' || event.severity === 'critical'
        ).length;

        if (recentHighSeverityEvents > 10) return 'high-risk';
        if (recentHighSeverityEvents > 5) return 'medium-risk';
        if (this.blockedIPs.size > 0) return 'low-risk';
        return 'secure';
    }
}

module.exports = new SecurityService();
