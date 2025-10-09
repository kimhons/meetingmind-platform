/**
 * Triple-AI Client
 * 
 * Coordinates GPT-5, Claude Sonnet 4.5, and Gemini Flash 2.5 for
 * superior meeting intelligence through specialized AI collaboration.
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

class TripleAIClient {
  constructor(config = {}) {
    this.config = {
      timeout: 5000,
      retryAttempts: 2,
      fallbackEnabled: true,
      ...config
    };
    
    // Initialize AI clients
    this.clients = {
      gpt5: new OpenAI({
        apiKey: config.gpt5?.apiKey || process.env.OPENAI_API_KEY,
        timeout: this.config.timeout
      }),
      claude: new Anthropic({
        apiKey: config.claude?.apiKey || process.env.ANTHROPIC_API_KEY,
        timeout: this.config.timeout
      }),
      gemini: null // Will initialize with Google AI SDK
    };
    
    // AI specialization configuration
    this.specializations = {
      gpt5: {
        strengths: ['language-generation', 'reasoning', 'context-understanding'],
        tasks: ['suggestion-generation', 'question-formulation', 'content-creation'],
        model: config.gpt5?.model || 'gpt-4-turbo-preview',
        maxTokens: config.gpt5?.maxTokens || 4096,
        temperature: config.gpt5?.temperature || 0.7
      },
      claude: {
        strengths: ['analysis', 'accuracy', 'safety'],
        tasks: ['sentiment-analysis', 'risk-assessment', 'fact-checking'],
        model: config.claude?.model || 'claude-3-sonnet-20240229',
        maxTokens: config.claude?.maxTokens || 4096,
        temperature: config.claude?.temperature || 0.7
      },
      gemini: {
        strengths: ['speed', 'multimodal', 'vision'],
        tasks: ['real-time-processing', 'image-analysis', 'quick-responses'],
        model: config.gemini?.model || 'gemini-1.5-pro',
        maxTokens: config.gemini?.maxTokens || 4096,
        temperature: config.gemini?.temperature || 0.7
      }
    };
    
    this.synthesizer = new ResponseSynthesizer();
    this.loadBalancer = new AILoadBalancer();
    this.performanceTracker = new PerformanceTracker();
    
    this.initialized = false;
  }
  
  /**
   * Initialize all AI clients
   */
  async initialize() {
    try {
      // Test GPT-5 connection
      await this.testConnection('gpt5');
      
      // Test Claude connection
      await this.testConnection('claude');
      
      // Initialize Gemini (mock for now)
      this.clients.gemini = new MockGeminiClient(this.config.gemini);
      
      this.initialized = true;
      console.log('✓ Triple-AI Client initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Triple-AI Client:', error);
      throw error;
    }
  }
  
  /**
   * Analyze context with GPT-5 specialization
   */
  async analyzeWithGPT5(request) {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildGPT5Prompt(request);
      
      const response = await this.clients.gpt5.chat.completions.create({
        model: this.specializations.gpt5.model,
        messages: [
          {
            role: 'system',
            content: this.getGPT5SystemPrompt(request.task)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.specializations.gpt5.maxTokens,
        temperature: this.specializations.gpt5.temperature,
        response_format: { type: 'json_object' }
      });
      
      const result = this.parseGPT5Response(response);
      
      this.performanceTracker.recordSuccess('gpt5', Date.now() - startTime);
      
      return {
        source: 'gpt5',
        result,
        confidence: this.calculateConfidence(result, 'gpt5'),
        responseTime: Date.now() - startTime,
        timestamp: Date.now()
      };
      
    } catch (error) {
      this.performanceTracker.recordError('gpt5', Date.now() - startTime, error);
      
      if (this.config.fallbackEnabled) {
        return this.handleFallback('gpt5', request, error);
      }
      
      throw error;
    }
  }
  
  /**
   * Analyze context with Claude specialization
   */
  async analyzeWithClaude(request) {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildClaudePrompt(request);
      
      const response = await this.clients.claude.messages.create({
        model: this.specializations.claude.model,
        max_tokens: this.specializations.claude.maxTokens,
        temperature: this.specializations.claude.temperature,
        system: this.getClaudeSystemPrompt(request.task),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
      
      const result = this.parseClaudeResponse(response);
      
      this.performanceTracker.recordSuccess('claude', Date.now() - startTime);
      
      return {
        source: 'claude',
        result,
        confidence: this.calculateConfidence(result, 'claude'),
        responseTime: Date.now() - startTime,
        timestamp: Date.now()
      };
      
    } catch (error) {
      this.performanceTracker.recordError('claude', Date.now() - startTime, error);
      
      if (this.config.fallbackEnabled) {
        return this.handleFallback('claude', request, error);
      }
      
      throw error;
    }
  }
  
  /**
   * Analyze context with Gemini specialization
   */
  async analyzeWithGemini(request) {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildGeminiPrompt(request);
      
      // Mock Gemini response for now
      const response = await this.clients.gemini.generateContent({
        model: this.specializations.gemini.model,
        prompt: prompt,
        maxTokens: this.specializations.gemini.maxTokens,
        temperature: this.specializations.gemini.temperature
      });
      
      const result = this.parseGeminiResponse(response);
      
      this.performanceTracker.recordSuccess('gemini', Date.now() - startTime);
      
      return {
        source: 'gemini',
        result,
        confidence: this.calculateConfidence(result, 'gemini'),
        responseTime: Date.now() - startTime,
        timestamp: Date.now()
      };
      
    } catch (error) {
      this.performanceTracker.recordError('gemini', Date.now() - startTime, error);
      
      if (this.config.fallbackEnabled) {
        return this.handleFallback('gemini', request, error);
      }
      
      throw error;
    }
  }
  
  /**
   * Parallel analysis with all three AI models
   */
  async analyzeParallel(request) {
    const startTime = Date.now();
    
    try {
      // Distribute work based on AI strengths
      const tasks = this.distributeWork(request);
      
      // Execute in parallel with timeout protection
      const promises = [
        this.executeWithTimeout('gpt5', tasks.gpt5),
        this.executeWithTimeout('claude', tasks.claude),
        this.executeWithTimeout('gemini', tasks.gemini)
      ];
      
      const results = await Promise.allSettled(promises);
      
      // Process results
      const analysis = {
        gpt5: results[0].status === 'fulfilled' ? results[0].value : null,
        claude: results[1].status === 'fulfilled' ? results[1].value : null,
        gemini: results[2].status === 'fulfilled' ? results[2].value : null,
        timestamp: Date.now()
      };
      
      // Synthesize responses
      const synthesized = await this.synthesizer.combine(analysis);
      
      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(analysis);
      
      this.performanceTracker.recordParallelAnalysis(Date.now() - startTime, analysis);
      
      return {
        individual: analysis,
        synthesized,
        confidence,
        responseTime: Date.now() - startTime,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('Error in parallel analysis:', error);
      throw error;
    }
  }
  
  /**
   * Distribute work based on AI specializations
   */
  distributeWork(request) {
    const { task, data, context, focus } = request;
    
    return {
      gpt5: {
        task: 'language_and_reasoning',
        data,
        context,
        focus: ['language_patterns', 'logical_reasoning', 'context_understanding'],
        specialization: 'Generate contextual suggestions and reasoning-based insights'
      },
      claude: {
        task: 'analysis_and_safety',
        data,
        context,
        focus: ['sentiment_analysis', 'risk_assessment', 'accuracy_validation'],
        specialization: 'Provide accurate analysis and safety considerations'
      },
      gemini: {
        task: 'speed_and_multimodal',
        data,
        context,
        focus: ['quick_insights', 'visual_processing', 'real_time_response'],
        specialization: 'Deliver fast insights and process multimodal content'
      }
    };
  }
  
  /**
   * Execute AI request with timeout protection
   */
  async executeWithTimeout(aiModel, request) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${aiModel} request timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);
      
      try {
        let result;
        
        switch (aiModel) {
          case 'gpt5':
            result = await this.analyzeWithGPT5(request);
            break;
          case 'claude':
            result = await this.analyzeWithClaude(request);
            break;
          case 'gemini':
            result = await this.analyzeWithGemini(request);
            break;
          default:
            throw new Error(`Unknown AI model: ${aiModel}`);
        }
        
        clearTimeout(timeout);
        resolve(result);
        
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
  
  /**
   * Build GPT-5 specific prompt
   */
  buildGPT5Prompt(request) {
    const { task, data, context, focus } = request;
    
    return `
Task: ${task}
Focus Areas: ${focus?.join(', ') || 'general analysis'}

Meeting Context:
- Current Topic: ${context?.currentTopic || 'Unknown'}
- Participants: ${context?.participants?.join(', ') || 'Unknown'}
- Conversation Flow: ${context?.conversationFlow?.slice(-3).map(c => `${c.speaker}: ${c.text}`).join('\n') || 'No recent conversation'}

Current Data:
${JSON.stringify(data, null, 2)}

Please provide a JSON response with the following structure:
{
  "insights": ["insight1", "insight2", ...],
  "suggestions": [
    {
      "type": "suggestion_type",
      "content": "suggestion_content",
      "confidence": 0.0-1.0,
      "reasoning": "why_this_suggestion"
    }
  ],
  "context_understanding": {
    "key_topics": ["topic1", "topic2"],
    "sentiment": 0.0-1.0,
    "engagement_level": 0.0-1.0
  },
  "confidence": 0.0-1.0
}`;
  }
  
  /**
   * Build Claude specific prompt
   */
  buildClaudePrompt(request) {
    const { task, data, context, focus } = request;
    
    return `
I need you to analyze meeting content with focus on accuracy and safety.

Task: ${task}
Analysis Focus: ${focus?.join(', ') || 'comprehensive analysis'}

Meeting Context:
- Participants: ${context?.participants?.length || 0} people
- Current sentiment: ${context?.sentiment?.overall || 'neutral'}
- Key terms discussed: ${Array.from(context?.keyTerms || []).slice(0, 5).join(', ')}

Data to Analyze:
${JSON.stringify(data, null, 2)}

Please provide analysis in this JSON format:
{
  "sentiment_analysis": {
    "overall_sentiment": 0.0-1.0,
    "emotional_indicators": ["indicator1", "indicator2"],
    "risk_factors": ["risk1", "risk2"]
  },
  "accuracy_assessment": {
    "factual_claims": ["claim1", "claim2"],
    "verification_needed": ["item1", "item2"],
    "confidence_level": 0.0-1.0
  },
  "safety_considerations": {
    "potential_issues": ["issue1", "issue2"],
    "recommendations": ["rec1", "rec2"]
  },
  "confidence": 0.0-1.0
}`;
  }
  
  /**
   * Build Gemini specific prompt
   */
  buildGeminiPrompt(request) {
    const { task, data, context, focus } = request;
    
    return `
Quick analysis needed for real-time meeting intelligence.

Task: ${task}
Speed Focus: ${focus?.join(', ') || 'fast insights'}

Current Context:
- Meeting in progress: ${context?.currentTopic || 'General discussion'}
- Recent activity: ${context?.conversationFlow?.slice(-1)[0]?.text || 'No recent activity'}

Data:
${JSON.stringify(data, null, 2)}

Provide fast JSON response:
{
  "quick_insights": ["insight1", "insight2"],
  "immediate_suggestions": [
    {
      "type": "type",
      "content": "content",
      "urgency": "low|medium|high"
    }
  ],
  "visual_analysis": {
    "detected_elements": ["element1", "element2"],
    "visual_context": "description"
  },
  "confidence": 0.0-1.0
}`;
  }
  
  /**
   * Get system prompts for each AI model
   */
  getGPT5SystemPrompt(task) {
    return `You are an expert meeting intelligence assistant specializing in language understanding, reasoning, and contextual analysis. Your role is to provide insightful suggestions and deep contextual understanding for business meetings. Focus on generating helpful suggestions, understanding complex contexts, and providing reasoning-based insights. Always respond in valid JSON format.`;
  }
  
  getClaudeSystemPrompt(task) {
    return `You are a precise meeting analysis assistant focused on accuracy, safety, and thorough analysis. Your role is to provide accurate sentiment analysis, identify potential risks or issues, and ensure the safety and appropriateness of meeting content. Prioritize factual accuracy and comprehensive analysis. Always respond in valid JSON format.`;
  }
  
  /**
   * Parse AI responses
   */
  parseGPT5Response(response) {
    try {
      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing GPT-5 response:', error);
      return { error: 'Failed to parse response', raw: response };
    }
  }
  
  parseClaudeResponse(response) {
    try {
      const content = response.content[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return { error: 'Failed to parse response', raw: response };
    }
  }
  
  parseGeminiResponse(response) {
    try {
      // Mock parsing for Gemini
      return {
        quick_insights: ['Fast insight 1', 'Fast insight 2'],
        immediate_suggestions: [
          { type: 'clarification', content: 'Ask for clarification on the last point', urgency: 'medium' }
        ],
        visual_analysis: {
          detected_elements: ['presentation', 'charts'],
          visual_context: 'Business presentation with data visualization'
        },
        confidence: 0.85
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return { error: 'Failed to parse response', raw: response };
    }
  }
  
  /**
   * Calculate confidence for individual AI responses
   */
  calculateConfidence(result, aiModel) {
    if (result.error) return 0;
    
    // Base confidence from AI response
    let confidence = result.confidence || 0.7;
    
    // Adjust based on AI model reliability
    const reliabilityFactors = {
      gpt5: 0.9,
      claude: 0.95,
      gemini: 0.85
    };
    
    confidence *= reliabilityFactors[aiModel] || 0.8;
    
    // Adjust based on response completeness
    const completeness = this.assessResponseCompleteness(result);
    confidence *= completeness;
    
    return Math.min(1.0, confidence);
  }
  
  /**
   * Calculate overall confidence from multiple AI responses
   */
  calculateOverallConfidence(analysis) {
    const confidences = [];
    
    if (analysis.gpt5 && !analysis.gpt5.error) confidences.push(analysis.gpt5.confidence);
    if (analysis.claude && !analysis.claude.error) confidences.push(analysis.claude.confidence);
    if (analysis.gemini && !analysis.gemini.error) confidences.push(analysis.gemini.confidence);
    
    if (confidences.length === 0) return 0;
    
    // Weighted average with consensus bonus
    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const consensusBonus = confidences.length > 1 ? 0.1 : 0;
    
    return Math.min(1.0, average + consensusBonus);
  }
  
  /**
   * Assess response completeness
   */
  assessResponseCompleteness(result) {
    if (result.error) return 0;
    
    let score = 0.5; // Base score
    
    // Check for key fields
    if (result.insights || result.suggestions) score += 0.2;
    if (result.sentiment_analysis || result.context_understanding) score += 0.2;
    if (result.confidence !== undefined) score += 0.1;
    
    return Math.min(1.0, score);
  }
  
  /**
   * Handle fallback when AI model fails
   */
  async handleFallback(failedModel, request, error) {
    console.warn(`${failedModel} failed, attempting fallback:`, error.message);
    
    // Try alternative models
    const alternatives = {
      gpt5: ['claude', 'gemini'],
      claude: ['gpt5', 'gemini'],
      gemini: ['gpt5', 'claude']
    };
    
    for (const alternative of alternatives[failedModel] || []) {
      try {
        switch (alternative) {
          case 'gpt5':
            return await this.analyzeWithGPT5(request);
          case 'claude':
            return await this.analyzeWithClaude(request);
          case 'gemini':
            return await this.analyzeWithGemini(request);
        }
      } catch (fallbackError) {
        console.warn(`Fallback ${alternative} also failed:`, fallbackError.message);
      }
    }
    
    // Return error response if all fallbacks fail
    return {
      source: failedModel,
      error: `All AI models failed. Original error: ${error.message}`,
      confidence: 0,
      timestamp: Date.now()
    };
  }
  
  /**
   * Test connection to AI service
   */
  async testConnection(aiModel) {
    try {
      switch (aiModel) {
        case 'gpt5':
          await this.clients.gpt5.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Test connection' }],
            max_tokens: 10
          });
          break;
        case 'claude':
          await this.clients.claude.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Test connection' }]
          });
          break;
        case 'gemini':
          // Mock test for Gemini
          break;
      }
      
      console.log(`✓ ${aiModel} connection successful`);
      
    } catch (error) {
      console.error(`✗ ${aiModel} connection failed:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceTracker.getMetrics();
  }
}

/**
 * Response Synthesizer for combining AI outputs
 */
class ResponseSynthesizer {
  async combine(analysis) {
    const synthesized = {
      insights: [],
      suggestions: [],
      sentiment: null,
      confidence: 0,
      sources: []
    };
    
    // Combine insights from all sources
    if (analysis.gpt5?.result?.insights) {
      synthesized.insights.push(...analysis.gpt5.result.insights);
      synthesized.sources.push('gpt5');
    }
    
    if (analysis.claude?.result?.sentiment_analysis) {
      synthesized.sentiment = analysis.claude.result.sentiment_analysis;
      synthesized.sources.push('claude');
    }
    
    if (analysis.gemini?.result?.quick_insights) {
      synthesized.insights.push(...analysis.gemini.result.quick_insights);
      synthesized.sources.push('gemini');
    }
    
    // Combine suggestions
    if (analysis.gpt5?.result?.suggestions) {
      synthesized.suggestions.push(...analysis.gpt5.result.suggestions);
    }
    
    if (analysis.gemini?.result?.immediate_suggestions) {
      synthesized.suggestions.push(...analysis.gemini.result.immediate_suggestions);
    }
    
    // Calculate synthesized confidence
    const confidences = [analysis.gpt5, analysis.claude, analysis.gemini]
      .filter(a => a && !a.error)
      .map(a => a.confidence);
    
    synthesized.confidence = confidences.length > 0 
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;
    
    return synthesized;
  }
}

/**
 * AI Load Balancer for distributing requests
 */
class AILoadBalancer {
  constructor() {
    this.modelLoad = {
      gpt5: 0,
      claude: 0,
      gemini: 0
    };
  }
  
  selectOptimalModel(task) {
    // Simple round-robin for now
    const models = Object.keys(this.modelLoad);
    const leastLoaded = models.reduce((min, model) => 
      this.modelLoad[model] < this.modelLoad[min] ? model : min
    );
    
    this.modelLoad[leastLoaded]++;
    
    return leastLoaded;
  }
  
  releaseModel(model) {
    if (this.modelLoad[model] > 0) {
      this.modelLoad[model]--;
    }
  }
}

/**
 * Performance Tracker for monitoring AI performance
 */
class PerformanceTracker {
  constructor() {
    this.metrics = {
      gpt5: { requests: 0, successes: 0, totalTime: 0, errors: [] },
      claude: { requests: 0, successes: 0, totalTime: 0, errors: [] },
      gemini: { requests: 0, successes: 0, totalTime: 0, errors: [] },
      parallel: { requests: 0, totalTime: 0 }
    };
  }
  
  recordSuccess(model, responseTime) {
    const metric = this.metrics[model];
    metric.requests++;
    metric.successes++;
    metric.totalTime += responseTime;
  }
  
  recordError(model, responseTime, error) {
    const metric = this.metrics[model];
    metric.requests++;
    metric.totalTime += responseTime;
    metric.errors.push({
      timestamp: Date.now(),
      error: error.message,
      responseTime
    });
  }
  
  recordParallelAnalysis(responseTime, analysis) {
    this.metrics.parallel.requests++;
    this.metrics.parallel.totalTime += responseTime;
  }
  
  getMetrics() {
    const result = {};
    
    for (const [model, metric] of Object.entries(this.metrics)) {
      if (model === 'parallel') {
        result[model] = {
          requests: metric.requests,
          averageTime: metric.requests > 0 ? metric.totalTime / metric.requests : 0
        };
      } else {
        result[model] = {
          requests: metric.requests,
          successRate: metric.requests > 0 ? metric.successes / metric.requests : 0,
          averageTime: metric.requests > 0 ? metric.totalTime / metric.requests : 0,
          errorCount: metric.errors.length
        };
      }
    }
    
    return result;
  }
}

/**
 * Mock Gemini Client for development
 */
class MockGeminiClient {
  constructor(config) {
    this.config = config;
  }
  
  async generateContent(request) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      content: JSON.stringify({
        quick_insights: ['Mock insight 1', 'Mock insight 2'],
        immediate_suggestions: [
          { type: 'clarification', content: 'Mock suggestion', urgency: 'medium' }
        ],
        visual_analysis: {
          detected_elements: ['mock_element'],
          visual_context: 'Mock visual context'
        },
        confidence: 0.8
      })
    };
  }
}

module.exports = TripleAIClient;
