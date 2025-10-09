/**
 * AI Coaching Engine
 * 
 * Advanced coaching system that provides real-time meeting optimization,
 * personalized performance improvement, and strategic decision guidance.
 * Leverages triple-AI collaboration for superior coaching intelligence.
 */

const { TripleAIClient } = require('../ai/triple-ai-client');
const { MeetingMemoryService } = require('./meeting-memory-service');
const { OpportunityDetectionEngine } = require('./opportunity-detection-engine');

class AICoachingEngine {
  constructor() {
    this.tripleAI = new TripleAIClient();
    this.memoryService = new MeetingMemoryService();
    this.opportunityEngine = new OpportunityDetectionEngine();
    
    // Coaching modules
    this.realTimeCoach = new RealTimePerformanceCoach(this.tripleAI);
    this.personalCoach = new PersonalizedImprovementCoach(this.tripleAI, this.memoryService);
    this.teamCoach = new TeamDynamicsCoach(this.tripleAI);
    this.decisionCoach = new StrategicDecisionCoach(this.tripleAI);
    
    // Coaching context and state management
    this.activeCoachingSessions = new Map();
    this.coachingHistory = new Map();
    this.performanceProfiles = new Map();
    
    // Coaching effectiveness tracking
    this.coachingMetrics = {
      suggestionsOffered: 0,
      suggestionsAccepted: 0,
      improvementMeasured: 0,
      userSatisfaction: []
    };
  }

  /**
   * Initialize coaching session for a meeting
   */
  async initializeCoachingSession(meetingId, participants, meetingContext) {
    try {
      const session = {
        meetingId,
        participants,
        context: meetingContext,
        startTime: new Date(),
        coachingInterventions: [],
        performanceMetrics: {},
        activeCoaching: {
          realTime: true,
          personal: true,
          team: true,
          decision: true
        }
      };

      // Load participant performance profiles
      for (const participant of participants) {
        const profile = await this.loadPerformanceProfile(participant.id);
        session.performanceMetrics[participant.id] = profile;
      }

      // Initialize coaching context with historical data
      const historicalContext = await this.memoryService.getRelevantHistory(
        meetingId, 
        participants.map(p => p.id),
        meetingContext
      );

      session.historicalContext = historicalContext;
      this.activeCoachingSessions.set(meetingId, session);

      console.log(`Coaching session initialized for meeting ${meetingId} with ${participants.length} participants`);
      return session;

    } catch (error) {
      console.error('Error initializing coaching session:', error);
      throw error;
    }
  }

  /**
   * Process real-time meeting data and provide coaching recommendations
   */
  async processRealTimeCoaching(meetingId, realTimeData) {
    try {
      const session = this.activeCoachingSessions.get(meetingId);
      if (!session) {
        throw new Error(`No active coaching session found for meeting ${meetingId}`);
      }

      const coachingRecommendations = [];

      // Real-time performance coaching
      if (session.activeCoaching.realTime) {
        const realTimeCoaching = await this.realTimeCoach.analyzeAndCoach(
          realTimeData,
          session.context,
          session.performanceMetrics
        );
        coachingRecommendations.push(...realTimeCoaching);
      }

      // Team dynamics coaching
      if (session.activeCoaching.team) {
        const teamCoaching = await this.teamCoach.analyzeGroupDynamics(
          realTimeData.participantBehavior,
          session.participants,
          session.historicalContext
        );
        coachingRecommendations.push(...teamCoaching);
      }

      // Decision coaching (triggered by decision points)
      if (session.activeCoaching.decision && realTimeData.decisionPoints?.length > 0) {
        const decisionCoaching = await this.decisionCoach.analyzeDecisionOpportunities(
          realTimeData.decisionPoints,
          session.context,
          session.historicalContext
        );
        coachingRecommendations.push(...decisionCoaching);
      }

      // Prioritize and filter recommendations
      const prioritizedRecommendations = await this.prioritizeCoachingRecommendations(
        coachingRecommendations,
        session,
        realTimeData
      );

      // Track coaching interventions
      session.coachingInterventions.push({
        timestamp: new Date(),
        recommendations: prioritizedRecommendations,
        context: realTimeData.context,
        accepted: false // Will be updated when user responds
      });

      // Update coaching metrics
      this.coachingMetrics.suggestionsOffered += prioritizedRecommendations.length;

      return prioritizedRecommendations;

    } catch (error) {
      console.error('Error processing real-time coaching:', error);
      return [];
    }
  }

