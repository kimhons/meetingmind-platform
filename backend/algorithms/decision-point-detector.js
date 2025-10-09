/**
 * Decision Point Detector Algorithm
 * 
 * Identifies moments when decisions could or should be made, tracks decision-making
 * opportunities, and ensures clear decision outcomes with proper implementation plans.
 */

class DecisionPointDetector {
  constructor(supabase, options = {}) {
    this.supabase = supabase;
    this.options = {
      confidenceThreshold: 0.6,
      decisionUrgencyThreshold: 0.7,
      implementationClarityThreshold: 0.8,
      contextWindow: 120, // seconds
      ...options
    };
    
    // Decision signal patterns
    this.decisionSignals = {
      explicit: [
        { pattern: /(?:we need to|let's|should we)\s+(?:decide|choose|pick|select)/i, weight: 0.9, urgency: 0.8 },
        { pattern: /(?:decision|choice|option)\s+(?:needs to be|must be|should be)\s+made/i, weight: 0.9, urgency: 0.9 },
        { pattern: /(?:what's our|what is our)\s+(?:decision|choice|call)/i, weight: 0.8, urgency: 0.7 },
        { pattern: /(?:time to|need to)\s+(?:make a decision|decide|choose)/i, weight: 0.8, urgency: 0.8 }
      ],
      implicit: [
        { pattern: /(?:should we|could we|what if we|how about we)/i, weight: 0.7, urgency: 0.5 },
        { pattern: /(?:the options are|our choices are|we could either)/i, weight: 0.8, urgency: 0.6 },
        { pattern: /(?:on one hand|on the other hand|alternatively)/i, weight: 0.6, urgency: 0.4 },
        { pattern: /(?:pros and cons|advantages and disadvantages|benefits and risks)/i, weight: 0.7, urgency: 0.5 }
      ],
      consensus: [
        { pattern: /(?:does everyone|do we all)\s+(?:agree|think|feel)/i, weight: 0.8, urgency: 0.6 },
        { pattern: /(?:are we all|is everyone)\s+(?:on board|in agreement|aligned)/i, weight: 0.8, urgency: 0.7 },
        { pattern: /(?:consensus|agreement|unanimous)/i, weight: 0.7, urgency: 0.6 },
        { pattern: /(?:show of hands|vote|poll)/i, weight: 0.9, urgency: 0.8 }
      ],
      implementation: [
        { pattern: /(?:who will|who's going to|who should)\s+(?:handle|take care of|be responsible)/i, weight: 0.8, urgency: 0.9 },
        { pattern: /(?:when will|by when|deadline|timeline)/i, weight: 0.7, urgency: 0.8 },
        { pattern: /(?:next steps|action items|follow up)/i, weight: 0.6, urgency: 0.7 },
        { pattern: /(?:how do we|how will we)\s+(?:implement|execute|proceed)/i, weight: 0.8, urgency: 0.8 }
      ]
    };
    
    // Decision quality indicators
    this.qualityIndicators = {
      clear_outcome: [
        /(?:we've decided|decision is|we'll go with|final decision)/i,
        /(?:agreed|settled|resolved|concluded)/i
      ],
      unclear_outcome: [
        /(?:we'll think about|maybe we should|perhaps we could)/i,
        /(?:not sure|unclear|undecided|still considering)/i
      ],
      implementation_plan: [
        /(?:action items|next steps|who will|by when|timeline)/i,
        /(?:responsible|owner|assignee|deadline)/i
      ]
    };
    
    // Decision tracking
    this.activeDecisions = new Map();
    this.decisionHistory = new Map();
    
    // Metrics tracking
    this.metrics = {
      detectionsRun: 0,
      decisionPointsDetected: 0,
      unclearDecisionsDetected: 0,
      implementationGapsDetected: 0,
      averageDecisionClarity: 0
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the decision point detector
   */
  async initialize() {
    try {
      console.log('Initializing Decision Point Detector...');
      
      // Load historical decision patterns
      await this.loadDecisionPatterns();
      
      // Initialize decision tracking
      this.initializeDecisionTracking();
      
      this.initialized = true;
      console.log('✓ Decision Point Detector initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Decision Point Detector:', error);
      throw error;
    }
  }
  
  /**
   * Detect decision opportunities in conversation segment
   */
  async detectOpportunities(conversationSegment, context) {
    try {
      if (!this.initialized) {
        throw new Error('Decision Point Detector not initialized');
      }
      
      this.metrics.detectionsRun++;
      
      const opportunities = [];
      
      // 1. Detect explicit decision points
      const explicitDecisions = await this.detectExplicitDecisionPoints(conversationSegment, context);
      opportunities.push(...explicitDecisions);
      
      // 2. Identify implicit decision opportunities
      const implicitDecisions = await this.detectImplicitDecisionPoints(conversationSegment, context);
      opportunities.push(...implicitDecisions);
      
      // 3. Analyze consensus-building opportunities
      const consensusOpportunities = await this.detectConsensusOpportunities(conversationSegment, context);
      opportunities.push(...consensusOpportunities);
      
      // 4. Check for implementation clarity
      const implementationGaps = await this.detectImplementationGaps(conversationSegment, context);
      opportunities.push(...implementationGaps);
      
      // 5. Identify stalled decisions
      const stalledDecisions = await this.detectStalledDecisions(conversationSegment, context);
      opportunities.push(...stalledDecisions);
      
      // 6. Analyze decision quality
      const qualityIssues = await this.analyzeDecisionQuality(conversationSegment, context);
      opportunities.push(...qualityIssues);
      
      // Filter and validate opportunities
      const validOpportunities = this.filterOpportunities(opportunities);
      
      // Update decision tracking
      await this.updateDecisionTracking(validOpportunities, context);
      
      // Update metrics
      this.updateMetrics(validOpportunities);
      
      return validOpportunities;
      
    } catch (error) {
      console.error('Error in decision point detection:', error);
      return [];
    }
  }
  
  /**
   * Detect explicit decision points in conversation
   */
  async detectExplicitDecisionPoints(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      
      // Check explicit decision signals
      for (const signal of this.decisionSignals.explicit) {
        const matches = text.match(signal.pattern);
        
        if (matches) {
          for (const match of matches) {
            const opportunity = await this.createDecisionOpportunity(
              match,
              signal,
              segment,
              context,
              'explicit_decision_point'
            );
            
            if (opportunity) {
              opportunities.push(opportunity);
            }
          }
        }
      }
      
      // Analyze decision context
      const decisionContext = await this.analyzeDecisionContext(text, context);
      
      if (decisionContext.hasDecisionContext && decisionContext.clarity < 0.7) {
        const opportunity = {
          id: `decision_context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'DECISION_POINT',
          subtype: 'unclear_decision_context',
          title: 'Decision Context Needs Clarification',
          description: 'Decision discussion detected but context and options need clarification',
          confidence: 0.7,
          timestamp: segment.timestamp || Date.now(),
          realTimeActionable: true,
          actionable: true,
          suggestedActions: [
            'Clearly state the decision that needs to be made',
            'Outline the available options',
            'Define the criteria for making the decision',
            'Set a timeline for the decision'
          ],
          contextData: {
            decisionContext: decisionContext.context,
            clarity: decisionContext.clarity,
            options: decisionContext.options,
            segmentText: text.substring(0, 200)
          }
        };
        
        opportunities.push(opportunity);
      }
      
    } catch (error) {
      console.error('Error detecting explicit decision points:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Detect implicit decision opportunities
   */
  async detectImplicitDecisionPoints(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      
      // Check implicit decision signals
      for (const signal of this.decisionSignals.implicit) {
        const matches = text.match(signal.pattern);
        
        if (matches) {
          for (const match of matches) {
            const opportunity = await this.createDecisionOpportunity(
              match,
              signal,
              segment,
              context,
              'implicit_decision_point'
            );
            
            if (opportunity) {
              opportunities.push(opportunity);
            }
          }
        }
      }
      
      // Detect option enumeration without decision
      const optionAnalysis = this.analyzeOptionEnumeration(text);
      
      if (optionAnalysis.hasOptions && !optionAnalysis.hasDecision) {
        const opportunity = {
          id: `options_no_decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'DECISION_POINT',
          subtype: 'options_without_decision',
          title: 'Options Discussed Without Decision',
          description: `${optionAnalysis.optionCount} options identified but no decision made`,
          confidence: 0.8,
          timestamp: segment.timestamp || Date.now(),
          realTimeActionable: true,
          actionable: true,
          suggestedActions: [
            'Summarize the options that have been discussed',
            'Ask the group to evaluate each option',
            'Facilitate a decision-making process',
            'Set criteria for choosing between options'
          ],
          contextData: {
            optionCount: optionAnalysis.optionCount,
            options: optionAnalysis.options,
            hasDecisionProcess: optionAnalysis.hasDecisionProcess,
            segmentText: text.substring(0, 200)
          }
        };
        
        opportunities.push(opportunity);
      }
      
    } catch (error) {
      console.error('Error detecting implicit decision points:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Detect consensus-building opportunities
   */
  async detectConsensusOpportunities(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      
      // Check consensus signals
      for (const signal of this.decisionSignals.consensus) {
        const matches = text.match(signal.pattern);
        
        if (matches) {
          for (const match of matches) {
            const opportunity = await this.createDecisionOpportunity(
              match,
              signal,
              segment,
              context,
              'consensus_building'
            );
            
            if (opportunity) {
              opportunities.push(opportunity);
            }
          }
        }
      }
      
      // Detect disagreement without resolution
      const disagreementAnalysis = this.analyzeDisagreement(text);
      
      if (disagreementAnalysis.hasDisagreement && !disagreementAnalysis.hasResolution) {
        const opportunity = {
          id: `unresolved_disagreement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'DECISION_POINT',
          subtype: 'unresolved_disagreement',
          title: 'Unresolved Disagreement Detected',
          description: 'Disagreement identified but no resolution or consensus-building process initiated',
          confidence: 0.7,
          timestamp: segment.timestamp || Date.now(),
          realTimeActionable: true,
          actionable: true,
          suggestedActions: [
            'Acknowledge the different viewpoints',
            'Facilitate discussion to understand each perspective',
            'Look for common ground or compromise solutions',
            'Use structured decision-making techniques'
          ],
          contextData: {
            disagreementType: disagreementAnalysis.type,
            perspectives: disagreementAnalysis.perspectives,
            intensity: disagreementAnalysis.intensity,
            segmentText: text.substring(0, 200)
          }
        };
        
        opportunities.push(opportunity);
      }
      
    } catch (error) {
      console.error('Error detecting consensus opportunities:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Detect implementation gaps in decisions
   */
  async detectImplementationGaps(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      
      // Check for decisions without implementation details
      const implementationAnalysis = this.analyzeImplementationClarity(text);
      
      if (implementationAnalysis.hasDecision && implementationAnalysis.clarity < this.options.implementationClarityThreshold) {
        const missingElements = implementationAnalysis.missingElements;
        
        const opportunity = {
          id: `implementation_gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'DECISION_POINT',
          subtype: 'implementation_gap',
          title: 'Decision Implementation Details Missing',
          description: `Decision made but missing: ${missingElements.join(', ')}`,
          confidence: 0.8,
          timestamp: segment.timestamp || Date.now(),
          realTimeActionable: true,
          actionable: true,
          suggestedActions: this.getImplementationActions(missingElements),
          contextData: {
            decision: implementationAnalysis.decision,
            missingElements,
            clarity: implementationAnalysis.clarity,
            hasOwner: implementationAnalysis.hasOwner,
            hasDeadline: implementationAnalysis.hasDeadline,
            hasActionItems: implementationAnalysis.hasActionItems
          }
        };
        
        opportunities.push(opportunity);
        this.metrics.implementationGapsDetected++;
      }
      
      // Check implementation signals
      for (const signal of this.decisionSignals.implementation) {
        const matches = text.match(signal.pattern);
        
        if (matches) {
          // This indicates good implementation planning
          // We can track this for positive reinforcement
          continue;
        }
      }
      
    } catch (error) {
      console.error('Error detecting implementation gaps:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Detect stalled decisions
   */
  async detectStalledDecisions(segment, context) {
    const opportunities = [];
    
    try {
      const meetingId = context.meetingId;
      
      // Check for decisions that have been discussed multiple times without resolution
      if (this.decisionHistory.has(meetingId)) {
        const history = this.decisionHistory.get(meetingId);
        const stalledDecisions = this.identifyStalledDecisions(history);
        
        for (const stalledDecision of stalledDecisions) {
          const opportunity = {
            id: `stalled_decision_${stalledDecision.id}_${Date.now()}`,
            type: 'DECISION_POINT',
            subtype: 'stalled_decision',
            title: 'Stalled Decision Detected',
            description: `Decision "${stalledDecision.topic}" has been discussed ${stalledDecision.discussionCount} times without resolution`,
            confidence: 0.8,
            timestamp: Date.now(),
            realTimeActionable: true,
            actionable: true,
            suggestedActions: [
              'Acknowledge that this decision has been discussed before',
              'Identify what is preventing the decision from being made',
              'Set a specific deadline for making the decision',
              'Assign someone to gather additional information if needed',
              'Use a structured decision-making framework'
            ],
            contextData: {
              decisionTopic: stalledDecision.topic,
              discussionCount: stalledDecision.discussionCount,
              firstDiscussed: stalledDecision.firstDiscussed,
              lastDiscussed: stalledDecision.lastDiscussed,
              barriers: stalledDecision.barriers
            }
          };
          
          opportunities.push(opportunity);
        }
      }
      
    } catch (error) {
      console.error('Error detecting stalled decisions:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Analyze decision quality
   */
  async analyzeDecisionQuality(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      
      // Check for unclear decision outcomes
      const hasUnclearOutcome = this.qualityIndicators.unclear_outcome.some(pattern => 
        pattern.test(text)
      );
      
      if (hasUnclearOutcome) {
        const opportunity = {
          id: `unclear_decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'DECISION_POINT',
          subtype: 'unclear_decision_outcome',
          title: 'Unclear Decision Outcome',
          description: 'Decision discussion ended without clear resolution or commitment',
          confidence: 0.7,
          timestamp: segment.timestamp || Date.now(),
          realTimeActionable: false, // Usually detected after the fact
          actionable: true,
          suggestedActions: [
            'Clarify what decision was actually made',
            'Confirm commitment from all stakeholders',
            'Document the decision clearly',
            'Establish next steps and accountability'
          ],
          contextData: {
            unclearIndicators: this.extractUnclearIndicators(text),
            segmentText: text.substring(0, 200)
          }
        };
        
        opportunities.push(opportunity);
        this.metrics.unclearDecisionsDetected++;
      }
      
      // Check decision quality factors
      const qualityAnalysis = this.assessDecisionQuality(text);
      
      if (qualityAnalysis.overallQuality < 0.6) {
        const opportunity = {
          id: `low_quality_decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'DECISION_POINT',
          subtype: 'low_quality_decision',
          title: 'Decision Quality Concerns',
          description: `Decision process shows quality concerns: ${qualityAnalysis.concerns.join(', ')}`,
          confidence: 0.6,
          timestamp: segment.timestamp || Date.now(),
          realTimeActionable: false,
          actionable: true,
          suggestedActions: [
            'Review the decision-making process',
            'Ensure all relevant information was considered',
            'Verify stakeholder input was gathered',
            'Consider if the decision needs to be revisited'
          ],
          contextData: {
            qualityScore: qualityAnalysis.overallQuality,
            concerns: qualityAnalysis.concerns,
            strengths: qualityAnalysis.strengths,
            recommendations: qualityAnalysis.recommendations
          }
        };
        
        opportunities.push(opportunity);
      }
      
    } catch (error) {
      console.error('Error analyzing decision quality:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Create decision opportunity from detected signal
   */
  async createDecisionOpportunity(match, signal, segment, context, subtype) {
    try {
      const confidence = signal.weight * 0.9; // High confidence for decision signals
      
      if (confidence < this.options.confidenceThreshold) {
        return null;
      }
      
      const opportunity = {
        id: `decision_${subtype}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'DECISION_POINT',
        subtype: subtype,
        title: this.getDecisionOpportunityTitle(subtype),
        description: `Decision signal detected: "${match}"`,
        confidence: confidence,
        timestamp: segment.timestamp || Date.now(),
        realTimeActionable: true,
        actionable: true,
        suggestedActions: this.getDecisionActions(subtype, signal),
        contextData: {
          decisionSignal: match,
          signalWeight: signal.weight,
          urgency: signal.urgency,
          segmentText: this.extractText(segment).substring(0, 150)
        }
      };
      
      this.metrics.decisionPointsDetected++;
      
      return opportunity;
      
    } catch (error) {
      console.error('Error creating decision opportunity:', error);
      return null;
    }
  }
  
  /**
   * Helper methods
   */
  extractText(segment) {
    if (typeof segment === 'string') {
      return segment;
    }
    
    return segment.text || segment.transcript || segment.content || '';
  }
  
  async analyzeDecisionContext(text, context) {
    try {
      const hasDecisionKeywords = /(?:decision|decide|choose|select|option|choice)/i.test(text);
      
      if (!hasDecisionKeywords) {
        return { hasDecisionContext: false, clarity: 0, context: '', options: [] };
      }
      
      // Analyze clarity of decision context
      let clarity = 0.5;
      const options = [];
      
      // Check for clear problem statement
      if (/(?:the (?:issue|problem|question) is|we need to (?:decide|determine))/i.test(text)) {
        clarity += 0.2;
      }
      
      // Check for enumerated options
      const optionPatterns = [
        /(?:option|choice|alternative)\s+(?:one|1|a)/i,
        /(?:option|choice|alternative)\s+(?:two|2|b)/i,
        /(?:first|second|third)\s+(?:option|choice|alternative)/i
      ];
      
      optionPatterns.forEach(pattern => {
        if (pattern.test(text)) {
          clarity += 0.1;
          options.push('Option identified');
        }
      });
      
      // Check for criteria or constraints
      if (/(?:criteria|requirements|constraints|must|should)/i.test(text)) {
        clarity += 0.1;
      }
      
      return {
        hasDecisionContext: true,
        clarity: Math.min(1.0, clarity),
        context: text.substring(0, 100),
        options
      };
      
    } catch (error) {
      console.error('Error analyzing decision context:', error);
      return { hasDecisionContext: false, clarity: 0, context: '', options: [] };
    }
  }
  
  analyzeOptionEnumeration(text) {
    const optionIndicators = [
      /(?:option|choice|alternative)\s+(?:one|1|a|first)/i,
      /(?:option|choice|alternative)\s+(?:two|2|b|second)/i,
      /(?:option|choice|alternative)\s+(?:three|3|c|third)/i,
      /(?:we could|we can|we might)\s+(?:either|also)/i,
      /(?:on one hand|on the other hand|alternatively)/i
    ];
    
    const decisionIndicators = [
      /(?:we've decided|decision is|we'll go with)/i,
      /(?:let's choose|let's pick|let's select)/i,
      /(?:final decision|conclusion|agreed)/i
    ];
    
    const processIndicators = [
      /(?:let's evaluate|let's compare|let's weigh)/i,
      /(?:pros and cons|advantages|disadvantages)/i,
      /(?:vote|poll|consensus)/i
    ];
    
    const optionCount = optionIndicators.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    const hasDecision = decisionIndicators.some(pattern => pattern.test(text));
    const hasDecisionProcess = processIndicators.some(pattern => pattern.test(text));
    
    return {
      hasOptions: optionCount > 0,
      optionCount,
      options: optionIndicators.map(pattern => {
        const match = text.match(pattern);
        return match ? match[0] : null;
      }).filter(Boolean),
      hasDecision,
      hasDecisionProcess
    };
  }
  
  analyzeDisagreement(text) {
    const disagreementIndicators = [
      { pattern: /(?:i disagree|i don't agree|i think differently)/i, type: 'direct', intensity: 0.8 },
      { pattern: /(?:but|however|on the contrary|actually)/i, type: 'soft', intensity: 0.4 },
      { pattern: /(?:that's not right|that's wrong|i don't think so)/i, type: 'direct', intensity: 0.9 },
      { pattern: /(?:different perspective|another view|alternative approach)/i, type: 'constructive', intensity: 0.5 }
    ];
    
    const resolutionIndicators = [
      /(?:let's find|let's look for)\s+(?:common ground|compromise)/i,
      /(?:we can agree|consensus|middle ground)/i,
      /(?:resolved|settled|agreed)/i
    ];
    
    let hasDisagreement = false;
    let disagreementType = 'none';
    let intensity = 0;
    const perspectives = [];
    
    for (const indicator of disagreementIndicators) {
      if (indicator.pattern.test(text)) {
        hasDisagreement = true;
        disagreementType = indicator.type;
        intensity = Math.max(intensity, indicator.intensity);
        perspectives.push(indicator.type);
      }
    }
    
    const hasResolution = resolutionIndicators.some(pattern => pattern.test(text));
    
    return {
      hasDisagreement,
      type: disagreementType,
      intensity,
      perspectives: [...new Set(perspectives)],
      hasResolution
    };
  }
  
  analyzeImplementationClarity(text) {
    const decisionIndicators = [
      /(?:we've decided|decision is|we'll go with|agreed to)/i,
      /(?:final decision|conclusion|resolved)/i
    ];
    
    const implementationElements = {
      owner: /(?:who will|who's responsible|assigned to|owner)/i,
      deadline: /(?:by when|deadline|due date|timeline)/i,
      actionItems: /(?:action items|next steps|tasks|follow up)/i,
      success: /(?:success criteria|how we'll know|measure|outcome)/i
    };
    
    const hasDecision = decisionIndicators.some(pattern => pattern.test(text));
    
    if (!hasDecision) {
      return { hasDecision: false, clarity: 0, missingElements: [] };
    }
    
    const presentElements = [];
    const missingElements = [];
    
    Object.entries(implementationElements).forEach(([element, pattern]) => {
      if (pattern.test(text)) {
        presentElements.push(element);
      } else {
        missingElements.push(element);
      }
    });
    
    const clarity = presentElements.length / Object.keys(implementationElements).length;
    
    return {
      hasDecision: true,
      clarity,
      missingElements,
      hasOwner: presentElements.includes('owner'),
      hasDeadline: presentElements.includes('deadline'),
      hasActionItems: presentElements.includes('actionItems'),
      hasSuccessCriteria: presentElements.includes('success'),
      decision: this.extractDecision(text)
    };
  }
  
  extractDecision(text) {
    const decisionPatterns = [
      /(?:we've decided to|decision is to|we'll go with)\s+([^.!?]+)/i,
      /(?:agreed to|conclusion is)\s+([^.!?]+)/i
    ];
    
    for (const pattern of decisionPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Decision mentioned but not clearly stated';
  }
  
  identifyStalledDecisions(history) {
    const stalledDecisions = [];
    const topicCounts = new Map();
    
    // Count discussions by topic
    history.forEach(entry => {
      if (entry.topic) {
        const count = topicCounts.get(entry.topic) || 0;
        topicCounts.set(entry.topic, count + 1);
      }
    });
    
    // Identify topics discussed multiple times without resolution
    topicCounts.forEach((count, topic) => {
      if (count >= 3) { // Discussed 3+ times
        const entries = history.filter(entry => entry.topic === topic);
        const hasResolution = entries.some(entry => entry.resolved);
        
        if (!hasResolution) {
          stalledDecisions.push({
            id: topic.toLowerCase().replace(/\s+/g, '_'),
            topic,
            discussionCount: count,
            firstDiscussed: Math.min(...entries.map(e => e.timestamp)),
            lastDiscussed: Math.max(...entries.map(e => e.timestamp)),
            barriers: this.identifyDecisionBarriers(entries)
          });
        }
      }
    });
    
    return stalledDecisions;
  }
  
  identifyDecisionBarriers(entries) {
    const barriers = [];
    
    // Analyze common barriers from entry content
    const allText = entries.map(e => e.content || '').join(' ');
    
    if (/(?:need more|not enough)\s+(?:information|data|details)/i.test(allText)) {
      barriers.push('Insufficient information');
    }
    
    if (/(?:stakeholder|approval|sign.?off)/i.test(allText)) {
      barriers.push('Stakeholder approval needed');
    }
    
    if (/(?:budget|cost|funding|resource)/i.test(allText)) {
      barriers.push('Resource constraints');
    }
    
    if (/(?:timeline|deadline|time|urgent)/i.test(allText)) {
      barriers.push('Time constraints');
    }
    
    return barriers;
  }
  
  extractUnclearIndicators(text) {
    const indicators = [];
    
    this.qualityIndicators.unclear_outcome.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        indicators.push(...matches);
      }
    });
    
    return indicators;
  }
  
  assessDecisionQuality(text) {
    const qualityFactors = {
      hasInformation: /(?:based on|according to|data shows|research indicates)/i.test(text),
      hasStakeholderInput: /(?:team thinks|everyone agrees|input from|feedback)/i.test(text),
      hasAlternatives: /(?:considered|evaluated|compared|alternatives)/i.test(text),
      hasCriteria: /(?:criteria|requirements|factors|considerations)/i.test(text),
      hasRisks: /(?:risks|concerns|challenges|potential issues)/i.test(text),
      hasTimeline: /(?:timeline|deadline|when|by)/i.test(text)
    };
    
    const presentFactors = Object.values(qualityFactors).filter(Boolean).length;
    const totalFactors = Object.keys(qualityFactors).length;
    const overallQuality = presentFactors / totalFactors;
    
    const concerns = [];
    const strengths = [];
    
    if (!qualityFactors.hasInformation) concerns.push('Lack of supporting information');
    if (!qualityFactors.hasStakeholderInput) concerns.push('Limited stakeholder input');
    if (!qualityFactors.hasAlternatives) concerns.push('No alternatives considered');
    if (!qualityFactors.hasCriteria) concerns.push('No clear decision criteria');
    if (!qualityFactors.hasRisks) concerns.push('Risks not addressed');
    if (!qualityFactors.hasTimeline) concerns.push('No implementation timeline');
    
    Object.entries(qualityFactors).forEach(([factor, present]) => {
      if (present) {
        strengths.push(factor.replace('has', '').toLowerCase());
      }
    });
    
    return {
      overallQuality,
      concerns,
      strengths,
      recommendations: this.generateQualityRecommendations(concerns)
    };
  }
  
  generateQualityRecommendations(concerns) {
    const recommendations = [];
    
    if (concerns.includes('Lack of supporting information')) {
      recommendations.push('Gather relevant data and research before finalizing');
    }
    
    if (concerns.includes('Limited stakeholder input')) {
      recommendations.push('Consult with key stakeholders and affected parties');
    }
    
    if (concerns.includes('No alternatives considered')) {
      recommendations.push('Evaluate multiple options before deciding');
    }
    
    if (concerns.includes('No clear decision criteria')) {
      recommendations.push('Define clear criteria for evaluating options');
    }
    
    return recommendations;
  }
  
  getDecisionOpportunityTitle(subtype) {
    const titles = {
      explicit_decision_point: 'Decision Point Identified',
      implicit_decision_point: 'Potential Decision Opportunity',
      consensus_building: 'Consensus Building Opportunity',
      implementation_gap: 'Implementation Planning Needed',
      stalled_decision: 'Stalled Decision Detected',
      unclear_decision_outcome: 'Decision Outcome Unclear'
    };
    
    return titles[subtype] || 'Decision Opportunity';
  }
  
  getDecisionActions(subtype, signal) {
    const baseActions = {
      explicit_decision_point: [
        'Clearly frame the decision that needs to be made',
        'Identify and present the available options',
        'Set criteria for evaluating options',
        'Facilitate the decision-making process'
      ],
      implicit_decision_point: [
        'Acknowledge that a decision opportunity exists',
        'Ask if the group wants to make a decision now',
        'Clarify the options being discussed',
        'Suggest a structured approach to deciding'
      ],
      consensus_building: [
        'Check for agreement among participants',
        'Address any concerns or objections',
        'Look for common ground',
        'Facilitate consensus-building discussion'
      ]
    };
    
    return baseActions[subtype] || [
      'Address the decision opportunity',
      'Clarify the options and criteria',
      'Facilitate group decision-making',
      'Ensure clear outcomes and next steps'
    ];
  }
  
  getImplementationActions(missingElements) {
    const actions = [];
    
    if (missingElements.includes('owner')) {
      actions.push('Assign a clear owner or responsible party');
    }
    
    if (missingElements.includes('deadline')) {
      actions.push('Set a specific deadline or timeline');
    }
    
    if (missingElements.includes('actionItems')) {
      actions.push('Define specific action items and tasks');
    }
    
    if (missingElements.includes('success')) {
      actions.push('Establish success criteria and measures');
    }
    
    return actions;
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
  
  async updateDecisionTracking(opportunities, context) {
    try {
      const meetingId = context.meetingId;
      
      if (!this.decisionHistory.has(meetingId)) {
        this.decisionHistory.set(meetingId, []);
      }
      
      const history = this.decisionHistory.get(meetingId);
      
      opportunities.forEach(opp => {
        if (opp.type === 'DECISION_POINT') {
          history.push({
            timestamp: opp.timestamp,
            topic: this.extractTopicFromOpportunity(opp),
            type: opp.subtype,
            resolved: opp.subtype === 'clear_decision_outcome',
            content: opp.description
          });
        }
      });
      
      // Keep history manageable
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
    } catch (error) {
      console.error('Error updating decision tracking:', error);
    }
  }
  
  extractTopicFromOpportunity(opportunity) {
    // Extract topic from opportunity context
    if (opportunity.contextData && opportunity.contextData.decisionSignal) {
      return opportunity.contextData.decisionSignal.substring(0, 50);
    }
    
    return opportunity.title;
  }
  
  updateMetrics(opportunities) {
    opportunities.forEach(opp => {
      switch (opp.subtype) {
        case 'explicit_decision_point':
        case 'implicit_decision_point':
          this.metrics.decisionPointsDetected++;
          break;
        case 'unclear_decision_outcome':
          this.metrics.unclearDecisionsDetected++;
          break;
        case 'implementation_gap':
          this.metrics.implementationGapsDetected++;
          break;
      }
    });
    
    // Calculate average decision clarity
    const clarityOpportunities = opportunities.filter(opp => 
      opp.contextData && typeof opp.contextData.clarity === 'number'
    );
    
    if (clarityOpportunities.length > 0) {
      const avgClarity = clarityOpportunities.reduce((sum, opp) => 
        sum + opp.contextData.clarity, 0
      ) / clarityOpportunities.length;
      
      this.metrics.averageDecisionClarity = 
        (this.metrics.averageDecisionClarity + avgClarity) / 2;
    }
  }
  
  async loadDecisionPatterns() {
    try {
      // Load historical decision patterns from database
      console.log('Loading decision patterns...');
      
      // This would query historical data to improve detection accuracy
      
    } catch (error) {
      console.error('Error loading decision patterns:', error);
    }
  }
  
  initializeDecisionTracking() {
    // Initialize decision tracking systems
    console.log('Initializing decision tracking...');
  }
  
  /**
   * Get detector metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      initialized: this.initialized,
      activeDecisions: this.activeDecisions.size,
      trackedMeetings: this.decisionHistory.size
    };
  }
  
  /**
   * Reset for new meeting
   */
  resetForNewMeeting(meetingId) {
    this.activeDecisions.clear();
    // Keep decision history for cross-meeting analysis
  }
  
  /**
   * Shutdown detector gracefully
   */
  async shutdown() {
    console.log('Shutting down Decision Point Detector...');
    
    this.activeDecisions.clear();
    this.decisionHistory.clear();
    this.initialized = false;
    
    console.log('✓ Decision Point Detector shutdown complete');
  }
}

module.exports = DecisionPointDetector;
