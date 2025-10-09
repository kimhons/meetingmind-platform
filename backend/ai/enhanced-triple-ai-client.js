/**
 * Enhanced Triple-AI Client with Hybrid Provider Strategy
 * Integrates AIMLAPI cost savings with direct provider reliability
 */

const HybridAIClient = require('./hybrid-ai-client');

class EnhancedTripleAIClient extends HybridAIClient {
  constructor() {
    super();
    
    // MeetingMind-specific AI configurations
    this.meetingAIConfig = {
      contextual_analysis: {
        models: ['gpt-5', 'claude-4.5-sonnet'],
        operation: 'standard',
        temperature: 0.3,
        max_tokens: 1500
      },
      real_time_coaching: {
        models: ['gemini-2.5-flash', 'gpt-4.1'],
        operation: 'critical', // Use direct providers for real-time
        temperature: 0.7,
        max_tokens: 500
      },
      predictive_intelligence: {
        models: ['gpt-5', 'claude-4.5-sonnet', 'deepseek-r1'],
        operation: 'standard',
        temperature: 0.2,
        max_tokens: 2000
      },
      interview_coaching: {
        models: ['gpt-5', 'claude-4.5-sonnet'],
        operation: 'critical', // Critical for interview success
        temperature: 0.5,
        max_tokens: 1000
      },
      knowledge_integration: {
        models: ['gemini-2.5-flash', 'gpt-4.1'],
        operation: 'standard',
        temperature: 0.4,
        max_tokens: 1200
      }
    };
  }

  /**
   * Contextual Analysis with Triple-AI Collaboration
   */
  async analyzeContext(meetingData) {
    const config = this.meetingAIConfig.contextual_analysis;
    
    const analysisPrompt = `
    Analyze this meeting context and provide insights:
    
    Meeting Type: ${meetingData.type}
    Participants: ${meetingData.participants?.join(', ')}
    Agenda: ${meetingData.agenda}
    Previous Context: ${meetingData.previousContext}
    
    Provide:
    1. Key discussion points to focus on
    2. Potential challenges or opportunities
    3. Recommended conversation strategies
    4. Success metrics for this meeting
    `;

    return await this.tripleAICollaboration({
      prompt: analysisPrompt,
      context: meetingData,
      operation: config.operation,
      temperature: config.temperature,
      max_tokens: config.max_tokens
    });
  }

  /**
   * Real-time Coaching During Meetings
   */
  async provideRealTimeCoaching(conversationData) {
    const config = this.meetingAIConfig.real_time_coaching;
    
    const coachingPrompt = `
    Provide real-time coaching based on this conversation:
    
    Current Speaker: ${conversationData.currentSpeaker}
    Recent Dialogue: ${conversationData.recentDialogue}
    Meeting Objective: ${conversationData.objective}
    Time Remaining: ${conversationData.timeRemaining}
    
    Provide immediate, actionable coaching:
    1. What to say next (if appropriate)
    2. Body language or tone adjustments
    3. Strategic opportunities in the conversation
    4. Warning about potential issues
    
    Keep response under 100 words for real-time use.
    `;

    return await this.generateCompletion({
      model: config.models[0], // Use fastest model for real-time
      messages: [
        { role: 'system', content: 'You are a real-time meeting coach. Provide immediate, actionable advice.' },
        { role: 'user', content: coachingPrompt }
      ],
      operation: config.operation,
      temperature: config.temperature,
      max_tokens: config.max_tokens
    });
  }

