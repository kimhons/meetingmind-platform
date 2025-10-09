/**
 * Post-Meeting Analysis Engine
 * 
 * Comprehensive analysis of meeting effectiveness, opportunity identification,
 * and performance scoring with actionable insights and recommendations.
 */

const ClarificationDetector = require('../algorithms/clarification-detector');
const EngagementDetector = require('../algorithms/engagement-detector');
const DecisionPointDetector = require('../algorithms/decision-point-detector');

class PostMeetingAnalysisEngine {
  constructor(supabase, options = {}) {
    this.supabase = supabase;
    this.options = {
      analysisDepth: 'comprehensive', // 'basic', 'standard', 'comprehensive'
      includeAIInsights: true,
      generateRecommendations: true,
      calculateROI: true,
      performanceBenchmarking: true,
      ...options
    };
    
    // Initialize detectors for post-meeting analysis
    this.clarificationDetector = new ClarificationDetector(supabase, {
      confidenceThreshold: 0.5, // Lower threshold for post-meeting analysis
      contextWindow: 300 // Larger context window
    });
    
    this.engagementDetector = new EngagementDetector(supabase, {
      confidenceThreshold: 0.5,
      contextWindow: 300
    });
    
    this.decisionPointDetector = new DecisionPointDetector(supabase, {
      confidenceThreshold: 0.5,
      contextWindow: 300
    });
    
    // Analysis metrics
    this.analysisMetrics = {
      meetingsAnalyzed: 0,
      totalOpportunitiesIdentified: 0,
      averageEffectivenessScore: 0,
      averageEngagementScore: 0,
      averageDecisionQuality: 0,
      totalTimeSaved: 0,
      totalROI: 0
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the post-meeting analysis engine
   */
  async initialize() {
    try {
      console.log('Initializing Post-Meeting Analysis Engine...');
      
      // Initialize all detectors
      await this.clarificationDetector.initialize();
      await this.engagementDetector.initialize();
      await this.decisionPointDetector.initialize();
      
      // Load historical analysis data
      await this.loadHistoricalAnalysisData();
      
      // Initialize AI analysis capabilities
      await this.initializeAIAnalysis();
      
      this.initialized = true;
      console.log('✓ Post-Meeting Analysis Engine initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Post-Meeting Analysis Engine:', error);
      throw error;
    }
  }
  
  /**
   * Perform comprehensive post-meeting analysis
   */
  async analyzeMeeting(meetingData, context = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Post-Meeting Analysis Engine not initialized');
      }
      
      console.log(`Starting comprehensive analysis for meeting: ${meetingData.id}`);
      
      const analysisStart = Date.now();
      
      // 1. Basic meeting metrics
      const basicMetrics = await this.calculateBasicMetrics(meetingData);
      
      // 2. Opportunity analysis using all detectors
      const opportunityAnalysis = await this.performOpportunityAnalysis(meetingData, context);
      
      // 3. Engagement analysis
      const engagementAnalysis = await this.performEngagementAnalysis(meetingData, context);
      
      // 4. Decision quality analysis
      const decisionAnalysis = await this.performDecisionAnalysis(meetingData, context);
      
      // 5. Communication effectiveness analysis
      const communicationAnalysis = await this.performCommunicationAnalysis(meetingData, context);
      
      // 6. Time utilization analysis
      const timeAnalysis = await this.performTimeUtilizationAnalysis(meetingData, context);
      
      // 7. AI-powered insights
      const aiInsights = this.options.includeAIInsights ? 
        await this.generateAIInsights(meetingData, {
          basicMetrics,
          opportunityAnalysis,
          engagementAnalysis,
          decisionAnalysis,
          communicationAnalysis,
          timeAnalysis
        }) : null;
      
      // 8. Performance scoring
      const performanceScores = await this.calculatePerformanceScores({
        basicMetrics,
        opportunityAnalysis,
        engagementAnalysis,
        decisionAnalysis,
        communicationAnalysis,
        timeAnalysis
      });
      
      // 9. Recommendations generation
      const recommendations = this.options.generateRecommendations ?
        await this.generateRecommendations({
          opportunityAnalysis,
          engagementAnalysis,
          decisionAnalysis,
          communicationAnalysis,
          timeAnalysis,
          performanceScores
        }) : [];
      
      // 10. ROI calculation
      const roiAnalysis = this.options.calculateROI ?
        await this.calculateROI(meetingData, performanceScores, timeAnalysis) : null;
      
      // 11. Benchmarking
      const benchmarking = this.options.performanceBenchmarking ?
        await this.performBenchmarking(performanceScores, meetingData) : null;
      
      const analysisTime = Date.now() - analysisStart;
      
      // Compile comprehensive analysis report
      const analysisReport = {
        meetingId: meetingData.id,
        analysisTimestamp: Date.now(),
        analysisTime,
        analysisDepth: this.options.analysisDepth,
        
        // Core analysis components
        basicMetrics,
        opportunityAnalysis,
        engagementAnalysis,
        decisionAnalysis,
        communicationAnalysis,
        timeAnalysis,
        
        // Advanced insights
        aiInsights,
        performanceScores,
        recommendations,
        roiAnalysis,
        benchmarking,
        
        // Summary
        summary: await this.generateExecutiveSummary({
          performanceScores,
          opportunityAnalysis,
          recommendations,
          roiAnalysis
        })
      };
      
      // Store analysis results
      await this.storeAnalysisResults(analysisReport);
      
      // Update metrics
      this.updateAnalysisMetrics(analysisReport);
      
      console.log(`✓ Meeting analysis completed in ${analysisTime}ms`);
      
      return analysisReport;
      
    } catch (error) {
      console.error('Error in post-meeting analysis:', error);
      throw error;
    }
  }
  
