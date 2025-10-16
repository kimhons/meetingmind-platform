const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const AIOrchestrationService = require('../services/AIOrchestrationService');
const DatabaseService = require('../services/DatabaseService');
const { requireSubscription, rateLimit: authRateLimit } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => {
        // Different limits based on subscription tier
        const tier = req.user?.subscriptionTier || 'free';
        const limits = {
            free: 5,
            basic: 20,
            pro: 100,
            enterprise: 500
        };
        return limits[tier] || limits.free;
    },
    message: (req) => ({
        error: 'Rate limit exceeded',
        message: `AI processing rate limit exceeded for ${req.user?.subscriptionTier || 'free'} tier`,
        upgradeMessage: 'Upgrade your subscription for higher limits'
    }),
    standardHeaders: true,
    legacyHeaders: false,
});

// Validation rules
const analysisValidation = [
    body('type')
        .isIn([
            'meeting_summary', 'action_items', 'sentiment_analysis', 
            'interview_analysis', 'legal_analysis', 'medical_analysis',
            'financial_analysis', 'transcription_cleanup', 'translation',
            'code_analysis', 'custom'
        ])
        .withMessage('Invalid analysis type'),
    body('content')
        .isLength({ min: 10, max: 50000 })
        .withMessage('Content must be between 10 and 50,000 characters'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    body('complexity')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Complexity must be low, medium, or high'),
    body('budget')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Budget must be low, medium, or high')
];

// Process AI analysis
router.post('/analyze', aiLimiter, analysisValidation, async (req, res) => {
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

        const {
            type,
            content,
            context,
            instructions,
            priority = 'medium',
            complexity = 'medium',
            budget = 'medium',
            meetingId
        } = req.body;

        // Check subscription requirements for advanced features
        if (type === 'interview_analysis' || type === 'legal_analysis' || type === 'medical_analysis') {
            const hasAccess = ['pro', 'enterprise'].includes(req.user.subscriptionTier);
            if (!hasAccess) {
                return res.status(403).json({
                    error: 'Subscription upgrade required',
                    message: `${type} requires a Pro or Enterprise subscription`,
                    currentTier: req.user.subscriptionTier,
                    requiredTiers: ['pro', 'enterprise']
                });
            }
        }

        // Verify meeting ownership if meetingId provided
        if (meetingId) {
            const meeting = await DatabaseService.findById('meetings', meetingId);
            if (!meeting || (meeting.host_id !== req.user.id && meeting.organization_id !== req.user.organizationId)) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have access to this meeting'
                });
            }
        }

        // Prepare AI request
        const aiRequest = {
            type,
            content,
            context,
            instructions,
            priority,
            complexity,
            budget,
            meetingId,
            userId: req.user.id,
            organizationId: req.user.organizationId
        };

        // Process with AI orchestration service
        const result = await AIOrchestrationService.processWithMultiModel(aiRequest);

        // Format response
        const response = {
            jobId: result.jobId,
            type,
            result: result.result.result,
            confidence: result.result.confidence,
            strategy: result.strategy,
            duration: result.duration,
            cost: result.cost,
            metadata: {
                modelsUsed: result.result.synthesizedFrom || 1,
                processingStrategy: result.strategy,
                qualityScore: result.result.confidence
            }
        };

        // Include alternative results for Pro/Enterprise users
        if (['pro', 'enterprise'].includes(req.user.subscriptionTier) && result.result.alternativeResults) {
            response.alternatives = result.result.alternativeResults.map(alt => ({
                model: alt.model,
                confidence: alt.confidence,
                preview: alt.result.substring(0, 200) + '...'
            }));
        }

        res.json({
            message: 'Analysis completed successfully',
            analysis: response
        });

    } catch (error) {
        console.error('AI analysis error:', error);
        
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
            return res.status(429).json({
                error: 'Service temporarily unavailable',
                message: 'AI service is currently at capacity. Please try again in a few moments.',
                retryAfter: 60
            });
        }

        res.status(500).json({
            error: 'Analysis failed',
            message: 'An error occurred during AI analysis. Please try again.'
        });
    }
});

