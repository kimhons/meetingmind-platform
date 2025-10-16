const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');

const DatabaseService = require('./DatabaseService');
const NotificationService = require('./NotificationService');

class UserManagementService {
    constructor() {
        this.passwordResetTokens = new Map(); // token -> { userId, expires }
        this.invitationTokens = new Map(); // token -> { email, organizationId, role, expires }
        this.sessionManager = new Map(); // sessionId -> { userId, expires, device }
    }

    // User Registration and Authentication
    async registerUser(userData) {
        const {
            email,
            password,
            firstName,
            lastName,
            organizationName,
            invitationToken
        } = userData;

        try {
            // Check if user already exists
            const existingUser = await DatabaseService.findByField('users', 'email', email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Validate invitation token if provided
            let organizationId = null;
            let role = 'owner';
            
            if (invitationToken) {
                const invitation = this.invitationTokens.get(invitationToken);
                if (!invitation || invitation.expires < new Date()) {
                    throw new Error('Invalid or expired invitation token');
                }
                
                if (invitation.email !== email) {
                    throw new Error('Invitation token does not match email');
                }
                
                organizationId = invitation.organizationId;
                role = invitation.role;
                
                // Remove used token
                this.invitationTokens.delete(invitationToken);
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create organization if needed
            if (!organizationId && organizationName) {
                const organization = await DatabaseService.create('organizations', {
                    name: organizationName,
                    subscription_tier: 'free',
                    created_at: new Date(),
                    settings: {
                        allowInvitations: true,
                        requireApproval: false,
                        maxUsers: 5
                    }
                });
                organizationId = organization.id;
            }

            // Create user
            const user = await DatabaseService.create('users', {
                email,
                password_hash: hashedPassword,
                first_name: firstName,
                last_name: lastName,
                organization_id: organizationId,
                role,
                subscription_tier: organizationId ? 'free' : 'free',
                email_verified: false,
                created_at: new Date(),
                last_seen: new Date(),
                settings: {
                    notifications: {
                        email: true,
                        push: true,
                        sms: false
                    },
                    privacy: {
                        profileVisible: true,
                        activityVisible: false
                    },
                    preferences: {
                        theme: 'light',
                        language: 'en',
                        timezone: 'UTC'
                    }
                }
            });

            // Send verification email
            await this.sendEmailVerification(user.id, email);

            // Send welcome notification
            await NotificationService.sendToUser(user.id, {
                type: 'system.welcome',
                title: 'Welcome to MeetingMind!',
                message: 'Your account has been created successfully. Please verify your email to get started.',
                priority: 'medium'
            });

            return {
                user: this.sanitizeUser(user),
                message: 'User registered successfully. Please check your email for verification.'
            };

        } catch (error) {
            console.error('User registration error:', error);
            throw error;
        }
    }

    async authenticateUser(email, password, deviceInfo = {}) {
        try {
            const user = await DatabaseService.findByField('users', 'email', email);
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Check if account is locked
            if (user.account_locked && user.locked_until > new Date()) {
                const unlockTime = moment(user.locked_until).fromNow();
                throw new Error(`Account is locked. Try again ${unlockTime}`);
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                await this.handleFailedLogin(user.id);
                throw new Error('Invalid email or password');
            }

            // Check if email is verified
            if (!user.email_verified) {
                throw new Error('Please verify your email before logging in');
            }

            // Reset failed login attempts
            await DatabaseService.update('users', user.id, {
                failed_login_attempts: 0,
                account_locked: false,
                locked_until: null,
                last_login: new Date(),
                last_seen: new Date()
            });

            // Create session
            const sessionId = crypto.randomUUID();
            const token = this.generateJWT(user);
            
            this.sessionManager.set(sessionId, {
                userId: user.id,
                expires: moment().add(7, 'days').toDate(),
                device: {
                    userAgent: deviceInfo.userAgent,
                    ip: deviceInfo.ip,
                    location: deviceInfo.location
                },
                createdAt: new Date()
            });

            // Log login activity
            await this.logUserActivity(user.id, 'login', {
                sessionId,
                device: deviceInfo,
                timestamp: new Date()
            });

            return {
                user: this.sanitizeUser(user),
                token,
                sessionId,
                expiresIn: '7d'
            };

        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    async logoutUser(userId, sessionId) {
        try {
            // Remove session
            this.sessionManager.delete(sessionId);

            // Update last seen
            await DatabaseService.update('users', userId, {
                last_seen: new Date()
            });

            // Log logout activity
            await this.logUserActivity(userId, 'logout', {
                sessionId,
                timestamp: new Date()
            });

            return { message: 'Logged out successfully' };

        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    // Organization Management
    async createOrganization(userId, organizationData) {
        const { name, description, settings = {} } = organizationData;

        try {
            const user = await DatabaseService.findById('users', userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (user.organization_id) {
                throw new Error('User already belongs to an organization');
            }

            const organization = await DatabaseService.create('organizations', {
                name,
                description,
                owner_id: userId,
                subscription_tier: 'free',
                created_at: new Date(),
                settings: {
                    allowInvitations: true,
                    requireApproval: false,
                    maxUsers: 5,
                    ...settings
                }
            });

            // Update user to be organization owner
            await DatabaseService.update('users', userId, {
                organization_id: organization.id,
                role: 'owner'
            });

            // Send notification
            await NotificationService.sendToUser(userId, {
                type: 'organization.created',
                title: 'Organization Created',
                message: `Your organization "${name}" has been created successfully.`,
                priority: 'medium'
            });

            return organization;

        } catch (error) {
            console.error('Organization creation error:', error);
            throw error;
        }
    }

    async inviteUserToOrganization(inviterId, email, role = 'member') {
        try {
            const inviter = await DatabaseService.findById('users', inviterId);
            if (!inviter || !inviter.organization_id) {
                throw new Error('Inviter must belong to an organization');
            }

            if (!['owner', 'admin'].includes(inviter.role)) {
                throw new Error('Only owners and admins can invite users');
            }

            const organization = await DatabaseService.findById('organizations', inviter.organization_id);
            if (!organization) {
                throw new Error('Organization not found');
            }

            // Check if user already exists
            const existingUser = await DatabaseService.findByField('users', 'email', email);
            if (existingUser && existingUser.organization_id === organization.id) {
                throw new Error('User is already a member of this organization');
            }

            // Generate invitation token
            const invitationToken = crypto.randomBytes(32).toString('hex');
            const expires = moment().add(7, 'days').toDate();

            this.invitationTokens.set(invitationToken, {
                email,
                organizationId: organization.id,
                role,
                inviterId,
                expires
            });

            // Send invitation email
            await this.sendInvitationEmail(email, organization.name, invitationToken, inviter);

            // Log activity
            await this.logUserActivity(inviterId, 'user.invited', {
                email,
                organizationId: organization.id,
                role,
                timestamp: new Date()
            });

            return {
                message: 'Invitation sent successfully',
                invitationToken,
                expires
            };

        } catch (error) {
            console.error('User invitation error:', error);
            throw error;
        }
    }

    async updateUserRole(adminId, targetUserId, newRole) {
        try {
            const admin = await DatabaseService.findById('users', adminId);
            const targetUser = await DatabaseService.findById('users', targetUserId);

            if (!admin || !targetUser) {
                throw new Error('User not found');
            }

            if (admin.organization_id !== targetUser.organization_id) {
                throw new Error('Users must be in the same organization');
            }

            if (!['owner', 'admin'].includes(admin.role)) {
                throw new Error('Only owners and admins can update user roles');
            }

            if (admin.role === 'admin' && ['owner', 'admin'].includes(newRole)) {
                throw new Error('Admins cannot promote users to owner or admin');
            }

            if (targetUser.role === 'owner' && admin.role !== 'owner') {
                throw new Error('Only owners can modify owner roles');
            }

            await DatabaseService.update('users', targetUserId, {
                role: newRole,
                updated_at: new Date()
            });

            // Send notifications
            await NotificationService.sendToUser(targetUserId, {
                type: 'role.updated',
                title: 'Role Updated',
                message: `Your role has been updated to ${newRole}.`,
                priority: 'medium'
            });

            // Log activity
            await this.logUserActivity(adminId, 'role.updated', {
                targetUserId,
                oldRole: targetUser.role,
                newRole,
                timestamp: new Date()
            });

            return {
                message: 'User role updated successfully',
                user: this.sanitizeUser({ ...targetUser, role: newRole })
            };

        } catch (error) {
            console.error('Role update error:', error);
            throw error;
        }
    }

    // Subscription Management
    async updateSubscription(userId, subscriptionData) {
        const { tier, billingCycle, paymentMethod } = subscriptionData;

        try {
            const user = await DatabaseService.findById('users', userId);
            if (!user) {
                throw new Error('User not found');
            }

            const validTiers = ['free', 'basic', 'pro', 'enterprise'];
            if (!validTiers.includes(tier)) {
                throw new Error('Invalid subscription tier');
            }

            // Update user subscription
            await DatabaseService.update('users', userId, {
                subscription_tier: tier,
                subscription_updated_at: new Date()
            });

            // Update organization subscription if user is owner
            if (user.role === 'owner' && user.organization_id) {
                await DatabaseService.update('organizations', user.organization_id, {
                    subscription_tier: tier,
                    subscription_updated_at: new Date()
                });
            }

            // Send notification
            await NotificationService.sendToUser(userId, {
                type: 'subscription.updated',
                title: 'Subscription Updated',
                message: `Your subscription has been updated to ${tier}.`,
                priority: 'medium',
                data: { tier, billingCycle }
            });

            // Log activity
            await this.logUserActivity(userId, 'subscription.updated', {
                oldTier: user.subscription_tier,
                newTier: tier,
                billingCycle,
                timestamp: new Date()
            });

            return {
                message: 'Subscription updated successfully',
                subscription: {
                    tier,
                    billingCycle,
                    updatedAt: new Date()
                }
            };

        } catch (error) {
            console.error('Subscription update error:', error);
            throw error;
        }
    }

    // User Profile Management
    async updateUserProfile(userId, profileData) {
        try {
            const allowedFields = [
                'first_name',
                'last_name',
                'phone',
                'timezone',
                'language',
                'settings'
            ];

            const updateData = {};
            for (const field of allowedFields) {
                if (profileData[field] !== undefined) {
                    updateData[field] = profileData[field];
                }
            }

            updateData.updated_at = new Date();

            await DatabaseService.update('users', userId, updateData);

            const updatedUser = await DatabaseService.findById('users', userId);

            return {
                message: 'Profile updated successfully',
                user: this.sanitizeUser(updatedUser)
            };

        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await DatabaseService.findById('users', userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            await DatabaseService.update('users', userId, {
                password_hash: hashedPassword,
                password_updated_at: new Date()
            });

            // Invalidate all sessions except current one
            for (const [sessionId, session] of this.sessionManager.entries()) {
                if (session.userId === userId) {
                    this.sessionManager.delete(sessionId);
                }
            }

            // Send notification
            await NotificationService.sendToUser(userId, {
                type: 'security.password_changed',
                title: 'Password Changed',
                message: 'Your password has been changed successfully.',
                priority: 'high'
            });

            // Log activity
            await this.logUserActivity(userId, 'password.changed', {
                timestamp: new Date()
            });

            return { message: 'Password changed successfully' };

        } catch (error) {
            console.error('Password change error:', error);
            throw error;
        }
    }

    // Email Verification
    async sendEmailVerification(userId, email) {
        try {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const expires = moment().add(24, 'hours').toDate();

            // Store verification token
            await DatabaseService.update('users', userId, {
                email_verification_token: verificationToken,
                email_verification_expires: expires
            });

            // Send verification email (implement email service)
            console.log(`Email verification token for ${email}: ${verificationToken}`);

            return { message: 'Verification email sent' };

        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    }

    async verifyEmail(token) {
        try {
            const user = await DatabaseService.findByField('users', 'email_verification_token', token);
            if (!user) {
                throw new Error('Invalid verification token');
            }

            if (user.email_verification_expires < new Date()) {
                throw new Error('Verification token has expired');
            }

            await DatabaseService.update('users', user.id, {
                email_verified: true,
                email_verification_token: null,
                email_verification_expires: null,
                verified_at: new Date()
            });

            // Send welcome notification
            await NotificationService.sendToUser(user.id, {
                type: 'email.verified',
                title: 'Email Verified',
                message: 'Your email has been verified successfully. Welcome to MeetingMind!',
                priority: 'medium'
            });

            return { message: 'Email verified successfully' };

        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    }

    // Password Reset
    async requestPasswordReset(email) {
        try {
            const user = await DatabaseService.findByField('users', 'email', email);
            if (!user) {
                // Don't reveal if email exists
                return { message: 'If an account with this email exists, a password reset link has been sent.' };
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const expires = moment().add(1, 'hour').toDate();

            this.passwordResetTokens.set(resetToken, {
                userId: user.id,
                expires
            });

            // Send password reset email
            console.log(`Password reset token for ${email}: ${resetToken}`);

            // Log activity
            await this.logUserActivity(user.id, 'password.reset_requested', {
                timestamp: new Date()
            });

            return { message: 'If an account with this email exists, a password reset link has been sent.' };

        } catch (error) {
            console.error('Password reset request error:', error);
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            const resetData = this.passwordResetTokens.get(token);
            if (!resetData || resetData.expires < new Date()) {
                throw new Error('Invalid or expired reset token');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);

            await DatabaseService.update('users', resetData.userId, {
                password_hash: hashedPassword,
                password_updated_at: new Date()
            });

            // Remove used token
            this.passwordResetTokens.delete(token);

            // Invalidate all sessions
            for (const [sessionId, session] of this.sessionManager.entries()) {
                if (session.userId === resetData.userId) {
                    this.sessionManager.delete(sessionId);
                }
            }

            // Send notification
            await NotificationService.sendToUser(resetData.userId, {
                type: 'security.password_reset',
                title: 'Password Reset',
                message: 'Your password has been reset successfully.',
                priority: 'high'
            });

            // Log activity
            await this.logUserActivity(resetData.userId, 'password.reset_completed', {
                timestamp: new Date()
            });

            return { message: 'Password reset successfully' };

        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }

    // User Activity and Security
    async getUserActivity(userId, options = {}) {
        const { page = 1, limit = 20, type } = options;
        const offset = (page - 1) * limit;

        try {
            let query = 'SELECT * FROM user_activities WHERE user_id = $1';
            const params = [userId];

            if (type) {
                query += ' AND activity_type = $2';
                params.push(type);
            }

            query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
            params.push(limit, offset);

            const result = await DatabaseService.query(query, params);

            return {
                activities: result.rows,
                pagination: {
                    page,
                    limit,
                    total: result.rowCount
                }
            };

        } catch (error) {
            console.error('Get user activity error:', error);
            throw error;
        }
    }

    async logUserActivity(userId, activityType, data = {}) {
        try {
            await DatabaseService.create('user_activities', {
                user_id: userId,
                activity_type: activityType,
                data,
                created_at: new Date(),
                ip_address: data.ip,
                user_agent: data.userAgent
            });
        } catch (error) {
            console.error('Log activity error:', error);
            // Don't throw - logging should not break main functionality
        }
    }

    async handleFailedLogin(userId) {
        try {
            const user = await DatabaseService.findById('users', userId);
            const attempts = (user.failed_login_attempts || 0) + 1;

            const updateData = {
                failed_login_attempts: attempts,
                last_failed_login: new Date()
            };

            // Lock account after 5 failed attempts
            if (attempts >= 5) {
                updateData.account_locked = true;
                updateData.locked_until = moment().add(30, 'minutes').toDate();

                // Send security notification
                await NotificationService.sendToUser(userId, {
                    type: 'security.account_locked',
                    title: 'Account Locked',
                    message: 'Your account has been locked due to multiple failed login attempts.',
                    priority: 'high'
                });
            }

            await DatabaseService.update('users', userId, updateData);

        } catch (error) {
            console.error('Handle failed login error:', error);
        }
    }

    // Utility Methods
    generateJWT(user) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organization_id,
                subscriptionTier: user.subscription_tier
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    }

    sanitizeUser(user) {
        const {
            password_hash,
            email_verification_token,
            email_verification_expires,
            failed_login_attempts,
            account_locked,
            locked_until,
            ...sanitizedUser
        } = user;

        return sanitizedUser;
    }

    async sendInvitationEmail(email, organizationName, token, inviter) {
        // Implement email service integration
        console.log(`Invitation email for ${email} to join ${organizationName}: ${token}`);
        console.log(`Invited by: ${inviter.first_name} ${inviter.last_name} (${inviter.email})`);
    }

    // Session Management
    validateSession(sessionId) {
        const session = this.sessionManager.get(sessionId);
        if (!session || session.expires < new Date()) {
            this.sessionManager.delete(sessionId);
            return null;
        }
        return session;
    }

    getUserSessions(userId) {
        const userSessions = [];
        for (const [sessionId, session] of this.sessionManager.entries()) {
            if (session.userId === userId) {
                userSessions.push({
                    sessionId,
                    device: session.device,
                    createdAt: session.createdAt,
                    expires: session.expires
                });
            }
        }
        return userSessions;
    }

    revokeSession(userId, sessionId) {
        const session = this.sessionManager.get(sessionId);
        if (session && session.userId === userId) {
            this.sessionManager.delete(sessionId);
            return true;
        }
        return false;
    }

    revokeAllSessions(userId, exceptSessionId = null) {
        let revokedCount = 0;
        for (const [sessionId, session] of this.sessionManager.entries()) {
            if (session.userId === userId && sessionId !== exceptSessionId) {
                this.sessionManager.delete(sessionId);
                revokedCount++;
            }
        }
        return revokedCount;
    }

    // Cleanup expired tokens and sessions
    cleanupExpiredTokens() {
        const now = new Date();
        
        // Clean up password reset tokens
        for (const [token, data] of this.passwordResetTokens.entries()) {
            if (data.expires < now) {
                this.passwordResetTokens.delete(token);
            }
        }

        // Clean up invitation tokens
        for (const [token, data] of this.invitationTokens.entries()) {
            if (data.expires < now) {
                this.invitationTokens.delete(token);
            }
        }

        // Clean up expired sessions
        for (const [sessionId, session] of this.sessionManager.entries()) {
            if (session.expires < now) {
                this.sessionManager.delete(sessionId);
            }
        }
    }
}

module.exports = new UserManagementService();
