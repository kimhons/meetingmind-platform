const express = require('express');
const { query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const NotificationService = require('../services/NotificationService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for notification endpoints
const notificationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: {
        error: 'Rate limit exceeded',
        message: 'Too many notification requests. Please try again later.'
    }
});

// Apply authentication to all routes
router.use(requireAuth);
router.use(notificationLimiter);

// Get notification history
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isString().withMessage('Type must be a string'),
    query('read').optional().isBoolean().withMessage('Read must be a boolean')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            page = 1,
            limit = 20,
            type,
            read
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };

        if (type) options.type = type;
        if (read !== undefined) options.read = read === 'true';

        const notifications = await NotificationService.getNotificationHistory(req.user.id, options);
        const unreadCount = await NotificationService.getUnreadCount(req.user.id);

        res.json({
            notifications: notifications.map(notification => ({
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                priority: notification.priority,
                read: notification.read,
                emailSent: notification.email_sent,
                createdAt: notification.created_at
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                unreadCount
            }
        });

    } catch (error) {
        console.error('Failed to get notification history:', error);
        res.status(500).json({
            error: 'Failed to retrieve notifications',
            message: 'An error occurred while retrieving your notifications'
        });
    }
});

// Get unread notification count
router.get('/unread/count', async (req, res) => {
    try {
        const unreadCount = await NotificationService.getUnreadCount(req.user.id);
        
        res.json({
            unreadCount
        });

    } catch (error) {
        console.error('Failed to get unread count:', error);
        res.status(500).json({
            error: 'Failed to get unread count',
            message: 'An error occurred while retrieving unread count'
        });
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        
        await NotificationService.markNotificationAsRead(req.user.id, id);
        
        res.json({
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        res.status(500).json({
            error: 'Failed to mark as read',
            message: 'An error occurred while updating the notification'
        });
    }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
    try {
        await DatabaseService.query(
            'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
            [req.user.id]
        );
        
        res.json({
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        res.status(500).json({
            error: 'Failed to mark all as read',
            message: 'An error occurred while updating notifications'
        });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await DatabaseService.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Notification not found',
                message: 'The notification was not found or you do not have permission to delete it'
            });
        }
        
        res.json({
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        console.error('Failed to delete notification:', error);
        res.status(500).json({
            error: 'Failed to delete notification',
            message: 'An error occurred while deleting the notification'
        });
    }
});

// Get notification preferences
router.get('/preferences', async (req, res) => {
    try {
        const user = await DatabaseService.findById('users', req.user.id);
        const preferences = user.notification_preferences || {
            email: true,
            push: true,
            sms: false,
            types: {
                'ai.analysis.completed': { email: true, push: true },
                'ai.analysis.failed': { email: true, push: true },
                'meeting.started': { email: false, push: true },
                'meeting.ended': { email: false, push: true },
                'system.alert': { email: true, push: true },
                'subscription.changed': { email: true, push: true },
                'cost.alert': { email: true, push: true }
            }
        };

        res.json({
            preferences
        });

    } catch (error) {
        console.error('Failed to get notification preferences:', error);
        res.status(500).json({
            error: 'Failed to get preferences',
            message: 'An error occurred while retrieving notification preferences'
        });
    }
});

// Update notification preferences
router.put('/preferences', async (req, res) => {
    try {
        const { preferences } = req.body;

        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({
                error: 'Invalid preferences',
                message: 'Preferences must be a valid object'
            });
        }

        await DatabaseService.update('users', req.user.id, {
            notification_preferences: preferences
        });

        res.json({
            message: 'Notification preferences updated successfully',
            preferences
        });

    } catch (error) {
        console.error('Failed to update notification preferences:', error);
        res.status(500).json({
            error: 'Failed to update preferences',
            message: 'An error occurred while updating notification preferences'
        });
    }
});

// Test notification (for development/testing)
router.post('/test', async (req, res) => {
    try {
        // Only allow in development environment
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                error: 'Not allowed in production',
                message: 'Test notifications are not allowed in production'
            });
        }

        const { type = 'system.alert', title = 'Test Notification', message = 'This is a test notification' } = req.body;

        await NotificationService.sendToUser(req.user.id, {
            type,
            title,
            message,
            priority: 'low',
            data: {
                test: true,
                timestamp: new Date().toISOString()
            }
        });

        res.json({
            message: 'Test notification sent successfully'
        });

    } catch (error) {
        console.error('Failed to send test notification:', error);
        res.status(500).json({
            error: 'Failed to send test notification',
            message: 'An error occurred while sending the test notification'
        });
    }
});

// Get notification service status
router.get('/status', async (req, res) => {
    try {
        const status = NotificationService.getStatus();
        
        res.json({
            status: {
                ...status,
                userConnected: NotificationService.connectedClients.has(req.user.id)
            }
        });

    } catch (error) {
        console.error('Failed to get notification status:', error);
        res.status(500).json({
            error: 'Failed to get status',
            message: 'An error occurred while retrieving notification service status'
        });
    }
});

// Notification types reference
router.get('/types', async (req, res) => {
    try {
        const notificationTypes = {
            'ai.analysis.started': {
                name: 'AI Analysis Started',
                description: 'Notification when AI analysis begins',
                defaultPriority: 'low',
                emailDefault: false
            },
            'ai.analysis.completed': {
                name: 'AI Analysis Completed',
                description: 'Notification when AI analysis finishes successfully',
                defaultPriority: 'medium',
                emailDefault: true
            },
            'ai.analysis.failed': {
                name: 'AI Analysis Failed',
                description: 'Notification when AI analysis encounters an error',
                defaultPriority: 'high',
                emailDefault: true
            },
            'meeting.started': {
                name: 'Meeting Started',
                description: 'Notification when a meeting begins',
                defaultPriority: 'medium',
                emailDefault: false
            },
            'meeting.ended': {
                name: 'Meeting Ended',
                description: 'Notification when a meeting ends',
                defaultPriority: 'medium',
                emailDefault: false
            },
            'meeting.joined': {
                name: 'Meeting Joined',
                description: 'Notification when successfully joining a meeting',
                defaultPriority: 'low',
                emailDefault: false
            },
            'system.alert': {
                name: 'System Alert',
                description: 'Important system notifications and alerts',
                defaultPriority: 'high',
                emailDefault: true
            },
            'subscription.changed': {
                name: 'Subscription Changed',
                description: 'Notification when subscription tier changes',
                defaultPriority: 'medium',
                emailDefault: true
            },
            'cost.alert': {
                name: 'Cost Alert',
                description: 'Notification when approaching cost limits',
                defaultPriority: 'high',
                emailDefault: true
            }
        };

        res.json({
            types: notificationTypes
        });

    } catch (error) {
        console.error('Failed to get notification types:', error);
        res.status(500).json({
            error: 'Failed to get notification types',
            message: 'An error occurred while retrieving notification types'
        });
    }
});

module.exports = router;