// Batch analysis for multiple content pieces
router.post('/analyze/batch', 
    requireSubscription(['pro', 'enterprise']), 
    authRateLimit({ maxRequests: 10, windowMs: 5 * 60 * 1000 }),
    async (req, res) => {
        try {
            const { items, globalSettings = {} } = req.body;

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    error: 'Invalid input',
                    message: 'Items array is required and must not be empty'
                });
            }

            if (items.length > 50) {
                return res.status(400).json({
                    error: 'Batch size exceeded',
                    message: 'Maximum 50 items per batch'
                });
            }

            // Process items in parallel with concurrency limit
            const concurrencyLimit = req.user.subscriptionTier === 'enterprise' ? 10 : 5;
            const results = [];
            
            for (let i = 0; i < items.length; i += concurrencyLimit) {
                const batch = items.slice(i, i + concurrencyLimit);
                const batchPromises = batch.map(async (item, index) => {
                    try {
                        const aiRequest = {
                            ...globalSettings,
                            ...item,
                            userId: req.user.id,
                            organizationId: req.user.organizationId
                        };
                        
                        const result = await AIOrchestrationService.processWithMultiModel(aiRequest);
                        return {
                            index: i + index,
                            success: true,
                            result: {
                                jobId: result.jobId,
                                type: item.type,
                                result: result.result.result,
                                confidence: result.result.confidence,
                                duration: result.duration,
                                cost: result.cost
                            }
                        };
                    } catch (error) {
                        return {
                            index: i + index,
                            success: false,
                            error: error.message
                        };
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }

            // Calculate summary statistics
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            const totalCost = successful.reduce((sum, r) => sum + (r.result?.cost || 0), 0);
            const avgConfidence = successful.reduce((sum, r) => sum + (r.result?.confidence || 0), 0) / successful.length;

            res.json({
                message: 'Batch analysis completed',
                summary: {
                    total: items.length,
                    successful: successful.length,
                    failed: failed.length,
                    totalCost,
                    averageConfidence: avgConfidence || 0
                },
                results
            });

        } catch (error) {
            console.error('Batch analysis error:', error);
            res.status(500).json({
                error: 'Batch analysis failed',
                message: 'An error occurred during batch analysis'
            });
        }
    }
);

// Get AI service status
router.get('/status', async (req, res) => {
    try {
        const status = AIOrchestrationService.getStatus();
        
        // Add user-specific information
        const userStats = await DatabaseService.query(
            `SELECT 
                COUNT(*) as total_analyses,
                AVG(confidence) as avg_confidence,
                SUM(cost) as total_cost,
                AVG(processing_time) as avg_processing_time
             FROM ai_analyses 
             WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
             AND (
                 EXISTS (
                     SELECT 1 FROM meetings m 
                     WHERE m.id = ai_analyses.meeting_id 
                     AND (m.host_id = $1 OR m.organization_id = $2)
                 )
                 OR ai_analyses.meeting_id IS NULL
             )`,
            [req.user.id, req.user.organizationId]
        );

        const userMetrics = userStats.rows[0] || {
            total_analyses: 0,
            avg_confidence: 0,
            total_cost: 0,
            avg_processing_time: 0
        };

        res.json({
            service: status,
            userMetrics: {
                totalAnalyses: parseInt(userMetrics.total_analyses),
                averageConfidence: parseFloat(userMetrics.avg_confidence) || 0,
                totalCost: parseFloat(userMetrics.total_cost) || 0,
                averageProcessingTime: parseFloat(userMetrics.avg_processing_time) || 0
            },
            subscription: {
                tier: req.user.subscriptionTier,
                features: this.getSubscriptionFeatures(req.user.subscriptionTier)
            }
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            error: 'Status check failed',
            message: 'Unable to retrieve AI service status'
        });
    }
});

