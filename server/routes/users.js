const express = require('express');
const { body, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const UserManagementService = require('../services/UserManagementService');
const SecurityService = require('../services/SecurityService');
const { requireAuth, requireRole, requireSubscription } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for different user operations
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again later'
    }
});

const generalLimiter = SecurityService.createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many requests'
});

// Apply general rate limiting to all routes
router.use(generalLimiter);

// User Registration
router.post('/register', authLimiter, [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    body('firstName')
        .trim()
        .isLength({ min: 1 })
        .withMessage('First name is required'),
    body('lastName')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Last name is required'),
    body('organizationName')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Organization name must not be empty'),
    body('invitationToken')
        .optional()
        .isString()
        .withMessage('Invalid invitation token')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        // Sanitize inputs
        const userData = {
            email: SecurityService.validateAndSanitizeInput(req.body.email, 'email'),
            password: req.body.password, // Don't sanitize password
            firstName: SecurityService.validateAndSanitizeInput(req.body.firstName, 'name'),
            lastName: SecurityService.validateAndSanitizeInput(req.body.lastName, 'name'),
            organizationName: req.body.organizationName ? 
                SecurityService.validateAndSanitizeInput(req.body.organizationName, 'name') : null,
            invitationToken: req.body.invitationToken
        };

        const result = await UserManagementService.registerUser(userData);

        SecurityService.logSecurityEvent('user_registered', {
            email: userData.email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json(result);

    } catch (error) {
        console.error('Registration error:', error);
        
        SecurityService.logSecurityEvent('registration_failed', {
            email: req.body.email,
            error: error.message,
            ip: req.ip
        });

        res.status(400).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});

// User Login
router.post('/login', authLimiter, [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password } = req.body;
        const deviceInfo = {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            location: req.get('CF-IPCountry') || 'Unknown'
        };

        const result = await UserManagementService.authenticateUser(email, password, deviceInfo);

        SecurityService.logSecurityEvent('user_login', {
            userId: result.user.id,
            email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json(result);

    } catch (error) {
        console.error('Login error:', error);
        
        SecurityService.logSecurityEvent('login_failed', {
            email: req.body.email,
            error: error.message,
            ip: req.ip
        });

        res.status(401).json({
            error: 'Authentication failed',
            message: error.message
        });
    }
});

// User Logout
router.post('/logout', requireAuth, async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'];
        await UserManagementService.logoutUser(req.user.id, sessionId);

        SecurityService.logSecurityEvent('user_logout', {
            userId: req.user.id,
            sessionId,
            ip: req.ip
        });

        res.json({ message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: 'An error occurred during logout'
        });
    }
});

// Get Current User Profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        res.json({
            user: UserManagementService.sanitizeUser(req.user)
        });

    } catch (error) {
        console.error('Profile retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve profile',
            message: 'An error occurred while retrieving your profile'
        });
    }
});

// Update User Profile
router.put('/profile', requireAuth, [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('First name must not be empty'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Last name must not be empty'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Valid phone number is required'),
    body('timezone')
        .optional()
        .isString()
        .withMessage('Valid timezone is required'),
    body('language')
        .optional()
        .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja'])
        .withMessage('Unsupported language'),
    body('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be an object')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const result = await UserManagementService.updateUserProfile(req.user.id, req.body);

        SecurityService.logSecurityEvent('profile_updated', {
            userId: req.user.id,
            ip: req.ip
        });

        res.json(result);

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Profile update failed',
            message: error.message
        });
    }
});

// Change Password
router.put('/password', requireAuth, authLimiter, [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        
        // Validate new password strength
        SecurityService.validatePassword(newPassword);

        const result = await UserManagementService.changePassword(
            req.user.id,
            currentPassword,
            newPassword
        );

        SecurityService.logSecurityEvent('password_changed', {
            userId: req.user.id,
            ip: req.ip
        });

        res.json(result);

    } catch (error) {
        console.error('Password change error:', error);
        res.status(400).json({
            error: 'Password change failed',
            message: error.message
        });
    }
});

// Email Verification
router.post('/verify-email', [
    body('token')
        .notEmpty()
        .withMessage('Verification token is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { token } = req.body;
        const result = await UserManagementService.verifyEmail(token);

        SecurityService.logSecurityEvent('email_verified', {
            token,
            ip: req.ip
        });

        res.json(result);

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(400).json({
            error: 'Email verification failed',
            message: error.message
        });
    }
});

// Resend Email Verification
router.post('/resend-verification', requireAuth, async (req, res) => {
    try {
        if (req.user.email_verified) {
            return res.status(400).json({
                error: 'Email already verified',
                message: 'Your email is already verified'
            });
        }

        await UserManagementService.sendEmailVerification(req.user.id, req.user.email);

        res.json({
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            error: 'Failed to resend verification',
            message: 'An error occurred while sending verification email'
        });
    }
});

// Password Reset Request
router.post('/forgot-password', authLimiter, [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email } = req.body;
        const result = await UserManagementService.requestPasswordReset(email);

        SecurityService.logSecurityEvent('password_reset_requested', {
            email,
            ip: req.ip
        });

        res.json(result);

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            error: 'Password reset request failed',
            message: 'An error occurred while processing your request'
        });
    }
});

// Password Reset
router.post('/reset-password', authLimiter, [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { token, newPassword } = req.body;
        
        // Validate password strength
        SecurityService.validatePassword(newPassword);

        const result = await UserManagementService.resetPassword(token, newPassword);

        SecurityService.logSecurityEvent('password_reset_completed', {
            token,
            ip: req.ip
        });

        res.json(result);

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(400).json({
            error: 'Password reset failed',
            message: error.message
        });
    }
});

// Organization Management Routes