  /**
   * Calculate basic meeting metrics
   */
  async calculateBasicMetrics(meetingData) {
    try {
      const duration = meetingData.endTime - meetingData.startTime;
      const participantCount = meetingData.participants ? meetingData.participants.length : 0;
      const transcript = meetingData.transcript || '';
      
      // Word and speaking analysis
      const wordCount = transcript.split(/\s+/).length;
      const speakingRate = duration > 0 ? (wordCount / (duration / 60000)) : 0; // words per minute
      
      // Interaction analysis
      const questionCount = (transcript.match(/\?/g) || []).length;
      const interactionRate = duration > 0 ? (questionCount / (duration / 60000)) : 0;
      
      // Agenda adherence (if agenda provided)
      const agendaAdherence = meetingData.agenda ? 
        await this.calculateAgendaAdherence(transcript, meetingData.agenda) : null;
      
      return {
        duration,
        participantCount,
        wordCount,
        speakingRate,
        questionCount,
        interactionRate,
        agendaAdherence,
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        meetingType: meetingData.type || 'general',
        hasRecording: !!meetingData.recording,
        hasTranscript: !!transcript
      };
      
    } catch (error) {
      console.error('Error calculating basic metrics:', error);
      return {};
    }
  }
  
  /**
   * Perform comprehensive opportunity analysis
   */
  async performOpportunityAnalysis(meetingData, context) {
    try {
      const transcript = meetingData.transcript || '';
      const segments = this.segmentTranscript(transcript);
      
      let allOpportunities = [];
      
      // Run all detectors on each segment
      for (const segment of segments) {
        const segmentContext = { ...context, meetingId: meetingData.id };
        
        // Clarification opportunities
        const clarificationOpps = await this.clarificationDetector.detectOpportunities(segment, segmentContext);
        allOpportunities.push(...clarificationOpps);
        
        // Engagement opportunities
        const engagementOpps = await this.engagementDetector.detectOpportunities(segment, segmentContext);
        allOpportunities.push(...engagementOpps);
        
        // Decision opportunities
        const decisionOpps = await this.decisionPointDetector.detectOpportunities(segment, segmentContext);
        allOpportunities.push(...decisionOpps);
      }
      
      // Categorize and analyze opportunities
      const opportunityCategories = this.categorizeOpportunities(allOpportunities);
      const opportunityImpact = await this.assessOpportunityImpact(allOpportunities, meetingData);
      const missedOpportunities = this.identifyMissedOpportunities(allOpportunities);
      
      return {
        totalOpportunities: allOpportunities.length,
        opportunities: allOpportunities,
        categories: opportunityCategories,
        impact: opportunityImpact,
        missedOpportunities,
        opportunityDensity: allOpportunities.length / (meetingData.duration / 60000), // opportunities per minute
        highImpactOpportunities: allOpportunities.filter(opp => opp.confidence > 0.8).length,
        realTimeActionableOpportunities: allOpportunities.filter(opp => opp.realTimeActionable).length
      };
      
    } catch (error) {
      console.error('Error in opportunity analysis:', error);
      return { totalOpportunities: 0, opportunities: [] };
    }
  }
  
