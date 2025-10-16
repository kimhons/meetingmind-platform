const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const DatabaseService = require('../services/DatabaseService');
const EmailService = require('../services/EmailService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again in 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: {
        error: 'Too many registration attempts',
        message: 'Please try again in 1 hour'
    }
});

// Validation rules
const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name is required and must be less than 100 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name is required and must be less than 100 characters')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Helper function to generate JWT token
function generateToken(user, organizationId = null) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: organizationId
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

// Helper function to format user response
function formatUserResponse(user) {
    return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        subscriptionTier: user.subscription_tier,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login
    };
}

// Register new user
router.post('/register', registrationLimiter, registerValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Please check your input and try again',
                details: errors.array()
            });
        }

        const { email, password, firstName, lastName, organizationCode } = req.body;

        // Check if user already exists
        const existingUser = await DatabaseService.findByEmail('users', email);
        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'An account with this email address already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const userData = {
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            role: 'user',
            subscription_tier: 'free',
            is_active: true,
            email_verified: false
        };

        const user = await DatabaseService.create('users', userData);

        // Handle organization invitation
        let organizationId = null;
        if (organizationCode) {
            try {
                // Decode organization invitation
                const decoded = jwt.verify(organizationCode, process.env.JWT_SECRET);
                if (decoded.type === 'organization_invite') {
                    // Add user to organization
                    await DatabaseService.create('user_organizations', {
                        user_id: user.id,
                        organization_id: decoded.organizationId,
                        role: decoded.role || 'member'
                    });
                    organizationId = decoded.organizationId;
                }
            } catch (error) {
                console.log('Invalid organization code:', error.message);
                // Continue without organization - don't fail registration
            }
        }

        // Generate email verification token
        const verificationToken = jwt.sign(
            { userId: user.id, type: 'email_verification' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send verification email
        try {
            await EmailService.sendVerificationEmail(user.email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue - don't fail registration if email fails
        }

        // Generate auth token
        const token = generateToken(user, organizationId);

        res.status(201).json({
            message: 'User registered successfully',
            user: formatUserResponse(user),
            token,
            emailVerificationSent: true
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'An error occurred during registration. Please try again.'
        });
    }
});

// Login user
router.post('/login', authLimiter, loginValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Please check your input and try again',
                details: errors.array()
            });
        }

        const { email, password, organizationId } = req.body;

        // Find user
        const user = await DatabaseService.findByEmail('users', email);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({
                error: 'Account deactivated',
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Check organization membership if organizationId provided
        let validOrganizationId = null;
        if (organizationId) {
            const membership = await DatabaseService.query(
                'SELECT * FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
                [user.id, organizationId]
            );
            
            if (membership.rows.length > 0) {
                validOrganizationId = organizationId;
            }
        }

        // Update last login
        await DatabaseService.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Generate token
        const token = generateToken(user, validOrganizationId);

        // Get user organizations
        const organizations = await DatabaseService.query(
            `SELECT o.id, o.name, o.domain, uo.role, uo.joined_at 
             FROM organizations o 
             JOIN user_organizations uo ON o.id = uo.organization_id 
             WHERE uo.user_id = $1`,
            [user.id]
        );

        res.json({
            message: 'Login successful',
            user: formatUserResponse(user),
            token,
            organizations: organizations.rows
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'An error occurred during login. Please try again.'
        });
    }
});

// Verify email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                error: 'Token required',
                message: 'Email verification token is required'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(400).json({
                error: 'Invalid token',
                message: 'The verification token is invalid or expired'
            });
        }

        if (decoded.type !== 'email_verification') {
            return res.status(400).json({
                error: 'Invalid token type',
                message: 'This token is not for email verification'
            });
        }

        // Update user email verification status
        const user = await DatabaseService.update('users', decoded.userId, {
            email_verified: true
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'The user associated with this token was not found'
            });
        }

        res.json({
            message: 'Email verified successfully',
            user: formatUserResponse(user)
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            error: 'Verification failed',
            message: 'An error occurred during email verification'
        });
    }
});

// Resend verification email
router.post('/resend-verification', authMiddleware, async (req, res) => {
    try {
        const user = await DatabaseService.findById('users', req.user.id);
        
        if (user.email_verified) {
            return res.status(400).json({
                error: 'Email already verified',
                message: 'Your email address is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = jwt.sign(
            { userId: user.id, type: 'email_verification' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send verification email
        await EmailService.sendVerificationEmail(user.email, verificationToken);

        res.json({
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            error: 'Failed to send verification email',
            message: 'An error occurred while sending the verification email'
        });
    }
});

// Forgot password
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email required',
                message: 'Please provide your email address'
            });
        }

        const user = await DatabaseService.findByEmail('users', email);
        
        // Always return success to prevent email enumeration
        const successResponse = {
            message: 'If an account with that email exists, a password reset link has been sent'
        };

        if (!user) {
            return res.json(successResponse);
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user.id, type: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Send reset email
        try {
            await EmailService.sendPasswordResetEmail(user.email, resetToken);
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError);
        }

        res.json(successResponse);

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: 'Request failed',
            message: 'An error occurred while processing your request'
        });
    }
});

// Reset password
router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Token and new password are required'
            });
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'Weak password',
                message: 'Password must be at least 8 characters long'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(400).json({
                error: 'Invalid token',
                message: 'The reset token is invalid or expired'
            });
        }

        if (decoded.type !== 'password_reset') {
            return res.status(400).json({
                error: 'Invalid token type',
                message: 'This token is not for password reset'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        const user = await DatabaseService.update('users', decoded.userId, {
            password_hash: passwordHash
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'The user associated with this token was not found'
            });
        }

        res.json({
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: 'Reset failed',
            message: 'An error occurred while resetting your password'
        });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await DatabaseService.findById('users', req.user.id);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'Your account was not found'
            });
        }

        // Get user organizations
        const organizations = await DatabaseService.query(
            `SELECT o.id, o.name, o.domain, uo.role, uo.joined_at 
             FROM organizations o 
             JOIN user_organizations uo ON o.id = uo.organization_id 
             WHERE uo.user_id = $1`,
            [user.id]
        );

        res.json({
            user: formatUserResponse(user),
            organizations: organizations.rows
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user data',
            message: 'An error occurred while retrieving your account information'
        });
    }
});

// Refresh token
router.post('/refresh', authMiddleware, async (req, res) => {
    try {
        const user = await DatabaseService.findById('users', req.user.id);
        
        if (!user || !user.is_active) {
            return res.status(401).json({
                error: 'Invalid user',
                message: 'Your account is no longer valid'
            });
        }

        // Generate new token
        const token = generateToken(user, req.user.organizationId);

        res.json({
            message: 'Token refreshed successfully',
            token
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Refresh failed',
            message: 'An error occurred while refreshing your token'
        });
    }
});

// Logout (client-side token invalidation)
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        // In a more sophisticated implementation, you might maintain a blacklist of tokens
        // For now, we'll just return success as the client should discard the token
        
        res.json({
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: 'An error occurred during logout'
        });
    }
});

module.exports = router;