  /**
   * Generate personalized coaching recommendations
   */
  async generatePersonalizedCoaching(userId, meetingId, performanceData) {
    try {
      const userProfile = await this.loadPerformanceProfile(userId);
      const session = this.activeCoachingSessions.get(meetingId);

      const personalizedCoaching = await this.personalCoach.generatePersonalizedRecommendations(
        userId,
        userProfile,
        performanceData,
        session?.historicalContext
      );

      // Update user performance profile
      await this.updatePerformanceProfile(userId, performanceData, personalizedCoaching);

      return personalizedCoaching;

    } catch (error) {
      console.error('Error generating personalized coaching:', error);
      return [];
    }
  }

  /**
   * Prioritize coaching recommendations based on impact and urgency
   */
  async prioritizeCoachingRecommendations(recommendations, session, realTimeData) {
    try {
      // Use triple-AI collaboration for intelligent prioritization
      const prioritizationPrompt = `
        Analyze and prioritize these coaching recommendations based on:
        1. Immediate impact on meeting effectiveness
        2. Urgency of intervention needed
        3. User acceptance likelihood
        4. Implementation feasibility
        
        Recommendations: ${JSON.stringify(recommendations)}
        Meeting Context: ${JSON.stringify(session.context)}
        Current Situation: ${JSON.stringify(realTimeData.context)}
        
        Return top 3 recommendations with priority scores and reasoning.
      `;

      const prioritization = await this.tripleAI.processWithCollaboration(
        prioritizationPrompt,
        {
          gpt5: { role: 'reasoning', weight: 0.4 },
          claude: { role: 'accuracy', weight: 0.3 },
          gemini: { role: 'speed', weight: 0.3 }
        }
      );

      // Parse and structure prioritized recommendations
      const prioritizedRecommendations = recommendations
        .map(rec => ({
          ...rec,
          priority: this.calculatePriorityScore(rec, session, realTimeData),
          aiReasoning: prioritization.reasoning
        }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3); // Top 3 recommendations

      return prioritizedRecommendations;

    } catch (error) {
      console.error('Error prioritizing coaching recommendations:', error);
      return recommendations.slice(0, 3); // Fallback to first 3
    }
  }

  /**
   * Calculate priority score for coaching recommendation
   */
  calculatePriorityScore(recommendation, session, realTimeData) {
    let score = 0;

    // Impact factor (0-40 points)
    const impactWeights = { high: 40, medium: 25, low: 10 };
    score += impactWeights[recommendation.impact] || 10;

    // Urgency factor (0-30 points)
    const urgencyWeights = { immediate: 30, soon: 20, later: 5 };
    score += urgencyWeights[recommendation.urgency] || 5;

    // User acceptance likelihood (0-20 points)
    const userProfile = session.performanceMetrics[recommendation.targetUserId];
    if (userProfile?.coachingReceptivity) {
      score += userProfile.coachingReceptivity * 20;
    } else {
      score += 10; // Default moderate receptivity
    }

    // Implementation feasibility (0-10 points)
    const feasibilityWeights = { easy: 10, medium: 6, hard: 2 };
    score += feasibilityWeights[recommendation.feasibility] || 6;

    return score;
  }

  /**
   * Handle coaching feedback and update effectiveness metrics
   */
  async handleCoachingFeedback(meetingId, recommendationId, feedback) {
    try {
      const session = this.activeCoachingSessions.get(meetingId);
      if (!session) return;

      // Find and update the recommendation
      const intervention = session.coachingInterventions.find(
        i => i.recommendations.some(r => r.id === recommendationId)
      );

      if (intervention) {
        const recommendation = intervention.recommendations.find(r => r.id === recommendationId);
        if (recommendation) {
          recommendation.feedback = feedback;
          recommendation.accepted = feedback.accepted;
          
          // Update coaching metrics
          if (feedback.accepted) {
            this.coachingMetrics.suggestionsAccepted++;
          }
          
          if (feedback.satisfaction) {
            this.coachingMetrics.userSatisfaction.push(feedback.satisfaction);
          }
        }
      }

      // Learn from feedback for future coaching improvement
      await this.updateCoachingEffectiveness(recommendationId, feedback);

    } catch (error) {
      console.error('Error handling coaching feedback:', error);
    }
  }

  /**
   * Complete coaching session and generate summary
   */
  async completeCoachingSession(meetingId) {
    try {
      const session = this.activeCoachingSessions.get(meetingId);
      if (!session) return null;

      // Generate coaching session summary
      const summary = {
        meetingId,
        duration: new Date() - session.startTime,
        totalInterventions: session.coachingInterventions.length,
        acceptedRecommendations: session.coachingInterventions
          .flatMap(i => i.recommendations)
          .filter(r => r.accepted).length,
        participantProgress: {},
        keyInsights: [],
        improvementOpportunities: []
      };

      // Analyze participant progress during session
      for (const participant of session.participants) {
        const progress = await this.analyzeParticipantProgress(
          participant.id,
          session.coachingInterventions,
          session.performanceMetrics[participant.id]
        );
        summary.participantProgress[participant.id] = progress;
      }

      // Generate key insights using triple-AI collaboration
      const insightsPrompt = `
        Analyze this coaching session and provide key insights:
        
        Session Data: ${JSON.stringify(session, null, 2)}
        Summary: ${JSON.stringify(summary, null, 2)}
        
        Provide:
        1. Top 3 key insights about meeting effectiveness
        2. Most impactful coaching interventions
        3. Opportunities for future improvement
        4. Participant development recommendations
      `;

      const insights = await this.tripleAI.processWithCollaboration(
        insightsPrompt,
        {
          gpt5: { role: 'insight_generation', weight: 0.5 },
          claude: { role: 'accuracy_validation', weight: 0.3 },
          gemini: { role: 'synthesis', weight: 0.2 }
        }
      );

      summary.keyInsights = insights.keyInsights || [];
      summary.improvementOpportunities = insights.improvementOpportunities || [];

      // Store coaching session history
      this.coachingHistory.set(meetingId, {
        ...session,
        summary,
        completedAt: new Date()
      });

      // Clean up active session
      this.activeCoachingSessions.delete(meetingId);

      console.log(`Coaching session completed for meeting ${meetingId}`);
      return summary;

    } catch (error) {
      console.error('Error completing coaching session:', error);
      return null;
    }
  }

  /**
   * Load user performance profile
   */
  async loadPerformanceProfile(userId) {
    try {
      // Check cache first
      if (this.performanceProfiles.has(userId)) {
        return this.performanceProfiles.get(userId);
      }

      // Load from database (placeholder - would integrate with actual DB)
      const profile = {
        userId,
        meetingsAttended: 0,
        averageEngagement: 0.7,
        communicationStyle: 'balanced',
        strengths: [],
        improvementAreas: [],
        coachingReceptivity: 0.8,
        progressTracking: {
          engagement: [],
          communication: [],
          decisionMaking: [],
          leadership: []
        },
        lastUpdated: new Date()
      };

      this.performanceProfiles.set(userId, profile);
      return profile;

    } catch (error) {
      console.error('Error loading performance profile:', error);
      return null;
    }
  }

  /**
   * Update user performance profile with new data
   */
  async updatePerformanceProfile(userId, performanceData, coachingRecommendations) {
    try {
      const profile = await this.loadPerformanceProfile(userId);
      if (!profile) return;

      // Update performance metrics
      profile.meetingsAttended++;
      
      if (performanceData.engagement) {
        profile.progressTracking.engagement.push({
          date: new Date(),
          score: performanceData.engagement,
          context: performanceData.context
        });
        
        // Update rolling average
        const recentEngagement = profile.progressTracking.engagement.slice(-10);
        profile.averageEngagement = recentEngagement.reduce((sum, e) => sum + e.score, 0) / recentEngagement.length;
      }

      // Update strengths and improvement areas based on coaching
      if (coachingRecommendations?.length > 0) {
        const newImprovementAreas = coachingRecommendations
          .filter(r => r.category === 'improvement')
          .map(r => r.area);
        
        profile.improvementAreas = [...new Set([...profile.improvementAreas, ...newImprovementAreas])];
      }

      profile.lastUpdated = new Date();
      this.performanceProfiles.set(userId, profile);

    } catch (error) {
      console.error('Error updating performance profile:', error);
    }
  }

  /**
   * Analyze participant progress during coaching session
   */
  async analyzeParticipantProgress(userId, interventions, initialProfile) {
    try {
      const userInterventions = interventions
        .flatMap(i => i.recommendations)
        .filter(r => r.targetUserId === userId);

      const progress = {
        totalRecommendations: userInterventions.length,
        acceptedRecommendations: userInterventions.filter(r => r.accepted).length,
        improvementAreas: [...new Set(userInterventions.map(r => r.category))],
        progressScore: 0,
        keyAchievements: [],
        nextSteps: []
      };

      // Calculate progress score
      if (progress.totalRecommendations > 0) {
        progress.progressScore = (progress.acceptedRecommendations / progress.totalRecommendations) * 100;
      }

      // Identify key achievements
      const acceptedRecommendations = userInterventions.filter(r => r.accepted);
      progress.keyAchievements = acceptedRecommendations.map(r => ({
        area: r.category,
        achievement: r.title,
        impact: r.impact
      }));

      return progress;

    } catch (error) {
      console.error('Error analyzing participant progress:', error);
      return null;
    }
  }

  /**
   * Update coaching effectiveness based on feedback
   */
  async updateCoachingEffectiveness(recommendationId, feedback) {
    try {
      // This would integrate with a machine learning system to improve coaching algorithms
      // For now, we'll track effectiveness metrics
      
      const effectiveness = {
        recommendationId,
        feedback,
        timestamp: new Date(),
        effectiveness: feedback.accepted ? (feedback.satisfaction || 0.7) : 0.2
      };

      // Store effectiveness data for future algorithm improvement
      console.log('Coaching effectiveness recorded:', effectiveness);

    } catch (error) {
      console.error('Error updating coaching effectiveness:', error);
    }
  }

  /**
   * Get coaching analytics and metrics
   */
  getCoachingAnalytics() {
    const avgSatisfaction = this.coachingMetrics.userSatisfaction.length > 0
      ? this.coachingMetrics.userSatisfaction.reduce((sum, s) => sum + s, 0) / this.coachingMetrics.userSatisfaction.length
      : 0;

    const acceptanceRate = this.coachingMetrics.suggestionsOffered > 0
      ? (this.coachingMetrics.suggestionsAccepted / this.coachingMetrics.suggestionsOffered) * 100
      : 0;

    return {
      totalSuggestions: this.coachingMetrics.suggestionsOffered,
      acceptedSuggestions: this.coachingMetrics.suggestionsAccepted,
      acceptanceRate: acceptanceRate.toFixed(1),
      averageSatisfaction: avgSatisfaction.toFixed(2),
      activeSessions: this.activeCoachingSessions.size,
      totalUsers: this.performanceProfiles.size
    };
  }
}

/**
 * Real-Time Performance Coach
 * Provides immediate coaching during meetings
 */
class RealTimePerformanceCoach {
  constructor(tripleAI) {
    this.tripleAI = tripleAI;
  }

