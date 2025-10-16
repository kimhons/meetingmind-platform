const EventEmitter = require('events');
const nodemailer = require('nodemailer');
const DatabaseService = require('./DatabaseService');

class NotificationService extends EventEmitter {
    constructor() {
        super();
        this.connectedClients = new Map(); // userId -> socket
        this.emailTransporter = null;
        this.notificationQueue = [];
        this.processingQueue = false;
        
        this.initializeEmailService();
        this.setupEventHandlers();
    }

    async initializeEmailService() {
        try {
            // Configure email transporter
            this.emailTransporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            // Verify email configuration
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                await this.emailTransporter.verify();
                console.log('✅ Email service initialized successfully');
            } else {
                console.log('⚠️ Email service not configured (missing SMTP credentials)');
            }
        } catch (error) {
            console.error('❌ Failed to initialize email service:', error);
        }
    }

    setupEventHandlers() {
        // Handle AI processing events
        this.on('ai.analysis.started', this.handleAnalysisStarted.bind(this));
        this.on('ai.analysis.completed', this.handleAnalysisCompleted.bind(this));
        this.on('ai.analysis.failed', this.handleAnalysisFailed.bind(this));
        
        // Handle meeting events
        this.on('meeting.started', this.handleMeetingStarted.bind(this));
        this.on('meeting.ended', this.handleMeetingEnded.bind(this));
        this.on('meeting.joined', this.handleMeetingJoined.bind(this));
        
        // Handle system events
        this.on('system.alert', this.handleSystemAlert.bind(this));
        this.on('subscription.changed', this.handleSubscriptionChanged.bind(this));
        this.on('cost.alert', this.handleCostAlert.bind(this));
    }

    // WebSocket connection management
    addClient(userId, socket) {
        this.connectedClients.set(userId, socket);
        console.log(`🔌 Client connected: ${userId}`);
        
        // Send pending notifications
        this.sendPendingNotifications(userId);
        
        // Handle disconnect
        socket.on('disconnect', () => {
            this.connectedClients.delete(userId);
            console.log(`🔌 Client disconnected: ${userId}`);
        });

        // Handle client acknowledgments
        socket.on('notification.ack', (notificationId) => {
            this.markNotificationAsRead(userId, notificationId);
        });

        // Send welcome message
        this.sendToClient(userId, {
            type: 'system.connected',
            message: 'Real-time notifications connected',
            timestamp: new Date().toISOString()
        });
    }

    // Send notification to specific user
    async sendToUser(userId, notification) {
        try {
            // Store notification in database
            const storedNotification = await this.storeNotification(userId, notification);
            
            // Send via WebSocket if user is connected
            const socket = this.connectedClients.get(userId);
            if (socket) {
                this.sendToClient(userId, {
                    ...notification,
                    id: storedNotification.id,
                    timestamp: storedNotification.created_at
                });
            }

            // Send email if notification is important and user preferences allow
            if (notification.priority === 'high' || notification.emailRequired) {
                await this.sendEmailNotification(userId, notification);
            }

            return storedNotification;
        } catch (error) {
            console.error('Failed to send notification:', error);
            throw error;
        }
    }

    // Send to multiple users
    async sendToUsers(userIds, notification) {
        const promises = userIds.map(userId => this.sendToUser(userId, notification));
        return Promise.allSettled(promises);
    }

    // Send to organization
    async sendToOrganization(organizationId, notification, excludeUserId = null) {
        try {
            const users = await DatabaseService.query(
                'SELECT id FROM users WHERE organization_id = $1 AND id != $2',
                [organizationId, excludeUserId || 0]
            );
            
            const userIds = users.rows.map(user => user.id);
            return this.sendToUsers(userIds, notification);
        } catch (error) {
            console.error('Failed to send organization notification:', error);
            throw error;
        }
    }

    // Send notification via WebSocket
    sendToClient(userId, notification) {
        const socket = this.connectedClients.get(userId);
        if (socket) {
            socket.emit('notification', notification);
        }
    }

    // Store notification in database
    async storeNotification(userId, notification) {
        return DatabaseService.create('notifications', {
            user_id: userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: JSON.stringify(notification.data || {}),
            priority: notification.priority || 'medium',
            read: false,
            email_sent: false
        });
    }

    // Send email notification
    async sendEmailNotification(userId, notification) {
        if (!this.emailTransporter) {
            console.log('Email service not configured, skipping email notification');
            return;
        }

        try {
            // Get user email and preferences
            const user = await DatabaseService.findById('users', userId);
            if (!user || !user.email) {
                console.log(`No email found for user ${userId}`);
                return;
            }

            // Check user email preferences
            const preferences = user.notification_preferences || {};
            if (preferences.email === false) {
                console.log(`Email notifications disabled for user ${userId}`);
                return;
            }

            // Prepare email content
            const emailContent = this.generateEmailContent(notification, user);
            
            const mailOptions = {
                from: `"MeetingMind" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text
            };

            await this.emailTransporter.sendMail(mailOptions);
            
            // Mark email as sent
            await DatabaseService.query(
                'UPDATE notifications SET email_sent = true WHERE user_id = $1 AND type = $2 AND created_at > NOW() - INTERVAL \'1 minute\'',
                [userId, notification.type]
            );

            console.log(`📧 Email sent to ${user.email} for notification: ${notification.type}`);
        } catch (error) {
            console.error('Failed to send email notification:', error);
        }
    }

    // Generate email content
    generateEmailContent(notification, user) {
        const baseUrl = process.env.FRONTEND_URL || 'https://meetingmind.com';
        
        const templates = {
            'ai.analysis.completed': {
                subject: 'AI Analysis Complete - MeetingMind',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">AI Analysis Complete</h2>
                        <p>Hello ${user.first_name},</p>
                        <p>Your AI analysis has been completed successfully.</p>
                        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p><strong>Analysis Type:</strong> ${notification.data?.type || 'Unknown'}</p>
                            <p><strong>Confidence:</strong> ${Math.round((notification.data?.confidence || 0) * 100)}%</p>
                            <p><strong>Processing Time:</strong> ${notification.data?.duration || 0}ms</p>
                        </div>
                        <a href="${baseUrl}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Results</a>
                        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                            Best regards,<br>
                            The MeetingMind Team
                        </p>
                    </div>
                `,
                text: `AI Analysis Complete\n\nHello ${user.first_name},\n\nYour AI analysis has been completed successfully.\n\nView your results at: ${baseUrl}/dashboard\n\nBest regards,\nThe MeetingMind Team`
            },
            'meeting.started': {
                subject: 'Meeting Started - MeetingMind',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #059669;">Meeting Started</h2>
                        <p>Hello ${user.first_name},</p>
                        <p>A meeting has started and MeetingMind is now actively monitoring and analyzing the conversation.</p>
                        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p><strong>Meeting:</strong> ${notification.data?.title || 'Untitled Meeting'}</p>
                            <p><strong>Platform:</strong> ${notification.data?.platform || 'Unknown'}</p>
                            <p><strong>Started:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <a href="${baseUrl}/meetings/${notification.data?.meetingId}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Live Analysis</a>
                    </div>
                `,
                text: `Meeting Started\n\nHello ${user.first_name},\n\nA meeting has started and MeetingMind is now actively monitoring.\n\nView live analysis at: ${baseUrl}/meetings/${notification.data?.meetingId}\n\nBest regards,\nThe MeetingMind Team`
            },
            'system.alert': {
                subject: 'System Alert - MeetingMind',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc2626;">System Alert</h2>
                        <p>Hello ${user.first_name},</p>
                        <p>${notification.message}</p>
                        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p style="color: #dc2626; margin: 0;"><strong>Alert Type:</strong> ${notification.data?.alertType || 'General'}</p>
                        </div>
                        <a href="${baseUrl}/dashboard" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
                    </div>
                `,
                text: `System Alert\n\nHello ${user.first_name},\n\n${notification.message}\n\nView dashboard at: ${baseUrl}/dashboard\n\nBest regards,\nThe MeetingMind Team`
            }
        };

        const template = templates[notification.type] || templates['system.alert'];
        return template;
    }

    // Event handlers
    async handleAnalysisStarted(data) {
        await this.sendToUser(data.userId, {
            type: 'ai.analysis.started',
            title: 'AI Analysis Started',
            message: `AI analysis has begun for ${data.type}`,
            priority: 'low',
            data: {
                jobId: data.jobId,
                type: data.type,
                strategy: data.strategy
            }
        });
    }

    async handleAnalysisCompleted(data) {
        await this.sendToUser(data.userId, {
            type: 'ai.analysis.completed',
            title: 'AI Analysis Complete',
            message: `Your ${data.type} analysis is ready with ${Math.round(data.confidence * 100)}% confidence`,
            priority: 'medium',
            emailRequired: true,
            data: {
                jobId: data.jobId,
                type: data.type,
                confidence: data.confidence,
                duration: data.duration,
                cost: data.cost
            }
        });
    }

    async handleAnalysisFailed(data) {
        await this.sendToUser(data.userId, {
            type: 'ai.analysis.failed',
            title: 'AI Analysis Failed',
            message: `Analysis failed: ${data.error}`,
            priority: 'high',
            emailRequired: true,
            data: {
                jobId: data.jobId,
                type: data.type,
                error: data.error
            }
        });
    }

    async handleMeetingStarted(data) {
        // Notify host and participants
        const userIds = [data.hostId, ...(data.participantIds || [])];
        
        await this.sendToUsers(userIds, {
            type: 'meeting.started',
            title: 'Meeting Started',
            message: `Meeting "${data.title}" has started`,
            priority: 'medium',
            data: {
                meetingId: data.meetingId,
                title: data.title,
                platform: data.platform,
                hostId: data.hostId
            }
        });
    }

    async handleMeetingEnded(data) {
        const userIds = [data.hostId, ...(data.participantIds || [])];
        
        await this.sendToUsers(userIds, {
            type: 'meeting.ended',
            title: 'Meeting Ended',
            message: `Meeting "${data.title}" has ended. Analysis will be available shortly.`,
            priority: 'medium',
            data: {
                meetingId: data.meetingId,
                title: data.title,
                duration: data.duration,
                participantCount: data.participantCount
            }
        });
    }

    async handleMeetingJoined(data) {
        await this.sendToUser(data.userId, {
            type: 'meeting.joined',
            title: 'Meeting Joined',
            message: `Successfully joined meeting "${data.title}"`,
            priority: 'low',
            data: {
                meetingId: data.meetingId,
                title: data.title,
                platform: data.platform
            }
        });
    }

    async handleSystemAlert(data) {
        // Send to specific user or all users based on alert type
        if (data.userId) {
            await this.sendToUser(data.userId, {
                type: 'system.alert',
                title: data.title || 'System Alert',
                message: data.message,
                priority: data.priority || 'high',
                emailRequired: data.priority === 'high',
                data: {
                    alertType: data.alertType,
                    details: data.details
                }
            });
        } else if (data.organizationId) {
            await this.sendToOrganization(data.organizationId, {
                type: 'system.alert',
                title: data.title || 'System Alert',
                message: data.message,
                priority: data.priority || 'high',
                data: {
                    alertType: data.alertType,
                    details: data.details
                }
            });
        }
    }

    async handleSubscriptionChanged(data) {
        await this.sendToUser(data.userId, {
            type: 'subscription.changed',
            title: 'Subscription Updated',
            message: `Your subscription has been updated to ${data.newTier}`,
            priority: 'medium',
            emailRequired: true,
            data: {
                oldTier: data.oldTier,
                newTier: data.newTier,
                effectiveDate: data.effectiveDate
            }
        });
    }

    async handleCostAlert(data) {
        await this.sendToUser(data.userId, {
            type: 'cost.alert',
            title: 'Cost Alert',
            message: `${data.type} cost limit approaching: $${data.current.toFixed(2)} of $${data.limit}`,
            priority: 'high',
            emailRequired: true,
            data: {
                alertType: data.type,
                current: data.current,
                limit: data.limit,
                percentage: (data.current / data.limit) * 100
            }
        });
    }

    // Utility methods
    async sendPendingNotifications(userId) {
        try {
            const pendingNotifications = await DatabaseService.query(
                'SELECT * FROM notifications WHERE user_id = $1 AND read = false ORDER BY created_at DESC LIMIT 10',
                [userId]
            );

            for (const notification of pendingNotifications.rows) {
                this.sendToClient(userId, {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    data: notification.data,
                    priority: notification.priority,
                    timestamp: notification.created_at
                });
            }
        } catch (error) {
            console.error('Failed to send pending notifications:', error);
        }
    }

    async markNotificationAsRead(userId, notificationId) {
        try {
            await DatabaseService.query(
                'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
                [notificationId, userId]
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    async getNotificationHistory(userId, options = {}) {
        const { page = 1, limit = 20, type, read } = options;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE user_id = $1';
        const params = [userId];
        let paramIndex = 2;

        if (type) {
            whereClause += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (read !== undefined) {
            whereClause += ` AND read = $${paramIndex}`;
            params.push(read);
            paramIndex++;
        }

        const query = `
            SELECT * FROM notifications 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        params.push(limit, offset);
        
        const result = await DatabaseService.query(query, params);
        return result.rows;
    }

    async getUnreadCount(userId) {
        const result = await DatabaseService.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    // Cleanup old notifications
    async cleanupOldNotifications() {
        try {
            const result = await DatabaseService.query(
                'DELETE FROM notifications WHERE created_at < NOW() - INTERVAL \'30 days\' AND read = true'
            );
            console.log(`🧹 Cleaned up ${result.rowCount} old notifications`);
        } catch (error) {
            console.error('Failed to cleanup old notifications:', error);
        }
    }

    getConnectedClientsCount() {
        return this.connectedClients.size;
    }

    getStatus() {
        return {
            connectedClients: this.connectedClients.size,
            emailServiceEnabled: !!this.emailTransporter,
            queueSize: this.notificationQueue.length,
            processingQueue: this.processingQueue
        };
    }
}

module.exports = new NotificationService();