// Get analysis history
router.get('/history', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            type, 
            meetingId,
            startDate,
            endDate 
        } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = `WHERE (
            EXISTS (
                SELECT 1 FROM meetings m 
                WHERE m.id = ai_analyses.meeting_id 
                AND (m.host_id = $1 OR m.organization_id = $2)
            )
            OR ai_analyses.meeting_id IS NULL
        )`;
        
        const params = [req.user.id, req.user.organizationId];
        let paramIndex = 3;

        if (type) {
            whereClause += ` AND analysis_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (meetingId) {
            whereClause += ` AND meeting_id = $${paramIndex}`;
            params.push(meetingId);
            paramIndex++;
        }

        if (startDate) {
            whereClause += ` AND created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereClause += ` AND created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM ai_analyses ${whereClause}`;
        const countResult = await DatabaseService.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Get analyses
        const analysesQuery = `
            SELECT 
                id,
                meeting_id,
                analysis_type,
                model_used,
                confidence,
                processing_time,
                cost,
                created_at,
                output_data->>'result' as result_preview
            FROM ai_analyses 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        params.push(limit, offset);
        const analyses = await DatabaseService.query(analysesQuery, params);

        res.json({
            analyses: analyses.rows.map(analysis => ({
                id: analysis.id,
                meetingId: analysis.meeting_id,
                type: analysis.analysis_type,
                model: analysis.model_used,
                confidence: analysis.confidence,
                processingTime: analysis.processing_time,
                cost: analysis.cost,
                createdAt: analysis.created_at,
                preview: analysis.result_preview ? 
                    analysis.result_preview.substring(0, 200) + '...' : null
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('History retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve history',
            message: 'An error occurred while retrieving analysis history'
        });
    }
});

// Get specific analysis details
router.get('/analysis/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const analysis = await DatabaseService.query(
            `SELECT a.*, m.title as meeting_title
             FROM ai_analyses a
             LEFT JOIN meetings m ON a.meeting_id = m.id
             WHERE a.id = $1
             AND (
                 m.host_id = $2 
                 OR m.organization_id = $3
                 OR a.meeting_id IS NULL
             )`,
            [id, req.user.id, req.user.organizationId]
        );

        if (analysis.rows.length === 0) {
            return res.status(404).json({
                error: 'Analysis not found',
                message: 'The requested analysis was not found or you do not have access to it'
            });
        }

        const analysisData = analysis.rows[0];

        res.json({
            analysis: {
                id: analysisData.id,
                meetingId: analysisData.meeting_id,
                meetingTitle: analysisData.meeting_title,
                type: analysisData.analysis_type,
                model: analysisData.model_used,
                inputData: analysisData.input_data,
                outputData: analysisData.output_data,
                confidence: analysisData.confidence,
                processingTime: analysisData.processing_time,
                cost: analysisData.cost,
                createdAt: analysisData.created_at
            }
        });

    } catch (error) {
        console.error('Analysis retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve analysis',
            message: 'An error occurred while retrieving the analysis'
        });
    }
});

// Delete analysis
router.delete('/analysis/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const analysis = await DatabaseService.query(
            `SELECT a.id
             FROM ai_analyses a
             LEFT JOIN meetings m ON a.meeting_id = m.id
             WHERE a.id = $1
             AND (
                 m.host_id = $2 
                 OR m.organization_id = $3
                 OR a.meeting_id IS NULL
             )`,
            [id, req.user.id, req.user.organizationId]
        );

        if (analysis.rows.length === 0) {
            return res.status(404).json({
                error: 'Analysis not found',
                message: 'The requested analysis was not found or you do not have access to it'
            });
        }

        await DatabaseService.delete('ai_analyses', id);

        res.json({
            message: 'Analysis deleted successfully'
        });

    } catch (error) {
        console.error('Analysis deletion error:', error);
        res.status(500).json({
            error: 'Failed to delete analysis',
            message: 'An error occurred while deleting the analysis'
        });
    }
});

// Helper function to get subscription features
function getSubscriptionFeatures(tier) {
    const features = {
        free: {
            analysisTypes: ['meeting_summary', 'action_items', 'transcription_cleanup'],
            rateLimit: 5,
            batchProcessing: false,
            advancedAnalytics: false,
            multiModelConsensus: false
        },
        basic: {
            analysisTypes: ['meeting_summary', 'action_items', 'sentiment_analysis', 'transcription_cleanup'],
            rateLimit: 20,
            batchProcessing: false,
            advancedAnalytics: false,
            multiModelConsensus: false
        },
        pro: {
            analysisTypes: [
                'meeting_summary', 'action_items', 'sentiment_analysis', 
                'interview_analysis', 'transcription_cleanup', 'translation'
            ],
            rateLimit: 100,
            batchProcessing: true,
            advancedAnalytics: true,
            multiModelConsensus: true
        },
        enterprise: {
            analysisTypes: [
                'meeting_summary', 'action_items', 'sentiment_analysis',
                'interview_analysis', 'legal_analysis', 'medical_analysis',
                'financial_analysis', 'transcription_cleanup', 'translation',
                'code_analysis', 'custom'
            ],
            rateLimit: 500,
            batchProcessing: true,
            advancedAnalytics: true,
            multiModelConsensus: true
        }
    };

    return features[tier] || features.free;
}

module.exports = router;