  async analyzeAndCoach(realTimeData, meetingContext, performanceMetrics) {
    try {
      const coachingRecommendations = [];

      // Analyze speaking patterns
      if (realTimeData.speakingPatterns) {
        const speakingCoaching = await this.analyzeSpeakingPatterns(
          realTimeData.speakingPatterns,
          performanceMetrics
        );
        coachingRecommendations.push(...speakingCoaching);
      }

      // Analyze engagement levels
      if (realTimeData.engagementLevels) {
        const engagementCoaching = await this.analyzeEngagementLevels(
          realTimeData.engagementLevels,
          performanceMetrics
        );
        coachingRecommendations.push(...engagementCoaching);
      }

      // Analyze meeting flow and agenda adherence
      if (realTimeData.agendaAdherence) {
        const flowCoaching = await this.analyzeMeetingFlow(
          realTimeData.agendaAdherence,
          meetingContext
        );
        coachingRecommendations.push(...flowCoaching);
      }

      return coachingRecommendations;

    } catch (error) {
      console.error('Error in real-time performance coaching:', error);
      return [];
    }
  }

  async analyzeSpeakingPatterns(speakingPatterns, performanceMetrics) {
    const recommendations = [];

    for (const [userId, pattern] of Object.entries(speakingPatterns)) {
      const userProfile = performanceMetrics[userId];
      
      // Check for speaking time imbalances
      if (pattern.speakingTimePercentage > 40) {
        recommendations.push({
          id: `speaking-${userId}-${Date.now()}`,
          type: 'real_time_coaching',
          category: 'communication',
          targetUserId: userId,
          title: 'Consider Facilitating Others',
          message: 'You\'ve been speaking for a significant portion of the meeting. Consider asking others for their input.',
          impact: 'medium',
          urgency: 'soon',
          feasibility: 'easy',
          actionable: true,
          suggestions: [
            'Ask "What do others think about this?"',
            'Pause and invite specific people to share',
            'Summarize and ask for feedback'
          ]
        });
      } else if (pattern.speakingTimePercentage < 5 && userProfile?.role !== 'observer') {
        recommendations.push({
          id: `engagement-${userId}-${Date.now()}`,
          type: 'real_time_coaching',
          category: 'engagement',
          targetUserId: userId,
          title: 'Increase Participation',
          message: 'You haven\'t contributed much to the discussion. Your insights would be valuable.',
          impact: 'medium',
          urgency: 'soon',
          feasibility: 'easy',
          actionable: true,
          suggestions: [
            'Share your perspective on the current topic',
            'Ask a clarifying question',
            'Build on someone else\'s idea'
          ]
        });
      }
    }

    return recommendations;
  }

