/**
 * Clarification Detector Algorithm
 * 
 * Identifies moments when participants need clarification but don't ask,
 * or when confusion signals indicate missed understanding opportunities.
 */

class ClarificationDetector {
  constructor(supabase, options = {}) {
    this.supabase = supabase;
    this.options = {
      confidenceThreshold: 0.6,
      contextWindow: 30, // seconds
      confusionSignalWeight: 0.8,
      semanticAnalysisWeight: 0.7,
      ...options
    };
    
    // Confusion signal patterns
    this.confusionSignals = [
      // Direct confusion expressions
      { pattern: /(?:i don't|i do not)\s+(?:understand|get|follow)/i, weight: 0.9, type: 'direct' },
      { pattern: /(?:can you|could you)\s+(?:clarify|explain|elaborate)/i, weight: 0.8, type: 'request' },
      { pattern: /what do you mean\s+(?:by|when)/i, weight: 0.8, type: 'request' },
      { pattern: /i'm (?:not sure|unclear|confused)\s+(?:about|on|what)/i, weight: 0.7, type: 'uncertainty' },
      { pattern: /(?:sorry|excuse me),?\s+(?:what|how|why)/i, weight: 0.6, type: 'polite_confusion' },
      
      // Indirect confusion indicators
      { pattern: /(?:um|uh|er)\s+(?:what|how|why)/i, weight: 0.5, type: 'hesitation' },
      { pattern: /(?:wait|hold on),?\s+(?:what|how|why)/i, weight: 0.6, type: 'interruption' },
      { pattern: /(?:so|just to)\s+(?:clarify|confirm|understand)/i, weight: 0.7, type: 'verification' },
      { pattern: /(?:let me|can i)\s+(?:make sure|check|verify)/i, weight: 0.6, type: 'verification' },
      
      // Semantic confusion patterns
      { pattern: /(?:that doesn't|this doesn't)\s+(?:make sense|sound right)/i, weight: 0.8, type: 'disagreement' },
      { pattern: /(?:i think|it seems)\s+(?:there's|we have)\s+(?:a|some)\s+(?:confusion|misunderstanding)/i, weight: 0.9, type: 'meta_confusion' },
      { pattern: /(?:are we|is everyone)\s+(?:on the same page|talking about)/i, weight: 0.7, type: 'alignment_check' }
    ];
    
    // Technical jargon patterns that often need clarification
    this.jargonPatterns = [
      /\b[A-Z]{2,}\b/g, // Acronyms
      /\b\w+(?:API|SDK|SLA|KPI|ROI|CRM|ERP)\b/gi, // Technical terms
      /\b(?:implementation|architecture|infrastructure|methodology)\b/gi, // Complex concepts
      /\b(?:synergy|leverage|optimize|streamline|paradigm)\b/gi // Business jargon
    ];
    
    // Metrics tracking
    this.metrics = {
      detectionsRun: 0,
      opportunitiesFound: 0,
      averageConfidence: 0,
      falsePositives: 0
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the clarification detector
   */
  async initialize() {
    try {
      console.log('Initializing Clarification Detector...');
      
      // Load historical clarification patterns from database
      await this.loadHistoricalPatterns();
      
      // Initialize AI models for semantic analysis
      await this.initializeSemanticAnalysis();
      
      this.initialized = true;
      console.log('✓ Clarification Detector initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Clarification Detector:', error);
      throw error;
    }
  }
  
  /**
   * Detect clarification opportunities in conversation segment
   */
  async detectOpportunities(conversationSegment, context) {
    try {
      if (!this.initialized) {
        throw new Error('Clarification Detector not initialized');
      }
      
      this.metrics.detectionsRun++;
      
      const opportunities = [];
      
      // 1. Analyze explicit confusion signals
      const explicitOpportunities = await this.analyzeExplicitConfusion(conversationSegment, context);
      opportunities.push(...explicitOpportunities);
      
      // 2. Detect semantic confusion through AI analysis
      const semanticOpportunities = await this.analyzeSemanticConfusion(conversationSegment, context);
      opportunities.push(...semanticOpportunities);
      
      // 3. Identify missed clarification moments
      const missedOpportunities = await this.identifyMissedClarifications(conversationSegment, context);
      opportunities.push(...missedOpportunities);
      
      // 4. Analyze jargon usage without explanation
      const jargonOpportunities = await this.analyzeJargonUsage(conversationSegment, context);
      opportunities.push(...jargonOpportunities);
      
      // 5. Filter and validate opportunities
      const validOpportunities = this.filterOpportunities(opportunities);
      
      // Update metrics
      this.metrics.opportunitiesFound += validOpportunities.length;
      if (validOpportunities.length > 0) {
        const avgConfidence = validOpportunities.reduce((sum, opp) => sum + opp.confidence, 0) / validOpportunities.length;
        this.metrics.averageConfidence = (this.metrics.averageConfidence + avgConfidence) / 2;
      }
      
      return validOpportunities;
      
    } catch (error) {
      console.error('Error in clarification detection:', error);
      return [];
    }
  }
  
  /**
   * Analyze explicit confusion signals in conversation
   */
  async analyzeExplicitConfusion(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      const speakers = this.extractSpeakers(segment);
      
      // Check each confusion signal pattern
      for (const signal of this.confusionSignals) {
        const matches = text.match(signal.pattern);
        
        if (matches) {
          for (const match of matches) {
            const opportunity = await this.createConfusionOpportunity(
              match,
              signal,
              segment,
              context,
              'explicit_confusion'
            );
            
            if (opportunity) {
              opportunities.push(opportunity);
            }
          }
        }
      }
      
      // Analyze speaker patterns for confusion
      const speakerConfusion = await this.analyzeSpeakerConfusionPatterns(speakers, text, context);
      opportunities.push(...speakerConfusion);
      
    } catch (error) {
      console.error('Error analyzing explicit confusion:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Analyze semantic confusion through AI
   */
  async analyzeSemanticConfusion(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      
      if (text.length < 50) {
        return opportunities; // Too short for meaningful analysis
      }
      
      // Use AI to analyze semantic clarity
      const semanticAnalysis = await this.performSemanticAnalysis(text, context);
      
      if (semanticAnalysis.confusionLikelihood > 0.6) {
        const opportunity = {
          id: `clarification_semantic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'CLARIFICATION_NEEDED',
          subtype: 'semantic_confusion',
          title: 'Potential Semantic Confusion Detected',
          description: `AI analysis suggests potential confusion in discussion: ${semanticAnalysis.confusionReason}`,
          confidence: semanticAnalysis.confusionLikelihood * this.options.semanticAnalysisWeight,
          timestamp: segment.timestamp || Date.now(),
          realTimeActionable: true,
          actionable: true,
          suggestedActions: [
            'Ask participants if the current discussion is clear',
            'Provide a brief summary of key points',
            'Check for understanding before proceeding',
            'Offer to clarify any confusing concepts'
          ],
          contextData: {
            segmentText: text.substring(0, 200),
            confusionReason: semanticAnalysis.confusionReason,
            confusionLikelihood: semanticAnalysis.confusionLikelihood,
            suggestedClarifications: semanticAnalysis.suggestedClarifications
          },
          aiInsights: {
            model: 'semantic_analysis',
            analysisType: 'confusion_detection',
            confidence: semanticAnalysis.confidence
          }
        };
        
        opportunities.push(opportunity);
      }
      
    } catch (error) {
      console.error('Error in semantic confusion analysis:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Identify missed clarification opportunities
   */
  async identifyMissedClarifications(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      const conversationFlow = this.analyzeConversationFlow(segment);
      
      // Look for rapid topic changes without clarification
      const rapidChanges = this.detectRapidTopicChanges(conversationFlow);
      
      for (const change of rapidChanges) {
        if (change.clarificationNeeded && !change.clarificationProvided) {
          const opportunity = {
            id: `clarification_missed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'CLARIFICATION_NEEDED',
            subtype: 'missed_clarification',
            title: 'Missed Clarification Opportunity',
            description: `Rapid topic change from "${change.fromTopic}" to "${change.toTopic}" without clarification`,
            confidence: 0.7,
            timestamp: change.timestamp,
            realTimeActionable: false, // Too late for real-time action
            actionable: true,
            suggestedActions: [
              'Acknowledge the topic change in future meetings',
              'Provide brief context when switching topics',
              'Check for understanding after topic transitions',
              'Use transition phrases to signal topic changes'
            ],
            contextData: {
              fromTopic: change.fromTopic,
              toTopic: change.toTopic,
              transitionSpeed: change.speed,
              participantsAffected: change.participantsAffected
            }
          };
          
          opportunities.push(opportunity);
        }
      }
      
      // Look for complex explanations without follow-up questions
      const complexExplanations = this.detectComplexExplanations(text, conversationFlow);
      
      for (const explanation of complexExplanations) {
        if (explanation.complexity > 0.7 && !explanation.hasFollowUp) {
          const opportunity = {
            id: `clarification_complex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'CLARIFICATION_NEEDED',
            subtype: 'complex_explanation',
            title: 'Complex Explanation Without Follow-up',
            description: `Complex explanation provided without checking for understanding`,
            confidence: 0.6,
            timestamp: explanation.timestamp,
            realTimeActionable: true,
            actionable: true,
            suggestedActions: [
              'Ask "Does that make sense to everyone?"',
              'Invite questions about the explanation',
              'Provide a brief summary of key points',
              'Check for non-verbal confusion signals'
            ],
            contextData: {
              explanation: explanation.text.substring(0, 150),
              complexity: explanation.complexity,
              speaker: explanation.speaker,
              duration: explanation.duration
            }
          };
          
          opportunities.push(opportunity);
        }
      }
      
    } catch (error) {
      console.error('Error identifying missed clarifications:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Analyze jargon usage without explanation
   */
  async analyzeJargonUsage(segment, context) {
    const opportunities = [];
    
    try {
      const text = this.extractText(segment);
      const jargonTerms = this.extractJargonTerms(text);
      
      if (jargonTerms.length === 0) {
        return opportunities;
      }
      
      // Check if jargon terms were explained
      const unexplainedJargon = await this.identifyUnexplainedJargon(jargonTerms, text, context);
      
      if (unexplainedJargon.length > 0) {
        const opportunity = {
          id: `clarification_jargon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'CLARIFICATION_NEEDED',
          subtype: 'jargon_usage',
          title: 'Unexplained Jargon Usage',
          description: `${unexplainedJargon.length} technical terms used without explanation`,
          confidence: Math.min(0.8, unexplainedJargon.length * 0.2),
          timestamp: segment.timestamp || Date.now(),
          realTimeActionable: true,
          actionable: true,
          suggestedActions: [
            'Define technical terms when first introduced',
            'Ask if everyone is familiar with the terminology',
            'Provide brief explanations for acronyms',
            'Create a glossary for recurring technical terms'
          ],
          contextData: {
            unexplainedTerms: unexplainedJargon,
            totalJargonCount: jargonTerms.length,
            segmentText: text.substring(0, 200)
          }
        };
        
        opportunities.push(opportunity);
      }
      
    } catch (error) {
      console.error('Error analyzing jargon usage:', error);
    }
    
    return opportunities;
  }
  
  /**
   * Create confusion opportunity from detected signal
   */
  async createConfusionOpportunity(match, signal, segment, context, subtype) {
    try {
      const confidence = signal.weight * this.options.confusionSignalWeight;
      
      if (confidence < this.options.confidenceThreshold) {
        return null;
      }
      
      const opportunity = {
        id: `clarification_${subtype}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'CLARIFICATION_NEEDED',
        subtype: subtype,
        title: this.getOpportunityTitle(signal.type),
        description: `Confusion signal detected: "${match}"`,
        confidence: confidence,
        timestamp: segment.timestamp || Date.now(),
        realTimeActionable: true,
        actionable: true,
        suggestedActions: this.getSuggestedActions(signal.type),
        contextData: {
          confusionSignal: match,
          signalType: signal.type,
          signalWeight: signal.weight,
          segmentText: this.extractText(segment).substring(0, 150)
        }
      };
      
      return opportunity;
      
    } catch (error) {
      console.error('Error creating confusion opportunity:', error);
      return null;
    }
  }
  
  /**
   * Perform semantic analysis using AI
   */
  async performSemanticAnalysis(text, context) {
    try {
      // This would integrate with the Triple-AI system
      // For now, using heuristic analysis
      
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let confusionScore = 0;
      let confusionReasons = [];
      
      // Analyze sentence complexity
      for (const sentence of sentences) {
        const words = sentence.trim().split(/\s+/);
        
        // Long sentences may be confusing
        if (words.length > 25) {
          confusionScore += 0.2;
          confusionReasons.push('Long, complex sentences detected');
        }
        
        // Multiple clauses may be confusing
        const clauses = sentence.split(/,|;|\band\b|\bor\b|\bbut\b/);
        if (clauses.length > 4) {
          confusionScore += 0.15;
          confusionReasons.push('Multiple clauses in single sentence');
        }
        
        // Technical density
        const jargonCount = this.extractJargonTerms(sentence).length;
        if (jargonCount > 3) {
          confusionScore += 0.25;
          confusionReasons.push('High technical term density');
        }
      }
      
      // Analyze overall coherence
      const topicChanges = this.countTopicChanges(text);
      if (topicChanges > 3) {
        confusionScore += 0.2;
        confusionReasons.push('Frequent topic changes');
      }
      
      return {
        confusionLikelihood: Math.min(1.0, confusionScore),
        confusionReason: confusionReasons.join('; '),
        confidence: 0.7,
        suggestedClarifications: this.generateClarificationSuggestions(confusionReasons)
      };
      
    } catch (error) {
      console.error('Error in semantic analysis:', error);
      return {
        confusionLikelihood: 0,
        confusionReason: 'Analysis failed',
        confidence: 0,
        suggestedClarifications: []
      };
    }
  }
  
  /**
   * Helper methods
   */
  extractText(segment) {
    if (typeof segment === 'string') {
      return segment;
    }
    
    if (segment.text) {
      return segment.text;
    }
    
    if (segment.transcript) {
      return segment.transcript;
    }
    
    if (segment.content) {
      return segment.content;
    }
    
    return '';
  }
  
  extractSpeakers(segment) {
    if (segment.speakers) {
      return segment.speakers;
    }
    
    if (segment.participants) {
      return segment.participants;
    }
    
    return [];
  }
  
  extractJargonTerms(text) {
    const jargonTerms = [];
    
    for (const pattern of this.jargonPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        jargonTerms.push(...matches);
      }
    }
    
    return [...new Set(jargonTerms)]; // Remove duplicates
  }
  
  analyzeConversationFlow(segment) {
    // Simplified conversation flow analysis
    const text = this.extractText(segment);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      sentenceCount: sentences.length,
      averageSentenceLength: sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length,
      topicChanges: this.countTopicChanges(text),
      questionCount: (text.match(/\?/g) || []).length
    };
  }
  
  detectRapidTopicChanges(conversationFlow) {
    // Simplified topic change detection
    // In a real implementation, this would use more sophisticated NLP
    
    const changes = [];
    
    if (conversationFlow.topicChanges > 2) {
      changes.push({
        fromTopic: 'Previous topic',
        toTopic: 'New topic',
        speed: 'rapid',
        timestamp: Date.now(),
        clarificationNeeded: true,
        clarificationProvided: false,
        participantsAffected: ['all']
      });
    }
    
    return changes;
  }
  
  detectComplexExplanations(text, conversationFlow) {
    const explanations = [];
    
    // Look for explanation indicators
    const explanationPatterns = [
      /(?:let me explain|i'll explain|to explain)/i,
      /(?:what this means|what i mean|in other words)/i,
      /(?:basically|essentially|fundamentally)/i
    ];
    
    for (const pattern of explanationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        explanations.push({
          text: text,
          complexity: this.calculateComplexity(text),
          hasFollowUp: this.hasFollowUpQuestions(text),
          timestamp: Date.now(),
          speaker: 'unknown',
          duration: text.length / 10 // Rough estimate
        });
      }
    }
    
    return explanations;
  }
  
  calculateComplexity(text) {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const jargonCount = this.extractJargonTerms(text).length;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const jargonDensity = jargonCount / words.length;
    
    let complexity = 0;
    
    if (avgWordsPerSentence > 20) complexity += 0.3;
    if (jargonDensity > 0.1) complexity += 0.4;
    if (sentences.length > 5) complexity += 0.2;
    
    return Math.min(1.0, complexity);
  }
  
  hasFollowUpQuestions(text) {
    const followUpPatterns = [
      /(?:any questions|questions about|does that make sense)/i,
      /(?:is that clear|are you following|understand so far)/i,
      /(?:make sense|clear to everyone)/i
    ];
    
    return followUpPatterns.some(pattern => pattern.test(text));
  }
  
  countTopicChanges(text) {
    // Simplified topic change counting
    const transitionWords = [
      'however', 'meanwhile', 'furthermore', 'additionally',
      'on the other hand', 'moving on', 'next', 'also',
      'by the way', 'speaking of', 'that reminds me'
    ];
    
    let changes = 0;
    for (const word of transitionWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        changes += matches.length;
      }
    }
    
    return changes;
  }
  
  async identifyUnexplainedJargon(jargonTerms, text, context) {
    const unexplained = [];
    
    for (const term of jargonTerms) {
      // Check if term is explained in the text
      const explanationPatterns = [
        new RegExp(`${term}\\s+(?:is|means|refers to|stands for)`, 'i'),
        new RegExp(`(?:which is|that is|i\\.e\\.|meaning)\\s+${term}`, 'i'),
        new RegExp(`${term}\\s*\\([^)]+\\)`, 'i') // Term with parenthetical explanation
      ];
      
      const isExplained = explanationPatterns.some(pattern => pattern.test(text));
      
      if (!isExplained) {
        unexplained.push(term);
      }
    }
    
    return unexplained;
  }
  
  getOpportunityTitle(signalType) {
    const titles = {
      direct: 'Direct Confusion Expressed',
      request: 'Clarification Requested',
      uncertainty: 'Uncertainty Indicated',
      polite_confusion: 'Polite Confusion Signal',
      hesitation: 'Hesitation Detected',
      interruption: 'Confusion Interruption',
      verification: 'Verification Request',
      disagreement: 'Disagreement/Confusion',
      meta_confusion: 'Meta-Confusion Detected',
      alignment_check: 'Alignment Check Needed'
    };
    
    return titles[signalType] || 'Clarification Opportunity';
  }
  
  getSuggestedActions(signalType) {
    const actions = {
      direct: [
        'Pause and ask what specifically needs clarification',
        'Provide a clearer explanation of the concept',
        'Use simpler language or analogies',
        'Check understanding before proceeding'
      ],
      request: [
        'Respond to the clarification request immediately',
        'Provide concrete examples',
        'Ask follow-up questions to ensure understanding',
        'Offer to discuss offline if needed'
      ],
      uncertainty: [
        'Address the uncertainty directly',
        'Provide additional context or background',
        'Ask what specific aspects are unclear',
        'Offer multiple explanations or perspectives'
      ],
      verification: [
        'Confirm the verification request',
        'Provide clear confirmation or correction',
        'Summarize key points for clarity',
        'Document the clarification for future reference'
      ]
    };
    
    return actions[signalType] || [
      'Acknowledge the confusion signal',
      'Provide clarification as needed',
      'Check for understanding',
      'Adjust communication style if necessary'
    ];
  }
  
  generateClarificationSuggestions(confusionReasons) {
    const suggestions = [];
    
    if (confusionReasons.includes('Long, complex sentences')) {
      suggestions.push('Break down complex ideas into shorter sentences');
    }
    
    if (confusionReasons.includes('Multiple clauses')) {
      suggestions.push('Simplify sentence structure and use bullet points');
    }
    
    if (confusionReasons.includes('High technical term density')) {
      suggestions.push('Define technical terms and use more accessible language');
    }
    
    if (confusionReasons.includes('Frequent topic changes')) {
      suggestions.push('Provide clear transitions between topics');
    }
    
    return suggestions;
  }
  
  analyzeSpeakerConfusionPatterns(speakers, text, context) {
    // Analyze patterns in speaker behavior that might indicate confusion
    const opportunities = [];
    
    // This would be implemented with more sophisticated speaker analysis
    // For now, return empty array
    
    return opportunities;
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
  
  async loadHistoricalPatterns() {
    try {
      // Load historical clarification patterns from database
      // This would help improve detection accuracy over time
      console.log('Loading historical clarification patterns...');
      
      // Implementation would query the database for past clarification opportunities
      // and their resolution outcomes to improve pattern recognition
      
    } catch (error) {
      console.error('Error loading historical patterns:', error);
    }
  }
  
  async initializeSemanticAnalysis() {
    try {
      // Initialize AI models for semantic analysis
      console.log('Initializing semantic analysis capabilities...');
      
      // This would initialize connections to the Triple-AI system
      // for more sophisticated semantic understanding
      
    } catch (error) {
      console.error('Error initializing semantic analysis:', error);
    }
  }
  
  /**
   * Get detector metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      initialized: this.initialized,
      detectionAccuracy: this.metrics.opportunitiesFound > 0 ? 
        (this.metrics.opportunitiesFound - this.metrics.falsePositives) / this.metrics.opportunitiesFound : 0
    };
  }
  
  /**
   * Shutdown detector gracefully
   */
  async shutdown() {
    console.log('Shutting down Clarification Detector...');
    this.initialized = false;
    console.log('✓ Clarification Detector shutdown complete');
  }
}

module.exports = ClarificationDetector;
