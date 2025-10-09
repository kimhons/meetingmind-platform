/**
 * Intelligence Orchestrator Service
 * 
 * Central coordination engine that manages all AI services, synthesizes results,
 * and prioritizes insights for real-time delivery during meetings.
 */

const EventEmitter = require('events');
const ContextualAnalysisService = require('./contextual-analysis');
const TripleAIClient = require('../ai/triple-ai-client');

class IntelligenceOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxConcurrentRequests: 10,
      requestTimeout: 5000,
      synthesisTimeout: 2000,
      priorityLevels: ['critical', 'high', 'medium', 'low'],
      ...options
    };
    
    // Service instances
    this.services = new Map();
    this.tripleAI = null;
    
    // Request management
    this.activeRequests = new Map();
    this.requestQueue = new PriorityQueue();
    this.coordinationEngine = new CoordinationEngine();
    this.synthesizer = new IntelligenceSynthesizer();
    
    // Performance tracking
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      serviceUtilization: {},
      synthesisPerformance: {
        averageTime: 0,
        successRate: 0
      }
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the intelligence orchestrator
   */
  async initialize() {
    try {
      console.log('Initializing Intelligence Orchestrator...');
      
      // Initialize Triple-AI client
      this.tripleAI = new TripleAIClient();
      await this.tripleAI.initialize();
      
      // Initialize core services
      await this.initializeServices();
      
      // Start request processing
      this.startRequestProcessor();
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log('✓ Intelligence Orchestrator initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Intelligence Orchestrator:', error);
      throw error;
    }
  }
  
  /**
   * Initialize all intelligence services
   */
  async initializeServices() {
    // Contextual Analysis Service
    const contextualService = new ContextualAnalysisService({
      tripleAI: this.tripleAI,
      confidenceThreshold: 0.7
    });
    await contextualService.initialize();
    this.services.set('contextual', contextualService);
    
    // Predictive Outcomes Service (placeholder)
    this.services.set('predictive', new MockPredictiveService());
    
    // Coaching Service (placeholder)
    this.services.set('coaching', new MockCoachingService());
    
    // Knowledge Service (placeholder)
    this.services.set('knowledge', new MockKnowledgeService());
    
    // Set up service event listeners
    this.setupServiceEventListeners();
    
    console.log(`✓ Initialized ${this.services.size} intelligence services`);
  }
  
  /**
   * Set up event listeners for all services
   */
  setupServiceEventListeners() {
    this.services.forEach((service, serviceName) => {
      if (service.on) {
        service.on('analysisCompleted', (data) => {
          this.handleServiceResult(serviceName, data);
        });
        
        service.on('error', (error) => {
          this.handleServiceError(serviceName, error);
        });
      }
    });
  }
  
  /**
   * Process intelligence request with coordination
   */
  async processIntelligenceRequest(meetingId, context, requestType = 'real_time', priority = 'medium') {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    try {
      // Validate request
      if (!meetingId || !context) {
        throw new Error('Invalid request: meetingId and context are required');
      }
      
      // Create request object
      const request = {
        id: requestId,
        meetingId,
        context,
        requestType,
        priority,
        timestamp: startTime,
        status: 'pending'
      };
      
      // Add to active requests
      this.activeRequests.set(requestId, request);
      
      // Determine relevant services
      const relevantServices = this.selectRelevantServices(requestType, context);
      
      // Execute services in parallel with coordination
      const serviceResults = await this.executeServicesWithCoordination(
        request, 
        relevantServices
      );
      
      // Synthesize results
      const synthesizedResult = await this.synthesizer.synthesize(
        serviceResults, 
        context, 
        requestType
      );
      
      // Prioritize insights
      const prioritizedInsights = await this.prioritizeInsights(
        synthesizedResult, 
        context, 
        priority
      );
      
      // Update metrics
      this.updateMetrics(startTime, true, serviceResults);
      
      // Clean up request
      this.activeRequests.delete(requestId);
      
      // Emit result
      this.emit('intelligenceProcessed', {
        requestId,
        meetingId,
        insights: prioritizedInsights,
        responseTime: Date.now() - startTime,
        serviceResults
      });
      
      return prioritizedInsights;
      
    } catch (error) {
      this.updateMetrics(startTime, false);
      this.activeRequests.delete(requestId);
      
      console.error(`Error processing intelligence request ${requestId}:`, error);
      
      // Emit error
      this.emit('intelligenceError', {
        requestId,
        meetingId,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  /**
   * Select relevant services based on request type and context
   */
  selectRelevantServices(requestType, context) {
    const serviceSelection = {
      real_time: ['contextual'],
      comprehensive: ['contextual', 'predictive', 'coaching'],
      predictive_focus: ['predictive', 'contextual'],
      coaching_focus: ['coaching', 'contextual'],
      knowledge_query: ['knowledge', 'contextual']
    };
    
    let selectedServices = serviceSelection[requestType] || ['contextual'];
    
    // Dynamic service selection based on context
    if (context.needsPrediction) {
      selectedServices.push('predictive');
    }
    
    if (context.needsCoaching) {
      selectedServices.push('coaching');
    }
    
    if (context.needsKnowledge) {
      selectedServices.push('knowledge');
    }
    
    // Remove duplicates and ensure services exist
    return [...new Set(selectedServices)].filter(service => this.services.has(service));
  }
  
  /**
   * Execute services with coordination and timeout protection
   */
  async executeServicesWithCoordination(request, serviceNames) {
    const { context, requestType } = request;
    const servicePromises = [];
    
    // Create coordinated execution plan
    const executionPlan = this.coordinationEngine.createExecutionPlan(
      serviceNames, 
      context, 
      requestType
    );
    
    // Execute services according to plan
    for (const phase of executionPlan.phases) {
      const phasePromises = phase.services.map(serviceName => 
        this.executeServiceWithTimeout(serviceName, request, phase.timeout)
      );
      
      const phaseResults = await Promise.allSettled(phasePromises);
      servicePromises.push(...phaseResults);
      
      // Early termination if critical service fails
      if (phase.critical && phaseResults.some(r => r.status === 'rejected')) {
        console.warn('Critical service failed, terminating execution plan');
        break;
      }
    }
    
    // Process results
    const serviceResults = {};
    serviceNames.forEach((serviceName, index) => {
      const result = servicePromises[index];
      serviceResults[serviceName] = result.status === 'fulfilled' 
        ? result.value 
        : { error: result.reason?.message || 'Service execution failed' };
    });
    
    return serviceResults;
  }
  
  /**
   * Execute individual service with timeout protection
   */
  async executeServiceWithTimeout(serviceName, request, timeout = this.options.requestTimeout) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Service ${serviceName} timed out after ${timeout}ms`));
      }, timeout);
      
      try {
        let result;
        
        // Call appropriate service method based on service type
        switch (serviceName) {
          case 'contextual':
            result = await service.analyzeRealTimeContext(
              request.meetingId, 
              request.context
            );
            break;
          case 'predictive':
            result = await service.generatePredictions(request.context);
            break;
          case 'coaching':
            result = await service.generateCoachingInsights(
              request.context, 
              request.userProfile
            );
            break;
          case 'knowledge':
            result = await service.searchKnowledge(request.context);
            break;
          default:
            throw new Error(`Unknown service method for ${serviceName}`);
        }
        
        clearTimeout(timeoutId);
        resolve({
          serviceName,
          result,
          timestamp: Date.now(),
          success: true
        });
        
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }
  
  /**
   * Prioritize insights based on context and priority level
   */
  async prioritizeInsights(synthesizedResult, context, priority) {
    const prioritizer = new InsightPrioritizer({
      priority,
      context,
      userPreferences: context.userPreferences || {}
    });
    
    return await prioritizer.prioritize(synthesizedResult);
  }
  
  /**
   * Start request processor for queued requests
   */
  startRequestProcessor() {
    setInterval(() => {
      this.processQueuedRequests();
    }, 100); // Process every 100ms
  }
  
  /**
   * Process queued requests
   */
  async processQueuedRequests() {
    if (this.activeRequests.size >= this.options.maxConcurrentRequests) {
      return; // At capacity
    }
    
    const request = this.requestQueue.dequeue();
    if (!request) {
      return; // No queued requests
    }
    
    try {
      await this.processIntelligenceRequest(
        request.meetingId,
        request.context,
        request.requestType,
        request.priority
      );
    } catch (error) {
      console.error('Error processing queued request:', error);
    }
  }
  
  /**
   * Handle service result
   */
  handleServiceResult(serviceName, data) {
    this.emit('serviceResult', {
      serviceName,
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle service error
   */
  handleServiceError(serviceName, error) {
    console.error(`Service ${serviceName} error:`, error);
    
    this.emit('serviceError', {
      serviceName,
      error: error.message,
      timestamp: Date.now()
    });
  }
  
  /**
   * Update performance metrics
   */
  updateMetrics(startTime, success, serviceResults = {}) {
    const responseTime = Date.now() - startTime;
    
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    }
    
    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + responseTime) / 2;
    
    // Update service utilization
    Object.keys(serviceResults).forEach(serviceName => {
      if (!this.metrics.serviceUtilization[serviceName]) {
        this.metrics.serviceUtilization[serviceName] = {
          requests: 0,
          successes: 0,
          averageTime: 0
        };
      }
      
      const serviceMetric = this.metrics.serviceUtilization[serviceName];
      serviceMetric.requests++;
      
      if (serviceResults[serviceName] && !serviceResults[serviceName].error) {
        serviceMetric.successes++;
      }
      
      serviceMetric.averageTime = (serviceMetric.averageTime + responseTime) / 2;
    });
  }
  
  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get orchestrator status and metrics
   */
  getStatus() {
    return {
      initialized: this.initialized,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.size(),
      services: Array.from(this.services.keys()),
      metrics: this.metrics,
      uptime: Date.now() - (this.initTime || Date.now())
    };
  }
  
  /**
   * Shutdown orchestrator gracefully
   */
  async shutdown() {
    console.log('Shutting down Intelligence Orchestrator...');
    
    // Wait for active requests to complete (with timeout)
    const shutdownTimeout = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (this.activeRequests.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Shutdown services
    for (const [serviceName, service] of this.services) {
      if (service.shutdown) {
        try {
          await service.shutdown();
          console.log(`✓ ${serviceName} service shutdown complete`);
        } catch (error) {
          console.error(`✗ Error shutting down ${serviceName} service:`, error);
        }
      }
    }
    
    this.emit('shutdown');
    console.log('✓ Intelligence Orchestrator shutdown complete');
  }
}

/**
 * Coordination Engine for managing service execution
 */
class CoordinationEngine {
  createExecutionPlan(serviceNames, context, requestType) {
    // Create execution phases based on service dependencies and priorities
    const plan = {
      phases: []
    };
    
    // Phase 1: Core analysis (contextual always first)
    if (serviceNames.includes('contextual')) {
      plan.phases.push({
        services: ['contextual'],
        timeout: 3000,
        critical: true
      });
    }
    
    // Phase 2: Parallel specialized services
    const parallelServices = serviceNames.filter(s => s !== 'contextual');
    if (parallelServices.length > 0) {
      plan.phases.push({
        services: parallelServices,
        timeout: 4000,
        critical: false
      });
    }
    
    return plan;
  }
}

/**
 * Intelligence Synthesizer for combining service results
 */
class IntelligenceSynthesizer {
  async synthesize(serviceResults, context, requestType) {
    const synthesized = {
      insights: [],
      suggestions: [],
      predictions: [],
      coaching: [],
      knowledge: [],
      confidence: 0,
      sources: [],
      timestamp: Date.now()
    };
    
    // Process contextual analysis results
    if (serviceResults.contextual && !serviceResults.contextual.error) {
      const contextualResult = serviceResults.contextual.result;
      
      if (contextualResult.suggestions) {
        synthesized.suggestions.push(...contextualResult.suggestions);
      }
      
      if (contextualResult.insights) {
        synthesized.insights.push(...contextualResult.insights);
      }
      
      synthesized.sources.push('contextual');
    }
    
    // Process predictive results
    if (serviceResults.predictive && !serviceResults.predictive.error) {
      synthesized.predictions.push(...(serviceResults.predictive.result.predictions || []));
      synthesized.sources.push('predictive');
    }
    
    // Process coaching results
    if (serviceResults.coaching && !serviceResults.coaching.error) {
      synthesized.coaching.push(...(serviceResults.coaching.result.insights || []));
      synthesized.sources.push('coaching');
    }
    
    // Process knowledge results
    if (serviceResults.knowledge && !serviceResults.knowledge.error) {
      synthesized.knowledge.push(...(serviceResults.knowledge.result.documents || []));
      synthesized.sources.push('knowledge');
    }
    
    // Calculate overall confidence
    synthesized.confidence = this.calculateSynthesizedConfidence(serviceResults);
    
    return synthesized;
  }
  
  calculateSynthesizedConfidence(serviceResults) {
    const confidences = [];
    
    Object.values(serviceResults).forEach(result => {
      if (result && !result.error && result.result && result.result.confidence) {
        confidences.push(result.result.confidence);
      }
    });
    
    if (confidences.length === 0) return 0;
    
    // Weighted average with consensus bonus
    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const consensusBonus = confidences.length > 1 ? 0.1 : 0;
    
    return Math.min(1.0, average + consensusBonus);
  }
}

/**
 * Insight Prioritizer for ranking and filtering insights
 */
class InsightPrioritizer {
  constructor(options = {}) {
    this.options = options;
    this.priorityWeights = {
      critical: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4
    };
  }
  
  async prioritize(synthesizedResult) {
    const allInsights = [
      ...synthesizedResult.suggestions.map(s => ({ ...s, category: 'suggestion' })),
      ...synthesizedResult.insights.map(i => ({ ...i, category: 'insight' })),
      ...synthesizedResult.predictions.map(p => ({ ...p, category: 'prediction' })),
      ...synthesizedResult.coaching.map(c => ({ ...c, category: 'coaching' })),
      ...synthesizedResult.knowledge.map(k => ({ ...k, category: 'knowledge' }))
    ];
    
    // Calculate priority scores
    const scoredInsights = allInsights.map(insight => ({
      ...insight,
      priorityScore: this.calculatePriorityScore(insight)
    }));
    
    // Sort by priority score
    const prioritized = scoredInsights.sort((a, b) => b.priorityScore - a.priorityScore);
    
    // Apply filters and limits
    return this.applyFiltersAndLimits(prioritized);
  }
  
  calculatePriorityScore(insight) {
    let score = insight.confidence || 0.5;
    
    // Apply priority weight
    const priorityWeight = this.priorityWeights[this.options.priority] || 0.6;
    score *= priorityWeight;
    
    // Category-specific adjustments
    const categoryWeights = {
      suggestion: 1.0,
      insight: 0.9,
      prediction: 0.8,
      coaching: 0.7,
      knowledge: 0.6
    };
    
    score *= categoryWeights[insight.category] || 0.5;
    
    // Urgency adjustments
    if (insight.urgency === 'high') score *= 1.2;
    if (insight.urgency === 'low') score *= 0.8;
    
    return score;
  }
  
  applyFiltersAndLimits(prioritizedInsights) {
    // Apply confidence threshold
    const filtered = prioritizedInsights.filter(insight => 
      insight.confidence >= 0.6
    );
    
    // Limit total insights
    return filtered.slice(0, 10);
  }
}

/**
 * Priority Queue for request management
 */
class PriorityQueue {
  constructor() {
    this.items = [];
  }
  
  enqueue(item, priority = 'medium') {
    const priorityValues = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityValue = priorityValues[priority] || 2;
    
    this.items.push({ ...item, priority: priorityValue });
    this.items.sort((a, b) => b.priority - a.priority);
  }
  
  dequeue() {
    return this.items.shift();
  }
  
  size() {
    return this.items.length;
  }
}

// Mock services for development
class MockPredictiveService {
  async generatePredictions(context) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      predictions: [
        { outcome: 'Decision reached', probability: 0.85, timeframe: '10 minutes' }
      ],
      confidence: 0.8
    };
  }
}

class MockCoachingService {
  async generateCoachingInsights(context, userProfile) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      insights: [
        { type: 'communication', suggestion: 'Consider asking more open-ended questions', confidence: 0.75 }
      ],
      confidence: 0.75
    };
  }
}

class MockKnowledgeService {
  async searchKnowledge(context) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      documents: [
        { title: 'Relevant Document', summary: 'Document summary', relevance: 0.9 }
      ],
      confidence: 0.85
    };
  }
}

module.exports = IntelligenceOrchestrator;
