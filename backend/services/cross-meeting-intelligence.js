/**
 * Cross-Meeting Intelligence Engine
 * 
 * Provides sophisticated intelligence by analyzing patterns, relationships,
 * and continuity across multiple meeting sessions.
 */

const EventEmitter = require('events');

class CrossMeetingIntelligenceEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      analysisWindow: 90, // Days to look back for analysis
      patternDetectionThreshold: 0.6, // Minimum confidence for pattern detection
      continuityScoreThreshold: 0.7, // Minimum score for continuity insights
      maxInsights: 10, // Maximum insights to return
      ...options
    };
    
    // Core analysis engines
    this.continuityEngine = new ContextualContinuityEngine(this.options);
    this.patternDetector = new PatternDetectionEngine(this.options);
    this.decisionTracker = new DecisionImplementationTracker(this.options);
    this.conversationAnalyzer = new ConversationFlowAnalyzer(this.options);
    this.outcomePredictor = new OutcomePredictionEngine(this.options);
    
    // Performance metrics
    this.metrics = {
      analysisRequests: 0,
      patternsDetected: 0,
      continuityInsights: 0,
      predictionAccuracy: 0,
      averageProcessingTime: 0
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the cross-meeting intelligence engine
   */
  async initialize() {
    try {
      console.log('Initializing Cross-Meeting Intelligence Engine...');
      
      // Initialize all analysis engines
      await this.continuityEngine.initialize();
      await this.patternDetector.initialize();
      await this.decisionTracker.initialize();
      await this.conversationAnalyzer.initialize();
      await this.outcomePredictor.initialize();
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log('✓ Cross-Meeting Intelligence Engine initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Cross-Meeting Intelligence Engine:', error);
      throw error;
    }
  }
  
  /**
   * Generate comprehensive cross-meeting intelligence
   */
  async generateIntelligence(currentMeetingContext, historicalContext, organizationId) {
    const startTime = Date.now();
    
    try {
      console.log(`Generating cross-meeting intelligence for organization ${organizationId}...`);
      
      // Validate inputs
      if (!currentMeetingContext || !organizationId) {
        throw new Error('Current meeting context and organization ID are required');
      }
      
      // Run parallel analysis across all engines
      const [
        continuityInsights,
        detectedPatterns,
        decisionTracking,
        conversationAnalysis,
        outcomesPrediction
      ] = await Promise.all([
        this.continuityEngine.analyzeContinuity(currentMeetingContext, historicalContext),
        this.patternDetector.detectPatterns(currentMeetingContext, historicalContext, organizationId),
        this.decisionTracker.trackDecisionImplementation(currentMeetingContext, historicalContext),
        this.conversationAnalyzer.analyzeConversationFlow(currentMeetingContext, historicalContext),
        this.outcomePredictor.predictOutcomes(currentMeetingContext, historicalContext)
      ]);
      
      // Synthesize all intelligence into actionable insights
      const synthesizedIntelligence = await this.synthesizeIntelligence({
        continuityInsights,
        detectedPatterns,
        decisionTracking,
        conversationAnalysis,
        outcomesPrediction,
        currentContext: currentMeetingContext,
        historicalContext
      });
      
      // Calculate overall confidence and priority
      const intelligence = {
        insights: synthesizedIntelligence,
        confidence: this.calculateOverallConfidence(synthesizedIntelligence),
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        metadata: {
          analysisWindow: this.options.analysisWindow,
          historicalMeetingsAnalyzed: historicalContext?.similarMeetings?.length || 0,
          patternsDetected: detectedPatterns.length,
          continuityScore: continuityInsights.overallScore || 0
        }
      };
      
      // Update metrics
      this.updateMetrics(startTime, synthesizedIntelligence);
      
      // Emit intelligence generated event
      this.emit('intelligenceGenerated', {
        organizationId,
        insightCount: synthesizedIntelligence.length,
        confidence: intelligence.confidence,
        processingTime: intelligence.processingTime
      });
      
      console.log(`✓ Generated ${synthesizedIntelligence.length} cross-meeting insights`);
      
      return intelligence;
      
    } catch (error) {
      console.error('Error generating cross-meeting intelligence:', error);
      
      this.emit('intelligenceError', {
        organizationId,
        error: error.message,
        processingTime: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  /**
   * Synthesize intelligence from all analysis engines
   */
  async synthesizeIntelligence(analysisResults) {
    const insights = [];
    
    // Process continuity insights
    if (analysisResults.continuityInsights && analysisResults.continuityInsights.insights) {
      analysisResults.continuityInsights.insights.forEach(insight => {
        insights.push({
          type: 'continuity',
          category: 'context_continuity',
          title: insight.title,
          description: insight.description,
          details: insight.details,
          confidence: insight.confidence,
          priority: this.calculatePriority(insight),
          actionable: insight.actionable || false,
          suggestedActions: insight.suggestedActions || [],
          source: 'continuity_engine'
        });
      });
    }
    
    // Process detected patterns
    if (analysisResults.detectedPatterns && analysisResults.detectedPatterns.length > 0) {
      analysisResults.detectedPatterns.forEach(pattern => {
        insights.push({
          type: 'pattern',
          category: 'behavioral_pattern',
          title: `${pattern.type} Pattern Detected`,
          description: pattern.description,
          details: {
            frequency: pattern.frequency,
            strength: pattern.strength,
            examples: pattern.examples,
            trend: pattern.trend
          },
          confidence: pattern.confidence,
          priority: this.calculatePriority(pattern),
          actionable: true,
          suggestedActions: pattern.recommendations || [],
          source: 'pattern_detector'
        });
      });
    }
    
    // Process decision tracking
    if (analysisResults.decisionTracking && analysisResults.decisionTracking.insights) {
      analysisResults.decisionTracking.insights.forEach(insight => {
        insights.push({
          type: 'decision_tracking',
          category: 'decision_implementation',
          title: insight.title,
          description: insight.description,
          details: insight.details,
          confidence: insight.confidence,
          priority: 'high', // Decision tracking is always high priority
          actionable: true,
          suggestedActions: insight.suggestedActions || [],
          source: 'decision_tracker'
        });
      });
    }
    
    // Process conversation analysis
    if (analysisResults.conversationAnalysis && analysisResults.conversationAnalysis.insights) {
      analysisResults.conversationAnalysis.insights.forEach(insight => {
        insights.push({
          type: 'conversation_flow',
          category: 'communication_optimization',
          title: insight.title,
          description: insight.description,
          details: insight.details,
          confidence: insight.confidence,
          priority: this.calculatePriority(insight),
          actionable: insight.actionable || false,
          suggestedActions: insight.suggestedActions || [],
          source: 'conversation_analyzer'
        });
      });
    }
    
    // Process outcome predictions
    if (analysisResults.outcomesPrediction && analysisResults.outcomesPrediction.predictions) {
      analysisResults.outcomesPrediction.predictions.forEach(prediction => {
        insights.push({
          type: 'outcome_prediction',
          category: 'predictive_intelligence',
          title: `Predicted: ${prediction.outcome}`,
          description: prediction.description,
          details: {
            probability: prediction.probability,
            timeframe: prediction.timeframe,
            factors: prediction.factors,
            confidence: prediction.confidence
          },
          confidence: prediction.confidence,
          priority: this.calculatePriority(prediction),
          actionable: true,
          suggestedActions: prediction.recommendations || [],
          source: 'outcome_predictor'
        });
      });
    }
    
    // Sort insights by priority and confidence
    insights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.confidence - a.confidence;
    });
    
    // Limit to maximum insights
    return insights.slice(0, this.options.maxInsights);
  }
  
  /**
   * Calculate priority level for an insight
   */
  calculatePriority(insight) {
    const confidence = insight.confidence || 0;
    const impact = insight.impact || insight.strength || 0.5;
    
    const priorityScore = (confidence * 0.6) + (impact * 0.4);
    
    if (priorityScore >= 0.9) return 'critical';
    if (priorityScore >= 0.7) return 'high';
    if (priorityScore >= 0.5) return 'medium';
    return 'low';
  }
  
  /**
   * Calculate overall confidence for intelligence
   */
  calculateOverallConfidence(insights) {
    if (!insights || insights.length === 0) {
      return 0.0;
    }
    
    const totalConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0);
    const avgConfidence = totalConfidence / insights.length;
    
    // Apply bonus for multiple high-confidence insights
    const highConfidenceCount = insights.filter(i => i.confidence >= 0.8).length;
    const confidenceBonus = Math.min(highConfidenceCount * 0.05, 0.15);
    
    return Math.min(1.0, avgConfidence + confidenceBonus);
  }
  
  /**
   * Update performance metrics
   */
  updateMetrics(startTime, insights) {
    const processingTime = Date.now() - startTime;
    
    this.metrics.analysisRequests++;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime + processingTime) / 2;
    
    // Count different types of insights
    insights.forEach(insight => {
      switch (insight.type) {
        case 'pattern':
          this.metrics.patternsDetected++;
          break;
        case 'continuity':
          this.metrics.continuityInsights++;
          break;
      }
    });
  }
  
  /**
   * Get engine metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      initialized: this.initialized,
      engines: {
        continuity: this.continuityEngine.getMetrics(),
        patterns: this.patternDetector.getMetrics(),
        decisions: this.decisionTracker.getMetrics(),
        conversation: this.conversationAnalyzer.getMetrics(),
        outcomes: this.outcomePredictor.getMetrics()
      }
    };
  }
  
  /**
   * Shutdown engine gracefully
   */
  async shutdown() {
    console.log('Shutting down Cross-Meeting Intelligence Engine...');
    
    // Shutdown all engines
    await Promise.all([
      this.continuityEngine.shutdown(),
      this.patternDetector.shutdown(),
      this.decisionTracker.shutdown(),
      this.conversationAnalyzer.shutdown(),
      this.outcomePredictor.shutdown()
    ]);
    
    this.emit('shutdown');
    console.log('✓ Cross-Meeting Intelligence Engine shutdown complete');
  }
}