  /**
   * Predictive Meeting Intelligence
   */
  async predictMeetingOutcomes(meetingData) {
    const config = this.meetingAIConfig.predictive_intelligence;
    
    const predictionPrompt = `
    Predict meeting outcomes based on this data:
    
    Meeting Type: ${meetingData.type}
    Participants: ${JSON.stringify(meetingData.participants)}
    Historical Data: ${JSON.stringify(meetingData.historicalData)}
    Current Agenda: ${meetingData.agenda}
    Participant Dynamics: ${JSON.stringify(meetingData.dynamics)}
    
    Predict with 87% accuracy target:
    1. Likely decisions and outcomes
    2. Potential roadblocks or conflicts
    3. Probability of achieving objectives
    4. Recommended interventions
    5. Timeline for follow-up actions
    
    Provide confidence scores for each prediction.
    `;

    return await this.tripleAICollaboration({
      prompt: predictionPrompt,
      context: meetingData,
      operation: config.operation,
      temperature: config.temperature,
      max_tokens: config.max_tokens
    });
  }

  /**
   * Interview Intelligence and Coaching
   */
  async provideInterviewCoaching(interviewData) {
    const config = this.meetingAIConfig.interview_coaching;
    
    const coachingPrompt = `
    Provide interview coaching for this scenario:
    
    Company: ${interviewData.company}
    Role: ${interviewData.role}
    Interview Type: ${interviewData.type}
    Candidate Background: ${JSON.stringify(interviewData.candidateProfile)}
    Question Context: ${interviewData.currentQuestion}
    
    Provide:
    1. Optimal response strategy
    2. Key points to emphasize
    3. Potential follow-up questions
    4. Body language and delivery tips
    5. Red flags to avoid
    
    Focus on maximizing interview success probability.
    `;

    return await this.tripleAICollaboration({
      prompt: coachingPrompt,
      context: interviewData,
      operation: config.operation,
      temperature: config.temperature,
      max_tokens: config.max_tokens
    });
  }

  /**
   * Knowledge Integration and Synthesis
   */
  async integrateKnowledge(knowledgeData) {
    const config = this.meetingAIConfig.knowledge_integration;
    
    const integrationPrompt = `
    Integrate and synthesize this knowledge for meeting preparation:
    
    Meeting Context: ${knowledgeData.meetingContext}
    Company Knowledge: ${JSON.stringify(knowledgeData.companyKnowledge)}
    Project Information: ${JSON.stringify(knowledgeData.projectInfo)}
    Participant Profiles: ${JSON.stringify(knowledgeData.participantProfiles)}
    Historical Decisions: ${JSON.stringify(knowledgeData.historicalDecisions)}
    
    Synthesize into:
    1. Key talking points and references
    2. Strategic context and background
    3. Potential questions and answers
    4. Relationship dynamics to consider
    5. Success strategies based on history
    `;

    return await this.generateCompletion({
      model: config.models[0],
      messages: [
        { role: 'system', content: 'You are a knowledge integration specialist. Synthesize information for optimal meeting preparation.' },
        { role: 'user', content: integrationPrompt }
      ],
      operation: config.operation,
      temperature: config.temperature,
      max_tokens: config.max_tokens
    });
  }