  async analyzeEngagementLevels(engagementLevels, performanceMetrics) {
    const recommendations = [];
    const avgEngagement = Object.values(engagementLevels).reduce((sum, e) => sum + e, 0) / Object.keys(engagementLevels).length;

    if (avgEngagement < 0.6) {
      recommendations.push({
        id: `group-engagement-${Date.now()}`,
        type: 'real_time_coaching',
        category: 'facilitation',
        targetUserId: 'facilitator',
        title: 'Boost Group Engagement',
        message: 'Overall engagement is low. Consider changing the meeting dynamic.',
        impact: 'high',
        urgency: 'immediate',
        feasibility: 'medium',
        actionable: true,
        suggestions: [
          'Ask an engaging question to the group',
          'Take a brief break or change format',
          'Use interactive techniques like polling',
          'Address the energy level directly'
        ]
      });
    }

    return recommendations;
  }

  async analyzeMeetingFlow(agendaAdherence, meetingContext) {
    const recommendations = [];

    if (agendaAdherence.timeOverrun > 0.2) {
      recommendations.push({
        id: `time-management-${Date.now()}`,
        type: 'real_time_coaching',
        category: 'time_management',
        targetUserId: 'facilitator',
        title: 'Meeting Running Over Time',
        message: `Meeting is ${Math.round(agendaAdherence.timeOverrun * 100)}% over allocated time for current topic.`,
        impact: 'high',
        urgency: 'immediate',
        feasibility: 'easy',
        actionable: true,
        suggestions: [
          'Summarize current discussion and move to next topic',
          'Park detailed discussions for follow-up',
          'Ask group to prioritize remaining agenda items',
          'Schedule follow-up meeting if needed'
        ]
      });
    }

    return recommendations;
  }
}

/**
 * Personalized Improvement Coach
 * Provides long-term coaching based on individual performance patterns
 */
class PersonalizedImprovementCoach {
  constructor(tripleAI, memoryService) {
    this.tripleAI = tripleAI;
    this.memoryService = memoryService;
  }

