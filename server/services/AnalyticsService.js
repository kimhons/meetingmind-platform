const DatabaseService = require('./DatabaseService');
const moment = require('moment');

class AnalyticsService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Dashboard Overview Analytics
    async getDashboardOverview(userId, organizationId, timeRange = '30d') {
        const cacheKey = `dashboard_${userId}_${organizationId}_${timeRange}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const dateRange = this.getDateRange(timeRange);
            
            const [
                meetingStats,
                aiUsageStats,
                costStats,
                performanceStats,
                trendData
            ] = await Promise.all([
                this.getMeetingStats(userId, organizationId, dateRange),
                this.getAIUsageStats(userId, organizationId, dateRange),
                this.getCostStats(userId, organizationId, dateRange),
                this.getPerformanceStats(userId, organizationId, dateRange),
                this.getTrendData(userId, organizationId, dateRange)
            ]);

            const overview = {
                timeRange,
                period: dateRange,
                meetings: meetingStats,
                aiUsage: aiUsageStats,
                costs: costStats,
                performance: performanceStats,
                trends: trendData,
                generatedAt: new Date().toISOString()
            };

            this.setCache(cacheKey, overview);
            return overview;

        } catch (error) {
            console.error('Failed to generate dashboard overview:', error);
            throw error;
        }
    }

    // Meeting Analytics
    async getMeetingStats(userId, organizationId, dateRange) {
        const query = `
            SELECT 
                COUNT(*) as total_meetings,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_meetings,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_meetings,
                AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_duration_minutes,
                SUM(participant_count) as total_participants,
                AVG(participant_count) as avg_participants,
                COUNT(DISTINCT platform) as platforms_used,
                COUNT(CASE WHEN created_at >= $3 - INTERVAL '7 days' THEN 1 END) as meetings_last_week
            FROM meetings 
            WHERE (host_id = $1 OR organization_id = $2)
            AND created_at >= $3 AND created_at <= $4
        `;

        const result = await DatabaseService.query(query, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        const stats = result.rows[0];

        // Get platform breakdown
        const platformQuery = `
            SELECT platform, COUNT(*) as count
            FROM meetings 
            WHERE (host_id = $1 OR organization_id = $2)
            AND created_at >= $3 AND created_at <= $4
            GROUP BY platform
            ORDER BY count DESC
        `;

        const platformResult = await DatabaseService.query(platformQuery, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        // Get meeting frequency by day of week
        const frequencyQuery = `
            SELECT 
                EXTRACT(DOW FROM created_at) as day_of_week,
                COUNT(*) as count
            FROM meetings 
            WHERE (host_id = $1 OR organization_id = $2)
            AND created_at >= $3 AND created_at <= $4
            GROUP BY EXTRACT(DOW FROM created_at)
            ORDER BY day_of_week
        `;

        const frequencyResult = await DatabaseService.query(frequencyQuery, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const frequencyByDay = frequencyResult.rows.map(row => ({
            day: dayNames[row.day_of_week],
            count: parseInt(row.count)
        }));

        return {
            total: parseInt(stats.total_meetings),
            completed: parseInt(stats.completed_meetings),
            active: parseInt(stats.active_meetings),
            averageDuration: parseFloat(stats.avg_duration_minutes) || 0,
            totalParticipants: parseInt(stats.total_participants) || 0,
            averageParticipants: parseFloat(stats.avg_participants) || 0,
            platformsUsed: parseInt(stats.platforms_used),
            growthRate: this.calculateGrowthRate(
                parseInt(stats.total_meetings),
                parseInt(stats.meetings_last_week)
            ),
            platformBreakdown: platformResult.rows.map(row => ({
                platform: row.platform,
                count: parseInt(row.count),
                percentage: (parseInt(row.count) / parseInt(stats.total_meetings)) * 100
            })),
            frequencyByDay
        };
    }

    // AI Usage Analytics
    async getAIUsageStats(userId, organizationId, dateRange) {
        const query = `
            SELECT 
                COUNT(*) as total_analyses,
                COUNT(DISTINCT analysis_type) as analysis_types_used,
                AVG(confidence) as avg_confidence,
                AVG(processing_time) as avg_processing_time,
                COUNT(CASE WHEN confidence >= 0.9 THEN 1 END) as high_confidence_analyses,
                COUNT(DISTINCT model_used) as models_used,
                SUM(cost) as total_cost
            FROM ai_analyses a
            LEFT JOIN meetings m ON a.meeting_id = m.id
            WHERE (m.host_id = $1 OR m.organization_id = $2 OR a.meeting_id IS NULL)
            AND a.created_at >= $3 AND a.created_at <= $4
        `;

        const result = await DatabaseService.query(query, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        const stats = result.rows[0];

        // Get analysis type breakdown
        const typeQuery = `
            SELECT 
                analysis_type,
                COUNT(*) as count,
                AVG(confidence) as avg_confidence,
                AVG(processing_time) as avg_processing_time,
                SUM(cost) as total_cost
            FROM ai_analyses a
            LEFT JOIN meetings m ON a.meeting_id = m.id
            WHERE (m.host_id = $1 OR m.organization_id = $2 OR a.meeting_id IS NULL)
            AND a.created_at >= $3 AND a.created_at <= $4
            GROUP BY analysis_type
            ORDER BY count DESC
        `;

        const typeResult = await DatabaseService.query(typeQuery, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        // Get model usage breakdown
        const modelQuery = `
            SELECT 
                model_used,
                COUNT(*) as count,
                AVG(confidence) as avg_confidence,
                SUM(cost) as total_cost
            FROM ai_analyses a
            LEFT JOIN meetings m ON a.meeting_id = m.id
            WHERE (m.host_id = $1 OR m.organization_id = $2 OR a.meeting_id IS NULL)
            AND a.created_at >= $3 AND a.created_at <= $4
            GROUP BY model_used
            ORDER BY count DESC
        `;

        const modelResult = await DatabaseService.query(modelQuery, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        return {
            total: parseInt(stats.total_analyses),
            typesUsed: parseInt(stats.analysis_types_used),
            averageConfidence: parseFloat(stats.avg_confidence) || 0,
            averageProcessingTime: parseFloat(stats.avg_processing_time) || 0,
            highConfidenceRate: (parseInt(stats.high_confidence_analyses) / parseInt(stats.total_analyses)) * 100 || 0,
            modelsUsed: parseInt(stats.models_used),
            totalCost: parseFloat(stats.total_cost) || 0,
            typeBreakdown: typeResult.rows.map(row => ({
                type: row.analysis_type,
                count: parseInt(row.count),
                averageConfidence: parseFloat(row.avg_confidence),
                averageProcessingTime: parseFloat(row.avg_processing_time),
                cost: parseFloat(row.total_cost),
                percentage: (parseInt(row.count) / parseInt(stats.total_analyses)) * 100
            })),
            modelBreakdown: modelResult.rows.map(row => ({
                model: row.model_used,
                count: parseInt(row.count),
                averageConfidence: parseFloat(row.avg_confidence),
                cost: parseFloat(row.total_cost),
                percentage: (parseInt(row.count) / parseInt(stats.total_analyses)) * 100
            }))
        };
    }

    // Cost Analytics
    async getCostStats(userId, organizationId, dateRange) {
        const query = `
            SELECT 
                SUM(cost) as total_cost,
                AVG(cost) as avg_cost_per_analysis,
                COUNT(*) as total_analyses,
                SUM(CASE WHEN a.created_at >= $3 - INTERVAL '7 days' THEN cost ELSE 0 END) as cost_last_week
            FROM ai_analyses a
            LEFT JOIN meetings m ON a.meeting_id = m.id
            WHERE (m.host_id = $1 OR m.organization_id = $2 OR a.meeting_id IS NULL)
            AND a.created_at >= $3 AND a.created_at <= $4
        `;

        const result = await DatabaseService.query(query, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        const stats = result.rows[0];

        // Get daily cost breakdown
        const dailyCostQuery = `
            SELECT 
                DATE(a.created_at) as date,
                SUM(cost) as daily_cost,
                COUNT(*) as daily_analyses
            FROM ai_analyses a
            LEFT JOIN meetings m ON a.meeting_id = m.id
            WHERE (m.host_id = $1 OR m.organization_id = $2 OR a.meeting_id IS NULL)
            AND a.created_at >= $3 AND a.created_at <= $4
            GROUP BY DATE(a.created_at)
            ORDER BY date
        `;

        const dailyCostResult = await DatabaseService.query(dailyCostQuery, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        // Calculate cost efficiency metrics
        const totalCost = parseFloat(stats.total_cost) || 0;
        const totalAnalyses = parseInt(stats.total_analyses) || 1;
        const costLastWeek = parseFloat(stats.cost_last_week) || 0;

        return {
            total: totalCost,
            averagePerAnalysis: parseFloat(stats.avg_cost_per_analysis) || 0,
            totalAnalyses,
            efficiency: totalAnalyses / Math.max(totalCost, 0.01), // Analyses per dollar
            weeklyTrend: this.calculateGrowthRate(totalCost, costLastWeek),
            dailyBreakdown: dailyCostResult.rows.map(row => ({
                date: row.date,
                cost: parseFloat(row.daily_cost),
                analyses: parseInt(row.daily_analyses),
                efficiency: parseInt(row.daily_analyses) / Math.max(parseFloat(row.daily_cost), 0.01)
            })),
            projectedMonthlyCost: this.projectMonthlyCost(dailyCostResult.rows),
            costSavings: this.calculateCostSavings(totalCost, totalAnalyses)
        };
    }

    // Performance Analytics
    async getPerformanceStats(userId, organizationId, dateRange) {
        const query = `
            SELECT 
                AVG(processing_time) as avg_processing_time,
                MIN(processing_time) as min_processing_time,
                MAX(processing_time) as max_processing_time,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time) as median_processing_time,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time) as p95_processing_time,
                COUNT(CASE WHEN processing_time < 3000 THEN 1 END) as fast_analyses,
                COUNT(*) as total_analyses,
                AVG(confidence) as avg_confidence,
                COUNT(CASE WHEN confidence >= 0.9 THEN 1 END) as high_quality_analyses
            FROM ai_analyses a
            LEFT JOIN meetings m ON a.meeting_id = m.id
            WHERE (m.host_id = $1 OR m.organization_id = $2 OR a.meeting_id IS NULL)
            AND a.created_at >= $3 AND a.created_at <= $4
        `;

        const result = await DatabaseService.query(query, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        const stats = result.rows[0];

        // Get performance trends over time
        const trendQuery = `
            SELECT 
                DATE(a.created_at) as date,
                AVG(processing_time) as avg_processing_time,
                AVG(confidence) as avg_confidence,
                COUNT(*) as daily_analyses
            FROM ai_analyses a
            LEFT JOIN meetings m ON a.meeting_id = m.id
            WHERE (m.host_id = $1 OR m.organization_id = $2 OR a.meeting_id IS NULL)
            AND a.created_at >= $3 AND a.created_at <= $4
            GROUP BY DATE(a.created_at)
            ORDER BY date
        `;

        const trendResult = await DatabaseService.query(trendQuery, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        const totalAnalyses = parseInt(stats.total_analyses) || 1;

        return {
            averageProcessingTime: parseFloat(stats.avg_processing_time) || 0,
            minProcessingTime: parseFloat(stats.min_processing_time) || 0,
            maxProcessingTime: parseFloat(stats.max_processing_time) || 0,
            medianProcessingTime: parseFloat(stats.median_processing_time) || 0,
            p95ProcessingTime: parseFloat(stats.p95_processing_time) || 0,
            fastAnalysesRate: (parseInt(stats.fast_analyses) / totalAnalyses) * 100,
            averageConfidence: parseFloat(stats.avg_confidence) || 0,
            highQualityRate: (parseInt(stats.high_quality_analyses) / totalAnalyses) * 100,
            performanceScore: this.calculatePerformanceScore(stats),
            trends: trendResult.rows.map(row => ({
                date: row.date,
                averageProcessingTime: parseFloat(row.avg_processing_time),
                averageConfidence: parseFloat(row.avg_confidence),
                volume: parseInt(row.daily_analyses)
            }))
        };
    }

    // Trend Data
    async getTrendData(userId, organizationId, dateRange) {
        const query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as meetings,
                AVG(participant_count) as avg_participants,
                AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_duration
            FROM meetings 
            WHERE (host_id = $1 OR organization_id = $2)
            AND created_at >= $3 AND created_at <= $4
            GROUP BY DATE(created_at)
            ORDER BY date
        `;

        const meetingTrends = await DatabaseService.query(query, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        const aiQuery = `
            SELECT 
                DATE(a.created_at) as date,
                COUNT(*) as analyses,
                AVG(confidence) as avg_confidence,
                SUM(cost) as daily_cost
            FROM ai_analyses a
            LEFT JOIN meetings m ON a.meeting_id = m.id
            WHERE (m.host_id = $1 OR m.organization_id = $2 OR a.meeting_id IS NULL)
            AND a.created_at >= $3 AND a.created_at <= $4
            GROUP BY DATE(a.created_at)
            ORDER BY date
        `;

        const aiTrends = await DatabaseService.query(aiQuery, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        // Combine trends
        const combinedTrends = this.combineTrendData(meetingTrends.rows, aiTrends.rows);

        return {
            daily: combinedTrends,
            summary: {
                totalDays: combinedTrends.length,
                averageMeetingsPerDay: combinedTrends.reduce((sum, day) => sum + day.meetings, 0) / combinedTrends.length,
                averageAnalysesPerDay: combinedTrends.reduce((sum, day) => sum + day.analyses, 0) / combinedTrends.length,
                peakDay: combinedTrends.reduce((peak, day) => 
                    day.meetings > peak.meetings ? day : peak, combinedTrends[0] || {}
                )
            }
        };
    }

    // User Engagement Analytics
    async getUserEngagementStats(userId, organizationId, timeRange = '30d') {
        const dateRange = this.getDateRange(timeRange);
        
        const query = `
            SELECT 
                COUNT(DISTINCT DATE(created_at)) as active_days,
                COUNT(*) as total_sessions,
                AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_session_duration,
                MAX(created_at) as last_activity,
                COUNT(CASE WHEN created_at >= $3 - INTERVAL '7 days' THEN 1 END) as recent_sessions
            FROM meetings 
            WHERE (host_id = $1 OR organization_id = $2)
            AND created_at >= $3 AND created_at <= $4
        `;

        const result = await DatabaseService.query(query, [
            userId, organizationId, dateRange.start, dateRange.end
        ]);

        const stats = result.rows[0];
        const totalDays = moment(dateRange.end).diff(moment(dateRange.start), 'days');

        return {
            activeDays: parseInt(stats.active_days),
            totalSessions: parseInt(stats.total_sessions),
            averageSessionDuration: parseFloat(stats.avg_session_duration) || 0,
            lastActivity: stats.last_activity,
            recentSessions: parseInt(stats.recent_sessions),
            engagementRate: (parseInt(stats.active_days) / totalDays) * 100,
            sessionFrequency: parseInt(stats.total_sessions) / Math.max(parseInt(stats.active_days), 1)
        };
    }

    // Meeting Insights
    async getMeetingInsights(meetingId, userId) {
        const query = `
            SELECT 
                m.*,
                COUNT(a.id) as analysis_count,
                AVG(a.confidence) as avg_confidence,
                SUM(a.cost) as total_cost,
                STRING_AGG(DISTINCT a.analysis_type, ', ') as analysis_types
            FROM meetings m
            LEFT JOIN ai_analyses a ON m.id = a.meeting_id
            WHERE m.id = $1 AND (m.host_id = $2 OR m.organization_id = (
                SELECT organization_id FROM users WHERE id = $2
            ))
            GROUP BY m.id
        `;

        const result = await DatabaseService.query(query, [meetingId, userId]);
        
        if (result.rows.length === 0) {
            throw new Error('Meeting not found or access denied');
        }

        const meeting = result.rows[0];

        // Get detailed analysis breakdown
        const analysisQuery = `
            SELECT 
                analysis_type,
                confidence,
                processing_time,
                cost,
                created_at,
                output_data
            FROM ai_analyses
            WHERE meeting_id = $1
            ORDER BY created_at DESC
        `;

        const analysisResult = await DatabaseService.query(analysisQuery, [meetingId]);

        return {
            meeting: {
                id: meeting.id,
                title: meeting.title,
                platform: meeting.platform,
                duration: meeting.ended_at ? 
                    moment(meeting.ended_at).diff(moment(meeting.started_at), 'minutes') : null,
                participantCount: meeting.participant_count,
                status: meeting.status,
                startedAt: meeting.started_at,
                endedAt: meeting.ended_at
            },
            analytics: {
                analysisCount: parseInt(meeting.analysis_count),
                averageConfidence: parseFloat(meeting.avg_confidence) || 0,
                totalCost: parseFloat(meeting.total_cost) || 0,
                analysisTypes: meeting.analysis_types ? meeting.analysis_types.split(', ') : []
            },
            analyses: analysisResult.rows.map(analysis => ({
                type: analysis.analysis_type,
                confidence: analysis.confidence,
                processingTime: analysis.processing_time,
                cost: analysis.cost,
                createdAt: analysis.created_at,
                summary: this.extractAnalysisSummary(analysis.output_data)
            }))
        };
    }

    // Utility methods
    getDateRange(timeRange) {
        const end = moment().endOf('day');
        let start;

        switch (timeRange) {
            case '7d':
                start = moment().subtract(7, 'days').startOf('day');
                break;
            case '30d':
                start = moment().subtract(30, 'days').startOf('day');
                break;
            case '90d':
                start = moment().subtract(90, 'days').startOf('day');
                break;
            case '1y':
                start = moment().subtract(1, 'year').startOf('day');
                break;
            default:
                start = moment().subtract(30, 'days').startOf('day');
        }

        return {
            start: start.toDate(),
            end: end.toDate()
        };
    }

    calculateGrowthRate(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }

    calculatePerformanceScore(stats) {
        const speedScore = Math.max(0, 100 - (parseFloat(stats.avg_processing_time) / 100));
        const qualityScore = (parseFloat(stats.avg_confidence) || 0) * 100;
        const reliabilityScore = Math.min(100, (parseInt(stats.fast_analyses) / parseInt(stats.total_analyses)) * 100);
        
        return (speedScore + qualityScore + reliabilityScore) / 3;
    }

    projectMonthlyCost(dailyCosts) {
        if (dailyCosts.length === 0) return 0;
        
        const avgDailyCost = dailyCosts.reduce((sum, day) => sum + parseFloat(day.daily_cost), 0) / dailyCosts.length;
        return avgDailyCost * 30;
    }

    calculateCostSavings(actualCost, analysisCount) {
        // Assume traditional services cost $0.10 per analysis
        const traditionalCost = analysisCount * 0.10;
        const savings = traditionalCost - actualCost;
        const savingsPercentage = (savings / traditionalCost) * 100;
        
        return {
            amount: Math.max(0, savings),
            percentage: Math.max(0, savingsPercentage),
            traditional: traditionalCost,
            actual: actualCost
        };
    }

    combineTrendData(meetingTrends, aiTrends) {
        const combined = new Map();
        
        // Add meeting data
        meetingTrends.forEach(day => {
            combined.set(day.date, {
                date: day.date,
                meetings: parseInt(day.meetings),
                avgParticipants: parseFloat(day.avg_participants) || 0,
                avgDuration: parseFloat(day.avg_duration) || 0,
                analyses: 0,
                avgConfidence: 0,
                dailyCost: 0
            });
        });
        
        // Add AI data
        aiTrends.forEach(day => {
            const existing = combined.get(day.date) || {
                date: day.date,
                meetings: 0,
                avgParticipants: 0,
                avgDuration: 0,
                analyses: 0,
                avgConfidence: 0,
                dailyCost: 0
            };
            
            existing.analyses = parseInt(day.analyses);
            existing.avgConfidence = parseFloat(day.avg_confidence) || 0;
            existing.dailyCost = parseFloat(day.daily_cost) || 0;
            
            combined.set(day.date, existing);
        });
        
        return Array.from(combined.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    extractAnalysisSummary(outputData) {
        try {
            const data = typeof outputData === 'string' ? JSON.parse(outputData) : outputData;
            const result = data.result || '';
            return result.length > 200 ? result.substring(0, 200) + '...' : result;
        } catch (error) {
            return 'Analysis summary not available';
        }
    }

    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Clean up old cache entries
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = new AnalyticsService();
