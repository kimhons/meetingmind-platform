/**
 * Opportunity Detection Engine
 * 
 * Advanced real-time and post-meeting opportunity detection system that identifies
 * missed collaboration moments, engagement drops, and optimization opportunities.
 */

const EventEmitter = require('events');
const { createClient } = require('@supabase/supabase-js');

class OpportunityDetectionEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      realTimeThreshold: 0.7, // Minimum confidence for real-time alerts
      postMeetingThreshold: 0.6, // Minimum confidence for post-meeting analysis
      maxRealTimeAlerts: 5, // Maximum real-time alerts per meeting
      analysisWindow: 30, // Seconds of context for analysis
      ...options
    };
    
    // Database client
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Detection algorithms
    this.detectionAlgorithms = {
      CLARIFICATION_NEEDED: new ClarificationDetector(this.supabase, this.options),
      DEFINITION_OPPORTUNITY: new DefinitionDetector(this.supabase, this.options),
      FOLLOW_UP_MISSING: new FollowUpDetector(this.supabase, this.options),
      DECISION_POINT: new DecisionPointDetector(this.supabase, this.options),
      ACTION_ITEM_UNCLEAR: new ActionItemDetector(this.supabase, this.options),
      ENGAGEMENT_DROP: new EngagementDetector(this.supabase, this.options),
      KNOWLEDGE_GAP: new KnowledgeGapDetector(this.supabase, this.options),
      TIME_MANAGEMENT: new TimeManagementDetector(this.supabase, this.options),
      COLLABORATION_MISS: new CollaborationDetector(this.supabase, this.options)
    };
    
    // Processing components
    this.realTimeProcessor = new RealTimeOpportunityProcessor(this.detectionAlgorithms, this.options);
    this.postMeetingAnalyzer = new PostMeetingAnalyzer(this.detectionAlgorithms, this.options);
    this.opportunityClassifier = new OpportunityClassifier(this.options);
    
    // Performance metrics
    this.metrics = {
      realTimeDetections: 0,
      postMeetingAnalyses: 0,
      totalOpportunities: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      alertsSent: 0,
      resolutionRate: 0
    };
    
    // Real-time state
    this.activeMeetings = new Map();
    this.alertCounts = new Map();
    
    this.initialized = false;
  }
  
  /**
   * Initialize the opportunity detection engine
   */
  async initialize() {
    try {
      console.log('Initializing Opportunity Detection Engine...');
      
      // Initialize all detection algorithms
      const initPromises = Object.values(this.detectionAlgorithms).map(algorithm =>
        algorithm.initialize()
      );
      
      await Promise.all(initPromises);
      
      // Initialize processing components
      await this.realTimeProcessor.initialize();
      await this.postMeetingAnalyzer.initialize();
      await this.opportunityClassifier.initialize();
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log('✓ Opportunity Detection Engine initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Opportunity Detection Engine:', error);
      throw error;
    }
  }
  
  /**
   * Process real-time conversation segment for opportunity detection
   */
  async processRealTimeSegment(conversationSegment, meetingContext) {
    const startTime = Date.now();
    
    try {
      if (!this.initialized) {
        throw new Error('Engine not initialized');
      }
      
      const meetingId = meetingContext.meetingId;
      
      // Initialize meeting state if needed
      if (!this.activeMeetings.has(meetingId)) {
        this.activeMeetings.set(meetingId, {
          startTime: Date.now(),
          segmentCount: 0,
          opportunitiesDetected: 0,
          lastAnalysis: null
        });
        this.alertCounts.set(meetingId, 0);
      }
      
      const meetingState = this.activeMeetings.get(meetingId);
      meetingState.segmentCount++;
      
      // Process segment through real-time processor
      const processingResult = await this.realTimeProcessor.processConversationSegment(
        conversationSegment,
        meetingContext
      );
      
      // Filter opportunities for real-time alerts
      const realTimeOpportunities = processingResult.opportunities.filter(opp =>
        opp.confidence >= this.options.realTimeThreshold &&
        opp.realTimeActionable &&
        this.alertCounts.get(meetingId) < this.options.maxRealTimeAlerts
      );
      
      // Classify and prioritize opportunities
      const classifiedOpportunities = await Promise.all(
        realTimeOpportunities.map(opp =>
          this.opportunityClassifier.classifyOpportunity(opp, meetingContext)
        )
      );
      
      // Send real-time alerts for high-priority opportunities
      const alerts = classifiedOpportunities.filter(opp => 
        opp.priority === 'high' || opp.priority === 'critical'
      );
      
      if (alerts.length > 0) {
        await this.sendRealTimeAlerts(alerts, meetingId);
        this.alertCounts.set(meetingId, this.alertCounts.get(meetingId) + alerts.length);
      }
      
      // Store all opportunities for post-meeting analysis
      await this.storeOpportunities(processingResult.opportunities, meetingId, 'real_time');
      
      // Update meeting state
      meetingState.opportunitiesDetected += processingResult.opportunities.length;
      meetingState.lastAnalysis = Date.now();
      
      // Update metrics
      this.updateRealTimeMetrics(startTime, processingResult.opportunities, alerts);
      
      // Emit processing event
      this.emit('realTimeProcessed', {
        meetingId,
        segmentId: conversationSegment.id,
        opportunitiesDetected: processingResult.opportunities.length,
        alertsSent: alerts.length,
        processingTime: Date.now() - startTime
      });
      
      return {
        success: true,
        opportunitiesDetected: processingResult.opportunities.length,
        realTimeAlerts: alerts.length,
        processingTime: Date.now() - startTime,
        confidence: this.calculateAverageConfidence(processingResult.opportunities)
      };
      
    } catch (error) {
      console.error(`Error processing real-time segment for meeting ${meetingContext.meetingId}:`, error);
      
      this.emit('realTimeError', {
        meetingId: meetingContext.meetingId,
        error: error.message,
        processingTime: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  /**
   * Perform comprehensive post-meeting opportunity analysis
   */
  async analyzePostMeeting(meetingData, participantData, objectives) {
    const startTime = Date.now();
    
    try {
      console.log(`Performing post-meeting analysis for meeting ${meetingData.id}...`);
      
      if (!this.initialized) {
        throw new Error('Engine not initialized');
      }
      
      // Perform comprehensive analysis
      const analysisResult = await this.postMeetingAnalyzer.analyzeMeetingEffectiveness(
        meetingData,
        participantData,
        objectives
      );
      
      // Classify all detected opportunities
      const classifiedOpportunities = await Promise.all(
        analysisResult.opportunities.map(opp =>
          this.opportunityClassifier.classifyOpportunity(opp, {
            meetingId: meetingData.id,
            organizationId: meetingData.organizationId,
            meetingType: meetingData.type,
            participantCount: participantData.length,
            duration: meetingData.durationMinutes,
            objectives
          })
        )
      );
      
      // Generate comprehensive opportunity report
      const opportunityReport = await this.generateOpportunityReport(
        classifiedOpportunities,
        analysisResult.metrics,
        meetingData
      );
      
      // Store post-meeting opportunities
      await this.storeOpportunities(classifiedOpportunities, meetingData.id, 'post_meeting');
      
      // Store analysis metrics
      await this.storeAnalysisMetrics(analysisResult.metrics, meetingData.id);
      
      // Clean up meeting state
      this.activeMeetings.delete(meetingData.id);
      this.alertCounts.delete(meetingData.id);
      
      // Update metrics
      this.updatePostMeetingMetrics(startTime, classifiedOpportunities, analysisResult.metrics);
      
      // Emit analysis complete event
      this.emit('postMeetingAnalyzed', {
        meetingId: meetingData.id,
        opportunitiesDetected: classifiedOpportunities.length,
        effectivenessScore: analysisResult.metrics.overallEffectiveness,
        processingTime: Date.now() - startTime
      });
      
      console.log(`✓ Post-meeting analysis complete: ${classifiedOpportunities.length} opportunities detected`);
      
      return {
        success: true,
        opportunities: classifiedOpportunities,
        metrics: analysisResult.metrics,
        report: opportunityReport,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`Error in post-meeting analysis for meeting ${meetingData.id}:`, error);
      
      this.emit('postMeetingError', {
        meetingId: meetingData.id,
        error: error.message,
        processingTime: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  /**
   * Send real-time alerts for detected opportunities
   */
  async sendRealTimeAlerts(opportunities, meetingId) {
    try {
      const alerts = opportunities.map(opp => ({
        type: 'opportunity_detected',
        meetingId,
        opportunity: {
          id: opp.id,
          type: opp.type,
          title: opp.title,
          description: opp.description,
          priority: opp.priority,
          confidence: opp.confidence,
          suggestedActions: opp.suggestedActions?.slice(0, 3) || [],
          timestamp: Date.now()
        }
      }));
      
      // Emit alerts through WebSocket
      this.emit('realTimeAlerts', { meetingId, alerts });
      
      // Store alert history
      await this.storeAlertHistory(alerts, meetingId);
      
      this.metrics.alertsSent += alerts.length;
      
    } catch (error) {
      console.error('Error sending real-time alerts:', error);
    }
  }
  
  /**
   * Store opportunities in database
   */
  async storeOpportunities(opportunities, meetingId, analysisType) {
    try {
      const opportunityRecords = opportunities.map(opp => ({
        meeting_id: meetingId,
        opportunity_type: opp.type,
        title: opp.title,
        description: opp.description,
        confidence: opp.confidence,
        priority: opp.priority,
        impact_score: opp.impactScore || 0.5,
        feasibility_score: opp.feasibilityScore || 0.5,
        urgency_score: opp.urgencyScore || 0.5,
        actionable: opp.actionable || false,
        suggested_actions: opp.suggestedActions || [],
        context_data: opp.contextData || {},
        analysis_type: analysisType,
        detected_at: new Date().toISOString(),
        resolution_status: 'pending',
        ai_insights: opp.aiInsights || null
      }));
      
      const { error } = await this.supabase
        .from('missed_opportunities')
        .insert(opportunityRecords);
      
      if (error) {
        console.error('Error storing opportunities:', error);
      }
      
    } catch (error) {
      console.error('Error in storeOpportunities:', error);
    }
  }
  
  /**
   * Store analysis metrics
   */
  async storeAnalysisMetrics(metrics, meetingId) {
    try {
      const metricsRecord = {
        meeting_id: meetingId,
        effectiveness_score: metrics.overallEffectiveness || 0,
        participation_balance: metrics.participationBalance || 0,
        decision_velocity: metrics.decisionVelocity || 0,
        engagement_consistency: metrics.engagementConsistency || 0,
        time_efficiency: metrics.timeEfficiency || 0,
        objective_completion_rate: metrics.objectiveCompletionRate || 0,
        collaboration_score: metrics.collaborationScore || 0,
        knowledge_sharing_score: metrics.knowledgeSharingScore || 0,
        analysis_timestamp: new Date().toISOString(),
        ai_confidence: metrics.confidence || 0.8
      };
      
      const { error } = await this.supabase
        .from('meeting_analytics_metrics')
        .insert(metricsRecord);
      
      if (error) {
        console.error('Error storing analysis metrics:', error);
      }
      
    } catch (error) {
      console.error('Error in storeAnalysisMetrics:', error);
    }
  }
  
  /**
   * Store alert history
   */
  async storeAlertHistory(alerts, meetingId) {
    try {
      const alertRecords = alerts.map(alert => ({
        meeting_id: meetingId,
        alert_type: alert.type,
        opportunity_type: alert.opportunity.type,
        priority: alert.opportunity.priority,
        confidence: alert.opportunity.confidence,
        alert_content: alert.opportunity,
        sent_at: new Date().toISOString(),
        delivery_status: 'sent'
      }));
      
      const { error } = await this.supabase
        .from('real_time_alerts')
        .insert(alertRecords);
      
      if (error) {
        console.error('Error storing alert history:', error);
      }
      
    } catch (error) {
      console.error('Error in storeAlertHistory:', error);
    }
  }
  
  /**
   * Generate comprehensive opportunity report
   */
  async generateOpportunityReport(opportunities, metrics, meetingData) {
    try {
      // Categorize opportunities by type
      const opportunityCategories = this.categorizeOpportunities(opportunities);
      
      // Calculate impact analysis
      const impactAnalysis = this.calculateImpactAnalysis(opportunities, metrics);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(opportunities, metrics, meetingData);
      
      // Calculate ROI potential
      const roiPotential = this.calculateROIPotential(opportunities, meetingData);
      
      return {
        summary: {
          totalOpportunities: opportunities.length,
          highPriorityCount: opportunities.filter(o => o.priority === 'high' || o.priority === 'critical').length,
          averageConfidence: this.calculateAverageConfidence(opportunities),
          estimatedImpact: impactAnalysis.totalImpact,
          roiPotential
        },
        categories: opportunityCategories,
        impactAnalysis,
        recommendations,
        actionPlan: this.generateActionPlan(opportunities),
        metrics: {
          effectiveness: metrics.overallEffectiveness,
          efficiency: metrics.timeEfficiency,
          engagement: metrics.engagementConsistency,
          collaboration: metrics.collaborationScore
        }
      };
      
    } catch (error) {
      console.error('Error generating opportunity report:', error);
      return null;
    }
  }
  
  /**
   * Categorize opportunities by type
   */
  categorizeOpportunities(opportunities) {
    const categories = {};
    
    opportunities.forEach(opp => {
      if (!categories[opp.type]) {
        categories[opp.type] = {
          count: 0,
          opportunities: [],
          averageConfidence: 0,
          averageImpact: 0
        };
      }
      
      categories[opp.type].count++;
      categories[opp.type].opportunities.push(opp);
    });
    
    // Calculate averages for each category
    Object.values(categories).forEach(category => {
      const opps = category.opportunities;
      category.averageConfidence = opps.reduce((sum, o) => sum + o.confidence, 0) / opps.length;
      category.averageImpact = opps.reduce((sum, o) => sum + (o.impactScore || 0.5), 0) / opps.length;
    });
    
    return categories;
  }
  
  /**
   * Calculate impact analysis
   */
  calculateImpactAnalysis(opportunities, metrics) {
    const totalImpact = opportunities.reduce((sum, opp) => sum + (opp.impactScore || 0.5), 0);
    const averageImpact = opportunities.length > 0 ? totalImpact / opportunities.length : 0;
    
    const highImpactOpportunities = opportunities.filter(opp => (opp.impactScore || 0.5) >= 0.7);
    const actionableOpportunities = opportunities.filter(opp => opp.actionable);
    
    return {
      totalImpact,
      averageImpact,
      highImpactCount: highImpactOpportunities.length,
      actionableCount: actionableOpportunities.length,
      potentialEffectivenessGain: this.calculateEffectivenessGain(opportunities, metrics),
      estimatedTimeSavings: this.calculateTimeSavings(opportunities)
    };
  }
  
  /**
   * Generate recommendations based on opportunities
   */
  async generateRecommendations(opportunities, metrics, meetingData) {
    const recommendations = [];
    
    // Analyze opportunity patterns
    const patterns = this.analyzeOpportunityPatterns(opportunities);
    
    // Generate pattern-based recommendations
    patterns.forEach(pattern => {
      if (pattern.frequency >= 2) {
        recommendations.push({
          type: 'pattern_based',
          title: `Address Recurring ${pattern.type} Issues`,
          description: `${pattern.frequency} instances of ${pattern.type} detected`,
          priority: 'high',
          actions: pattern.suggestedActions,
          impact: 'medium'
        });
      }
    });
    
    // Generate effectiveness-based recommendations
    if (metrics.overallEffectiveness < 0.7) {
      recommendations.push({
        type: 'effectiveness',
        title: 'Improve Overall Meeting Effectiveness',
        description: `Current effectiveness score: ${Math.round(metrics.overallEffectiveness * 100)}%`,
        priority: 'high',
        actions: [
          'Set clearer meeting objectives',
          'Improve agenda structure',
          'Enhance participant preparation',
          'Implement better time management'
        ],
        impact: 'high'
      });
    }
    
    // Generate engagement-based recommendations
    if (metrics.engagementConsistency < 0.6) {
      recommendations.push({
        type: 'engagement',
        title: 'Enhance Participant Engagement',
        description: `Engagement consistency: ${Math.round(metrics.engagementConsistency * 100)}%`,
        priority: 'medium',
        actions: [
          'Encourage more balanced participation',
          'Use interactive discussion techniques',
          'Address silent participants proactively',
          'Implement engagement monitoring'
        ],
        impact: 'medium'
      });
    }
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }
  
  /**
   * Analyze opportunity patterns
   */
  analyzeOpportunityPatterns(opportunities) {
    const patterns = {};
    
    opportunities.forEach(opp => {
      if (!patterns[opp.type]) {
        patterns[opp.type] = {
          type: opp.type,
          frequency: 0,
          totalConfidence: 0,
          suggestedActions: new Set()
        };
      }
      
      patterns[opp.type].frequency++;
      patterns[opp.type].totalConfidence += opp.confidence;
      
      if (opp.suggestedActions) {
        opp.suggestedActions.forEach(action => 
          patterns[opp.type].suggestedActions.add(action)
        );
      }
    });
    
    // Convert to array and calculate averages
    return Object.values(patterns).map(pattern => ({
      ...pattern,
      averageConfidence: pattern.totalConfidence / pattern.frequency,
      suggestedActions: Array.from(pattern.suggestedActions).slice(0, 3)
    }));
  }
  
  /**
   * Generate action plan
   */
  generateActionPlan(opportunities) {
    const highPriorityOpportunities = opportunities
      .filter(opp => opp.priority === 'high' || opp.priority === 'critical')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
    
    return highPriorityOpportunities.map((opp, index) => ({
      priority: index + 1,
      opportunity: opp.title,
      actions: opp.suggestedActions?.slice(0, 2) || [],
      timeframe: this.getTimeframe(opp.urgencyScore || 0.5),
      owner: 'Meeting Facilitator',
      expectedImpact: this.getImpactLevel(opp.impactScore || 0.5)
    }));
  }
  
  /**
   * Calculate ROI potential
   */
  calculateROIPotential(opportunities, meetingData) {
    const participantCount = meetingData.participantCount || 5;
    const durationMinutes = meetingData.durationMinutes || 60;
    const hourlyRate = 100; // Assumed average hourly rate
    
    const meetingCost = (participantCount * hourlyRate * durationMinutes) / 60;
    
    const potentialSavings = opportunities.reduce((total, opp) => {
      const impactScore = opp.impactScore || 0.5;
      const timeSavingPercentage = impactScore * 0.2; // Up to 20% time savings
      return total + (meetingCost * timeSavingPercentage);
    }, 0);
    
    return {
      meetingCost,
      potentialSavings: Math.round(potentialSavings),
      roiPercentage: meetingCost > 0 ? Math.round((potentialSavings / meetingCost) * 100) : 0,
      paybackPeriod: 'Immediate'
    };
  }
  
  /**
   * Helper methods
   */
  calculateAverageConfidence(opportunities) {
    if (opportunities.length === 0) return 0;
    return opportunities.reduce((sum, opp) => sum + opp.confidence, 0) / opportunities.length;
  }
  
  calculateEffectivenessGain(opportunities, metrics) {
    const highImpactCount = opportunities.filter(opp => (opp.impactScore || 0.5) >= 0.7).length;
    const potentialGain = highImpactCount * 0.1; // 10% gain per high-impact opportunity
    return Math.min(0.3, potentialGain); // Cap at 30% gain
  }
  
  calculateTimeSavings(opportunities) {
    const timeSavingOpportunities = opportunities.filter(opp => 
      opp.type === 'TIME_MANAGEMENT' || opp.type === 'DECISION_POINT'
    );
    return timeSavingOpportunities.length * 5; // 5 minutes per opportunity
  }
  
  getTimeframe(urgencyScore) {
    if (urgencyScore >= 0.8) return 'Immediate';
    if (urgencyScore >= 0.6) return 'This week';
    if (urgencyScore >= 0.4) return 'Next meeting';
    return 'Future meetings';
  }
  
  getImpactLevel(impactScore) {
    if (impactScore >= 0.8) return 'High';
    if (impactScore >= 0.6) return 'Medium';
    return 'Low';
  }
  
  /**
   * Update metrics
   */
  updateRealTimeMetrics(startTime, opportunities, alerts) {
    const processingTime = Date.now() - startTime;
    
    this.metrics.realTimeDetections++;
    this.metrics.totalOpportunities += opportunities.length;
    this.metrics.alertsSent += alerts.length;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime + processingTime) / 2;
    
    if (opportunities.length > 0) {
      const avgConfidence = this.calculateAverageConfidence(opportunities);
      this.metrics.averageConfidence = 
        (this.metrics.averageConfidence + avgConfidence) / 2;
    }
  }
  
  updatePostMeetingMetrics(startTime, opportunities, analysisMetrics) {
    const processingTime = Date.now() - startTime;
    
    this.metrics.postMeetingAnalyses++;
    this.metrics.totalOpportunities += opportunities.length;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime + processingTime) / 2;
    
    if (opportunities.length > 0) {
      const avgConfidence = this.calculateAverageConfidence(opportunities);
      this.metrics.averageConfidence = 
        (this.metrics.averageConfidence + avgConfidence) / 2;
    }
  }
  
  /**
   * Get engine metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeMeetings: this.activeMeetings.size,
      initialized: this.initialized,
      algorithms: Object.keys(this.detectionAlgorithms).length
    };
  }
  
  /**
   * Shutdown engine gracefully
   */
  async shutdown() {
    console.log('Shutting down Opportunity Detection Engine...');
    
    // Shutdown all algorithms
    const shutdownPromises = Object.values(this.detectionAlgorithms).map(algorithm =>
      algorithm.shutdown ? algorithm.shutdown() : Promise.resolve()
    );
    
    await Promise.all(shutdownPromises);
    
    // Clear state
    this.activeMeetings.clear();
    this.alertCounts.clear();
    
    this.emit('shutdown');
    console.log('✓ Opportunity Detection Engine shutdown complete');
  }
}

/**
 * Real-Time Opportunity Processor
 * Handles real-time processing of conversation segments
 */
class RealTimeOpportunityProcessor {
  constructor(detectionAlgorithms, options) {
    this.algorithms = detectionAlgorithms;
    this.options = options;
    this.processingQueue = [];
    this.isProcessing = false;
  }
  
  async initialize() {
    console.log('✓ Real-Time Opportunity Processor initialized');
  }
  
  async processConversationSegment(segment, context) {
    try {
      const startTime = Date.now();
      
      // Run detection algorithms in parallel
      const detectionPromises = Object.entries(this.algorithms).map(async ([type, algorithm]) => {
        try {
          const opportunities = await algorithm.detectOpportunities(segment, context);
          return opportunities.map(opp => ({ ...opp, algorithmType: type }));
        } catch (error) {
          console.error(`Error in ${type} algorithm:`, error);
          return [];
        }
      });
      
      const detectionResults = await Promise.allSettled(detectionPromises);
      
      // Flatten and filter results
      const allOpportunities = detectionResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(opp => opp.confidence >= this.options.postMeetingThreshold);
      
      // Remove duplicates and merge similar opportunities
      const uniqueOpportunities = this.deduplicateOpportunities(allOpportunities);
      
      return {
        opportunities: uniqueOpportunities,
        processingTime: Date.now() - startTime,
        algorithmsRun: Object.keys(this.algorithms).length
      };
      
    } catch (error) {
      console.error('Error in processConversationSegment:', error);
      return { opportunities: [], processingTime: 0, algorithmsRun: 0 };
    }
  }
  
  deduplicateOpportunities(opportunities) {
    const uniqueOpportunities = [];
    const seenOpportunities = new Set();
    
    opportunities.forEach(opp => {
      const key = `${opp.type}_${opp.title}_${Math.round(opp.confidence * 10)}`;
      
      if (!seenOpportunities.has(key)) {
        seenOpportunities.add(key);
        uniqueOpportunities.push(opp);
      }
    });
    
    return uniqueOpportunities;
  }
}

/**
 * Post-Meeting Analyzer
 * Performs comprehensive post-meeting opportunity analysis
 */
class PostMeetingAnalyzer {
  constructor(detectionAlgorithms, options) {
    this.algorithms = detectionAlgorithms;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Post-Meeting Analyzer initialized');
  }
  
  async analyzeMeetingEffectiveness(meetingData, participantData, objectives) {
    try {
      // Calculate efficiency metrics
      const efficiencyMetrics = this.calculateEfficiencyMetrics(
        meetingData,
        participantData,
        objectives
      );
      
      // Identify collaboration opportunities
      const collaborationOpportunities = await this.identifyCollaborationOpportunities(
        participantData,
        meetingData.conversationFlow
      );
      
      // Analyze decision-making effectiveness
      const decisionAnalysis = this.analyzeDecisionMaking(
        meetingData.decisions || [],
        objectives,
        participantData
      );
      
      // Evaluate time utilization
      const timeAnalysis = this.analyzeTimeUtilization(
        meetingData.timeline || [],
        objectives,
        participantData
      );
      
      // Run all detection algorithms on complete meeting data
      const comprehensiveOpportunities = await this.runComprehensiveDetection(
        meetingData,
        participantData,
        objectives
      );
      
      // Combine all opportunities
      const allOpportunities = [
        ...collaborationOpportunities,
        ...decisionAnalysis.opportunities,
        ...timeAnalysis.opportunities,
        ...comprehensiveOpportunities
      ];
      
      return {
        opportunities: allOpportunities,
        metrics: {
          ...efficiencyMetrics,
          overallEffectiveness: this.calculateOverallEffectiveness(efficiencyMetrics),
          collaborationScore: this.calculateCollaborationScore(collaborationOpportunities),
          knowledgeSharingScore: this.calculateKnowledgeSharingScore(comprehensiveOpportunities)
        }
      };
      
    } catch (error) {
      console.error('Error in analyzeMeetingEffectiveness:', error);
      return { opportunities: [], metrics: {} };
    }
  }
  
  calculateEfficiencyMetrics(meetingData, participantData, objectives) {
    return {
      objectiveCompletionRate: this.calculateObjectiveCompletion(objectives, meetingData.outcomes || []),
      participationBalance: this.calculateParticipationBalance(participantData),
      decisionVelocity: this.calculateDecisionVelocity(meetingData.decisions || [], meetingData.durationMinutes),
      engagementConsistency: this.calculateEngagementConsistency(participantData),
      timeEfficiency: this.calculateTimeEfficiency(meetingData.timeline || [], objectives)
    };
  }
  
  calculateObjectiveCompletion(objectives, outcomes) {
    if (!objectives || objectives.length === 0) return 0.5;
    
    const completedObjectives = objectives.filter(obj => 
      outcomes.some(outcome => 
        outcome.toLowerCase().includes(obj.toLowerCase()) ||
        obj.toLowerCase().includes(outcome.toLowerCase())
      )
    );
    
    return completedObjectives.length / objectives.length;
  }
  
  calculateParticipationBalance(participantData) {
    if (!participantData || participantData.length === 0) return 0.5;
    
    const speakingTimes = participantData.map(p => p.speakingTime || 0);
    const totalTime = speakingTimes.reduce((sum, time) => sum + time, 0);
    
    if (totalTime === 0) return 0.5;
    
    const expectedTime = totalTime / participantData.length;
    const variance = speakingTimes.reduce((sum, time) => 
      sum + Math.pow(time - expectedTime, 2), 0
    ) / participantData.length;
    
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / expectedTime;
    
    // Lower coefficient of variation = better balance
    return Math.max(0, 1 - coefficientOfVariation);
  }
  
  calculateDecisionVelocity(decisions, durationMinutes) {
    if (!decisions || decisions.length === 0 || !durationMinutes) return 0.5;
    
    const decisionsPerHour = (decisions.length / durationMinutes) * 60;
    
    // Normalize to 0-1 scale (assuming 2 decisions per hour is optimal)
    return Math.min(1, decisionsPerHour / 2);
  }
  
  calculateEngagementConsistency(participantData) {
    if (!participantData || participantData.length === 0) return 0.5;
    
    const engagementLevels = participantData.map(p => p.engagementLevel || 0.5);
    const averageEngagement = engagementLevels.reduce((sum, level) => sum + level, 0) / engagementLevels.length;
    
    const variance = engagementLevels.reduce((sum, level) => 
      sum + Math.pow(level - averageEngagement, 2), 0
    ) / engagementLevels.length;
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - variance);
  }
  
  calculateTimeEfficiency(timeline, objectives) {
    if (!timeline || timeline.length === 0) return 0.5;
    
    // Simple heuristic: meetings that stay on agenda are more efficient
    const onTopicTime = timeline.filter(item => 
      item.type === 'agenda_item' || item.type === 'objective_discussion'
    ).reduce((sum, item) => sum + (item.duration || 0), 0);
    
    const totalTime = timeline.reduce((sum, item) => sum + (item.duration || 0), 0);
    
    return totalTime > 0 ? onTopicTime / totalTime : 0.5;
  }
  
  async identifyCollaborationOpportunities(participantData, conversationFlow) {
    const opportunities = [];
    
    // Identify silent participants who could contribute
    const silentParticipants = participantData.filter(p => 
      (p.speakingTime || 0) < 60 && // Less than 1 minute speaking time
      (p.expertise || []).length > 0 // But has relevant expertise
    );
    
    silentParticipants.forEach(participant => {
      opportunities.push({
        id: `collaboration_${participant.id}_${Date.now()}`,
        type: 'COLLABORATION_MISS',
        title: 'Underutilized Expertise',
        description: `${participant.name} has relevant expertise but limited participation`,
        confidence: 0.8,
        realTimeActionable: false,
        actionable: true,
        suggestedActions: [
          `Directly ask ${participant.name} for input on relevant topics`,
          'Create structured opportunities for expertise sharing',
          'Follow up individually to gather insights'
        ],
        contextData: {
          participantId: participant.id,
          participantName: participant.name,
          expertise: participant.expertise,
          speakingTime: participant.speakingTime
        }
      });
    });
    
    return opportunities;
  }
  
  analyzeDecisionMaking(decisions, objectives, participantData) {
    const opportunities = [];
    
    // Check for unclear decisions
    const unclearDecisions = decisions.filter(decision => 
      !decision.owner || !decision.deadline || !decision.actionItems
    );
    
    unclearDecisions.forEach(decision => {
      opportunities.push({
        id: `decision_${decision.id || Date.now()}`,
        type: 'ACTION_ITEM_UNCLEAR',
        title: 'Unclear Decision Implementation',
        description: 'Decision lacks clear owner, deadline, or action items',
        confidence: 0.9,
        realTimeActionable: false,
        actionable: true,
        suggestedActions: [
          'Assign clear decision owner',
          'Set specific implementation deadline',
          'Define concrete action items',
          'Establish success criteria'
        ],
        contextData: {
          decision: decision.description,
          missingElements: [
            !decision.owner && 'owner',
            !decision.deadline && 'deadline',
            !decision.actionItems && 'action items'
          ].filter(Boolean)
        }
      });
    });
    
    return { opportunities };
  }
  
  analyzeTimeUtilization(timeline, objectives, participantData) {
    const opportunities = [];
    
    // Check for time management issues
    const longDiscussions = timeline.filter(item => 
      item.type === 'discussion' && (item.duration || 0) > 15 // More than 15 minutes
    );
    
    longDiscussions.forEach(discussion => {
      opportunities.push({
        id: `time_${discussion.id || Date.now()}`,
        type: 'TIME_MANAGEMENT',
        title: 'Extended Discussion Without Resolution',
        description: `Discussion on "${discussion.topic}" exceeded 15 minutes without clear outcome`,
        confidence: 0.7,
        realTimeActionable: false,
        actionable: true,
        suggestedActions: [
          'Set time limits for discussion topics',
          'Use structured decision-making processes',
          'Park unresolved items for follow-up',
          'Assign discussion facilitator'
        ],
        contextData: {
          topic: discussion.topic,
          duration: discussion.duration,
          outcome: discussion.outcome
        }
      });
    });
    
    return { opportunities };
  }
  
  async runComprehensiveDetection(meetingData, participantData, objectives) {
    try {
      const context = {
        meetingId: meetingData.id,
        organizationId: meetingData.organizationId,
        meetingType: meetingData.type,
        participants: participantData,
        objectives,
        fullTranscript: meetingData.transcript,
        conversationFlow: meetingData.conversationFlow
      };
      
      // Run all algorithms on complete meeting data
      const detectionPromises = Object.values(this.algorithms).map(async algorithm => {
        try {
          return await algorithm.detectOpportunities(meetingData, context);
        } catch (error) {
          console.error('Error in comprehensive detection algorithm:', error);
          return [];
        }
      });
      
      const results = await Promise.allSettled(detectionPromises);
      
      return results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(opp => opp.confidence >= this.options.postMeetingThreshold);
      
    } catch (error) {
      console.error('Error in runComprehensiveDetection:', error);
      return [];
    }
  }
  
  calculateOverallEffectiveness(metrics) {
    const weights = {
      objectiveCompletionRate: 0.3,
      participationBalance: 0.2,
      decisionVelocity: 0.2,
      engagementConsistency: 0.15,
      timeEfficiency: 0.15
    };
    
    return Object.entries(weights).reduce((sum, [metric, weight]) => 
      sum + (metrics[metric] || 0.5) * weight, 0
    );
  }
  
  calculateCollaborationScore(collaborationOpportunities) {
    // Higher score = fewer collaboration opportunities (better collaboration)
    const maxOpportunities = 5; // Assume max 5 collaboration opportunities
    const actualOpportunities = Math.min(collaborationOpportunities.length, maxOpportunities);
    return Math.max(0, 1 - (actualOpportunities / maxOpportunities));
  }
  
  calculateKnowledgeSharingScore(opportunities) {
    const knowledgeOpportunities = opportunities.filter(opp => 
      opp.type === 'KNOWLEDGE_GAP' || opp.type === 'DEFINITION_OPPORTUNITY'
    );
    
    const maxOpportunities = 3; // Assume max 3 knowledge sharing opportunities
    const actualOpportunities = Math.min(knowledgeOpportunities.length, maxOpportunities);
    return Math.max(0, 1 - (actualOpportunities / maxOpportunities));
  }
}

/**
 * Opportunity Classifier
 * Classifies and scores opportunities for priority and actionability
 */
class OpportunityClassifier {
  constructor(options) {
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Opportunity Classifier initialized');
  }
  
  async classifyOpportunity(opportunity, context) {
    try {
      // Calculate impact score
      const impactScore = this.calculateImpactScore(opportunity, context);
      
      // Calculate feasibility score
      const feasibilityScore = this.calculateFeasibilityScore(opportunity, context);
      
      // Calculate urgency score
      const urgencyScore = this.calculateUrgencyScore(opportunity, context);
      
      // Determine overall priority
      const priority = this.determinePriority(impactScore, feasibilityScore, urgencyScore);
      
      // Assess actionability
      const actionability = this.assessActionability(opportunity, context);
      
      return {
        ...opportunity,
        impactScore,
        feasibilityScore,
        urgencyScore,
        priority,
        actionability,
        classification: this.getClassification(opportunity.type),
        realTimeActionable: this.isRealTimeActionable(opportunity, context)
      };
      
    } catch (error) {
      console.error('Error classifying opportunity:', error);
      return opportunity;
    }
  }
  
  calculateImpactScore(opportunity, context) {
    const baseImpact = {
      CLARIFICATION_NEEDED: 0.7,
      DEFINITION_OPPORTUNITY: 0.6,
      FOLLOW_UP_MISSING: 0.8,
      DECISION_POINT: 0.9,
      ACTION_ITEM_UNCLEAR: 0.8,
      ENGAGEMENT_DROP: 0.7,
      KNOWLEDGE_GAP: 0.8,
      TIME_MANAGEMENT: 0.6,
      COLLABORATION_MISS: 0.7
    };
    
    let impact = baseImpact[opportunity.type] || 0.5;
    
    // Adjust based on context
    if (context.meetingType === 'strategic') impact *= 1.2;
    if (context.participantCount > 5) impact *= 1.1;
    if (context.objectives && context.objectives.length > 0) impact *= 1.1;
    
    return Math.min(1.0, impact);
  }
  
  calculateFeasibilityScore(opportunity, context) {
    let feasibility = 0.7; // Base feasibility
    
    // Adjust based on opportunity type
    const easyToImplement = ['CLARIFICATION_NEEDED', 'DEFINITION_OPPORTUNITY', 'FOLLOW_UP_MISSING'];
    const moderateToImplement = ['DECISION_POINT', 'ACTION_ITEM_UNCLEAR', 'TIME_MANAGEMENT'];
    const hardToImplement = ['ENGAGEMENT_DROP', 'KNOWLEDGE_GAP', 'COLLABORATION_MISS'];
    
    if (easyToImplement.includes(opportunity.type)) feasibility = 0.9;
    else if (moderateToImplement.includes(opportunity.type)) feasibility = 0.7;
    else if (hardToImplement.includes(opportunity.type)) feasibility = 0.5;
    
    // Adjust based on context
    if (context.meetingType === 'informal') feasibility *= 1.1;
    if (context.duration && context.duration > 90) feasibility *= 0.9; // Longer meetings harder to change
    
    return Math.min(1.0, feasibility);
  }
  
  calculateUrgencyScore(opportunity, context) {
    let urgency = 0.5; // Base urgency
    
    // Adjust based on opportunity type
    const highUrgency = ['DECISION_POINT', 'ACTION_ITEM_UNCLEAR', 'TIME_MANAGEMENT'];
    const mediumUrgency = ['CLARIFICATION_NEEDED', 'ENGAGEMENT_DROP', 'FOLLOW_UP_MISSING'];
    const lowUrgency = ['DEFINITION_OPPORTUNITY', 'KNOWLEDGE_GAP', 'COLLABORATION_MISS'];
    
    if (highUrgency.includes(opportunity.type)) urgency = 0.8;
    else if (mediumUrgency.includes(opportunity.type)) urgency = 0.6;
    else if (lowUrgency.includes(opportunity.type)) urgency = 0.4;
    
    // Adjust based on confidence
    urgency *= opportunity.confidence;
    
    return Math.min(1.0, urgency);
  }
  
  determinePriority(impactScore, feasibilityScore, urgencyScore) {
    const priorityScore = (impactScore * 0.4) + (feasibilityScore * 0.3) + (urgencyScore * 0.3);
    
    if (priorityScore >= 0.8) return 'critical';
    if (priorityScore >= 0.7) return 'high';
    if (priorityScore >= 0.5) return 'medium';
    return 'low';
  }
  
  assessActionability(opportunity, context) {
    const actionableTypes = [
      'CLARIFICATION_NEEDED',
      'DEFINITION_OPPORTUNITY', 
      'FOLLOW_UP_MISSING',
      'DECISION_POINT',
      'ACTION_ITEM_UNCLEAR'
    ];
    
    const hasActions = opportunity.suggestedActions && opportunity.suggestedActions.length > 0;
    const isActionableType = actionableTypes.includes(opportunity.type);
    
    return hasActions && isActionableType;
  }
  
  getClassification(opportunityType) {
    const classifications = {
      CLARIFICATION_NEEDED: 'Communication',
      DEFINITION_OPPORTUNITY: 'Knowledge Sharing',
      FOLLOW_UP_MISSING: 'Process',
      DECISION_POINT: 'Decision Making',
      ACTION_ITEM_UNCLEAR: 'Process',
      ENGAGEMENT_DROP: 'Participation',
      KNOWLEDGE_GAP: 'Knowledge Sharing',
      TIME_MANAGEMENT: 'Efficiency',
      COLLABORATION_MISS: 'Collaboration'
    };
    
    return classifications[opportunityType] || 'General';
  }
  
  isRealTimeActionable(opportunity, context) {
    const realTimeTypes = [
      'CLARIFICATION_NEEDED',
      'DEFINITION_OPPORTUNITY',
      'ENGAGEMENT_DROP',
      'DECISION_POINT'
    ];
    
    return realTimeTypes.includes(opportunity.type) && 
           opportunity.confidence >= 0.7 &&
           opportunity.priority !== 'low';
  }
}

// Detection Algorithm Base Classes (to be implemented in separate files)
class ClarificationDetector {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Clarification Detector initialized');
  }
  
  async detectOpportunities(segment, context) {
    // Implementation will be in separate file
    return [];
  }
}

class DefinitionDetector {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Definition Detector initialized');
  }
  
  async detectOpportunities(segment, context) {
    // Implementation will be in separate file
    return [];
  }
}

class FollowUpDetector {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Follow-Up Detector initialized');
  }
  
  async detectOpportunities(segment, context) {
    // Implementation will be in separate file
    return [];
  }
}

class DecisionPointDetector {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Decision Point Detector initialized');
  }
  
  async detectOpportunities(segment, context) {
    // Implementation will be in separate file
    return [];
  }
}

class ActionItemDetector {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Action Item Detector initialized');
  }
  
  async detectOpportunities(segment, context) {
    // Implementation will be in separate file
    return [];
  }
}

class EngagementDetector {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Engagement Detector initialized');
  }
  
  async detectOpportunities(segment, context) {
    // Implementation will be in separate file
    return [];
  }
}

class KnowledgeGapDetector {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Knowledge Gap Detector initialized');
  }
  
  async detectOpportunities(segment, context) {
    // Implementation will be in separate file
    return [];
  }
}

class TimeManagementDetector {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Time Management Detector initialized');
  }
  
  async detectOpportunities(segment, context) {
    // Implementation will be in separate file
    return [];
  }
}

class CollaborationDetector {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Collaboration Detector initialized');
  }
  
  async detectOpportunities(segment, context) {
    // Implementation will be in separate file
    return [];
  }
}

module.exports = OpportunityDetectionEngine;