  async generatePersonalizedRecommendations(userId, userProfile, performanceData, historicalContext) {
    try {
      const recommendations = [];

      // Analyze performance trends
      const trends = this.analyzePerformanceTrends(userProfile, performanceData);
      
      // Generate coaching based on trends
      if (trends.engagementTrend === 'declining') {
        recommendations.push({
          id: `personal-engagement-${userId}-${Date.now()}`,
          type: 'personalized_coaching',
          category: 'engagement',
          targetUserId: userId,
          title: 'Engagement Improvement Plan',
          message: 'Your engagement has been declining over recent meetings. Let\'s work on re-energizing your participation.',
          impact: 'high',
          urgency: 'later',
          feasibility: 'medium',
          actionable: true,
          personalizedPlan: {
            goal: 'Increase meeting engagement by 25% over next 4 meetings',
            strategies: [
              'Prepare 2-3 questions before each meeting',
              'Set a goal to contribute within first 10 minutes',
              'Practice active listening techniques',
              'Identify topics where your expertise adds value'
            ],
            milestones: [
              { week: 1, target: 'Ask at least 1 question per meeting' },
              { week: 2, target: 'Contribute to 75% of discussion topics' },
              { week: 3, target: 'Lead discussion on 1 agenda item' },
              { week: 4, target: 'Achieve 80%+ engagement score' }
            ]
          }
        });
      }

      // Communication style coaching
      if (userProfile.communicationStyle === 'passive' && performanceData.leadership_opportunities > 0) {
        recommendations.push({
          id: `leadership-development-${userId}-${Date.now()}`,
          type: 'personalized_coaching',
          category: 'leadership',
          targetUserId: userId,
          title: 'Leadership Development Opportunity',
          message: 'You have opportunities to take more leadership in meetings. Your expertise is valuable.',
          impact: 'medium',
          urgency: 'later',
          feasibility: 'medium',
          actionable: true,
          personalizedPlan: {
            goal: 'Develop meeting leadership skills',
            strategies: [
              'Volunteer to lead agenda items in your expertise area',
              'Practice summarizing discussions and next steps',
              'Ask strategic questions that guide conversation',
              'Offer to facilitate smaller team discussions'
            ]
          }
        });
      }

      return recommendations;

    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return [];
    }
  }