  /**
   * Opportunity Detection Analysis
   */
  async detectOpportunities(conversationData) {
    const detectionPrompt = `
    Analyze this conversation for missed opportunities:
    
    Conversation: ${conversationData.transcript}
    Meeting Objective: ${conversationData.objective}
    Participant Roles: ${JSON.stringify(conversationData.participantRoles)}
    
    Identify:
    1. Missed clarification opportunities
    2. Unexplored collaboration possibilities
    3. Unasked strategic questions
    4. Potential decision points not addressed
    5. Relationship building opportunities missed
    
    Provide specific, actionable recommendations.
    `;

    return await this.generateCompletion({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: 'You are an opportunity detection specialist. Identify missed opportunities in conversations.' },
        { role: 'user', content: detectionPrompt }
      ],
      operation: 'standard',
      temperature: 0.3,
      max_tokens: 1500
    });
  }

  /**
   * Cross-Meeting Intelligence
   */
  async analyzeCrossMeetingPatterns(meetingHistory) {
    const analysisPrompt = `
    Analyze patterns across these meetings:
    
    Meeting History: ${JSON.stringify(meetingHistory)}
    
    Identify:
    1. Recurring themes and decisions
    2. Participant behavior patterns
    3. Successful strategies and outcomes
    4. Unresolved issues carrying forward
    5. Relationship evolution over time
    
    Provide insights for future meeting optimization.
    `;

    return await this.tripleAICollaboration({
      prompt: analysisPrompt,
      context: { meetingHistory },
      operation: 'standard',
      temperature: 0.2,
      max_tokens: 2000
    });
  }

  /**
   * Performance Analytics and Insights
   */
  async generatePerformanceInsights(performanceData) {
    const insightsPrompt = `
    Generate performance insights from this data:
    
    Meeting Metrics: ${JSON.stringify(performanceData.metrics)}
    Outcome Data: ${JSON.stringify(performanceData.outcomes)}
    Participant Feedback: ${JSON.stringify(performanceData.feedback)}
    
    Provide:
    1. Performance trends and patterns
    2. Areas for improvement
    3. Success factors and best practices
    4. Personalized coaching recommendations
    5. ROI analysis and business impact
    `;

    return await this.generateCompletion({
      model: 'claude-4.5-sonnet',
      messages: [
        { role: 'system', content: 'You are a performance analytics specialist. Generate actionable insights from meeting data.' },
        { role: 'user', content: insightsPrompt }
      ],
      operation: 'standard',
      temperature: 0.4,
      max_tokens: 1800
    });
  }

  /**
   * Cost-Optimized Batch Processing
   */
  async processBatchAnalysis(batchData) {
    // Use AIMLAPI for cost-effective batch processing
    const batchPromises = batchData.map(item => 
      this.generateCompletion({
        model: 'gpt-4.1',
        messages: item.messages,
        operation: 'standard', // Use cost-effective AIMLAPI
        temperature: 0.5,
        max_tokens: 1000
      })
    );

    const results = await Promise.allSettled(batchPromises);
    
    return {
      successful: results.filter(r => r.status === 'fulfilled').map(r => r.value),
      failed: results.filter(r => r.status === 'rejected').map(r => r.reason),
      total_cost: results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value.cost, 0)
    };
  }

  /**
   * Get AI Usage Analytics
   */
  getAIUsageAnalytics() {
    const stats = this.getProviderStats();
    
    return {
      provider_performance: stats,
      cost_savings: this.calculateCostSavings(stats),
      reliability_metrics: this.calculateReliabilityMetrics(stats),
      recommendations: this.generateOptimizationRecommendations(stats)
    };
  }

  calculateCostSavings(stats) {
    const aimlApiCost = stats.aimlapi?.totalCost || 0;
    const directProviderCost = Object.entries(stats)
      .filter(([provider]) => provider !== 'aimlapi')
      .reduce((sum, [, data]) => sum + (data.totalCost || 0), 0);
    
    const totalCost = aimlApiCost + directProviderCost;
    const estimatedDirectCost = totalCost / 0.3; // Assuming 70% savings with AIMLAPI
    
    return {
      actual_cost: totalCost,
      estimated_direct_cost: estimatedDirectCost,
      savings: estimatedDirectCost - totalCost,
      savings_percentage: ((estimatedDirectCost - totalCost) / estimatedDirectCost) * 100
    };
  }

  calculateReliabilityMetrics(stats) {
    return Object.entries(stats).map(([provider, data]) => ({
      provider,
      success_rate: data.success_rate,
      health_status: data.health?.healthy,
      total_requests: data.success + data.error
    }));
  }

  generateOptimizationRecommendations(stats) {
    const recommendations = [];
    
    // Analyze provider performance and suggest optimizations
    Object.entries(stats).forEach(([provider, data]) => {
      if (data.success_rate < 0.95) {
        recommendations.push(`Consider reducing load on ${provider} (success rate: ${(data.success_rate * 100).toFixed(1)}%)`);
      }
      
      if (data.totalCost > 1000) {
        recommendations.push(`High cost detected for ${provider}: $${data.totalCost.toFixed(2)}. Consider optimization.`);
      }
    });

    return recommendations;
  }
}

module.exports = EnhancedTripleAIClient;
