const jwt = require('jsonwebtoken');
const DatabaseService = require('../services/DatabaseService');

class AuthMiddleware {
    static async authenticate(req, res, next) {
        try {
            // Get token from header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'Please provide a valid authentication token'
                });
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix

            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (jwtError) {
                if (jwtError.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        error: 'Token expired',
                        message: 'Your session has expired. Please log in again.'
                    });
                } else if (jwtError.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        error: 'Invalid token',
                        message: 'The provided token is invalid'
                    });
                } else {
                    throw jwtError;
                }
            }

            // Get user from database
            const user = await DatabaseService.findById('users', decoded.userId);
            if (!user) {
                return res.status(401).json({
                    error: 'User not found',
                    message: 'The user associated with this token no longer exists'
                });
            }

            // Check if user is active
            if (!user.is_active) {
                return res.status(401).json({
                    error: 'Account deactivated',
                    message: 'Your account has been deactivated. Please contact support.'
                });
            }

            // Add user info to request
            req.user = {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                subscriptionTier: user.subscription_tier,
                organizationId: decoded.organizationId || null
            };

            // Update last activity
            await DatabaseService.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );

            next();
        } catch (error) {
            console.error('Authentication error:', error);
            return res.status(500).json({
                error: 'Authentication failed',
                message: 'An error occurred during authentication'
            });
        }
    }

    static requireRole(roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'Please authenticate first'
                });
            }

            const userRole = req.user.role;
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
                });
            }

            next();
        };
    }

    static requireSubscription(tiers) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'Please authenticate first'
                });
            }

            const userTier = req.user.subscriptionTier;
            const allowedTiers = Array.isArray(tiers) ? tiers : [tiers];

            // Define tier hierarchy
            const tierHierarchy = {
                'free': 0,
                'basic': 1,
                'pro': 2,
                'enterprise': 3
            };

            const userTierLevel = tierHierarchy[userTier] || 0;
            const requiredTierLevel = Math.min(...allowedTiers.map(tier => tierHierarchy[tier] || 0));

            if (userTierLevel < requiredTierLevel) {
                return res.status(403).json({
                    error: 'Subscription upgrade required',
                    message: `This feature requires a ${allowedTiers.join(' or ')} subscription`,
                    currentTier: userTier,
                    requiredTiers: allowedTiers
                });
            }

            next();
        };
    }

    static async requireOrganization(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'Please authenticate first'
                });
            }

            // Check if user belongs to an organization
            const membership = await DatabaseService.query(
                'SELECT * FROM user_organizations WHERE user_id = $1',
                [req.user.id]
            );

            if (membership.rows.length === 0) {
                return res.status(403).json({
                    error: 'Organization membership required',
                    message: 'This feature requires organization membership'
                });
            }

            // Add organization info to request
            req.user.organizations = membership.rows;
            req.user.primaryOrganization = membership.rows[0]; // First organization as primary

            next();
        } catch (error) {
            console.error('Organization check error:', error);
            return res.status(500).json({
                error: 'Authorization failed',
                message: 'An error occurred during authorization'
            });
        }
    }

    static rateLimit(options = {}) {
        const {
            windowMs = 15 * 60 * 1000, // 15 minutes
            maxRequests = 100,
            message = 'Too many requests, please try again later'
        } = options;

        const requests = new Map();

        return (req, res, next) => {
            const key = req.user ? req.user.id : req.ip;
            const now = Date.now();
            const windowStart = now - windowMs;

            // Clean old requests
            if (requests.has(key)) {
                const userRequests = requests.get(key).filter(time => time > windowStart);
                requests.set(key, userRequests);
            }

            // Check rate limit
            const currentRequests = requests.get(key) || [];
            if (currentRequests.length >= maxRequests) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: message,
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }

            // Add current request
            currentRequests.push(now);
            requests.set(key, currentRequests);

            next();
        };
    }

    static async validateApiKey(req, res, next) {
        try {
            const apiKey = req.headers['x-api-key'];
            if (!apiKey) {
                return res.status(401).json({
                    error: 'API key required',
                    message: 'Please provide a valid API key in the X-API-Key header'
                });
            }

            // Find API key in database
            const keyRecord = await DatabaseService.query(
                'SELECT ak.*, u.id as user_id, u.email, u.role FROM api_keys ak JOIN users u ON ak.user_id = u.id WHERE ak.encrypted_key = $1 AND ak.is_active = true',
                [apiKey]
            );

            if (keyRecord.rows.length === 0) {
                return res.status(401).json({
                    error: 'Invalid API key',
                    message: 'The provided API key is invalid or inactive'
                });
            }

            const key = keyRecord.rows[0];

            // Update last used timestamp
            await DatabaseService.query(
                'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = $1',
                [key.id]
            );

            // Add user info to request
            req.user = {
                id: key.user_id,
                email: key.email,
                role: key.role,
                apiKeyId: key.id,
                isApiRequest: true
            };

            next();
        } catch (error) {
            console.error('API key validation error:', error);
            return res.status(500).json({
                error: 'Authentication failed',
                message: 'An error occurred during API key validation'
            });
        }
    }

    static optional(req, res, next) {
        // Optional authentication - doesn't fail if no token provided
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        // If token is provided, validate it
        AuthMiddleware.authenticate(req, res, next);
    }
}

module.exports = AuthMiddleware.authenticate;
module.exports.requireRole = AuthMiddleware.requireRole;
module.exports.requireSubscription = AuthMiddleware.requireSubscription;
module.exports.requireOrganization = AuthMiddleware.requireOrganization;
module.exports.rateLimit = AuthMiddleware.rateLimit;
module.exports.validateApiKey = AuthMiddleware.validateApiKey;
module.exports.optional = AuthMiddleware.optional;
