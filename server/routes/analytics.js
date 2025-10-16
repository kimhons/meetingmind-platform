const express = require('express');
const { query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const AnalyticsService = require('../services/AnalyticsService');
const { requireAuth, requireSubscription } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for analytics endpoints
const analyticsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => {
        const tier = req.user?.subscriptionTier || 'free';
        const limits = {
            free: 10,
            basic: 30,
            pro: 100,
            enterprise: 300
        };
        return limits[tier] || limits.free;
    },
    message: (req) => ({
        error: 'Rate limit exceeded',
        message: `Analytics rate limit exceeded for ${req.user?.subscriptionTier || 'free'} tier`
    })
});

// Apply authentication to all routes
router.use(requireAuth);
router.use(analyticsLimiter);

// Validation rules
const timeRangeValidation = [
    query('timeRange')
        .optional()
        .isIn(['7d', '30d', '90d', '1y'])
        .withMessage('Time range must be one of: 7d, 30d, 90d, 1y')
];

// Dashboard overview analytics
router.get('/dashboard', timeRangeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { timeRange = '30d' } = req.query;
        
        const overview = await AnalyticsService.getDashboardOverview(
            req.user.id,
            req.user.organizationId,
            timeRange
        );

        res.json({
            message: 'Dashboard analytics retrieved successfully',
            analytics: overview
        });

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            error: 'Failed to retrieve dashboard analytics',
            message: 'An error occurred while generating dashboard analytics'
        });
    }
});

// Meeting analytics
router.get('/meetings', timeRangeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { timeRange = '30d' } = req.query;
        const dateRange = AnalyticsService.getDateRange(timeRange);
        
        const meetingStats = await AnalyticsService.getMeetingStats(
            req.user.id,
            req.user.organizationId,
            dateRange
        );

        res.json({
            message: 'Meeting analytics retrieved successfully',
            analytics: {
                timeRange,
                period: dateRange,
                meetings: meetingStats
            }
        });

    } catch (error) {
        console.error('Meeting analytics error:', error);
        res.status(500).json({
            error: 'Failed to retrieve meeting analytics',
            message: 'An error occurred while generating meeting analytics'
        });
    }
});

// AI usage analytics
router.get('/ai-usage', timeRangeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { timeRange = '30d' } = req.query;
        const dateRange = AnalyticsService.getDateRange(timeRange);
        
        const aiUsageStats = await AnalyticsService.getAIUsageStats(
            req.user.id,
            req.user.organizationId,
            dateRange
        );

        res.json({
            message: 'AI usage analytics retrieved successfully',
            analytics: {
                timeRange,
                period: dateRange,
                aiUsage: aiUsageStats
            }
        });

    } catch (error) {
        console.error('AI usage analytics error:', error);
        res.status(500).json({
            error: 'Failed to retrieve AI usage analytics',
            message: 'An error occurred while generating AI usage analytics'
        });
    }
});

// Cost analytics
router.get('/costs', timeRangeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { timeRange = '30d' } = req.query;
        const dateRange = AnalyticsService.getDateRange(timeRange);
        
        const costStats = await AnalyticsService.getCostStats(
            req.user.id,
            req.user.organizationId,
            dateRange
        );

        res.json({
            message: 'Cost analytics retrieved successfully',
            analytics: {
                timeRange,
                period: dateRange,
                costs: costStats
            }
        });

    } catch (error) {
        console.error('Cost analytics error:', error);
        res.status(500).json({
            error: 'Failed to retrieve cost analytics',
            message: 'An error occurred while generating cost analytics'
        });
    }
});

// Performance analytics
router.get('/performance', timeRangeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { timeRange = '30d' } = req.query;
        const dateRange = AnalyticsService.getDateRange(timeRange);
        
        const performanceStats = await AnalyticsService.getPerformanceStats(
            req.user.id,
            req.user.organizationId,
            dateRange
        );

        res.json({
            message: 'Performance analytics retrieved successfully',
            analytics: {
                timeRange,
                period: dateRange,
                performance: performanceStats
            }
        });

    } catch (error) {
        console.error('Performance analytics error:', error);
        res.status(500).json({
            error: 'Failed to retrieve performance analytics',
            message: 'An error occurred while generating performance analytics'
        });
    }
});

// User engagement analytics (Pro/Enterprise only)
router.get('/engagement', 
    requireSubscription(['pro', 'enterprise']),
    timeRangeValidation, 
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { timeRange = '30d' } = req.query;
            
            const engagementStats = await AnalyticsService.getUserEngagementStats(
                req.user.id,
                req.user.organizationId,
                timeRange
            );

            res.json({
                message: 'Engagement analytics retrieved successfully',
                analytics: {
                    timeRange,
                    engagement: engagementStats
                }
            });

        } catch (error) {
            console.error('Engagement analytics error:', error);
            res.status(500).json({
                error: 'Failed to retrieve engagement analytics',
                message: 'An error occurred while generating engagement analytics'
            });
        }
    }
);