  analyzePerformanceTrends(userProfile, performanceData) {
    const trends = {};

    // Analyze engagement trend
    if (userProfile.progressTracking.engagement.length >= 3) {
      const recent = userProfile.progressTracking.engagement.slice(-3);
      const older = userProfile.progressTracking.engagement.slice(-6, -3);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, e) => sum + e.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, e) => sum + e.score, 0) / older.length;
        
        if (recentAvg < olderAvg - 0.1) {
          trends.engagementTrend = 'declining';
        } else if (recentAvg > olderAvg + 0.1) {
          trends.engagementTrend = 'improving';
        } else {
          trends.engagementTrend = 'stable';
        }
      }
    }

    return trends;
  }
}

/**
 * Team Dynamics Coach
 * Analyzes and coaches team interactions and collaboration
 */
class TeamDynamicsCoach {
  constructor(tripleAI) {
    this.tripleAI = tripleAI;
  }

  async analyzeGroupDynamics(participantBehavior, participants, historicalContext) {
    try {
      const recommendations = [];

      // Analyze participation balance
      const participationAnalysis = this.analyzeParticipationBalance(participantBehavior, participants);
      if (participationAnalysis.imbalanced) {
        recommendations.push(...participationAnalysis.recommendations);
      }

      // Analyze collaboration patterns
      const collaborationAnalysis = this.analyzeCollaborationPatterns(participantBehavior);
      if (collaborationAnalysis.issues.length > 0) {
        recommendations.push(...collaborationAnalysis.recommendations);
      }

      // Analyze conflict or tension indicators
      const conflictAnalysis = this.analyzeConflictIndicators(participantBehavior);
      if (conflictAnalysis.conflictDetected) {
        recommendations.push(...conflictAnalysis.recommendations);
      }

      return recommendations;

    } catch (error) {
      console.error('Error analyzing group dynamics:', error);
      return [];
    }
  }

