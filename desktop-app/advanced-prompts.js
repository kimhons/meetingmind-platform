const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class AdvancedPromptEngine {
  constructor() {
    this.promptTemplates = {};
    this.contextHistory = [];
    this.userProfile = {};
    this.meetingContext = {};
    this.industryKnowledge = {};
    this.responsePatterns = {};
    this.initializePromptSystem();
  }

  async initializePromptSystem() {
    await this.loadPromptTemplates();
    await this.loadUserProfile();
    await this.loadIndustryKnowledge();
    this.initializeResponsePatterns();
  }

  async loadPromptTemplates() {
    this.promptTemplates = {
      // Advanced system prompts with role-based expertise
      systemPrompts: {
        meetingAnalyst: `You are an expert meeting analyst with 15+ years of experience in business communication, psychology, and strategic consulting. You have deep expertise in:

- Conversation dynamics and power structures
- Negotiation tactics and influence patterns  
- Emotional intelligence and sentiment analysis
- Business strategy and decision-making processes
- Cross-cultural communication patterns
- Industry-specific terminology and contexts

Your analysis should be:
- Precise and actionable (not generic advice)
- Based on specific conversational cues and patterns
- Contextually aware of business environments
- Psychologically informed about human behavior
- Strategically focused on outcomes

Always provide confidence levels (0.0-1.0) for your insights and distinguish between facts, inferences, and recommendations.`,

        knowledgeExpert: `You are a senior business intelligence analyst and researcher with access to comprehensive business knowledge. Your expertise spans:

- Market research and competitive analysis
- Industry trends and regulatory environments
- Financial modeling and business metrics
- Technology adoption patterns
- Organizational behavior and change management
- Risk assessment and mitigation strategies

When providing information:
- Cite specific data points and sources when possible
- Distinguish between current facts and projections
- Provide context for statistical claims
- Consider multiple perspectives and scenarios
- Focus on actionable intelligence over general information`,

        communicationSpecialist: `You are an expert business communication consultant specializing in professional correspondence and relationship management. Your skills include:

- Executive-level communication strategies
- Stakeholder relationship management
- Cross-functional team coordination
- Client relationship development
- Conflict resolution and negotiation
- Cultural sensitivity in business contexts

Your communications should be:
- Professionally appropriate for the context
- Strategically aligned with business objectives
- Relationship-preserving while being direct
- Culturally and contextually sensitive
- Action-oriented with clear next steps`
      },

      // Context-aware conversation analysis prompts
      conversationAnalysis: {
        deepAnalysis: `Analyze this conversation excerpt with expert-level precision:

CONVERSATION CONTEXT:
Meeting Type: {meetingType}
Industry: {industry}
Participants: {participants}
Meeting Stage: {meetingStage}
Previous Context: {previousContext}

CONVERSATION EXCERPT:
"{conversationText}"

ANALYSIS FRAMEWORK:
1. COMMUNICATION DYNAMICS
   - Power dynamics and hierarchy indicators
   - Influence patterns and persuasion attempts
   - Emotional undertones and sentiment shifts
   - Engagement levels and participation patterns

2. BUSINESS INTELLIGENCE
   - Decision-making signals and buying indicators
   - Pain points and underlying needs
   - Budget and timeline implications
   - Competitive landscape references

3. STRATEGIC OPPORTUNITIES
   - Relationship building moments
   - Value proposition alignment
   - Risk mitigation needs
   - Next step optimization

4. PSYCHOLOGICAL INSIGHTS
   - Cognitive biases in play
   - Emotional states and triggers
   - Communication preferences
   - Resistance patterns

Provide your analysis in this JSON structure:
{
  "conversationDynamics": {
    "powerStructure": "analysis of hierarchy and influence",
    "emotionalTone": "detailed sentiment analysis",
    "engagementLevel": "participation and interest indicators",
    "communicationStyle": "preferred interaction patterns"
  },
  "businessIntelligence": {
    "decisionStage": "where they are in decision process",
    "painPoints": ["specific challenges identified"],
    "budgetSignals": "financial capacity indicators",
    "timelineIndicators": "urgency and timing cues"
  },
  "strategicInsights": [
    {
      "type": "opportunity|risk|concern|advantage",
      "insight": "specific actionable insight",
      "evidence": "conversation elements supporting this",
      "confidence": 0.0-1.0,
      "priority": "critical|high|medium|low",
      "timeframe": "immediate|short-term|medium-term|long-term"
    }
  ],
  "recommendedActions": [
    {
      "action": "specific action to take",
      "rationale": "why this action is recommended",
      "timing": "when to execute",
      "riskLevel": "low|medium|high"
    }
  ],
  "conversationPredictions": {
    "likelyNextTopics": ["predicted discussion points"],
    "potentialObjections": ["anticipated concerns"],
    "opportunityWindows": ["moments for strategic moves"]
  }
}`,

        quickInsight: `Provide rapid tactical analysis for this conversation moment:

Context: {meetingType} | Stage: {meetingStage} | Industry: {industry}
Conversation: "{conversationText}"

Focus on IMMEDIATE actionable insights:
1. What just happened (key moment identification)
2. What it means (strategic implication)  
3. What to do next (specific action)
4. Risk/opportunity level (critical assessment)

JSON Response:
{
  "immediateInsight": {
    "keyMoment": "what significant thing just occurred",
    "strategicMeaning": "business implication",
    "recommendedResponse": "specific next action",
    "urgencyLevel": "immediate|soon|later",
    "confidence": 0.0-1.0
  },
  "tacticalSuggestions": [
    "specific thing to say or do",
    "follow-up question to ask",
    "strategic move to consider"
  ],
  "warningSignals": ["any red flags or concerns"],
  "opportunitySignals": ["positive indicators to leverage"]
}`
      },

      // Advanced knowledge search with domain expertise
      knowledgeSearch: {
        expertResearch: `You are conducting expert-level research on: "{query}"

RESEARCH CONTEXT:
Industry: {industry}
Meeting Context: {meetingContext}
Stakeholder Level: {stakeholderLevel}
Information Need: {informationNeed}

RESEARCH REQUIREMENTS:
- Provide authoritative, current information
- Include specific data points and statistics
- Consider industry-specific nuances
- Address potential counterarguments
- Suggest strategic applications

Research Framework:
1. CORE INFORMATION
   - Factual foundation and key data
   - Industry-specific considerations
   - Current market conditions

2. STRATEGIC CONTEXT  
   - Competitive landscape implications
   - Risk and opportunity assessment
   - Implementation considerations

3. ACTIONABLE INTELLIGENCE
   - Specific recommendations
   - Decision-making criteria
   - Success metrics and KPIs

JSON Response:
{
  "executiveSummary": "concise high-level overview",
  "keyFindings": [
    {
      "finding": "specific research result",
      "source": "authoritative source or reasoning",
      "relevance": "why this matters in context",
      "confidence": 0.0-1.0,
      "recency": "how current this information is"
    }
  ],
  "strategicImplications": [
    {
      "implication": "business impact or consideration",
      "timeframe": "when this becomes relevant",
      "stakeholders": "who this affects",
      "actionRequired": "what needs to be done"
    }
  ],
  "competitiveIntelligence": {
    "marketPosition": "where this fits in market",
    "competitorResponse": "how competitors handle this",
    "differentiationOpportunity": "unique positioning angle"
  },
  "implementationGuidance": {
    "successFactors": ["key requirements for success"],
    "commonPitfalls": ["typical mistakes to avoid"],
    "metrics": ["how to measure success"],
    "timeline": "realistic implementation schedule"
  },
  "followUpQuestions": ["strategic questions to explore further"]
}`
      },

      // Sophisticated follow-up generation
      followUpGeneration: {
        executiveFollowUp: `Generate a sophisticated follow-up communication based on this meeting analysis:

MEETING INTELLIGENCE:
Type: {meetingType}
Duration: {duration}
Participants: {participants}
Key Topics: {topics}
Decision Points: {decisionPoints}
Action Items: {actionItems}
Relationship Status: {relationshipStatus}
Next Steps: {nextSteps}

COMMUNICATION REQUIREMENTS:
- Executive-level professionalism
- Strategic relationship building
- Clear value proposition reinforcement
- Appropriate urgency and tone
- Cultural and contextual sensitivity

FOLLOW-UP FRAMEWORK:
1. RELATIONSHIP REINFORCEMENT
   - Acknowledge specific contributions
   - Reference shared insights or moments
   - Demonstrate active listening

2. VALUE CONSOLIDATION
   - Summarize key value propositions
   - Reinforce mutual benefits
   - Address any concerns raised

3. MOMENTUM BUILDING
   - Clear next steps with ownership
   - Appropriate timeline pressure
   - Multiple engagement touchpoints

4. STRATEGIC POSITIONING
   - Competitive differentiation
   - Risk mitigation assurance
   - Success pathway clarity

JSON Response:
{
  "communicationStrategy": {
    "primaryObjective": "main goal of this follow-up",
    "toneAndStyle": "appropriate communication approach",
    "keyMessages": ["core points to convey"],
    "relationshipGoals": ["relationship outcomes desired"]
  },
  "emailContent": {
    "subject": "compelling subject line",
    "opening": "relationship-appropriate greeting and context",
    "body": "structured main content with strategic messaging",
    "closing": "professional close with clear next steps",
    "signature": "appropriate sign-off"
  },
  "strategicElements": {
    "valueReinforcement": ["ways value proposition is strengthened"],
    "riskMitigation": ["concerns addressed proactively"],
    "competitiveDifferentiation": ["unique advantages highlighted"],
    "urgencyCreation": ["appropriate timeline pressure"]
  },
  "followUpSequence": [
    {
      "timing": "when to follow up",
      "method": "communication channel",
      "purpose": "objective of touchpoint",
      "content": "key message for this interaction"
    }
  ],
  "successMetrics": ["how to measure follow-up effectiveness"]
}`
      }
    };
  }

  async loadUserProfile() {
    try {
      const profilePath = path.join(os.homedir(), '.meetingmind', 'user-profile.json');
      const profileData = await fs.readFile(profilePath, 'utf8');
      this.userProfile = JSON.parse(profileData);
    } catch (error) {
      // Initialize default user profile
      this.userProfile = {
        role: 'business_professional',
        industry: 'technology',
        experienceLevel: 'senior',
        communicationStyle: 'direct_professional',
        meetingTypes: ['sales', 'strategy', 'negotiation'],
        preferences: {
          insightDepth: 'detailed',
          responseSpeed: 'balanced',
          riskTolerance: 'moderate',
          culturalContext: 'western_business'
        },
        learningHistory: {
          successfulStrategies: [],
          preferredApproaches: [],
          avoidedMistakes: []
        }
      };
      await this.saveUserProfile();
    }
  }

  async saveUserProfile() {
    try {
      const profileDir = path.join(os.homedir(), '.meetingmind');
      const profilePath = path.join(profileDir, 'user-profile.json');
      
      await fs.mkdir(profileDir, { recursive: true });
      await fs.writeFile(profilePath, JSON.stringify(this.userProfile, null, 2));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  async loadIndustryKnowledge() {
    this.industryKnowledge = {
      technology: {
        keyMetrics: ['ARR', 'CAC', 'LTV', 'churn rate', 'product-market fit'],
        decisionMakers: ['CTO', 'VP Engineering', 'Product Manager', 'CEO'],
        commonConcerns: ['scalability', 'security', 'integration', 'ROI'],
        buyingProcess: ['technical evaluation', 'pilot program', 'stakeholder buy-in'],
        competitiveFactors: ['feature completeness', 'performance', 'support', 'pricing']
      },
      finance: {
        keyMetrics: ['ROI', 'risk assessment', 'compliance', 'cost reduction'],
        decisionMakers: ['CFO', 'Risk Manager', 'Compliance Officer', 'CEO'],
        commonConcerns: ['regulatory compliance', 'data security', 'audit trail'],
        buyingProcess: ['risk assessment', 'compliance review', 'board approval'],
        competitiveFactors: ['regulatory compliance', 'security', 'reporting', 'integration']
      },
      healthcare: {
        keyMetrics: ['patient outcomes', 'cost per patient', 'compliance', 'efficiency'],
        decisionMakers: ['CMO', 'CIO', 'Administrator', 'Department Head'],
        commonConcerns: ['HIPAA compliance', 'patient safety', 'workflow disruption'],
        buyingProcess: ['clinical evaluation', 'compliance review', 'pilot program'],
        competitiveFactors: ['clinical efficacy', 'compliance', 'usability', 'integration']
      }
    };
  }

  initializeResponsePatterns() {
    this.responsePatterns = {
      confidence: {
        high: (confidence) => confidence >= 0.8,
        medium: (confidence) => confidence >= 0.5 && confidence < 0.8,
        low: (confidence) => confidence < 0.5
      },
      urgency: {
        immediate: ['budget deadline', 'decision timeline', 'competitive pressure'],
        high: ['quarterly planning', 'project timeline', 'stakeholder pressure'],
        medium: ['evaluation process', 'vendor selection', 'strategic planning'],
        low: ['research phase', 'early exploration', 'future consideration']
      },
      sentiment: {
        positive: ['excited', 'interested', 'impressed', 'convinced'],
        neutral: ['considering', 'evaluating', 'reviewing', 'analyzing'],
        negative: ['concerned', 'skeptical', 'hesitant', 'resistant'],
        mixed: ['cautiously optimistic', 'interested but concerned', 'mixed feelings']
      }
    };
  }

  buildAdvancedPrompt(templateType, subType, context) {
    const template = this.promptTemplates[templateType]?.[subType];
    if (!template) {
      throw new Error(`Prompt template not found: ${templateType}.${subType}`);
    }

    // Enhanced context with user profile and industry knowledge
    const enhancedContext = {
      ...context,
      userProfile: this.userProfile,
      industryContext: this.industryKnowledge[context.industry] || {},
      conversationHistory: this.getRelevantHistory(context),
      strategicContext: this.buildStrategicContext(context)
    };

    // Advanced template interpolation with context awareness
    return this.interpolateTemplate(template, enhancedContext);
  }

  interpolateTemplate(template, context) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = this.getContextValue(key, context);
      return value !== undefined ? value : match;
    });
  }

  getContextValue(key, context) {
    // Multi-level context resolution
    if (context[key] !== undefined) return context[key];
    if (context.userProfile?.[key] !== undefined) return context.userProfile[key];
    if (context.industryContext?.[key] !== undefined) return context.industryContext[key];
    if (context.meetingContext?.[key] !== undefined) return context.meetingContext[key];
    
    // Dynamic context generation
    switch (key) {
      case 'stakeholderLevel':
        return this.inferStakeholderLevel(context);
      case 'meetingStage':
        return this.inferMeetingStage(context);
      case 'informationNeed':
        return this.inferInformationNeed(context);
      case 'relationshipStatus':
        return this.inferRelationshipStatus(context);
      default:
        return `[${key}]`; // Placeholder for missing context
    }
  }

  inferStakeholderLevel(context) {
    const participants = context.participants || [];
    const titles = participants.map(p => p.title || '').join(' ').toLowerCase();
    
    if (titles.includes('ceo') || titles.includes('president') || titles.includes('founder')) {
      return 'executive';
    } else if (titles.includes('vp') || titles.includes('director') || titles.includes('head')) {
      return 'senior_management';
    } else if (titles.includes('manager') || titles.includes('lead')) {
      return 'management';
    } else {
      return 'individual_contributor';
    }
  }

  inferMeetingStage(context) {
    const conversationText = (context.conversationText || '').toLowerCase();
    const topics = (context.topics || []).join(' ').toLowerCase();
    
    if (conversationText.includes('nice to meet') || conversationText.includes('introduction')) {
      return 'introduction';
    } else if (topics.includes('demo') || topics.includes('presentation')) {
      return 'demonstration';
    } else if (conversationText.includes('price') || conversationText.includes('cost') || conversationText.includes('budget')) {
      return 'negotiation';
    } else if (conversationText.includes('next steps') || conversationText.includes('decision')) {
      return 'closing';
    } else {
      return 'discovery';
    }
  }

  inferInformationNeed(context) {
    const query = (context.query || '').toLowerCase();
    
    if (query.includes('competitor') || query.includes('alternative')) {
      return 'competitive_analysis';
    } else if (query.includes('roi') || query.includes('cost') || query.includes('price')) {
      return 'financial_justification';
    } else if (query.includes('implement') || query.includes('deploy')) {
      return 'implementation_guidance';
    } else if (query.includes('risk') || query.includes('security')) {
      return 'risk_assessment';
    } else {
      return 'general_research';
    }
  }

  inferRelationshipStatus(context) {
    const meetingCount = context.meetingHistory?.length || 0;
    const lastInteraction = context.lastInteraction || 'unknown';
    
    if (meetingCount === 0) {
      return 'new_prospect';
    } else if (meetingCount <= 2) {
      return 'early_stage';
    } else if (meetingCount <= 5) {
      return 'developing';
    } else {
      return 'established';
    }
  }

  getRelevantHistory(context) {
    // Return last 3 relevant conversation contexts
    return this.contextHistory
      .filter(h => h.meetingType === context.meetingType || h.industry === context.industry)
      .slice(-3)
      .map(h => ({
        summary: h.summary,
        keyInsights: h.keyInsights,
        outcomes: h.outcomes
      }));
  }

  buildStrategicContext(context) {
    return {
      competitivePosition: this.assessCompetitivePosition(context),
      relationshipDynamics: this.assessRelationshipDynamics(context),
      decisionFactors: this.identifyDecisionFactors(context),
      riskFactors: this.identifyRiskFactors(context)
    };
  }

  assessCompetitivePosition(context) {
    // Analyze competitive positioning based on conversation cues
    const conversationText = (context.conversationText || '').toLowerCase();
    
    if (conversationText.includes('comparing') || conversationText.includes('other options')) {
      return 'competitive_evaluation';
    } else if (conversationText.includes('unique') || conversationText.includes('different')) {
      return 'differentiation_focus';
    } else {
      return 'unknown';
    }
  }

  assessRelationshipDynamics(context) {
    const participants = context.participants || [];
    const conversationTone = this.analyzeTone(context.conversationText || '');
    
    return {
      powerDynamics: this.inferPowerDynamics(participants),
      communicationStyle: conversationTone,
      engagementLevel: this.assessEngagement(context.conversationText || '')
    };
  }

  identifyDecisionFactors(context) {
    const industry = context.industry || 'general';
    const industryData = this.industryKnowledge[industry] || {};
    
    return {
      keyMetrics: industryData.keyMetrics || [],
      decisionMakers: industryData.decisionMakers || [],
      commonConcerns: industryData.commonConcerns || []
    };
  }

  identifyRiskFactors(context) {
    const conversationText = (context.conversationText || '').toLowerCase();
    const risks = [];
    
    if (conversationText.includes('budget') && conversationText.includes('tight')) {
      risks.push('budget_constraints');
    }
    if (conversationText.includes('timeline') && conversationText.includes('aggressive')) {
      risks.push('timeline_pressure');
    }
    if (conversationText.includes('stakeholder') && conversationText.includes('approval')) {
      risks.push('stakeholder_alignment');
    }
    
    return risks;
  }

  analyzeTone(text) {
    const positiveWords = ['great', 'excellent', 'perfect', 'love', 'impressed'];
    const negativeWords = ['concern', 'worry', 'problem', 'issue', 'difficult'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  inferPowerDynamics(participants) {
    // Analyze participant hierarchy and influence patterns
    const executives = participants.filter(p => 
      (p.title || '').toLowerCase().includes('ceo') || 
      (p.title || '').toLowerCase().includes('president')
    );
    
    if (executives.length > 0) return 'executive_present';
    return 'peer_level';
  }

  assessEngagement(text) {
    const engagementIndicators = ['question', 'how', 'what', 'when', 'where', 'why'];
    const words = text.toLowerCase().split(/\s+/);
    const engagementScore = words.filter(w => engagementIndicators.includes(w)).length;
    
    if (engagementScore > 3) return 'high';
    if (engagementScore > 1) return 'medium';
    return 'low';
  }

  addToHistory(context, insights, outcomes) {
    this.contextHistory.push({
      timestamp: new Date().toISOString(),
      meetingType: context.meetingType,
      industry: context.industry,
      summary: context.conversationText?.substring(0, 200),
      keyInsights: insights,
      outcomes: outcomes
    });
    
    // Keep only last 50 entries
    if (this.contextHistory.length > 50) {
      this.contextHistory = this.contextHistory.slice(-50);
    }
  }

  updateUserProfile(feedback) {
    // Machine learning-like profile updates based on user feedback
    if (feedback.successfulStrategy) {
      this.userProfile.learningHistory.successfulStrategies.push(feedback.successfulStrategy);
    }
    
    if (feedback.preferredApproach) {
      this.userProfile.learningHistory.preferredApproaches.push(feedback.preferredApproach);
    }
    
    if (feedback.avoidedMistake) {
      this.userProfile.learningHistory.avoidedMistakes.push(feedback.avoidedMistake);
    }
    
    this.saveUserProfile();
  }

  // Main prompt generation methods
  generateInsightsPrompt(text, context) {
    const promptContext = {
      conversationText: text,
      meetingType: context.meetingType || 'business_meeting',
      industry: context.industry || this.userProfile.industry,
      participants: context.participants || [],
      previousContext: this.getRelevantHistory(context)
    };

    return this.buildAdvancedPrompt('conversationAnalysis', 'deepAnalysis', promptContext);
  }

  generateQuickInsightPrompt(text, context) {
    const promptContext = {
      conversationText: text,
      meetingType: context.meetingType || 'business_meeting',
      industry: context.industry || this.userProfile.industry,
      meetingStage: context.meetingStage || this.inferMeetingStage({ conversationText: text })
    };

    return this.buildAdvancedPrompt('conversationAnalysis', 'quickInsight', promptContext);
  }

  generateKnowledgeSearchPrompt(query, context) {
    const promptContext = {
      query: query,
      industry: context.industry || this.userProfile.industry,
      meetingContext: context.meetingType || 'business_meeting',
      stakeholderLevel: context.stakeholderLevel || this.inferStakeholderLevel(context),
      informationNeed: this.inferInformationNeed({ query })
    };

    return this.buildAdvancedPrompt('knowledgeSearch', 'expertResearch', promptContext);
  }

  generateFollowUpPrompt(meetingData) {
    const promptContext = {
      meetingType: meetingData.meetingType || 'business_meeting',
      duration: meetingData.duration || 'unknown',
      participants: meetingData.participants || [],
      topics: meetingData.topics || [],
      decisionPoints: meetingData.decisionPoints || [],
      actionItems: meetingData.actionItems || [],
      nextSteps: meetingData.nextSteps || [],
      relationshipStatus: this.inferRelationshipStatus(meetingData)
    };

    return this.buildAdvancedPrompt('followUpGeneration', 'executiveFollowUp', promptContext);
  }

  // Response validation and enhancement
  validateAndEnhanceResponse(response, expectedStructure) {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      
      // Validate structure
      const isValid = this.validateResponseStructure(parsed, expectedStructure);
      if (!isValid) {
        throw new Error('Response structure validation failed');
      }
      
      // Enhance with confidence scoring
      return this.enhanceResponseWithConfidence(parsed);
    } catch (error) {
      console.error('Response validation failed:', error);
      return this.generateFallbackResponse(expectedStructure);
    }
  }

  validateResponseStructure(response, expectedStructure) {
    // Implement structure validation logic
    const requiredFields = expectedStructure.required || [];
    return requiredFields.every(field => response.hasOwnProperty(field));
  }

  enhanceResponseWithConfidence(response) {
    // Add confidence scoring based on response quality indicators
    if (response.strategicInsights) {
      response.strategicInsights = response.strategicInsights.map(insight => ({
        ...insight,
        qualityScore: this.calculateInsightQuality(insight),
        actionability: this.assessActionability(insight)
      }));
    }
    
    return response;
  }

  calculateInsightQuality(insight) {
    let score = 0.5; // Base score
    
    // Increase score for specific evidence
    if (insight.evidence && insight.evidence.length > 20) score += 0.2;
    
    // Increase score for high confidence
    if (insight.confidence > 0.8) score += 0.2;
    
    // Increase score for actionable insights
    if (insight.type === 'opportunity' || insight.type === 'advantage') score += 0.1;
    
    return Math.min(score, 1.0);
  }

  assessActionability(insight) {
    const actionWords = ['ask', 'present', 'propose', 'schedule', 'follow up', 'address'];
    const hasActionWords = actionWords.some(word => 
      insight.insight.toLowerCase().includes(word)
    );
    
    return hasActionWords ? 'high' : 'medium';
  }

  generateFallbackResponse(expectedStructure) {
    // Generate structured fallback when AI response fails
    return {
      success: false,
      error: 'AI response validation failed',
      fallback: true,
      message: 'Using enhanced fallback analysis',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AdvancedPromptEngine;