  /**
   * Perform engagement analysis
   */
  async performEngagementAnalysis(meetingData, context) {
    try {
      const participants = meetingData.participants || [];
      const transcript = meetingData.transcript || '';
      
      // Overall engagement metrics
      const overallEngagement = this.engagementDetector.calculateOverallEngagement();
      
      // Individual participant analysis
      const participantAnalysis = await this.analyzeIndividualParticipants(participants, transcript);
      
      // Engagement trends over time
      const engagementTrends = await this.analyzeEngagementTrends(meetingData);
      
      // Participation balance
      const participationBalance = this.analyzeParticipationBalance(participantAnalysis);
      
      return {
        overallEngagement,
        participantAnalysis,
        engagementTrends,
        participationBalance,
        silentParticipants: participantAnalysis.filter(p => p.speakingRatio < 0.1).length,
        dominantParticipants: participantAnalysis.filter(p => p.speakingRatio > 0.4).length,
        averageSpeakingTime: participantAnalysis.reduce((sum, p) => sum + p.speakingTime, 0) / participantAnalysis.length,
        interactionQuality: this.calculateInteractionQuality(participantAnalysis)
      };
      
    } catch (error) {
      console.error('Error in engagement analysis:', error);
      return { overallEngagement: 0.5 };
    }
  }
  
  /**
   * Perform decision analysis
   */
  async performDecisionAnalysis(meetingData, context) {
    try {
      const transcript = meetingData.transcript || '';
      
      // Extract decisions made
      const decisionsMade = await this.extractDecisionsMade(transcript);
      
      // Analyze decision quality
      const decisionQuality = await this.analyzeDecisionQuality(decisionsMade, transcript);
      
      // Implementation clarity
      const implementationClarity = await this.analyzeImplementationClarity(decisionsMade);
      
      // Decision-making process effectiveness
      const processEffectiveness = await this.analyzeDecisionProcess(transcript);
      
      return {
        decisionsMade,
        decisionCount: decisionsMade.length,
        decisionQuality,
        implementationClarity,
        processEffectiveness,
        averageDecisionTime: this.calculateAverageDecisionTime(decisionsMade),
        unclearDecisions: decisionsMade.filter(d => d.clarity < 0.7).length,
        implementationGaps: decisionsMade.filter(d => !d.hasImplementationPlan).length
      };
      
    } catch (error) {
      console.error('Error in decision analysis:', error);
      return { decisionCount: 0, decisionsMade: [] };
    }
  }
  
  /**
   * Perform communication effectiveness analysis
   */
  async performCommunicationAnalysis(meetingData, context) {
    try {
      const transcript = meetingData.transcript || '';
      
      // Clarity analysis
      const clarityScore = await this.analyzeCommunicationClarity(transcript);
      
      // Information flow analysis
      const informationFlow = await this.analyzeInformationFlow(transcript);
      
      // Question-answer effectiveness
      const qaEffectiveness = await this.analyzeQuestionAnswerEffectiveness(transcript);
      
      // Topic coherence
      const topicCoherence = await this.analyzeTopicCoherence(transcript);
      
      return {
        clarityScore,
        informationFlow,
        qaEffectiveness,
        topicCoherence,
        communicationGaps: this.identifyCommunicationGaps(transcript),
        jargonUsage: this.analyzeJargonUsage(transcript),
        conversationFlow: this.analyzeConversationFlow(transcript)
      };
      
    } catch (error) {
      console.error('Error in communication analysis:', error);
      return { clarityScore: 0.5 };
    }
  }
  