  analyzeParticipationBalance(participantBehavior, participants) {
    const speakingTimes = Object.values(participantBehavior).map(p => p.speakingTime || 0);
    const avgSpeakingTime = speakingTimes.reduce((sum, t) => sum + t, 0) / speakingTimes.length;
    const maxSpeakingTime = Math.max(...speakingTimes);
    const minSpeakingTime = Math.min(...speakingTimes);

    const imbalanced = (maxSpeakingTime / avgSpeakingTime > 2) || (minSpeakingTime / avgSpeakingTime < 0.3);

    const recommendations = [];
    if (imbalanced) {
      recommendations.push({
        id: `participation-balance-${Date.now()}`,
        type: 'team_dynamics_coaching',
        category: 'facilitation',
        targetUserId: 'facilitator',
        title: 'Address Participation Imbalance',
        message: 'There\'s a significant imbalance in participation. Some voices are dominating while others are silent.',
        impact: 'high',
        urgency: 'soon',
        feasibility: 'medium',
        actionable: true,
        suggestions: [
          'Use round-robin technique for input',
          'Directly invite quiet participants to share',
          'Set speaking time limits for dominant participants',
          'Break into smaller groups for discussion'
        ]
      });
    }

    return { imbalanced, recommendations };
  }

  analyzeCollaborationPatterns(participantBehavior) {
    const issues = [];
    const recommendations = [];

    // Check for interruption patterns
    const totalInterruptions = Object.values(participantBehavior)
      .reduce((sum, p) => sum + (p.interruptions || 0), 0);

    if (totalInterruptions > participants.length * 2) {
      issues.push('excessive_interruptions');
      recommendations.push({
        id: `interruption-management-${Date.now()}`,
        type: 'team_dynamics_coaching',
        category: 'communication',
        targetUserId: 'facilitator',
        title: 'Manage Interruptions',
        message: 'There are excessive interruptions disrupting the flow of discussion.',
        impact: 'medium',
        urgency: 'soon',
        feasibility: 'easy',
        actionable: true,
        suggestions: [
          'Establish ground rules about letting people finish',
          'Use a talking stick or similar technique',
          'Acknowledge interruptions and redirect',
          'Address pattern with specific individuals if needed'
        ]
      });
    }

    return { issues, recommendations };
  }

  analyzeConflictIndicators(participantBehavior) {
    let conflictDetected = false;
    const recommendations = [];

    // Simple conflict detection based on behavioral indicators
    const negativeIndicators = Object.values(participantBehavior)
      .reduce((sum, p) => sum + (p.negativeLanguage || 0) + (p.disagreements || 0), 0);

    if (negativeIndicators > 5) {
      conflictDetected = true;
      recommendations.push({
        id: `conflict-resolution-${Date.now()}`,
        type: 'team_dynamics_coaching',
        category: 'conflict_resolution',
        targetUserId: 'facilitator',
        title: 'Address Emerging Conflict',
        message: 'There are signs of tension or conflict in the group. Consider intervention.',
        impact: 'high',
        urgency: 'immediate',
        feasibility: 'hard',
        actionable: true,
        suggestions: [
          'Acknowledge different perspectives explicitly',
          'Focus on common goals and shared interests',
          'Use structured problem-solving approach',
          'Consider taking a break to reset dynamics',
          'Address issues privately with individuals if needed'
        ]
      });
    }

    return { conflictDetected, recommendations };
  }
}

/**
 * Strategic Decision Coach
 * Provides coaching for decision-making processes and outcomes
 */
class StrategicDecisionCoach {
  constructor(tripleAI) {
    this.tripleAI = tripleAI;
  }

  async analyzeDecisionOpportunities(decisionPoints, meetingContext, historicalContext) {
    try {
      const recommendations = [];

      for (const decisionPoint of decisionPoints) {
        // Analyze decision quality
        const qualityAnalysis = await this.analyzeDecisionQuality(decisionPoint, historicalContext);
        if (qualityAnalysis.needsImprovement) {
          recommendations.push(...qualityAnalysis.recommendations);
        }

        // Analyze implementation planning
        const implementationAnalysis = this.analyzeImplementationPlanning(decisionPoint);
        if (implementationAnalysis.gaps.length > 0) {
          recommendations.push(...implementationAnalysis.recommendations);
        }

        // Analyze stakeholder alignment
        const alignmentAnalysis = this.analyzeStakeholderAlignment(decisionPoint, meetingContext);
        if (!alignmentAnalysis.aligned) {
          recommendations.push(...alignmentAnalysis.recommendations);
        }
      }

      return recommendations;

    } catch (error) {
      console.error('Error analyzing decision opportunities:', error);
      return [];
    }
  }