// Create Organization
router.post('/organization', requireAuth, [
    body('name')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Organization name is required'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const result = await UserManagementService.createOrganization(req.user.id, req.body);

        SecurityService.logSecurityEvent('organization_created', {
            userId: req.user.id,
            organizationName: req.body.name,
            ip: req.ip
        });

        res.status(201).json(result);

    } catch (error) {
        console.error('Organization creation error:', error);
        res.status(400).json({
            error: 'Organization creation failed',
            message: error.message
        });
    }
});

// Invite User to Organization
router.post('/organization/invite', 
    requireAuth,
    requireRole(['owner', 'admin']),
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('role')
            .isIn(['member', 'admin'])
            .withMessage('Role must be either member or admin')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { email, role } = req.body;
            const result = await UserManagementService.inviteUserToOrganization(
                req.user.id,
                email,
                role
            );

            SecurityService.logSecurityEvent('user_invited', {
                inviterId: req.user.id,
                email,
                role,
                organizationId: req.user.organizationId,
                ip: req.ip
            });

            res.json(result);

        } catch (error) {
            console.error('User invitation error:', error);
            res.status(400).json({
                error: 'Invitation failed',
                message: error.message
            });
        }
    }
);

// Update User Role
router.put('/organization/users/:userId/role',
    requireAuth,
    requireRole(['owner', 'admin']),
    [
        body('role')
            .isIn(['member', 'admin', 'owner'])
            .withMessage('Invalid role')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { userId } = req.params;
            const { role } = req.body;

            const result = await UserManagementService.updateUserRole(
                req.user.id,
                userId,
                role
            );

            SecurityService.logSecurityEvent('role_updated', {
                adminId: req.user.id,
                targetUserId: userId,
                newRole: role,
                ip: req.ip
            });

            res.json(result);

        } catch (error) {
            console.error('Role update error:', error);
            res.status(400).json({
                error: 'Role update failed',
                message: error.message
            });
        }
    }
);

// Subscription Management

// Update Subscription
router.put('/subscription',
    requireAuth,
    requireRole(['owner']),
    [
        body('tier')
            .isIn(['free', 'basic', 'pro', 'enterprise'])
            .withMessage('Invalid subscription tier'),
        body('billingCycle')
            .optional()
            .isIn(['monthly', 'yearly'])
            .withMessage('Billing cycle must be monthly or yearly')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const result = await UserManagementService.updateSubscription(req.user.id, req.body);

            SecurityService.logSecurityEvent('subscription_updated', {
                userId: req.user.id,
                newTier: req.body.tier,
                ip: req.ip
            });

            res.json(result);

        } catch (error) {
            console.error('Subscription update error:', error);
            res.status(400).json({
                error: 'Subscription update failed',
                message: error.message
            });
        }
    }
);

// User Activity and Security

// Get User Activity
router.get('/activity', requireAuth, [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('type')
        .optional()
        .isString()
        .withMessage('Type must be a string')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            type: req.query.type
        };

        const result = await UserManagementService.getUserActivity(req.user.id, options);

        res.json(result);

    } catch (error) {
        console.error('Activity retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve activity',
            message: 'An error occurred while retrieving user activity'
        });
    }
});

// Get User Sessions
router.get('/sessions', requireAuth, async (req, res) => {
    try {
        const sessions = UserManagementService.getUserSessions(req.user.id);

        res.json({
            sessions: sessions.map(session => ({
                sessionId: session.sessionId,
                device: session.device,
                createdAt: session.createdAt,
                expires: session.expires,
                isCurrent: session.sessionId === req.headers['x-session-id']
            }))
        });

    } catch (error) {
        console.error('Sessions retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve sessions',
            message: 'An error occurred while retrieving user sessions'
        });
    }
});

// Revoke Session
router.delete('/sessions/:sessionId', requireAuth, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const success = UserManagementService.revokeSession(req.user.id, sessionId);

        if (success) {
            SecurityService.logSecurityEvent('session_revoked', {
                userId: req.user.id,
                sessionId,
                ip: req.ip
            });

            res.json({ message: 'Session revoked successfully' });
        } else {
            res.status(404).json({
                error: 'Session not found',
                message: 'The specified session was not found'
            });
        }

    } catch (error) {
        console.error('Session revocation error:', error);
        res.status(500).json({
            error: 'Failed to revoke session',
            message: 'An error occurred while revoking the session'
        });
    }
});

// Revoke All Sessions
router.delete('/sessions', requireAuth, async (req, res) => {
    try {
        const currentSessionId = req.headers['x-session-id'];
        const revokedCount = UserManagementService.revokeAllSessions(req.user.id, currentSessionId);

        SecurityService.logSecurityEvent('all_sessions_revoked', {
            userId: req.user.id,
            revokedCount,
            ip: req.ip
        });

        res.json({
            message: 'All sessions revoked successfully',
            revokedCount
        });

    } catch (error) {
        console.error('All sessions revocation error:', error);
        res.status(500).json({
            error: 'Failed to revoke sessions',
            message: 'An error occurred while revoking sessions'
        });
    }
});

// GDPR Data Deletion Request (Enterprise only)
router.delete('/gdpr/delete-data',
    requireAuth,
    requireSubscription(['enterprise']),
    async (req, res) => {
        try {
            const result = await SecurityService.handleDataDeletionRequest(req.user.id);

            SecurityService.logSecurityEvent('gdpr_deletion_requested', {
                userId: req.user.id,
                ip: req.ip
            });

            res.json(result);

        } catch (error) {
            console.error('GDPR deletion error:', error);
            res.status(500).json({
                error: 'Data deletion failed',
                message: 'An error occurred while processing data deletion request'
            });
        }
    }
);

module.exports = router;