  /**
   * Perform time utilization analysis
   */
  async performTimeUtilizationAnalysis(meetingData, context) {
    try {
      const duration = meetingData.endTime - meetingData.startTime;
      const transcript = meetingData.transcript || '';
      
      // Productive time analysis
      const productiveTime = await this.calculateProductiveTime(transcript, duration);
      
      // Time allocation by topic
      const topicTimeAllocation = await this.analyzeTopicTimeAllocation(transcript, duration);
      
      // Efficiency metrics
      const efficiencyMetrics = await this.calculateEfficiencyMetrics(meetingData);
      
      // Time waste identification
      const timeWaste = await this.identifyTimeWaste(transcript, duration);
      
      return {
        totalDuration: duration,
        productiveTime,
        productivityRatio: productiveTime / duration,
        topicTimeAllocation,
        efficiencyMetrics,
        timeWaste,
        averageTopicTime: topicTimeAllocation.length > 0 ? 
          topicTimeAllocation.reduce((sum, t) => sum + t.duration, 0) / topicTimeAllocation.length : 0,
        timeUtilizationScore: this.calculateTimeUtilizationScore(productiveTime, duration, timeWaste)
      };
      
    } catch (error) {
      console.error('Error in time utilization analysis:', error);
      return { totalDuration: 0, productivityRatio: 0.5 };
    }
  }
  
  /**
   * Generate AI-powered insights
   */
  async generateAIInsights(meetingData, analysisComponents) {
    try {
      // This would integrate with the Triple-AI system for advanced insights
      // For now, providing structured insights based on analysis
      
      const insights = {
        keyFindings: [],
        patterns: [],
        recommendations: [],
        predictions: []
      };
      
      // Analyze patterns across components
      const { opportunityAnalysis, engagementAnalysis, decisionAnalysis } = analysisComponents;
      
      // Key findings
      if (opportunityAnalysis.totalOpportunities > 10) {
        insights.keyFindings.push({
          type: 'high_opportunity_density',
          description: `High opportunity density detected (${opportunityAnalysis.totalOpportunities} opportunities)`,
          impact: 'high',
          actionable: true
        });
      }
      
      if (engagementAnalysis.overallEngagement < 0.6) {
        insights.keyFindings.push({
          type: 'low_engagement',
          description: `Below-average engagement levels (${Math.round(engagementAnalysis.overallEngagement * 100)}%)`,
          impact: 'medium',
          actionable: true
        });
      }
      
      if (decisionAnalysis.unclearDecisions > 0) {
        insights.keyFindings.push({
          type: 'unclear_decisions',
          description: `${decisionAnalysis.unclearDecisions} decisions lack clarity or implementation plans`,
          impact: 'high',
          actionable: true
        });
      }
      
      // Pattern identification
      insights.patterns = await this.identifyMeetingPatterns(analysisComponents);
      
      // AI-generated recommendations
      insights.recommendations = await this.generateAIRecommendations(analysisComponents);
      
      // Predictive insights
      insights.predictions = await this.generatePredictiveInsights(meetingData, analysisComponents);
      
      return insights;
      
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return { keyFindings: [], patterns: [], recommendations: [], predictions: [] };
    }
  }
  