/**
 * Contextual Continuity Engine
 * Analyzes continuity between meetings and identifies context gaps
 */
class ContextualContinuityEngine {
  constructor(options) {
    this.options = options;
    this.metrics = { analysisCount: 0, insightsGenerated: 0 };
  }
  
  async initialize() {
    console.log('✓ Contextual Continuity Engine initialized');
  }
  
  async analyzeContinuity(currentContext, historicalContext) {
    try {
      const insights = [];
      let overallScore = 0;
      
      // Analyze unresolved items continuity
      if (historicalContext.unresolvedItems && historicalContext.unresolvedItems.length > 0) {
        const unresolvedInsight = this.analyzeUnresolvedItems(
          currentContext, 
          historicalContext.unresolvedItems
        );
        if (unresolvedInsight) {
          insights.push(unresolvedInsight);
        }
      }
      
      // Analyze topic continuity
      if (historicalContext.similarMeetings && historicalContext.similarMeetings.length > 0) {
        const topicInsight = this.analyzeTopicContinuity(
          currentContext,
          historicalContext.similarMeetings
        );
        if (topicInsight) {
          insights.push(topicInsight);
        }
      }
      
      // Analyze participant continuity
      if (historicalContext.participantHistory && historicalContext.participantHistory.length > 0) {
        const participantInsight = this.analyzeParticipantContinuity(
          currentContext,
          historicalContext.participantHistory
        );
        if (participantInsight) {
          insights.push(participantInsight);
        }
      }
      
      // Calculate overall continuity score
      overallScore = this.calculateContinuityScore(insights, currentContext, historicalContext);
      
      this.metrics.analysisCount++;
      this.metrics.insightsGenerated += insights.length;
      
      return {
        insights,
        overallScore,
        continuityStrength: this.categorizeContinuityStrength(overallScore)
      };
      
    } catch (error) {
      console.error('Error in continuity analysis:', error);
      return { insights: [], overallScore: 0, continuityStrength: 'weak' };
    }
  }
  
