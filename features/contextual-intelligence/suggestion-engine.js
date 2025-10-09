/**
 * Suggestion Engine
 * 
 * Generates contextual suggestions, definitions, and follow-up questions
 * based on real-time meeting analysis and triple-AI insights.
 */

class SuggestionEngine {
  constructor(options = {}) {
    this.options = {
      confidenceThreshold: 0.7,
      maxSuggestions: 5,
      suggestionTypes: ['definition', 'follow_up', 'clarification', 'action', 'objection_handling'],
      ...options
    };
    
    this.tripleAI = options.tripleAI;
    this.suggestionCache = new Map();
    this.suggestionHistory = [];
    
    this.suggestionTypes = {
      DEFINITION: 'definition',
      FOLLOW_UP: 'follow_up',
      CLARIFICATION: 'clarification',
      ACTION: 'action',
      OBJECTION_HANDLING: 'objection_handling',
      TRANSITION: 'transition',
      SUMMARY: 'summary'
    };
    
    this.suggestionPriorities = {
      [this.suggestionTypes.DEFINITION]: 1,
      [this.suggestionTypes.CLARIFICATION]: 2,
      [this.suggestionTypes.FOLLOW_UP]: 3,
      [this.suggestionTypes.ACTION]: 4,
      [this.suggestionTypes.OBJECTION_HANDLING]: 5,
      [this.suggestionTypes.TRANSITION]: 6,
      [this.suggestionTypes.SUMMARY]: 7
    };
  }
  