  /**
   * Calculate comprehensive performance scores
   */
  async calculatePerformanceScores(analysisComponents) {
    try {
      const {
        opportunityAnalysis,
        engagementAnalysis,
        decisionAnalysis,
        communicationAnalysis,
        timeAnalysis
      } = analysisComponents;
      
      // Individual component scores (0-100)
      const opportunityScore = Math.max(0, 100 - (opportunityAnalysis.totalOpportunities * 2)); // Fewer opportunities = higher score
      const engagementScore = engagementAnalysis.overallEngagement * 100;
      const decisionScore = this.calculateDecisionScore(decisionAnalysis);
      const communicationScore = communicationAnalysis.clarityScore * 100;
      const timeUtilizationScore = timeAnalysis.timeUtilizationScore * 100;
      
      // Weighted overall effectiveness score
      const weights = {
        opportunity: 0.15,
        engagement: 0.25,
        decision: 0.25,
        communication: 0.20,
        timeUtilization: 0.15
      };
      
      const overallEffectiveness = 
        (opportunityScore * weights.opportunity) +
        (engagementScore * weights.engagement) +
        (decisionScore * weights.decision) +
        (communicationScore * weights.communication) +
        (timeUtilizationScore * weights.timeUtilization);
      
      return {
        overallEffectiveness: Math.round(overallEffectiveness),
        componentScores: {
          opportunity: Math.round(opportunityScore),
          engagement: Math.round(engagementScore),
          decision: Math.round(decisionScore),
          communication: Math.round(communicationScore),
          timeUtilization: Math.round(timeUtilizationScore)
        },
        grade: this.calculateGrade(overallEffectiveness),
        strengths: this.identifyStrengths(analysisComponents),
        improvementAreas: this.identifyImprovementAreas(analysisComponents)
      };
      
    } catch (error) {
      console.error('Error calculating performance scores:', error);
      return { overallEffectiveness: 50, componentScores: {} };
    }
  }
  
  /**
   * Generate actionable recommendations
   */
  async generateRecommendations(analysisComponents) {
    try {
      const recommendations = [];
      
      const {
        opportunityAnalysis,
        engagementAnalysis,
        decisionAnalysis,
        communicationAnalysis,
        timeAnalysis,
        performanceScores
      } = analysisComponents;
      
      // High-priority recommendations based on analysis
      if (opportunityAnalysis.totalOpportunities > 15) {
        recommendations.push({
          priority: 'high',
          category: 'opportunity_management',
          title: 'Implement Real-Time Opportunity Alerts',
          description: 'High number of missed opportunities detected. Enable real-time alerts to catch opportunities as they arise.',
          impact: 'high',
          effort: 'low',
          timeframe: 'immediate',
          specificActions: [
            'Enable MeetingMind real-time suggestions',
            'Train facilitators on opportunity recognition',
            'Implement structured discussion formats'
          ]
        });
      }
      
      if (engagementAnalysis.silentParticipants > 2) {
        recommendations.push({
          priority: 'high',
          category: 'engagement',
          title: 'Improve Participant Engagement',
          description: `${engagementAnalysis.silentParticipants} participants had minimal participation. Implement strategies to increase engagement.`,
          impact: 'high',
          effort: 'medium',
          timeframe: 'next_meeting',
          specificActions: [
            'Use round-robin discussion formats',
            'Directly invite input from quiet participants',
            'Break into smaller discussion groups',
            'Prepare engagement questions in advance'
          ]
        });
      }
      
      if (decisionAnalysis.unclearDecisions > 0) {
        recommendations.push({
          priority: 'high',
          category: 'decision_making',
          title: 'Improve Decision Clarity and Implementation',
          description: `${decisionAnalysis.unclearDecisions} decisions need clearer outcomes and implementation plans.`,
          impact: 'high',
          effort: 'medium',
          timeframe: 'immediate',
          specificActions: [
            'Document decisions clearly with owners and deadlines',
            'Use structured decision-making frameworks',
            'Confirm understanding before moving on',
            'Create action item tracking system'
          ]
        });
      }
      
      if (timeAnalysis.productivityRatio < 0.7) {
        recommendations.push({
          priority: 'medium',
          category: 'time_management',
          title: 'Improve Time Utilization',
          description: `Only ${Math.round(timeAnalysis.productivityRatio * 100)}% of meeting time was productive. Focus on efficiency improvements.`,
          impact: 'medium',
          effort: 'medium',
          timeframe: 'next_meeting',
          specificActions: [
            'Create and stick to detailed agendas',
            'Set time limits for discussion topics',
            'Minimize off-topic discussions',
            'Use parking lot for unrelated items'
          ]
        });
      }
      
      // Sort by priority and impact
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const impactOrder = { high: 3, medium: 2, low: 1 };
        
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        
        return impactOrder[b.impact] - impactOrder[a.impact];
      });
      