  async analyzeDecisionQuality(decisionPoint, historicalContext) {
    const needsImprovement = !decisionPoint.hasAlternatives || !decisionPoint.hasRiskAssessment;
    const recommendations = [];

    if (needsImprovement) {
      recommendations.push({
        id: `decision-quality-${decisionPoint.id}-${Date.now()}`,
        type: 'strategic_decision_coaching',
        category: 'decision_making',
        targetUserId: 'facilitator',
        title: 'Improve Decision Quality',
        message: 'This decision could benefit from more thorough analysis before finalizing.',
        impact: 'high',
        urgency: 'immediate',
        feasibility: 'medium',
        actionable: true,
        suggestions: [
          'Identify and evaluate alternative options',
          'Conduct risk assessment for each option',
          'Consider long-term implications',
          'Gather input from relevant stakeholders',
          'Define success criteria and metrics'
        ],
        decisionContext: {
          decisionId: decisionPoint.id,
          currentStatus: decisionPoint.status,
          missingElements: [
            !decisionPoint.hasAlternatives && 'alternatives',
            !decisionPoint.hasRiskAssessment && 'risk_assessment'
          ].filter(Boolean)
        }
      });
    }

    return { needsImprovement, recommendations };
  }

  analyzeImplementationPlanning(decisionPoint) {
    const gaps = [];
    const recommendations = [];

    if (!decisionPoint.hasOwner) gaps.push('owner');
    if (!decisionPoint.hasTimeline) gaps.push('timeline');
    if (!decisionPoint.hasActionItems) gaps.push('action_items');
    if (!decisionPoint.hasSuccessMetrics) gaps.push('success_metrics');

    if (gaps.length > 0) {
      recommendations.push({
        id: `implementation-planning-${decisionPoint.id}-${Date.now()}`,
        type: 'strategic_decision_coaching',
        category: 'implementation',
        targetUserId: 'facilitator',
        title: 'Complete Implementation Planning',
        message: `This decision needs clearer implementation planning. Missing: ${gaps.join(', ')}.`,
        impact: 'high',
        urgency: 'immediate',
        feasibility: 'easy',
        actionable: true,
        suggestions: [
          'Assign clear decision owner and accountability',
          'Set specific timeline with milestones',
          'Define concrete action items and responsibilities',
          'Establish success metrics and review process',
          'Identify potential obstacles and mitigation strategies'
        ],
        implementationGaps: gaps
      });
    }

    return { gaps, recommendations };
  }

  analyzeStakeholderAlignment(decisionPoint, meetingContext) {
    // Simple alignment analysis based on participation in decision
    const participantsInvolved = decisionPoint.participantsInvolved || [];
    const totalParticipants = meetingContext.participants?.length || 0;
    const alignmentPercentage = participantsInvolved.length / totalParticipants;

    const aligned = alignmentPercentage > 0.7;
    const recommendations = [];

    if (!aligned) {
      recommendations.push({
        id: `stakeholder-alignment-${decisionPoint.id}-${Date.now()}`,
        type: 'strategic_decision_coaching',
        category: 'stakeholder_management',
        targetUserId: 'facilitator',
        title: 'Ensure Stakeholder Alignment',
        message: 'Not all stakeholders seem aligned on this decision. Consider building consensus.',
        impact: 'high',
        urgency: 'soon',
        feasibility: 'medium',
        actionable: true,
        suggestions: [
          'Explicitly ask for input from all stakeholders',
          'Address concerns and objections directly',
          'Seek explicit agreement or commitment',
          'Identify and resolve underlying disagreements',
          'Consider if decision needs broader consultation'
        ],
        alignmentData: {
          participantsInvolved: participantsInvolved.length,
          totalParticipants,
          alignmentPercentage: Math.round(alignmentPercentage * 100)
        }
      });
    }

    return { aligned, recommendations };
  }
}

module.exports = {
  AICoachingEngine,
  RealTimePerformanceCoach,
  PersonalizedImprovementCoach,
  TeamDynamicsCoach,
  StrategicDecisionCoach
};
