/**
 * Engagement Detector Algorithm
 * 
 * Monitors participant engagement levels and identifies opportunities
 * to improve participation, address engagement drops, and leverage silent expertise.
 */

class EngagementDetector {
  constructor(supabase, options = {}) {
    this.supabase = supabase;
    this.options = {
      confidenceThreshold: 0.6,
      engagementDropThreshold: 0.3, // 30% drop in engagement
      silentParticipantThreshold: 0.2, // Less than 20% speaking time
      dominantParticipantThreshold: 0.6, // More than 60% speaking time
      contextWindow: 60, // seconds
      ...options
    };
    
    // Engagement indicators
    this.engagementSignals = {
      positive: [
        { pattern: /(?:great|excellent|interesting|good)\s+(?:point|idea|question)/i, weight: 0.8 },
        { pattern: /(?:i agree|exactly|that's right|absolutely)/i, weight: 0.6 },
        { pattern: /(?:what if|how about|could we|should we)/i, weight: 0.7 },
        { pattern: /(?:building on|adding to|following up)/i, weight: 0.8 },
        { pattern: /(?:question|clarification|thought|suggestion)/i, weight: 0.5 }
      ],
      negative: [
        { pattern: /(?:um|uh|er)\s*$/i, weight: 0.4 },
        { pattern: /(?:i don't know|not sure|maybe|perhaps)/i, weight: 0.3 },
        { pattern: /(?:anyway|moving on|next topic)/i, weight: 0.5 },
        { pattern: /(?:sorry|excuse me)\s*$/i, weight: 0.3 }
      ],
      disengagement: [
        { pattern: /(?:can we|let's)\s+(?:move on|wrap up|finish)/i, weight: 0.7 },
        { pattern: /(?:running out of time|need to end|getting late)/i, weight: 0.8 },
        { pattern: /(?:off topic|side track|different subject)/i, weight: 0.6 }
      ]
    };
    
    // Participation metrics tracking
    this.participationMetrics = new Map();
    this.engagementHistory = new Map();
    
    // Metrics tracking
    this.metrics = {
      detectionsRun: 0,
      engagementDropsDetected: 0,
      silentParticipantsIdentified: 0,
      dominantParticipantsDetected: 0,
      averageEngagementScore: 0
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the engagement detector
   */
  async initialize() {
    try {
      console.log('Initializing Engagement Detector...');
      
      // Load historical engagement patterns
      await this.loadEngagementPatterns();
      
      // Initialize participation tracking
      this.initializeParticipationTracking();
      
      this.initialized = true;
      console.log('✓ Engagement Detector initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Engagement Detector:', error);
      throw error;
    }
  }
  
  /**
   * Detect engagement opportunities in conversation segment
   */
  async detectOpportunities(conversationSegment, context) {
    try {
      if (!this.initialized) {
        throw new Error('Engagement Detector not initialized');
      }
      
      this.metrics.detectionsRun++;
      
      const opportunities = [];
      
      // 1. Update participation metrics
      await this.updateParticipationMetrics(conversationSegment, context);
      
      // 2. Detect engagement drops
      const engagementDrops = await this.detectEngagementDrops(conversationSegment, context);
      opportunities.push(...engagementDrops);
      
      // 3. Identify silent participants with expertise
      const silentExperts = await this.identifySilentExperts(conversationSegment, context);
      opportunities.push(...silentExperts);
      
      // 4. Detect dominant participants
      const dominantParticipants = await this.detectDominantParticipants(conversationSegment, context);
      opportunities.push(...dominantParticipants);
      
      // 5. Analyze conversation flow for engagement
      const flowOpportunities = await this.analyzeConversationFlow(conversationSegment, context);
      opportunities.push(...flowOpportunities);
      
      // 6. Detect disengagement signals
      const disengagementOpportunities = await this.detectDisengagementSignals(conversationSegment, context);
      opportunities.push(...disengagementOpportunities);
      
      // Filter and validate opportunities
      const validOpportunities = this.filterOpportunities(opportunities);
      
      // Update metrics
      this.updateMetrics(validOpportunities);
      
      return validOpportunities;
      
    } catch (error) {
      console.error('Error in engagement detection:', error);
      return [];
    }
  }
  
  /**
   * Update participation metrics for current segment
   */
  async updateParticipationMetrics(segment, context) {
    try {
      const participants = this.extractParticipants(segment);
      const segmentDuration = this.getSegmentDuration(segment);
      
      for (const participant of participants) {
        const participantId = participant.id || participant.email || participant.name;
        
        if (!this.participationMetrics.has(participantId)) {
          this.participationMetrics.set(participantId, {
            totalSpeakingTime: 0,
            interactionCount: 0,
            questionCount: 0,
            contributionQuality: 0,
            engagementLevel: 0.5,
            lastInteraction: null,
            expertise: participant.expertise || [],
            role: participant.role || 'participant'
          });
        }
        
        const metrics = this.participationMetrics.get(participantId);
        
        // Update speaking time
        metrics.totalSpeakingTime += participant.speakingTime || 0;
        
        // Update interaction count
        if (participant.spoke) {
          metrics.interactionCount++;
          metrics.lastInteraction = Date.now();
        }
        
        // Count questions
        if (participant.text && participant.text.includes('?')) {
          metrics.questionCount += (participant.text.match(/\?/g) || []).length;
        }
        
        // Calculate engagement level
        metrics.engagementLevel = this.calculateEngagementLevel(participant, metrics, segmentDuration);
        
        // Update contribution quality
        metrics.contributionQuality = await this.assessContributionQuality(participant, context);
      }
      
    } catch (error) {
      console.error('Error updating participation metrics:', error);
    }
  }
  
  /**
   * Detect engagement drops in conversation
   */
  async detectEngagementDrops(segment, context) {
    const opportunities = [];
    
    try {
      const currentEngagement = this.calculateOverallEngagement();
      const meetingId = context.meetingId;
      
      // Get historical engagement for this meeting
      if (!this.engagementHistory.has(meetingId)) {
        this.engagementHistory.set(meetingId, []);
      }
      
      const history = this.engagementHistory.get(meetingId);
      history.push({
        timestamp: Date.now(),
        engagement: currentEngagement,
        participantCount: this.participationMetrics.size
      });
      
      // Keep only recent history
      if (history.length > 10) {
        history.shift();
      }
      
      // Detect significant drops
      if (history.length >= 3) {
        const recentAvg = history.slice(-3).reduce((sum, h) => sum + h.engagement, 0) / 3;
        const previousAvg = history.slice(-6, -3).reduce((sum, h) => sum + h.engagement, 0) / 3;
        
        if (previousAvg > 0 && (previousAvg - recentAvg) / previousAvg > this.options.engagementDropThreshold) {
          const opportunity = {
            id: `engagement_drop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'ENGAGEMENT_DROP',
            subtype: 'overall_engagement_drop',
            title: 'Overall Engagement Drop Detected',
            description: `Meeting engagement dropped by ${Math.round(((previousAvg - recentAvg) / previousAvg) * 100)}%`,
            confidence: 0.8,
            timestamp: Date.now(),
            realTimeActionable: true,
            actionable: true,
            suggestedActions: [
              'Ask an engaging question to re-energize the discussion',
              'Take a brief break to reset energy levels',
              'Change the discussion format or approach',
              'Invite specific participants to share their thoughts',
              'Summarize progress to maintain momentum'
            ],
            contextData: {
              previousEngagement: previousAvg,
              currentEngagement: recentAvg,
              dropPercentage: ((previousAvg - recentAvg) / previousAvg) * 100,
              participantCount: this.participationMetrics.size,
              segmentDuration: this.getSegmentDuration(segment)
            }
          };
          
          opportunities.push(opportunity);
          this.metrics.engagementDropsDetected++;
        }
      }
      
    } catch (error) {
      console.error('Error detecting engagement drops:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Identify silent participants who could contribute expertise
   */
  async identifySilentExperts(segment, context) {
    const opportunities = [];
    
    try {
      const totalMeetingTime = this.getTotalMeetingTime(context);
      
      for (const [participantId, metrics] of this.participationMetrics.entries()) {
        const speakingRatio = totalMeetingTime > 0 ? metrics.totalSpeakingTime / totalMeetingTime : 0;
        
        // Identify silent participants with relevant expertise
        if (speakingRatio < this.options.silentParticipantThreshold && 
            metrics.expertise.length > 0 &&
            this.hasRelevantExpertise(metrics.expertise, context)) {
          
          const opportunity = {
            id: `silent_expert_${participantId}_${Date.now()}`,
            type: 'ENGAGEMENT_DROP',
            subtype: 'silent_expert',
            title: 'Underutilized Expertise Detected',
            description: `Participant with relevant expertise has limited participation (${Math.round(speakingRatio * 100)}% speaking time)`,
            confidence: 0.7,
            timestamp: Date.now(),
            realTimeActionable: true,
            actionable: true,
            suggestedActions: [
              `Directly ask ${this.getParticipantName(participantId)} for their input`,
              'Create structured opportunities for expertise sharing',
              'Ask specific questions related to their expertise',
              'Encourage participation through smaller group discussions'
            ],
            contextData: {
              participantId,
              participantName: this.getParticipantName(participantId),
              speakingRatio,
              expertise: metrics.expertise,
              relevantExpertise: this.getRelevantExpertise(metrics.expertise, context),
              totalSpeakingTime: metrics.totalSpeakingTime,
              interactionCount: metrics.interactionCount
            }
          };
          
          opportunities.push(opportunity);
          this.metrics.silentParticipantsIdentified++;
        }
      }
      
    } catch (error) {
      console.error('Error identifying silent experts:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Detect participants dominating the conversation
   */
  async detectDominantParticipants(segment, context) {
    const opportunities = [];
    
    try {
      const totalMeetingTime = this.getTotalMeetingTime(context);
      const participantCount = this.participationMetrics.size;
      const expectedSpeakingTime = totalMeetingTime / participantCount;
      
      for (const [participantId, metrics] of this.participationMetrics.entries()) {
        const speakingRatio = totalMeetingTime > 0 ? metrics.totalSpeakingTime / totalMeetingTime : 0;
        
        // Detect participants speaking significantly more than expected
        if (speakingRatio > this.options.dominantParticipantThreshold) {
          const opportunity = {
            id: `dominant_participant_${participantId}_${Date.now()}`,
            type: 'ENGAGEMENT_DROP',
            subtype: 'dominant_participant',
            title: 'Conversation Dominance Detected',
            description: `One participant is dominating the conversation (${Math.round(speakingRatio * 100)}% speaking time)`,
            confidence: 0.8,
            timestamp: Date.now(),
            realTimeActionable: true,
            actionable: true,
            suggestedActions: [
              'Politely redirect conversation to include other participants',
              'Ask for input from specific other participants',
              'Set speaking time limits for individual contributions',
              'Use structured discussion formats (round-robin, etc.)',
              'Acknowledge the contribution and invite others to respond'
            ],
            contextData: {
              participantId,
              participantName: this.getParticipantName(participantId),
              speakingRatio,
              expectedRatio: 1 / participantCount,
              excessRatio: speakingRatio - (1 / participantCount),
              totalSpeakingTime: metrics.totalSpeakingTime,
              interactionCount: metrics.interactionCount
            }
          };
          
          opportunities.push(opportunity);
          this.metrics.dominantParticipantsDetected++;
        }
      }
      
    } catch (error) {
      console.error('Error detecting dominant participants:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Analyze conversation flow for engagement opportunities
   */
  async analyzeConversationFlow(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      const flowAnalysis = this.analyzeFlow(text);
      
      // Detect monologue situations
      if (flowAnalysis.isMonologue && flowAnalysis.duration > 120) { // 2+ minutes
        const opportunity = {
          id: `monologue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'ENGAGEMENT_DROP',
          subtype: 'extended_monologue',
          title: 'Extended Monologue Detected',
          description: `Single participant speaking for ${Math.round(flowAnalysis.duration / 60)} minutes without interaction`,
          confidence: 0.7,
          timestamp: Date.now(),
          realTimeActionable: true,
          actionable: true,
          suggestedActions: [
            'Politely interrupt to check for questions',
            'Ask for reactions or thoughts from other participants',
            'Suggest breaking into smaller discussion groups',
            'Introduce structured interaction points'
          ],
          contextData: {
            duration: flowAnalysis.duration,
            speaker: flowAnalysis.speaker,
            interactionCount: flowAnalysis.interactionCount,
            questionCount: flowAnalysis.questionCount
          }
        };
        
        opportunities.push(opportunity);
      }
      
      // Detect lack of questions or interaction
      if (flowAnalysis.questionCount === 0 && flowAnalysis.duration > 300) { // 5+ minutes without questions
        const opportunity = {
          id: `no_questions_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'ENGAGEMENT_DROP',
          subtype: 'lack_of_questions',
          title: 'Lack of Interactive Questions',
          description: `${Math.round(flowAnalysis.duration / 60)} minutes of discussion without questions or clarifications`,
          confidence: 0.6,
          timestamp: Date.now(),
          realTimeActionable: true,
          actionable: true,
          suggestedActions: [
            'Ask "What questions do you have about this?"',
            'Invite specific participants to share their thoughts',
            'Pose a thought-provoking question to the group',
            'Check for understanding and clarity'
          ],
          contextData: {
            duration: flowAnalysis.duration,
            interactionCount: flowAnalysis.interactionCount,
            participantCount: this.participationMetrics.size
          }
        };
        
        opportunities.push(opportunity);
      }
      
    } catch (error) {
      console.error('Error analyzing conversation flow:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Detect disengagement signals in conversation
   */
  async detectDisengagementSignals(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      
      // Check for disengagement patterns
      for (const signal of this.engagementSignals.disengagement) {
        const matches = text.match(signal.pattern);
        
        if (matches) {
          const opportunity = {
            id: `disengagement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'ENGAGEMENT_DROP',
            subtype: 'disengagement_signal',
            title: 'Disengagement Signal Detected',
            description: `Participant expressed desire to move on or end discussion: "${matches[0]}"`,
            confidence: signal.weight,
            timestamp: Date.now(),
            realTimeActionable: true,
            actionable: true,
            suggestedActions: [
              'Acknowledge the time concern and provide a brief timeline',
              'Ask if the current topic needs more time or can be concluded',
              'Suggest parking unresolved items for follow-up',
              'Check if key objectives have been met before moving on'
            ],
            contextData: {
              disengagementSignal: matches[0],
              signalType: 'time_pressure',
              segmentText: text.substring(0, 150)
            }
          };
          
          opportunities.push(opportunity);
        }
      }
      
      // Detect energy level drops through language analysis
      const energyLevel = this.analyzeEnergyLevel(text);
      if (energyLevel < 0.3) {
        const opportunity = {
          id: `low_energy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'ENGAGEMENT_DROP',
          subtype: 'low_energy',
          title: 'Low Energy Level Detected',
          description: `Language analysis suggests low energy in the conversation`,
          confidence: 0.6,
          timestamp: Date.now(),
          realTimeActionable: true,
          actionable: true,
          suggestedActions: [
            'Suggest a brief energizing break',
            'Change the discussion format to be more interactive',
            'Ask an engaging or thought-provoking question',
            'Introduce a different perspective or approach'
          ],
          contextData: {
            energyLevel,
            analysisMethod: 'language_analysis',
            segmentLength: text.length
          }
        };
        
        opportunities.push(opportunity);
      }
      
    } catch (error) {
      console.error('Error detecting disengagement signals:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Helper methods
   */
  extractParticipants(segment) {
    if (segment.participants) {
      return segment.participants;
    }
    
    if (segment.speakers) {
      return segment.speakers;
    }
    
    // Extract from text if no explicit participant data
    return this.extractParticipantsFromText(segment);
  }
  
  extractParticipantsFromText(segment) {
    // Simplified participant extraction
    // In a real implementation, this would use more sophisticated NLP
    const text = this.extractText(segment);
    const participants = [];
    
    // Look for speaker indicators
    const speakerPatterns = [
      /^([A-Z][a-z]+):/gm, // "John:"
      /\[([A-Z][a-z]+)\]/gm, // "[John]"
      /- ([A-Z][a-z]+):/gm // "- John:"
    ];
    
    for (const pattern of speakerPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1];
        if (!participants.find(p => p.name === name)) {
          participants.push({
            name,
            id: name.toLowerCase(),
            spoke: true,
            text: text,
            speakingTime: 30 // Estimated
          });
        }
      }
    }
    
    return participants;
  }
  
  extractText(segment) {
    if (typeof segment === 'string') {
      return segment;
    }
    
    return segment.text || segment.transcript || segment.content || '';
  }
  
  getSegmentDuration(segment) {
    if (segment.duration) {
      return segment.duration;
    }
    
    if (segment.endTime && segment.startTime) {
      return segment.endTime - segment.startTime;
    }
    
    // Estimate based on text length
    const text = this.extractText(segment);
    return Math.max(10, text.length / 10); // Rough estimate: 10 chars per second
  }
  
  calculateEngagementLevel(participant, metrics, segmentDuration) {
    let engagement = 0.5; // Base engagement
    
    // Speaking time factor
    if (participant.speakingTime > 0) {
      engagement += 0.2;
    }
    
    // Question asking factor
    if (metrics.questionCount > 0) {
      engagement += 0.2;
    }
    
    // Recent interaction factor
    if (metrics.lastInteraction && (Date.now() - metrics.lastInteraction) < 60000) {
      engagement += 0.1;
    }
    
    // Contribution quality factor
    engagement += metrics.contributionQuality * 0.2;
    
    return Math.min(1.0, engagement);
  }
  
  async assessContributionQuality(participant, context) {
    try {
      const text = participant.text || '';
      
      if (text.length < 10) {
        return 0.3; // Very short contributions
      }
      
      let quality = 0.5; // Base quality
      
      // Question asking increases quality
      if (text.includes('?')) {
        quality += 0.2;
      }
      
      // Building on others' ideas
      if (/(?:building on|adding to|following up|i agree)/i.test(text)) {
        quality += 0.2;
      }
      
      // Providing examples or specifics
      if (/(?:for example|specifically|such as|like when)/i.test(text)) {
        quality += 0.1;
      }
      
      // Constructive language
      if (/(?:suggest|recommend|propose|consider)/i.test(text)) {
        quality += 0.1;
      }
      
      return Math.min(1.0, quality);
      
    } catch (error) {
      console.error('Error assessing contribution quality:', error);
      return 0.5;
    }
  }
  
  calculateOverallEngagement() {
    if (this.participationMetrics.size === 0) {
      return 0.5;
    }
    
    const engagementLevels = Array.from(this.participationMetrics.values())
      .map(metrics => metrics.engagementLevel);
    
    return engagementLevels.reduce((sum, level) => sum + level, 0) / engagementLevels.length;
  }
  
  getTotalMeetingTime(context) {
    if (context.meetingDuration) {
      return context.meetingDuration;
    }
    
    if (context.startTime) {
      return Date.now() - context.startTime;
    }
    
    // Estimate based on participation data
    const totalSpeakingTime = Array.from(this.participationMetrics.values())
      .reduce((sum, metrics) => sum + metrics.totalSpeakingTime, 0);
    
    return Math.max(totalSpeakingTime * 1.5, 300); // Assume some silence/overlap
  }
  
  hasRelevantExpertise(expertise, context) {
    if (!expertise || expertise.length === 0) {
      return false;
    }
    
    // Check if expertise matches meeting topics or objectives
    const meetingTopics = context.topics || context.objectives || [];
    
    return expertise.some(skill => 
      meetingTopics.some(topic => 
        topic.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(topic.toLowerCase())
      )
    );
  }
  
  getRelevantExpertise(expertise, context) {
    const meetingTopics = context.topics || context.objectives || [];
    
    return expertise.filter(skill => 
      meetingTopics.some(topic => 
        topic.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(topic.toLowerCase())
      )
    );
  }
  
  getParticipantName(participantId) {
    // Try to get name from participation metrics or use ID
    const metrics = this.participationMetrics.get(participantId);
    return metrics?.name || participantId;
  }
  
  analyzeFlow(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const questions = (text.match(/\?/g) || []).length;
    const words = text.split(/\s+/).length;
    
    return {
      isMonologue: sentences.length > 10 && questions < 2,
      duration: words * 0.5, // Rough estimate: 2 words per second
      speaker: 'unknown',
      interactionCount: questions,
      questionCount: questions,
      sentenceCount: sentences.length
    };
  }
  
  analyzeEnergyLevel(text) {
    let energy = 0.5; // Base energy level
    
    // Positive energy indicators
    const positiveWords = ['great', 'excellent', 'exciting', 'amazing', 'fantastic', 'wonderful'];
    const negativeWords = ['tired', 'boring', 'slow', 'dragging', 'tedious', 'exhausted'];
    
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        energy += matches.length * 0.1;
      }
    });
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        energy -= matches.length * 0.1;
      }
    });
    
    // Exclamation marks indicate energy
    const exclamations = (text.match(/!/g) || []).length;
    energy += exclamations * 0.05;
    
    // All caps words indicate energy (positive or negative)
    const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
    energy += capsWords * 0.03;
    
    return Math.max(0, Math.min(1, energy));
  }
  
  filterOpportunities(opportunities) {
    return opportunities.filter(opp => 
      opp.confidence >= this.options.confidenceThreshold &&
      opp.title && 
      opp.description &&
      opp.suggestedActions && 
      opp.suggestedActions.length > 0
    );
  }
  
  updateMetrics(opportunities) {
    opportunities.forEach(opp => {
      switch (opp.subtype) {
        case 'overall_engagement_drop':
          this.metrics.engagementDropsDetected++;
          break;
        case 'silent_expert':
          this.metrics.silentParticipantsIdentified++;
          break;
        case 'dominant_participant':
          this.metrics.dominantParticipantsDetected++;
          break;
      }
    });
    
    // Update average engagement score
    const currentEngagement = this.calculateOverallEngagement();
    this.metrics.averageEngagementScore = 
      (this.metrics.averageEngagementScore + currentEngagement) / 2;
  }
  
  async loadEngagementPatterns() {
    try {
      // Load historical engagement patterns from database
      console.log('Loading engagement patterns...');
      
      // This would query historical data to improve detection accuracy
      
    } catch (error) {
      console.error('Error loading engagement patterns:', error);
    }
  }
  
  initializeParticipationTracking() {
    // Initialize participation tracking systems
    console.log('Initializing participation tracking...');
  }
  
  /**
   * Get detector metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      initialized: this.initialized,
      activeParticipants: this.participationMetrics.size,
      currentEngagement: this.calculateOverallEngagement()
    };
  }
  
  /**
   * Reset metrics for new meeting
   */
  resetForNewMeeting(meetingId) {
    this.participationMetrics.clear();
    if (this.engagementHistory.has(meetingId)) {
      this.engagementHistory.delete(meetingId);
    }
  }
  
  /**
   * Shutdown detector gracefully
   */
  async shutdown() {
    console.log('Shutting down Engagement Detector...');
    
    this.participationMetrics.clear();
    this.engagementHistory.clear();
    this.initialized = false;
    
    console.log('✓ Engagement Detector shutdown complete');
  }
}

module.exports = EngagementDetector;