      return recommendations;
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }
  
  /**
   * Calculate ROI analysis
   */
  async calculateROI(meetingData, performanceScores, timeAnalysis) {
    try {
      const participantCount = meetingData.participants ? meetingData.participants.length : 0;
      const duration = meetingData.endTime - meetingData.startTime;
      const durationHours = duration / (1000 * 60 * 60);
      
      // Estimated costs (these would be configurable)
      const averageHourlyRate = 75; // $75/hour average
      const meetingCost = participantCount * durationHours * averageHourlyRate;
      
      // Potential savings from improvements
      const efficiencyGain = Math.max(0, (performanceScores.overallEffectiveness - 70) / 100);
      const timeSavings = timeAnalysis.timeWaste ? timeAnalysis.timeWaste.totalWastedTime : 0;
      const timeSavingsHours = timeSavings / (1000 * 60 * 60);
      
      const potentialSavings = {
        timeSavings: timeSavingsHours * participantCount * averageHourlyRate,
        efficiencyGains: meetingCost * efficiencyGain * 0.1, // 10% of efficiency gain
        decisionQuality: performanceScores.componentScores.decision > 80 ? meetingCost * 0.05 : 0,
        engagementValue: performanceScores.componentScores.engagement > 80 ? meetingCost * 0.03 : 0
      };
      
      const totalPotentialSavings = Object.values(potentialSavings).reduce((sum, saving) => sum + saving, 0);
      const roi = meetingCost > 0 ? (totalPotentialSavings / meetingCost) * 100 : 0;
      
      return {
        meetingCost,
        potentialSavings,
        totalPotentialSavings,
        roi,
        paybackPeriod: totalPotentialSavings > 0 ? meetingCost / totalPotentialSavings : null,
        costPerParticipant: participantCount > 0 ? meetingCost / participantCount : 0,
        valueCreated: totalPotentialSavings > meetingCost,
        recommendations: this.generateROIRecommendations(roi, potentialSavings)
      };
      
    } catch (error) {
      console.error('Error calculating ROI:', error);
      return { meetingCost: 0, roi: 0 };
    }
  }
  
  /**
   * Helper methods
   */
  segmentTranscript(transcript) {
    // Split transcript into analyzable segments
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const segments = [];
    
    // Group sentences into segments of ~5 sentences each
    for (let i = 0; i < sentences.length; i += 5) {
      const segmentText = sentences.slice(i, i + 5).join('. ');
      if (segmentText.trim().length > 0) {
        segments.push({
          text: segmentText,
          timestamp: Date.now() + (i * 1000), // Rough timestamp
          startIndex: i,
          endIndex: Math.min(i + 5, sentences.length)
        });
      }
    }
    
    return segments;
  }
  
  categorizeOpportunities(opportunities) {
    const categories = {
      clarification: opportunities.filter(opp => opp.type === 'CLARIFICATION_NEEDED'),
      engagement: opportunities.filter(opp => opp.type === 'ENGAGEMENT_DROP'),
      decision: opportunities.filter(opp => opp.type === 'DECISION_POINT'),
      other: opportunities.filter(opp => !['CLARIFICATION_NEEDED', 'ENGAGEMENT_DROP', 'DECISION_POINT'].includes(opp.type))
    };
    
    return {
      clarification: {
        count: categories.clarification.length,
        opportunities: categories.clarification
      },
      engagement: {
        count: categories.engagement.length,
        opportunities: categories.engagement
      },
      decision: {
        count: categories.decision.length,
        opportunities: categories.decision
      },
      other: {
        count: categories.other.length,
        opportunities: categories.other
      }
    };
  }
  
  async assessOpportunityImpact(opportunities, meetingData) {
    const impactLevels = { high: 0, medium: 0, low: 0 };
    
    opportunities.forEach(opp => {
      if (opp.confidence > 0.8) {
        impactLevels.high++;
      } else if (opp.confidence > 0.6) {
        impactLevels.medium++;
      } else {
        impactLevels.low++;
      }
    });
    
    return {
      distribution: impactLevels,
      totalImpactScore: (impactLevels.high * 3) + (impactLevels.medium * 2) + (impactLevels.low * 1),
      averageConfidence: opportunities.length > 0 ? 
        opportunities.reduce((sum, opp) => sum + opp.confidence, 0) / opportunities.length : 0
    };
  }
  
  identifyMissedOpportunities(opportunities) {
    return opportunities.filter(opp => 
      !opp.realTimeActionable || 
      opp.subtype.includes('missed') || 
      opp.confidence > 0.8
    );
  }
  
  calculateDecisionScore(decisionAnalysis) {
    if (decisionAnalysis.decisionCount === 0) {
      return 70; // Neutral score if no decisions needed
    }
    
    const clarityScore = decisionAnalysis.decisionQuality * 40;
    const implementationScore = decisionAnalysis.implementationClarity * 30;
    const processScore = decisionAnalysis.processEffectiveness * 30;
    
    return clarityScore + implementationScore + processScore;
  }
  
  calculateGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
  
  identifyStrengths(analysisComponents) {
    const strengths = [];
    
    if (analysisComponents.engagementAnalysis.overallEngagement > 0.8) {
      strengths.push('High participant engagement');
    }
    
    if (analysisComponents.decisionAnalysis.decisionQuality > 0.8) {
      strengths.push('Effective decision-making');
    }
    
    if (analysisComponents.communicationAnalysis.clarityScore > 0.8) {
      strengths.push('Clear communication');
    }
    
    if (analysisComponents.timeAnalysis.productivityRatio > 0.8) {
      strengths.push('Efficient time utilization');
    }
    
    return strengths;
  }
  
  identifyImprovementAreas(analysisComponents) {
    const areas = [];
    
    if (analysisComponents.opportunityAnalysis.totalOpportunities > 10) {
      areas.push('Opportunity recognition and action');
    }
    
    if (analysisComponents.engagementAnalysis.overallEngagement < 0.6) {
      areas.push('Participant engagement');
    }
    
    if (analysisComponents.decisionAnalysis.unclearDecisions > 0) {
      areas.push('Decision clarity and implementation');
    }
    
    if (analysisComponents.timeAnalysis.productivityRatio < 0.7) {
      areas.push('Time management and efficiency');
    }
    
    return areas;
  }
  
  generateROIRecommendations(roi, potentialSavings) {
    const recommendations = [];
    
    if (roi < 10) {
      recommendations.push('Focus on basic meeting efficiency improvements');
    } else if (roi < 25) {
      recommendations.push('Implement structured facilitation techniques');
    } else {
      recommendations.push('Meeting shows good ROI potential - maintain current practices');
    }
    
    if (potentialSavings.timeSavings > 100) {
      recommendations.push('Significant time savings possible through better agenda management');
    }
    
    return recommendations;
  }
  
  async generateExecutiveSummary(components) {
    const { performanceScores, opportunityAnalysis, recommendations, roiAnalysis } = components;
    
    return {
      overallGrade: performanceScores.grade,
      effectivenessScore: performanceScores.overallEffectiveness,
      keyMetrics: {
        opportunitiesIdentified: opportunityAnalysis.totalOpportunities,
        highPriorityRecommendations: recommendations.filter(r => r.priority === 'high').length,
        estimatedROI: roiAnalysis ? Math.round(roiAnalysis.roi) : 0
      },
      topRecommendation: recommendations.length > 0 ? recommendations[0] : null,
      nextSteps: recommendations.slice(0, 3).map(r => r.title)
    };
  }
  
  async storeAnalysisResults(analysisReport) {
    try {
      // Store in database for historical tracking and benchmarking
      const { data, error } = await this.supabase
        .from('meeting_analysis_results')
        .insert({
          meeting_id: analysisReport.meetingId,
          analysis_data: analysisReport,
          effectiveness_score: analysisReport.performanceScores.overallEffectiveness,
          opportunity_count: analysisReport.opportunityAnalysis.totalOpportunities,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error storing analysis results:', error);
      }
      
    } catch (error) {
      console.error('Error storing analysis results:', error);
    }
  }
  
  updateAnalysisMetrics(analysisReport) {
    this.analysisMetrics.meetingsAnalyzed++;
    this.analysisMetrics.totalOpportunitiesIdentified += analysisReport.opportunityAnalysis.totalOpportunities;
    
    // Update running averages
    const newEffectiveness = analysisReport.performanceScores.overallEffectiveness;
    this.analysisMetrics.averageEffectivenessScore = 
      (this.analysisMetrics.averageEffectivenessScore + newEffectiveness) / 2;
    
    if (analysisReport.roiAnalysis) {
      this.analysisMetrics.totalROI += analysisReport.roiAnalysis.totalPotentialSavings;
    }
  }
  
  // Placeholder methods for complex analysis functions
  async calculateAgendaAdherence(transcript, agenda) { return 0.8; }
  async analyzeIndividualParticipants(participants, transcript) { return []; }
  async analyzeEngagementTrends(meetingData) { return []; }
  analyzeParticipationBalance(participantAnalysis) { return { balanced: true }; }
  calculateInteractionQuality(participantAnalysis) { return 0.7; }
  async extractDecisionsMade(transcript) { return []; }
  async analyzeDecisionQuality(decisions, transcript) { return 0.7; }
  async analyzeImplementationClarity(decisions) { return 0.7; }
  async analyzeDecisionProcess(transcript) { return 0.7; }
  calculateAverageDecisionTime(decisions) { return 300; }
  async analyzeCommunicationClarity(transcript) { return 0.7; }
  async analyzeInformationFlow(transcript) { return { score: 0.7 }; }
  async analyzeQuestionAnswerEffectiveness(transcript) { return 0.7; }
  async analyzeTopicCoherence(transcript) { return 0.7; }
  identifyCommunicationGaps(transcript) { return []; }
  analyzeJargonUsage(transcript) { return { density: 0.1 }; }
  analyzeConversationFlow(transcript) { return { score: 0.7 }; }
  async calculateProductiveTime(transcript, duration) { return duration * 0.8; }
  async analyzeTopicTimeAllocation(transcript, duration) { return []; }
  async calculateEfficiencyMetrics(meetingData) { return { score: 0.7 }; }
  async identifyTimeWaste(transcript, duration) { return { totalWastedTime: duration * 0.1 }; }
  calculateTimeUtilizationScore(productiveTime, duration, timeWaste) { return productiveTime / duration; }
  async identifyMeetingPatterns(components) { return []; }
  async generateAIRecommendations(components) { return []; }
  async generatePredictiveInsights(meetingData, components) { return []; }
  async loadHistoricalAnalysisData() { console.log('Loading historical analysis data...'); }
  async initializeAIAnalysis() { console.log('Initializing AI analysis capabilities...'); }
  
  /**
   * Get analysis metrics
   */
  getMetrics() {
    return {
      ...this.analysisMetrics,
      initialized: this.initialized
    };
  }
  
  /**
   * Shutdown analysis engine gracefully
   */
  async shutdown() {
    console.log('Shutting down Post-Meeting Analysis Engine...');
    
    await this.clarificationDetector.shutdown();
    await this.engagementDetector.shutdown();
    await this.decisionPointDetector.shutdown();
    
    this.initialized = false;
    
    console.log('✓ Post-Meeting Analysis Engine shutdown complete');
  }
}

module.exports = PostMeetingAnalysisEngine;
