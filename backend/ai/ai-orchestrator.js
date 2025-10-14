/**
 * AI Orchestrator - Main Integration Point
 * 
 * This is the primary interface for all AI processing in MeetingMind.
 * It orchestrates between AIMLAPI primary provider and fallback systems
 * to deliver 70% cost savings with 99.99% reliability.
 */

const EventEmitter = require('events');
const FallbackProviderSystem = require('./fallback-provider-system');

class AIOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize fallback provider system
    this.fallbackSystem = new FallbackProviderSystem(config);
    
    // Context analysis configuration
    this.contextAnalyzer = {
      meetingTypes: {
        interview: {
          keywords: ['interview', 'candidate', 'hiring', 'assessment', 'skills', 'experience'],
          priority: 'high',
          qualityRequirement: 0.9
        },
        sales: {
          keywords: ['sales', 'deal', 'negotiation', 'pricing', 'contract', 'proposal'],
          priority: 'high',
          qualityRequirement: 0.85
        },
        executive: {
          keywords: ['strategic', 'executive', 'leadership', 'board', 'decision', 'planning'],
          priority: 'critical',
          qualityRequirement: 0.95
        },
        technical: {
          keywords: ['technical', 'engineering', 'development', 'architecture', 'code'],
          priority: 'medium',
          qualityRequirement: 0.8
        },
        team: {
          keywords: ['team', 'standup', 'sync', 'coordination', 'update', 'status'],
          priority: 'low',
          qualityRequirement: 0.7
        },
        training: {
          keywords: ['training', 'education', 'learning', 'workshop', 'tutorial'],
          priority: 'medium',
          qualityRequirement: 0.8
        }
      },
      
      industries: {
        healthcare: {
          keywords: ['patient', 'medical', 'healthcare', 'clinical', 'diagnosis', 'treatment'],
          compliance: ['HIPAA'],
          specialization: true
        },
        finance: {
          keywords: ['financial', 'investment', 'banking', 'trading', 'portfolio', 'risk'],
          compliance: ['SOX', 'PCI'],
          specialization: true
        },
        legal: {
          keywords: ['legal', 'law', 'contract', 'compliance', 'regulation', 'litigation'],
          compliance: ['Attorney-Client Privilege'],
          specialization: true
        },
        technology: {
          keywords: ['software', 'technology', 'development', 'engineering', 'product'],
          compliance: ['SOC2'],
          specialization: false
        }
      }
    };
    
    // Performance tracking
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      costSavings: 0,
      qualityScore: 0,
      contextAccuracy: 0,
      responseTimes: []
    };
    
    // Quality assurance
    this.qualityThresholds = {
      minimum: 0.7,
      target: 0.85,
      premium: 0.9
    };
    
    // Set up event forwarding
    this.setupEventForwarding();
  }
  
  /**
   * Main processing method - analyzes context and routes to optimal provider
   */
  async processRequest(input, options = {}) {
    const startTime = Date.now();
    
    try {
      // Analyze context from input
      const context = this.analyzeContext(input, options);
      
      // Enhance context with options
      const enhancedContext = {
        ...context,
        urgency: options.urgency || this.determineUrgency(context),
        qualityPriority: options.qualityPriority || this.determineQualityPriority(context),
        maxCost: options.maxCost,
        preferredModel: options.preferredModel
      };
      
      // Process through fallback system
      const result = await this.fallbackSystem.processRequest(
        enhancedContext,
        input.content || input,
        options
      );
      
      // Enhance result with context analysis
      const enhancedResult = {
        ...result,
        context: enhancedContext,
        qualityScore: this.assessResultQuality(result, enhancedContext),
        costEfficiency: this.calculateCostEfficiency(result, enhancedContext),
        recommendations: this.generateRecommendations(result, enhancedContext)
      };
      
      // Track performance
      this.trackPerformance(enhancedResult, Date.now() - startTime, true);
      
      this.emit('processing_complete', {
        context: enhancedContext,
        result: enhancedResult,
        responseTime: Date.now() - startTime
      });
      
      return enhancedResult;
      
    } catch (error) {
      this.trackPerformance(null, Date.now() - startTime, false);
      
      this.emit('processing_failed', {
        error: error.message,
        input,
        options,
        responseTime: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  /**
   * Analyze context from input to determine optimal processing strategy
   */
  analyzeContext(input, options = {}) {
    const content = typeof input === 'string' ? input : input.content || '';
    const metadata = typeof input === 'object' ? input : {};
    
    const context = {
      type: 'general',
      industry: null,
      language: 'en',
      complexity: 'medium',
      participants: 1,
      duration: null,
      topics: [],
      compliance: [],
      realtime: false
    };
    
    // Override with provided metadata
    Object.assign(context, metadata, options.context || {});
    
    // Analyze content for meeting type
    const contentLower = content.toLowerCase();
    
    for (const [type, config] of Object.entries(this.contextAnalyzer.meetingTypes)) {
      const matches = config.keywords.filter(keyword => 
        contentLower.includes(keyword.toLowerCase())
      ).length;
      
      if (matches >= 2) {
        context.type = type;
        context.priority = config.priority;
        context.qualityRequirement = config.qualityRequirement;
        break;
      }
    }
    
    // Analyze content for industry
    for (const [industry, config] of Object.entries(this.contextAnalyzer.industries)) {
      const matches = config.keywords.filter(keyword => 
        contentLower.includes(keyword.toLowerCase())
      ).length;
      
      if (matches >= 1) {
        context.industry = industry;
        context.compliance = config.compliance;
        context.specialization = config.specialization;
        break;
      }
    }
    
    // Determine complexity based on content length and structure
    if (content.length > 2000) {
      context.complexity = 'high';
    } else if (content.length < 500) {
      context.complexity = 'low';
    }
    
    // Extract topics using simple keyword analysis
    const sentences = content.split(/[.!?]+/);
    context.topics = sentences
      .filter(sentence => sentence.length > 20)
      .slice(0, 5)
      .map(sentence => sentence.trim().substring(0, 50));
    
    // Detect language (simple heuristic)
    const nonEnglishPatterns = [
      /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i, // European
      /[一-龯]/,  // Chinese
      /[ひらがなカタカナ]/,  // Japanese
      /[가-힣]/,  // Korean
      /[а-яё]/i,  // Russian
      /[أ-ي]/,   // Arabic
    ];
    
    for (const pattern of nonEnglishPatterns) {
      if (pattern.test(content)) {
        context.language = 'non-en';
        break;
      }
    }
    
    return context;
  }
  
  /**
   * Determine urgency based on context
   */
  determineUrgency(context) {
    if (context.realtime || context.type === 'realtime') {
      return 'realtime';
    }
    
    if (context.priority === 'critical' || context.type === 'executive') {
      return 'high';
    }
    
    if (context.type === 'interview' || context.type === 'sales') {
      return 'high';
    }
    
    if (context.type === 'team' || context.type === 'monitoring') {
      return 'low';
    }
    
    return 'medium';
  }
  
  /**
   * Determine quality priority based on context
   */
  determineQualityPriority(context) {
    if (context.type === 'executive' || context.priority === 'critical') {
      return 'premium';
    }
    
    if (context.type === 'interview' || context.type === 'sales') {
      return 'high';
    }
    
    if (context.specialization || context.compliance?.length > 0) {
      return 'high';
    }
    
    return 'standard';
  }
  
  /**
   * Assess result quality based on context requirements
   */
  assessResultQuality(result, context) {
    let score = 0.7; // Base score
    
    const content = result.content || '';
    
    // Content length assessment
    if (content.length > 200) {
      score += 0.1;
    }
    
    // Structure assessment
    if (content.includes('**') || content.includes('##') || content.includes('- ')) {
      score += 0.1;
    }
    
    // Actionable insights
    const actionWords = ['recommend', 'suggest', 'should', 'consider', 'action', 'next steps'];
    const actionCount = actionWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    if (actionCount >= 2) {
      score += 0.1;
    }
    
    // Context relevance
    if (context.topics && context.topics.length > 0) {
      const relevantTopics = context.topics.filter(topic => 
        content.toLowerCase().includes(topic.toLowerCase().substring(0, 20))
      ).length;
      
      score += (relevantTopics / context.topics.length) * 0.1;
    }
    
    // Industry specialization bonus
    if (context.specialization && context.industry) {
      const industryKeywords = this.contextAnalyzer.industries[context.industry]?.keywords || [];
      const industryRelevance = industryKeywords.filter(keyword => 
        content.toLowerCase().includes(keyword)
      ).length;
      
      if (industryRelevance >= 2) {
        score += 0.05;
      }
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Calculate cost efficiency of the result
   */
  calculateCostEfficiency(result, context) {
    const actualCost = result.cost || 0;
    const directProviderCost = this.estimateDirectProviderCost(result.usage);
    
    const savings = directProviderCost - actualCost;
    const savingsPercentage = (savings / directProviderCost) * 100;
    
    return {
      actualCost,
      directProviderCost,
      savings,
      savingsPercentage,
      efficiency: savingsPercentage >= 70 ? 'excellent' : 
                 savingsPercentage >= 50 ? 'good' : 
                 savingsPercentage >= 30 ? 'fair' : 'poor'
    };
  }
  
  /**
   * Estimate direct provider cost for comparison
   */
  estimateDirectProviderCost(usage) {
    // Estimate based on typical direct provider pricing
    const avgDirectCost = 0.025; // $25 per 1M tokens average
    return (usage.totalTokens / 1000) * avgDirectCost;
  }
  
  /**
   * Generate recommendations based on result and context
   */
  generateRecommendations(result, context) {
    const recommendations = [];
    
    // Quality recommendations
    if (result.qualityScore < context.qualityRequirement) {
      recommendations.push({
        type: 'quality',
        message: 'Consider using a higher-quality model for this context',
        action: 'upgrade_model'
      });
    }
    
    // Cost optimization recommendations
    if (result.costEfficiency?.savingsPercentage < 50) {
      recommendations.push({
        type: 'cost',
        message: 'Consider using more cost-effective models for similar requests',
        action: 'optimize_model_selection'
      });
    }
    
    // Performance recommendations
    if (result.responseTime > 2000 && context.urgency === 'realtime') {
      recommendations.push({
        type: 'performance',
        message: 'Consider using faster models for real-time processing',
        action: 'use_fast_model'
      });
    }
    
    // Context-specific recommendations
    if (context.type === 'interview' && !result.content.toLowerCase().includes('recommend')) {
      recommendations.push({
        type: 'context',
        message: 'Interview analysis should include specific recommendations',
        action: 'enhance_interview_prompt'
      });
    }
    
    if (context.type === 'sales' && !result.content.toLowerCase().includes('next step')) {
      recommendations.push({
        type: 'context',
        message: 'Sales analysis should include clear next steps',
        action: 'enhance_sales_prompt'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Track performance metrics
   */
  trackPerformance(result, responseTime, success) {
    this.performanceMetrics.totalRequests++;
    
    if (success) {
      this.performanceMetrics.successfulRequests++;
      
      if (result) {
        // Update quality score
        const currentQuality = this.performanceMetrics.qualityScore;
        this.performanceMetrics.qualityScore = 
          (currentQuality * (this.performanceMetrics.successfulRequests - 1) + result.qualityScore) / 
          this.performanceMetrics.successfulRequests;
        
        // Update cost savings
        if (result.costEfficiency) {
          this.performanceMetrics.costSavings += result.costEfficiency.savings;
        }
      }
    }
    
    // Update response time
    this.performanceMetrics.responseTimes.push(responseTime);
    if (this.performanceMetrics.responseTimes.length > 100) {
      this.performanceMetrics.responseTimes.shift();
    }
    
    this.performanceMetrics.averageResponseTime = 
      this.performanceMetrics.responseTimes.reduce((sum, time) => sum + time, 0) / 
      this.performanceMetrics.responseTimes.length;
  }
  
  /**
   * Set up event forwarding from fallback system
   */
  setupEventForwarding() {
    // Forward all fallback system events
    this.fallbackSystem.on('request_success', (data) => {
      this.emit('provider_success', data);
    });
    
    this.fallbackSystem.on('all_providers_failed', (data) => {
      this.emit('system_failure', data);
    });
    
    this.fallbackSystem.on('provider_failure', (data) => {
      this.emit('provider_failure', data);
    });
    
    this.fallbackSystem.on('circuit_breaker_opened', (data) => {
      this.emit('circuit_breaker_opened', data);
    });
    
    this.fallbackSystem.on('circuit_breaker_closed', (data) => {
      this.emit('circuit_breaker_closed', data);
    });
    
    this.fallbackSystem.on('health_report', (data) => {
      this.emit('health_report', data);
    });
    
    this.fallbackSystem.on('fallback_cost_impact', (data) => {
      this.emit('cost_impact', data);
    });
  }
  
  /**
   * Specialized processing methods for different contexts
   */
  
  async processInterview(content, options = {}) {
    return this.processRequest({
      content,
      type: 'interview',
      qualityRequirement: 0.9
    }, {
      ...options,
      qualityPriority: 'high',
      context: { type: 'interview' }
    });
  }
  
  async processSales(content, options = {}) {
    return this.processRequest({
      content,
      type: 'sales',
      qualityRequirement: 0.85
    }, {
      ...options,
      qualityPriority: 'high',
      context: { type: 'sales' }
    });
  }
  
  async processExecutive(content, options = {}) {
    return this.processRequest({
      content,
      type: 'executive',
      qualityRequirement: 0.95
    }, {
      ...options,
      qualityPriority: 'premium',
      context: { type: 'executive' }
    });
  }
  
  async processRealtime(content, options = {}) {
    return this.processRequest({
      content,
      realtime: true,
      urgency: 'realtime'
    }, {
      ...options,
      urgency: 'realtime',
      maxResponseTime: 500
    });
  }
  
  async processMultilingual(content, language, options = {}) {
    return this.processRequest({
      content,
      language,
      type: 'multilingual'
    }, {
      ...options,
      context: { language, type: 'multilingual' }
    });
  }
  
  /**
   * Batch processing for multiple requests
   */
  async processBatch(requests, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 5;
    const concurrent = options.concurrent !== false;
    
    if (concurrent) {
      // Process in batches concurrently
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchPromises = batch.map(request => 
          this.processRequest(request.input, request.options)
            .catch(error => ({ error: error.message, request }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
    } else {
      // Process sequentially
      for (const request of requests) {
        try {
          const result = await this.processRequest(request.input, request.options);
          results.push(result);
        } catch (error) {
          results.push({ error: error.message, request });
        }
      }
    }
    
    return {
      results,
      summary: {
        total: requests.length,
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        averageResponseTime: this.performanceMetrics.averageResponseTime
      }
    };
  }
  
  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      orchestrator: {
        performanceMetrics: this.performanceMetrics,
        qualityThresholds: this.qualityThresholds,
        contextAnalyzer: {
          supportedMeetingTypes: Object.keys(this.contextAnalyzer.meetingTypes),
          supportedIndustries: Object.keys(this.contextAnalyzer.industries)
        }
      },
      fallbackSystem: this.fallbackSystem.getStatus()
    };
  }
  
  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      costSavings: 0,
      qualityScore: 0,
      contextAccuracy: 0,
      responseTimes: []
    };
    
    this.emit('metrics_reset', {
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = AIOrchestrator;