  /**
   * Generate contextual suggestions based on AI analysis
   */
  async generateSuggestions(aiAnalysis, meetingContext) {
    try {
      const suggestions = [];
      
      // Generate different types of suggestions in parallel
      const suggestionPromises = [
        this.generateDefinitionSuggestions(aiAnalysis, meetingContext),
        this.generateFollowUpSuggestions(aiAnalysis, meetingContext),
        this.generateClarificationSuggestions(aiAnalysis, meetingContext),
        this.generateActionSuggestions(aiAnalysis, meetingContext),
        this.generateTransitionSuggestions(aiAnalysis, meetingContext)
      ];
      
      const suggestionSets = await Promise.allSettled(suggestionPromises);
      
      // Combine all suggestions
      suggestionSets.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          suggestions.push(...result.value);
        }
      });
      
      // Filter by confidence threshold
      const filteredSuggestions = suggestions.filter(
        suggestion => suggestion.confidence >= this.options.confidenceThreshold
      );
      
      // Rank and limit suggestions
      const rankedSuggestions = this.rankSuggestions(filteredSuggestions);
      const finalSuggestions = rankedSuggestions.slice(0, this.options.maxSuggestions);
      
      // Cache suggestions
      this.cacheSuggestions(meetingContext, finalSuggestions);
      
      // Update suggestion history
      this.updateSuggestionHistory(finalSuggestions);
      
      return finalSuggestions;
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }
  
  /**
   * Generate definition suggestions for technical terms
   */
  async generateDefinitionSuggestions(aiAnalysis, meetingContext) {
    const suggestions = [];
    
    try {
      // Extract technical terms from conversation
      const technicalTerms = this.extractTechnicalTerms(aiAnalysis, meetingContext);
      
      for (const term of technicalTerms.slice(0, 3)) { // Limit to 3 terms
        const definition = await this.getTermDefinition(term, meetingContext);
        
        if (definition && definition.confidence > 0.7) {
          suggestions.push({
            id: `def_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.suggestionTypes.DEFINITION,
            title: `Define "${term}"`,
            content: definition.content,
            term: term,
            confidence: definition.confidence,
            reasoning: `Technical term "${term}" was mentioned and may need clarification`,
            timestamp: Date.now(),
            source: 'definition_engine',
            metadata: {
              term: term,
              context: definition.context,
              examples: definition.examples || []
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Error generating definition suggestions:', error);
    }
    
    return suggestions;
  }
  
  /**
   * Generate follow-up question suggestions
   */
  async generateFollowUpSuggestions(aiAnalysis, meetingContext) {
    const suggestions = [];
    
    try {
      // Analyze conversation gaps
      const conversationGaps = this.identifyConversationGaps(aiAnalysis, meetingContext);
      
      // Generate questions for each gap
      for (const gap of conversationGaps.slice(0, 2)) {
        const question = await this.generateFollowUpQuestion(gap, meetingContext);
        
        if (question && question.confidence > 0.6) {
          suggestions.push({
            id: `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.suggestionTypes.FOLLOW_UP,
            title: 'Ask Follow-up Question',
            content: question.content,
            confidence: question.confidence,
            reasoning: question.reasoning,
            timestamp: Date.now(),
            source: 'question_generator',
            metadata: {
              gap_type: gap.type,
              context: gap.context,
              urgency: question.urgency || 'medium'
            }
          });
        }
      }
      
      // Generate topic-based follow-ups
      const topicQuestions = await this.generateTopicFollowUps(aiAnalysis, meetingContext);
      suggestions.push(...topicQuestions.slice(0, 2));
      
    } catch (error) {
      console.error('Error generating follow-up suggestions:', error);
    }
    
    return suggestions;
  }
  
  /**
   * Generate clarification suggestions
   */
  async generateClarificationSuggestions(aiAnalysis, meetingContext) {
    const suggestions = [];
    
    try {
      // Identify ambiguous statements
      const ambiguousStatements = this.identifyAmbiguousStatements(aiAnalysis, meetingContext);
      
      for (const statement of ambiguousStatements.slice(0, 2)) {
        const clarification = await this.generateClarificationRequest(statement, meetingContext);
        
        if (clarification && clarification.confidence > 0.65) {
          suggestions.push({
            id: `clarify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.suggestionTypes.CLARIFICATION,
            title: 'Request Clarification',
            content: clarification.content,
            confidence: clarification.confidence,
            reasoning: clarification.reasoning,
            timestamp: Date.now(),
            source: 'clarification_engine',
            metadata: {
              original_statement: statement.text,
              ambiguity_type: statement.ambiguityType,
              speaker: statement.speaker
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Error generating clarification suggestions:', error);
    }
    
    return suggestions;
  }
  
  /**
   * Generate action item suggestions
   */
  async generateActionSuggestions(aiAnalysis, meetingContext) {
    const suggestions = [];
    
    try {
      // Identify potential action items
      const potentialActions = this.identifyPotentialActions(aiAnalysis, meetingContext);
      
      for (const action of potentialActions.slice(0, 2)) {
        const actionSuggestion = await this.generateActionSuggestion(action, meetingContext);
        
        if (actionSuggestion && actionSuggestion.confidence > 0.7) {
          suggestions.push({
            id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.suggestionTypes.ACTION,
            title: 'Suggest Action Item',
            content: actionSuggestion.content,
            confidence: actionSuggestion.confidence,
            reasoning: actionSuggestion.reasoning,
            timestamp: Date.now(),
            source: 'action_engine',
            metadata: {
              action_type: action.type,
              priority: actionSuggestion.priority || 'medium',
              assignee: actionSuggestion.assignee,
              deadline: actionSuggestion.deadline
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Error generating action suggestions:', error);
    }
    
    return suggestions;
  }
  
  /**
   * Generate transition suggestions
   */
  async generateTransitionSuggestions(aiAnalysis, meetingContext) {
    const suggestions = [];
    
    try {
      // Check if topic has been exhausted
      const topicExhaustion = this.assessTopicExhaustion(aiAnalysis, meetingContext);
      
      if (topicExhaustion.isExhausted && topicExhaustion.confidence > 0.75) {
        const transition = await this.generateTopicTransition(topicExhaustion, meetingContext);
        
        if (transition) {
          suggestions.push({
            id: `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.suggestionTypes.TRANSITION,
            title: 'Suggest Topic Transition',
            content: transition.content,
            confidence: transition.confidence,
            reasoning: transition.reasoning,
            timestamp: Date.now(),
            source: 'transition_engine',
            metadata: {
              current_topic: meetingContext.currentTopic,
              suggested_topic: transition.nextTopic,
              transition_type: transition.type
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Error generating transition suggestions:', error);
    }
    
    return suggestions;
  }
  
  /**
   * Extract technical terms from conversation
   */
  extractTechnicalTerms(aiAnalysis, meetingContext) {
    const terms = new Set();
    
    // Extract from GPT-5 analysis
    if (aiAnalysis.gpt5?.result?.context_understanding?.key_topics) {
      aiAnalysis.gpt5.result.context_understanding.key_topics.forEach(topic => {
        if (this.isTechnicalTerm(topic)) {
          terms.add(topic);
        }
      });
    }
    
    // Extract from recent conversation
    if (meetingContext.conversationFlow) {
      const recentConversation = meetingContext.conversationFlow.slice(-5);
      recentConversation.forEach(entry => {
        const extractedTerms = this.extractTermsFromText(entry.text);
        extractedTerms.forEach(term => {
          if (this.isTechnicalTerm(term)) {
            terms.add(term);
          }
        });
      });
    }
    
    return Array.from(terms);
  }
  
  /**
   * Check if a term is technical/specialized
   */
  isTechnicalTerm(term) {
    // Simple heuristics - can be enhanced with domain-specific dictionaries
    const technicalIndicators = [
      /^[A-Z]{2,}$/, // Acronyms
      /\w+(?:API|SDK|SLA|KPI|ROI|CRM|ERP)\w*/i, // Common business/tech acronyms
      /\w*(?:tion|sion|ment|ness|ity|ism)$/i, // Abstract nouns
      /\w*(?:protocol|algorithm|framework|methodology)$/i // Technical terms
    ];
    
    return technicalIndicators.some(pattern => pattern.test(term)) && term.length > 3;
  }
  
  /**
   * Extract terms from text
   */
  extractTermsFromText(text) {
    // Simple term extraction - can be enhanced with NLP
    const words = text.split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 3)
      .filter(word => !stopWords.has(word.toLowerCase()))
      .filter(word => /^[a-zA-Z]+$/.test(word));
  }
  
  /**
   * Get definition for a term
   */
  async getTermDefinition(term, meetingContext) {
    try {
      // Check cache first
      const cacheKey = `def_${term.toLowerCase()}`;
      if (this.suggestionCache.has(cacheKey)) {
        return this.suggestionCache.get(cacheKey);
      }
      
      // Use AI to generate definition
      const definition = await this.generateAIDefinition(term, meetingContext);
      
      // Cache the definition
      this.suggestionCache.set(cacheKey, definition);
      
      return definition;
      
    } catch (error) {
      console.error(`Error getting definition for term "${term}":`, error);
      return null;
    }
  }
  
  /**
   * Generate AI-powered definition
   */
  async generateAIDefinition(term, meetingContext) {
    if (!this.tripleAI) {
      return {
        content: `Definition for "${term}" (AI unavailable)`,
        confidence: 0.5,
        context: 'general'
      };
    }
    
    try {
      const request = {
        task: 'definition_generation',
        data: { term, context: meetingContext.currentTopic },
        context: meetingContext,
        focus: ['accuracy', 'business_context', 'clarity']
      };
      
      const result = await this.tripleAI.analyzeWithClaude(request);
      
      if (result && result.result && !result.error) {
        return {
          content: result.result.definition || `${term}: Business/technical term requiring clarification`,
          confidence: result.confidence || 0.7,
          context: result.result.context || 'business',
          examples: result.result.examples || []
        };
      }
      
    } catch (error) {
      console.error('Error generating AI definition:', error);
    }
    
    // Fallback definition
    return {
      content: `"${term}" - Technical term that may benefit from clarification in this context`,
      confidence: 0.6,
      context: 'general'
    };
  }
  
  /**
   * Identify conversation gaps
   */
  identifyConversationGaps(aiAnalysis, meetingContext) {
    const gaps = [];
    
    // Check for incomplete information
    if (meetingContext.conversationFlow && meetingContext.conversationFlow.length > 0) {
      const recentEntries = meetingContext.conversationFlow.slice(-3);
      
      // Look for questions without answers
      recentEntries.forEach((entry, index) => {
        if (entry.text.includes('?') && index < recentEntries.length - 1) {
          const nextEntry = recentEntries[index + 1];
          if (!this.isAnswerToQuestion(entry.text, nextEntry.text)) {
            gaps.push({
              type: 'unanswered_question',
              context: entry.text,
              speaker: entry.speaker,
              timestamp: entry.timestamp
            });
          }
        }
      });
      
      // Look for incomplete statements
      recentEntries.forEach(entry => {
        if (this.isIncompleteStatement(entry.text)) {
          gaps.push({
            type: 'incomplete_statement',
            context: entry.text,
            speaker: entry.speaker,
            timestamp: entry.timestamp
          });
        }
      });
    }
    
    return gaps;
  }
  
  /**
   * Check if text is an answer to a question
   */
  isAnswerToQuestion(question, potentialAnswer) {
    // Simple heuristics - can be enhanced with NLP
    const answerIndicators = ['yes', 'no', 'because', 'the answer is', 'i think', 'in my opinion'];
    const lowerAnswer = potentialAnswer.toLowerCase();
    
    return answerIndicators.some(indicator => lowerAnswer.includes(indicator));
  }
  
  /**
   * Check if statement is incomplete
   */
  isIncompleteStatement(text) {
    // Simple heuristics for incomplete statements
    const incompleteIndicators = [
      /\.\.\.$/, // Ends with ellipsis
      /\band\s*$/, // Ends with "and"
      /\bbut\s*$/, // Ends with "but"
      /\bso\s*$/, // Ends with "so"
      /\bwell\s*$/, // Ends with "well"
    ];
    
    return incompleteIndicators.some(pattern => pattern.test(text.trim()));
  }
  
  /**
   * Generate follow-up question
   */
  async generateFollowUpQuestion(gap, meetingContext) {
    const questionTemplates = {
      unanswered_question: [
        "Could you elaborate on that previous question?",
        "I noticed a question wasn't fully addressed - should we revisit it?",
        "Would you like to return to the earlier question about {context}?"
      ],
      incomplete_statement: [
        "Could you finish that thought?",
        "What were you going to say about {context}?",
        "I think you were in the middle of explaining something - please continue."
      ],
      information_gap: [
        "Could you provide more details about {context}?",
        "What additional information would be helpful here?",
        "Are there any specifics we should cover regarding {context}?"
      ]
    };
    
    const templates = questionTemplates[gap.type] || questionTemplates.information_gap;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const question = template.replace('{context}', this.extractContextKeywords(gap.context));
    
    return {
      content: question,
      confidence: 0.75,
      reasoning: `Identified ${gap.type} in conversation flow`,
      urgency: gap.type === 'unanswered_question' ? 'high' : 'medium'
    };
  }
  
  /**
   * Extract context keywords
   */
  extractContextKeywords(context) {
    const words = context.split(/\s+/);
    const keywords = words.filter(word => word.length > 4 && /^[a-zA-Z]+$/.test(word));
    return keywords.slice(0, 3).join(', ') || 'this topic';
  }
  
  /**
   * Rank suggestions by priority and confidence
   */
  rankSuggestions(suggestions) {
    return suggestions.sort((a, b) => {
      // Primary sort: by type priority
      const priorityDiff = this.suggestionPriorities[a.type] - this.suggestionPriorities[b.type];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort: by confidence (descending)
      return b.confidence - a.confidence;
    });
  }
  
  /**
   * Cache suggestions
   */
  cacheSuggestions(meetingContext, suggestions) {
    const cacheKey = `suggestions_${meetingContext.currentTopic || 'general'}_${Date.now()}`;
    this.suggestionCache.set(cacheKey, {
      suggestions,
      timestamp: Date.now(),
      context: meetingContext.currentTopic
    });
    
    // Clean old cache entries (keep last 100)
    if (this.suggestionCache.size > 100) {
      const oldestKey = this.suggestionCache.keys().next().value;
      this.suggestionCache.delete(oldestKey);
    }
  }
  
  /**
   * Update suggestion history
   */
  updateSuggestionHistory(suggestions) {
    this.suggestionHistory.push({
      timestamp: Date.now(),
      count: suggestions.length,
      types: suggestions.map(s => s.type),
      averageConfidence: suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
    });
    
    // Keep only last 50 history entries
    if (this.suggestionHistory.length > 50) {
      this.suggestionHistory = this.suggestionHistory.slice(-50);
    }
  }
  
  /**
   * Get suggestion statistics
   */
  getSuggestionStats() {
    if (this.suggestionHistory.length === 0) {
      return {
        totalSuggestions: 0,
        averageConfidence: 0,
        typeDistribution: {},
        suggestionsPerSession: 0
      };
    }
    
    const totalSuggestions = this.suggestionHistory.reduce((sum, entry) => sum + entry.count, 0);
    const averageConfidence = this.suggestionHistory.reduce((sum, entry) => sum + entry.averageConfidence, 0) / this.suggestionHistory.length;
    
    const typeDistribution = {};
    this.suggestionHistory.forEach(entry => {
      entry.types.forEach(type => {
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });
    });
    
    return {
      totalSuggestions,
      averageConfidence,
      typeDistribution,
      suggestionsPerSession: totalSuggestions / this.suggestionHistory.length,
      sessionCount: this.suggestionHistory.length
    };
  }
  
  // Additional helper methods for other suggestion types...
  
  generateTopicFollowUps(aiAnalysis, meetingContext) {
    // Implementation for topic-based follow-ups
    return [];
  }
  
  identifyAmbiguousStatements(aiAnalysis, meetingContext) {
    // Implementation for identifying ambiguous statements
    return [];
  }
  
  generateClarificationRequest(statement, meetingContext) {
    // Implementation for generating clarification requests
    return null;
  }
  
  identifyPotentialActions(aiAnalysis, meetingContext) {
    // Implementation for identifying potential action items
    return [];
  }
  
  generateActionSuggestion(action, meetingContext) {
    // Implementation for generating action suggestions
    return null;
  }
  
  assessTopicExhaustion(aiAnalysis, meetingContext) {
    // Implementation for assessing if a topic is exhausted
    return { isExhausted: false, confidence: 0 };
  }
  
  generateTopicTransition(topicExhaustion, meetingContext) {
    // Implementation for generating topic transitions
    return null;
  }
}

module.exports = SuggestionEngine;