  analyzeUnresolvedItems(currentContext, unresolvedItems) {
    const relevantItems = unresolvedItems.filter(item => {
      // Check if current meeting participants were involved in the unresolved item
      const currentParticipants = (currentContext.participants || []).map(p => p.id || p.email || p);
      const itemParticipants = [item.assignee, item.owner].filter(Boolean);
      
      return itemParticipants.some(participant => currentParticipants.includes(participant));
    });
    
    if (relevantItems.length === 0) {
      return null;
    }
    
    return {
      title: 'Outstanding Items Require Attention',
      description: `${relevantItems.length} unresolved items from previous meetings need follow-up`,
      details: {
        items: relevantItems.slice(0, 5).map(item => ({
          type: item.type,
          description: item.description,
          meetingTitle: item.meetingTitle,
          daysSince: Math.floor((Date.now() - new Date(item.meetingDate)) / (1000 * 60 * 60 * 24)),
          assignee: item.assignee || item.owner
        })),
        totalCount: relevantItems.length
      },
      confidence: 0.9,
      actionable: true,
      suggestedActions: [
        'Review status of outstanding action items',
        'Update progress on pending decisions',
        'Reassign items if necessary',
        'Set new deadlines for overdue items'
      ]
    };
  }
  
  analyzeTopicContinuity(currentContext, similarMeetings) {
    const currentTopics = new Set((currentContext.topics || []).map(t => t.toLowerCase()));
    
    if (currentTopics.size === 0 || similarMeetings.length === 0) {
      return null;
    }
    
    const topicEvolution = similarMeetings.map(meeting => {
      const meetingTopics = new Set((meeting.topics || []).map(t => t.toLowerCase()));
      const overlap = [...currentTopics].filter(topic => meetingTopics.has(topic));
      
      return {
        meetingTitle: meeting.title,
        meetingDate: meeting.start_time,
        sharedTopics: overlap,
        overlapRatio: overlap.length / Math.max(currentTopics.size, meetingTopics.size),
        keyOutcomes: meeting.key_decisions?.slice(0, 2) || []
      };
    }).filter(evolution => evolution.overlapRatio > 0.3);
    
    if (topicEvolution.length === 0) {
      return null;
    }
    
    return {
      title: 'Topic Continuity Detected',
      description: `Current topics have been discussed in ${topicEvolution.length} recent meetings`,
      details: {
        evolution: topicEvolution.slice(0, 3),
        recurringTopics: this.identifyRecurringTopics(topicEvolution),
        progressIndicators: this.analyzeTopicProgress(topicEvolution)
      },
      confidence: 0.8,
      actionable: false,
      suggestedActions: [
        'Review previous decisions on these topics',
        'Consider if new approaches are needed',
        'Build on previous progress'
      ]
    };
  }
  