// Meeting insights (detailed analysis of specific meeting)
router.get('/meetings/:id/insights', async (req, res) => {
    try {
        const { id } = req.params;
        
        const insights = await AnalyticsService.getMeetingInsights(id, req.user.id);

        res.json({
            message: 'Meeting insights retrieved successfully',
            insights
        });

    } catch (error) {
        console.error('Meeting insights error:', error);
        
        if (error.message.includes('not found') || error.message.includes('access denied')) {
            return res.status(404).json({
                error: 'Meeting not found',
                message: 'The requested meeting was not found or you do not have access to it'
            });
        }

        res.status(500).json({
            error: 'Failed to retrieve meeting insights',
            message: 'An error occurred while generating meeting insights'
        });
    }
});

// Export analytics data (Enterprise only)
router.get('/export', 
    requireSubscription(['enterprise']),
    timeRangeValidation,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { timeRange = '30d', format = 'json' } = req.query;
            
            if (!['json', 'csv'].includes(format)) {
                return res.status(400).json({
                    error: 'Invalid format',
                    message: 'Format must be either json or csv'
                });
            }

            const overview = await AnalyticsService.getDashboardOverview(
                req.user.id,
                req.user.organizationId,
                timeRange
            );

            if (format === 'csv') {
                // Convert to CSV format
                const csvData = convertToCSV(overview);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="meetingmind-analytics-${timeRange}.csv"`);
                res.send(csvData);
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="meetingmind-analytics-${timeRange}.json"`);
                res.json(overview);
            }

        } catch (error) {
            console.error('Analytics export error:', error);
            res.status(500).json({
                error: 'Failed to export analytics',
                message: 'An error occurred while exporting analytics data'
            });
        }
    }
);

// Real-time analytics (WebSocket endpoint info)
router.get('/realtime/info', async (req, res) => {
    try {
        res.json({
            message: 'Real-time analytics information',
            websocket: {
                endpoint: '/analytics',
                events: [
                    'meeting.started',
                    'meeting.ended', 
                    'analysis.completed',
                    'cost.updated',
                    'performance.updated'
                ],
                authentication: 'JWT token required',
                subscriptionRequired: ['pro', 'enterprise']
            },
            polling: {
                endpoint: '/api/analytics/dashboard',
                recommendedInterval: '30s',
                rateLimit: 'Based on subscription tier'
            }
        });

    } catch (error) {
        console.error('Real-time info error:', error);
        res.status(500).json({
            error: 'Failed to get real-time info',
            message: 'An error occurred while retrieving real-time analytics information'
        });
    }
});

// Analytics health check
router.get('/health', async (req, res) => {
    try {
        // Test database connectivity and basic analytics
        const testQuery = await DatabaseService.query(
            'SELECT COUNT(*) FROM meetings WHERE created_at >= NOW() - INTERVAL \'1 day\''
        );

        const cacheStatus = AnalyticsService.cache.size;
        
        res.json({
            status: 'healthy',
            database: 'connected',
            cache: {
                size: cacheStatus,
                maxSize: 100
            },
            recentMeetings: parseInt(testQuery.rows[0].count),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Analytics health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: 'Service unavailable',
            message: 'Analytics service is experiencing issues'
        });
    }
});

// Clear analytics cache (Enterprise only)
router.post('/cache/clear', 
    requireSubscription(['enterprise']),
    async (req, res) => {
        try {
            AnalyticsService.clearCache();
            
            res.json({
                message: 'Analytics cache cleared successfully'
            });

        } catch (error) {
            console.error('Cache clear error:', error);
            res.status(500).json({
                error: 'Failed to clear cache',
                message: 'An error occurred while clearing the analytics cache'
            });
        }
    }
);

// Helper function to convert analytics data to CSV
function convertToCSV(data) {
    const rows = [];
    
    // Header
    rows.push([
        'Date',
        'Meetings',
        'AI Analyses',
        'Average Confidence',
        'Total Cost',
        'Average Processing Time'
    ].join(','));

    // Data rows
    if (data.trends && data.trends.daily) {
        data.trends.daily.forEach(day => {
            rows.push([
                day.date,
                day.meetings || 0,
                day.analyses || 0,
                (day.avgConfidence || 0).toFixed(2),
                (day.dailyCost || 0).toFixed(4),
                (day.averageProcessingTime || 0).toFixed(0)
            ].join(','));
        });
    }

    return rows.join('\n');
}

module.exports = router;
