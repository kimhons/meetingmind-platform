/**
 * Enhanced Contextual Analysis Service
 * 
 * Provides real-time contextual intelligence using triple-AI collaboration
 * for superior meeting insights and suggestions.
 */

const EventEmitter = require('events');

class ContextualAnalysisService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      confidenceThreshold: 0.75,
      suggestionUpdateInterval: 2000, // 2 seconds
      maxContextBuffer: 1000,
      aiTimeout: 5000, // 5 seconds
      ...options
    };
    
    this.tripleAI = null; // Will be initialized
    this.contextBuffer = new CircularBuffer(this.options.maxContextBuffer);
    this.suggestionEngine = null; // Will be initialized
    this.definitionService = null; // Will be initialized
    this.questionGenerator = null; // Will be initialized
    
    this.activeSessions = new Map();
    this.processingQueue = new Map();
    this.performanceMetrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      successRate: 0,
      aiModelUsage: { gpt5: 0, claude: 0, gemini: 0 }
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the contextual analysis service
   */
  async initialize() {
    try {
      // Initialize AI clients
      this.tripleAI = new TripleAIClient({
        gpt5: {
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4-turbo-preview', // Using available model
          maxTokens: 4096,
          temperature: 0.7
        },
        claude: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: 'claude-3-sonnet-20240229',
          maxTokens: 4096,
          temperature: 0.7
        },
        gemini: {
          apiKey: process.env.GOOGLE_API_KEY,
          model: 'gemini-1.5-pro',
          maxTokens: 4096,
          temperature: 0.7
        }
      });
      
      // Initialize suggestion engine
      this.suggestionEngine = new SuggestionEngine({
        tripleAI: this.tripleAI,
        confidenceThreshold: this.options.confidenceThreshold
      });
      
      // Initialize definition service
      this.definitionService = new DefinitionService({
        tripleAI: this.tripleAI,
        knowledgeBase: new KnowledgeBase()
      });
      
      // Initialize question generator
      this.questionGenerator = new QuestionGenerator({
        tripleAI: this.tripleAI
      });
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log('✓ Contextual Analysis Service initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Contextual Analysis Service:', error);
      throw error;
    }
  }
  
  /**
   * Start real-time analysis for a meeting session
   */
  async startRealTimeAnalysis(meetingId, config = {}) {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }
    
    const session = {
      meetingId,
      startTime: Date.now(),
      config: {
        enableSuggestions: true,
        enableDefinitions: true,
        enableQuestions: true,
        updateInterval: this.options.suggestionUpdateInterval,
        ...config
      },
      context: {
        participants: [],
        currentTopic: null,
        conversationFlow: [],
        sentiment: { overall: 0.5, trajectory: [] },
        keyTerms: new Set(),
        decisions: [],
        actionItems: []
      },
      metrics: {
        suggestionsGenerated: 0,
        definitionsProvided: 0,
        questionsAsked: 0,
        averageConfidence: 0
      }
    };
    
    this.activeSessions.set(meetingId, session);
    
    // Start periodic analysis
    this.startPeriodicAnalysis(meetingId);
    
    this.emit('analysisStarted', { meetingId, session });
    
    return session;
  }
  
  /**
   * Process real-time context data
   */
  async analyzeRealTimeContext(meetingId, contextData) {
    const startTime = Date.now();
    
    try {
      const session = this.activeSessions.get(meetingId);
      if (!session) {
        throw new Error(`No active session found for meeting ${meetingId}`);
      }
      
      // Add to context buffer
      this.contextBuffer.add({
        meetingId,
        timestamp: Date.now(),
        data: contextData
      });
      
      // Update session context
      await this.updateSessionContext(session, contextData);
      
      // Parallel AI processing
      const aiAnalysis = await this.performTripleAIAnalysis(contextData, session.context);
      
      // Generate contextual insights
      const insights = await this.generateContextualInsights(aiAnalysis, session);
      
      // Update performance metrics
      this.updatePerformanceMetrics(startTime, true);
      
      // Emit real-time updates
      this.emit('contextAnalyzed', {
        meetingId,
        insights,
        timestamp: Date.now()
      });
      
      return insights;
      
    } catch (error) {
      this.updatePerformanceMetrics(startTime, false);
      console.error(`Error analyzing context for meeting ${meetingId}:`, error);
      throw error;
    }
  }
  
  /**
   * Perform triple-AI analysis with parallel processing
   */
  async performTripleAIAnalysis(contextData, sessionContext) {
    const analysisPromises = [];
    
    // GPT-5 Analysis - Focus on language generation and reasoning
    analysisPromises.push(
      this.tripleAI.analyzeWithGPT5({
        task: 'contextual_understanding',
        data: contextData,
        context: sessionContext,
        focus: ['language_patterns', 'reasoning', 'context_understanding']
      }).catch(error => ({ error, source: 'gpt5' }))
    );
    
    // Claude Analysis - Focus on accuracy and safety
    analysisPromises.push(
      this.tripleAI.analyzeWithClaude({
        task: 'sentiment_and_risk_analysis',
        data: contextData,
        context: sessionContext,
        focus: ['sentiment_analysis', 'risk_assessment', 'accuracy_check']
      }).catch(error => ({ error, source: 'claude' }))
    );
    
    // Gemini Analysis - Focus on speed and multimodal processing
    analysisPromises.push(
      this.tripleAI.analyzeWithGemini({
        task: 'real_time_processing',
        data: contextData,
        context: sessionContext,
        focus: ['quick_insights', 'visual_analysis', 'real_time_response']
      }).catch(error => ({ error, source: 'gemini' }))
    );
    
    const results = await Promise.allSettled(analysisPromises);
    
    // Process results and handle failures
    const analysis = {
      gpt5: results[0].status === 'fulfilled' ? results[0].value : null,
      claude: results[1].status === 'fulfilled' ? results[1].value : null,
      gemini: results[2].status === 'fulfilled' ? results[2].value : null,
      timestamp: Date.now()
    };
    
    // Update AI usage metrics
    if (analysis.gpt5) this.performanceMetrics.aiModelUsage.gpt5++;
    if (analysis.claude) this.performanceMetrics.aiModelUsage.claude++;
    if (analysis.gemini) this.performanceMetrics.aiModelUsage.gemini++;
    
    return analysis;
  }
  
  /**
   * Generate contextual insights from AI analysis
   */
  async generateContextualInsights(aiAnalysis, session) {
    const insights = {
      suggestions: [],
      definitions: [],
      questions: [],
      sentiment: null,
      confidence: 0,
      timestamp: Date.now()
    };
    
    try {
      // Generate suggestions using all available AI results
      if (session.config.enableSuggestions) {
        insights.suggestions = await this.suggestionEngine.generateSuggestions(
          aiAnalysis, session.context
        );
      }
      
      // Generate definitions for technical terms
      if (session.config.enableDefinitions) {
        insights.definitions = await this.definitionService.identifyDefinitionOpportunities(
          aiAnalysis, session.context
        );
      }
      
      // Generate follow-up questions
      if (session.config.enableQuestions) {
        insights.questions = await this.questionGenerator.generateContextualQuestions(
          aiAnalysis, session.context
        );
      }
      
      // Extract sentiment analysis (primarily from Claude)
      if (aiAnalysis.claude && aiAnalysis.claude.sentiment) {
        insights.sentiment = aiAnalysis.claude.sentiment;
      }
      
      // Calculate overall confidence
      insights.confidence = this.calculateOverallConfidence(aiAnalysis);
      
      // Update session metrics
      session.metrics.suggestionsGenerated += insights.suggestions.length;
      session.metrics.definitionsProvided += insights.definitions.length;
      session.metrics.questionsAsked += insights.questions.length;
      session.metrics.averageConfidence = 
        (session.metrics.averageConfidence + insights.confidence) / 2;
      
    } catch (error) {
      console.error('Error generating contextual insights:', error);
      insights.error = error.message;
    }
    
    return insights;
  }
  
  /**
   * Update session context with new data
   */
  async updateSessionContext(session, contextData) {
    const context = session.context;
    
    // Update conversation flow
    if (contextData.transcript) {
      context.conversationFlow.push({
        timestamp: Date.now(),
        speaker: contextData.speaker,
        text: contextData.transcript,
        sentiment: contextData.sentiment
      });
      
      // Keep only last 50 conversation entries
      if (context.conversationFlow.length > 50) {
        context.conversationFlow = context.conversationFlow.slice(-50);
      }
    }
    
    // Update participants
    if (contextData.participants) {
      context.participants = [...new Set([...context.participants, ...contextData.participants])];
    }
    
    // Update current topic
    if (contextData.topic) {
      context.currentTopic = contextData.topic;
    }
    
    // Extract and update key terms
    if (contextData.transcript) {
      const newTerms = await this.extractKeyTerms(contextData.transcript);
      newTerms.forEach(term => context.keyTerms.add(term));
    }
    
    // Update sentiment trajectory
    if (contextData.sentiment) {
      context.sentiment.trajectory.push({
        timestamp: Date.now(),
        value: contextData.sentiment
      });
      
      // Calculate overall sentiment
      const recentSentiments = context.sentiment.trajectory.slice(-10);
      context.sentiment.overall = recentSentiments.reduce((sum, s) => sum + s.value, 0) / recentSentiments.length;
    }
  }
  
  /**
   * Start periodic analysis for a meeting
   */
  startPeriodicAnalysis(meetingId) {
    const session = this.activeSessions.get(meetingId);
    if (!session) return;
    
    const interval = setInterval(async () => {
      try {
        // Check if session is still active
        if (!this.activeSessions.has(meetingId)) {
          clearInterval(interval);
          return;
        }
        
        // Get recent context from buffer
        const recentContext = this.getRecentContext(meetingId);
        
        if (recentContext.length > 0) {
          // Perform periodic analysis
          const insights = await this.performPeriodicAnalysis(meetingId, recentContext);
          
          // Emit periodic insights
          this.emit('periodicInsights', {
            meetingId,
            insights,
            timestamp: Date.now()
          });
        }
        
      } catch (error) {
        console.error(`Error in periodic analysis for meeting ${meetingId}:`, error);
      }
    }, session.config.updateInterval);
    
    // Store interval reference for cleanup
    session.analysisInterval = interval;
  }
  
  /**
   * Stop real-time analysis for a meeting
   */
  async stopRealTimeAnalysis(meetingId) {
    const session = this.activeSessions.get(meetingId);
    if (!session) return;
    
    // Clear periodic analysis interval
    if (session.analysisInterval) {
      clearInterval(session.analysisInterval);
    }
    
    // Generate final session summary
    const summary = await this.generateSessionSummary(session);
    
    // Clean up session
    this.activeSessions.delete(meetingId);
    
    this.emit('analysisStopped', {
      meetingId,
      summary,
      duration: Date.now() - session.startTime
    });
    
    return summary;
  }
  
  /**
   * Get current suggestions for a meeting
   */
  getCurrentSuggestions(meetingId) {
    const session = this.activeSessions.get(meetingId);
    if (!session) return [];
    
    // Return cached suggestions or generate new ones
    return session.lastInsights?.suggestions || [];
  }
  
  /**
   * Calculate overall confidence from AI analysis
   */
  calculateOverallConfidence(aiAnalysis) {
    const confidences = [];
    
    if (aiAnalysis.gpt5?.confidence) confidences.push(aiAnalysis.gpt5.confidence);
    if (aiAnalysis.claude?.confidence) confidences.push(aiAnalysis.claude.confidence);
    if (aiAnalysis.gemini?.confidence) confidences.push(aiAnalysis.gemini.confidence);
    
    if (confidences.length === 0) return 0;
    
    // Weighted average with higher weight for multiple AI agreement
    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const agreementBonus = confidences.length > 1 ? 0.1 : 0;
    
    return Math.min(1.0, average + agreementBonus);
  }
  
  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(startTime, success) {
    const responseTime = Date.now() - startTime;
    
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime + responseTime) / 2;
    
    if (success) {
      this.performanceMetrics.successRate = 
        (this.performanceMetrics.successRate * (this.performanceMetrics.totalRequests - 1) + 1) / 
        this.performanceMetrics.totalRequests;
    } else {
      this.performanceMetrics.successRate = 
        (this.performanceMetrics.successRate * (this.performanceMetrics.totalRequests - 1)) / 
        this.performanceMetrics.totalRequests;
    }
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      activeSessions: this.activeSessions.size,
      bufferSize: this.contextBuffer.size()
    };
  }
  
  /**
   * Extract key terms from text
   */
  async extractKeyTerms(text) {
    // Simple implementation - can be enhanced with NLP libraries
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .filter(word => /^[a-zA-Z]+$/.test(word));
  }
  
  /**
   * Get recent context from buffer
   */
  getRecentContext(meetingId, timeWindow = 30000) { // 30 seconds
    const cutoff = Date.now() - timeWindow;
    return this.contextBuffer.getItems()
      .filter(item => item.meetingId === meetingId && item.timestamp > cutoff);
  }
  
  /**
   * Generate session summary
   */
  async generateSessionSummary(session) {
    return {
      meetingId: session.meetingId,
      duration: Date.now() - session.startTime,
      metrics: session.metrics,
      context: {
        participantCount: session.context.participants.length,
        topicsDiscussed: session.context.currentTopic ? 1 : 0,
        conversationLength: session.context.conversationFlow.length,
        keyTermsCount: session.context.keyTerms.size,
        averageSentiment: session.context.sentiment.overall
      },
      performance: {
        suggestionsPerMinute: session.metrics.suggestionsGenerated / ((Date.now() - session.startTime) / 60000),
        averageConfidence: session.metrics.averageConfidence
      }
    };
  }
}

/**
 * Circular Buffer for context storage
 */
class CircularBuffer {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.buffer = [];
    this.index = 0;
  }
  
  add(item) {
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(item);
    } else {
      this.buffer[this.index] = item;
      this.index = (this.index + 1) % this.maxSize;
    }
  }
  
  getItems() {
    return [...this.buffer];
  }
  
  size() {
    return this.buffer.length;
  }
}

module.exports = ContextualAnalysisService;