  analyzeParticipantContinuity(currentContext, participantHistory) {
    const currentParticipants = new Set((currentContext.participants || []).map(p => p.id || p.email || p));
    
    const participantPatterns = participantHistory.reduce((patterns, interaction) => {
      const participantId = interaction.participant_id;
      
      if (currentParticipants.has(participantId)) {
        if (!patterns[participantId]) {
          patterns[participantId] = {
            name: interaction.participant_name,
            interactions: [],
            avgEngagement: 0,
            avgContribution: 0
          };
        }
        
        patterns[participantId].interactions.push(interaction);
      }
      
      return patterns;
    }, {});
    
    // Calculate averages for each participant
    Object.values(participantPatterns).forEach(pattern => {
      const interactions = pattern.interactions;
      pattern.avgEngagement = interactions.reduce((sum, i) => sum + (i.engagement_level || 0), 0) / interactions.length;
      pattern.avgContribution = interactions.reduce((sum, i) => sum + (i.contribution_quality || 0), 0) / interactions.length;
    });
    
    const notablePatterns = Object.values(participantPatterns).filter(pattern => 
      pattern.interactions.length >= 3 && (pattern.avgEngagement > 0.7 || pattern.avgContribution > 0.7)
    );
    
    if (notablePatterns.length === 0) {
      return null;
    }
    
    return {
      title: 'Participant Engagement Patterns',
      description: `Historical engagement data available for ${notablePatterns.length} participants`,
      details: {
        patterns: notablePatterns.slice(0, 3).map(pattern => ({
          name: pattern.name,
          meetingCount: pattern.interactions.length,
          avgEngagement: Math.round(pattern.avgEngagement * 100),
          avgContribution: Math.round(pattern.avgContribution * 100),
          trend: this.calculateEngagementTrend(pattern.interactions)
        }))
      },
      confidence: 0.7,
      actionable: false,
      suggestedActions: [
        'Leverage high-engagement participants for key discussions',
        'Consider strategies to increase overall engagement'
      ]
    };
  }
  
  identifyRecurringTopics(topicEvolution) {
    const topicCounts = {};
    
    topicEvolution.forEach(evolution => {
      evolution.sharedTopics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    
    return Object.entries(topicCounts)
      .filter(([topic, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, frequency: count }));
  }
  
  analyzeTopicProgress(topicEvolution) {
    // Simple progress analysis based on decision count
    return topicEvolution.map(evolution => ({
      meetingTitle: evolution.meetingTitle,
      decisionsCount: evolution.keyOutcomes.length,
      progressIndicator: evolution.keyOutcomes.length > 0 ? 'decisions_made' : 'discussion_only'
    }));
  }
  
  calculateEngagementTrend(interactions) {
    if (interactions.length < 2) return 'stable';
    
    const recent = interactions.slice(-3);
    const older = interactions.slice(0, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, i) => sum + (i.engagement_level || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, i) => sum + (i.engagement_level || 0), 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }
  
  calculateContinuityScore(insights, currentContext, historicalContext) {
    let score = 0.5; // Base score
    
    // Boost score based on available historical context
    if (historicalContext.similarMeetings && historicalContext.similarMeetings.length > 0) {
      score += 0.2;
    }
    
    if (historicalContext.unresolvedItems && historicalContext.unresolvedItems.length > 0) {
      score += 0.1;
    }
    
    if (historicalContext.participantHistory && historicalContext.participantHistory.length > 0) {
      score += 0.1;
    }
    
    // Adjust based on insight quality
    const highConfidenceInsights = insights.filter(i => i.confidence >= 0.8).length;
    score += highConfidenceInsights * 0.05;
    
    return Math.min(1.0, score);
  }
  
  categorizeContinuityStrength(score) {
    if (score >= 0.8) return 'strong';
    if (score >= 0.6) return 'moderate';
    if (score >= 0.4) return 'weak';
    return 'minimal';
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  async shutdown() {
    console.log('✓ Contextual Continuity Engine shutdown');
  }
}

/**
 * Pattern Detection Engine
 * Identifies recurring patterns in meeting behavior and outcomes
 */
class PatternDetectionEngine {
  constructor(options) {
    this.options = options;
    this.metrics = { patternsDetected: 0, analysisCount: 0 };
  }
  
  async initialize() {
    console.log('✓ Pattern Detection Engine initialized');
  }
  
  async detectPatterns(currentContext, historicalContext, organizationId) {
    try {
      const patterns = [];
      
      // Detect meeting timing patterns
      const timingPatterns = this.detectTimingPatterns(historicalContext);
      patterns.push(...timingPatterns);
      
      // Detect participant engagement patterns
      const engagementPatterns = this.detectEngagementPatterns(historicalContext);
      patterns.push(...engagementPatterns);
      
      // Detect decision-making patterns
      const decisionPatterns = this.detectDecisionPatterns(historicalContext);
      patterns.push(...decisionPatterns);
      
      // Filter patterns by confidence threshold
      const significantPatterns = patterns.filter(pattern => 
        pattern.confidence >= this.options.patternDetectionThreshold
      );
      
      this.metrics.analysisCount++;
      this.metrics.patternsDetected += significantPatterns.length;
      
      return significantPatterns;
      
    } catch (error) {
      console.error('Error in pattern detection:', error);
      return [];
    }
  }
  
  detectTimingPatterns(historicalContext) {
    // Implementation for timing pattern detection
    return [];
  }
  
  detectEngagementPatterns(historicalContext) {
    // Implementation for engagement pattern detection
    return [];
  }
  
  detectDecisionPatterns(historicalContext) {
    // Implementation for decision pattern detection
    return [];
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  async shutdown() {
    console.log('✓ Pattern Detection Engine shutdown');
  }
}

/**
 * Decision Implementation Tracker
 * Tracks the implementation status of decisions across meetings
 */
class DecisionImplementationTracker {
  constructor(options) {
    this.options = options;
    this.metrics = { decisionsTracked: 0, implementationRate: 0 };
  }
  
  async initialize() {
    console.log('✓ Decision Implementation Tracker initialized');
  }
  
  async trackDecisionImplementation(currentContext, historicalContext) {
    try {
      const insights = [];
      
      // Track implementation of previous decisions
      if (historicalContext.unresolvedItems) {
        const decisionItems = historicalContext.unresolvedItems.filter(item => item.type === 'decision');
        
        if (decisionItems.length > 0) {
          insights.push({
            title: 'Decision Implementation Status',
            description: `${decisionItems.length} previous decisions need implementation follow-up`,
            details: {
              pendingDecisions: decisionItems.slice(0, 5).map(decision => ({
                description: decision.description,
                meetingTitle: decision.meetingTitle,
                daysSince: Math.floor((Date.now() - new Date(decision.meetingDate)) / (1000 * 60 * 60 * 24)),
                owner: decision.owner
              }))
            },
            confidence: 0.9,
            suggestedActions: [
              'Review implementation status of pending decisions',
              'Update decision owners on progress',
              'Identify blockers preventing implementation'
            ]
          });
        }
      }
      
      return { insights };
      
    } catch (error) {
      console.error('Error in decision tracking:', error);
      return { insights: [] };
    }
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  async shutdown() {
    console.log('✓ Decision Implementation Tracker shutdown');
  }
}

/**
 * Conversation Flow Analyzer
 * Analyzes conversation patterns and flow across meetings
 */
class ConversationFlowAnalyzer {
  constructor(options) {
    this.options = options;
    this.metrics = { conversationsAnalyzed: 0, flowInsights: 0 };
  }
  
  async initialize() {
    console.log('✓ Conversation Flow Analyzer initialized');
  }
  
  async analyzeConversationFlow(currentContext, historicalContext) {
    try {
      const insights = [];
      
      // Analyze conversation flow patterns
      // Implementation would go here
      
      return { insights };
      
    } catch (error) {
      console.error('Error in conversation flow analysis:', error);
      return { insights: [] };
    }
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  async shutdown() {
    console.log('✓ Conversation Flow Analyzer shutdown');
  }
}

/**
 * Outcome Prediction Engine
 * Predicts meeting outcomes based on historical patterns
 */
class OutcomePredictionEngine {
  constructor(options) {
    this.options = options;
    this.metrics = { predictionsGenerated: 0, accuracyRate: 0 };
  }
  
  async initialize() {
    console.log('✓ Outcome Prediction Engine initialized');
  }
  
  async predictOutcomes(currentContext, historicalContext) {
    try {
      const predictions = [];
      
      // Generate outcome predictions based on historical data
      if (historicalContext.similarMeetings && historicalContext.similarMeetings.length > 0) {
        const outcomeAnalysis = this.analyzeHistoricalOutcomes(historicalContext.similarMeetings);
        
        if (outcomeAnalysis.confidence > 0.6) {
          predictions.push({
            outcome: outcomeAnalysis.mostLikelyOutcome,
            description: outcomeAnalysis.description,
            probability: outcomeAnalysis.probability,
            timeframe: outcomeAnalysis.timeframe,
            factors: outcomeAnalysis.factors,
            confidence: outcomeAnalysis.confidence,
            recommendations: outcomeAnalysis.recommendations
          });
        }
      }
      
      this.metrics.predictionsGenerated += predictions.length;
      
      return { predictions };
      
    } catch (error) {
      console.error('Error in outcome prediction:', error);
      return { predictions: [] };
    }
  }
  
  analyzeHistoricalOutcomes(similarMeetings) {
    // Simple outcome analysis based on historical patterns
    const outcomes = similarMeetings.map(meeting => ({
      decisionsCount: (meeting.key_decisions || []).length,
      actionItemsCount: (meeting.action_items || []).length,
      effectivenessScore: meeting.effectiveness_score || 0.5
    }));
    
    const avgDecisions = outcomes.reduce((sum, o) => sum + o.decisionsCount, 0) / outcomes.length;
    const avgActionItems = outcomes.reduce((sum, o) => sum + o.actionItemsCount, 0) / outcomes.length;
    const avgEffectiveness = outcomes.reduce((sum, o) => sum + o.effectivenessScore, 0) / outcomes.length;
    
    return {
      mostLikelyOutcome: avgDecisions > 1 ? 'Decisions will be made' : 'Discussion-focused meeting',
      description: `Based on ${outcomes.length} similar meetings`,
      probability: Math.min(0.9, avgEffectiveness + 0.2),
      timeframe: 'End of meeting',
      factors: [
        `Average ${Math.round(avgDecisions)} decisions per meeting`,
        `Average ${Math.round(avgActionItems)} action items per meeting`,
        `${Math.round(avgEffectiveness * 100)}% average effectiveness`
      ],
      confidence: Math.min(0.8, outcomes.length * 0.1),
      recommendations: [
        'Prepare decision-making framework',
        'Assign action item owners clearly',
        'Set specific deadlines for outcomes'
      ]
    };
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  async shutdown() {
    console.log('✓ Outcome Prediction Engine shutdown');
  }
}

module.exports = CrossMeetingIntelligenceEngine;
