/**
 * Enhanced Hybrid AI Client with AIMLAPI Primary Provider Strategy
 * 
 * This implementation uses AIMLAPI as the primary provider for 70% cost savings
 * while maintaining OpenAI, Google, and Anthropic as fallback providers for
 * maximum reliability and performance.
 */

const axios = require('axios');

class EnhancedHybridAIClient {
  constructor(config = {}) {
    this.config = {
      // AIMLAPI Configuration (Primary Provider)
      aimlapi: {
        apiKey: config.aimlApiKey || process.env.AIMLAPI_KEY,
        baseUrl: 'https://api.aimlapi.com/v1',
        timeout: 30000,
        retries: 3
      },
      
      // Fallback Providers
      openai: {
        apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1',
        timeout: 30000,
        retries: 2
      },
      
      google: {
        apiKey: config.googleApiKey || process.env.GOOGLE_API_KEY,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        timeout: 30000,
        retries: 2
      },
      
      anthropic: {
        apiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com/v1',
        timeout: 30000,
        retries: 2
      }
    };
    
    // Cost tracking and optimization
    this.costTracker = {
      monthlyBudget: 5000, // $5K monthly budget
      currentSpend: 0,
      savingsTarget: 0.70, // 70% savings target
      usage: {
        aimlapi: { requests: 0, tokens: 0, cost: 0 },
        openai: { requests: 0, tokens: 0, cost: 0 },
        google: { requests: 0, tokens: 0, cost: 0 },
        anthropic: { requests: 0, tokens: 0, cost: 0 }
      }
    };
    
    // Performance monitoring
    this.performance = {
      responseTime: {},
      successRate: {},
      qualityScore: {},
      lastBenchmark: null
    };
    
    // AIMLAPI Model Strategy Matrix
    this.modelStrategy = {
      // High-value strategic analysis
      executive: {
        primary: 'gpt-5-pro',
        fallback: 'claude-4.5-sonnet',
        costPer1k: 0.00656, // 95% savings vs direct OpenAI
        useCases: ['C-level insights', 'Strategic decisions', 'Executive summaries']
      },
      
      // Real-time processing
      realtime: {
        primary: 'grok-4-fast',
        fallback: 'gemini-2.5-flash',
        costPer1k: 0.000735, // 98% savings vs direct
        useCases: ['Live transcription', 'Real-time coaching', 'Instant responses']
      },
      
      // Continuous monitoring
      monitoring: {
        primary: 'deepseek-v3.1',
        fallback: 'gpt-5-nano',
        costPer1k: 0.002352, // 92% savings vs direct
        useCases: ['Background analysis', 'Pattern detection', 'Sentiment tracking']
      },
      
      // Multi-language support
      multilingual: {
        primary: 'qwen3-max',
        fallback: 'gemini-2.5-flash',
        costPer1k: 0.008400, // 85% savings vs direct
        useCases: ['Global meetings', 'Translation', 'Cultural context']
      },
      
      // Interview intelligence
      interview: {
        primary: 'gpt-5-pro',
        fallback: 'claude-4.5-sonnet',
        costPer1k: 0.00656,
        useCases: ['Interview analysis', 'Candidate assessment', 'Coaching recommendations']
      },
      
      // Sales optimization
      sales: {
        primary: 'claude-4.5-sonnet',
        fallback: 'gpt-5-chat',
        costPer1k: 0.01890,
        useCases: ['Sales insights', 'Negotiation analysis', 'Deal optimization']
      }
    };
    
    // Rate limiting and health monitoring
    this.rateLimits = {
      'gpt-5-pro': { limit: 100, current: 0, resetTime: Date.now() },
      'claude-4.5-sonnet': { limit: 50, current: 0, resetTime: Date.now() },
      'grok-4-fast': { limit: 200, current: 0, resetTime: Date.now() },
      'deepseek-v3.1': { limit: 500, current: 0, resetTime: Date.now() }
    };
    
    this.providerHealth = {
      aimlapi: { status: 'healthy', lastCheck: Date.now(), failures: 0 },
      openai: { status: 'healthy', lastCheck: Date.now(), failures: 0 },
      google: { status: 'healthy', lastCheck: Date.now(), failures: 0 },
      anthropic: { status: 'healthy', lastCheck: Date.now(), failures: 0 }
    };
  }
  
  /**
   * Main processing method with intelligent provider selection
   */
  async processRequest(context, content, options = {}) {
    const startTime = Date.now();
    
    try {
      // Select optimal strategy based on context
      const strategy = this.selectStrategy(context);
      
      // Try primary provider (AIMLAPI)
      try {
        const result = await this.processWithAIMLAPI(strategy, content, options);
        this.logSuccess('aimlapi', Date.now() - startTime, result);
        return result;
      } catch (error) {
        console.warn('AIMLAPI failed, trying fallback:', error.message);
        return await this.processWithFallback(context, content, options, error);
      }
      
    } catch (error) {
      console.error('All providers failed:', error);
      throw new Error('AI processing unavailable - all providers failed');
    }
  }
  
  /**
   * Select optimal strategy based on meeting context
   */
  selectStrategy(context) {
    const { type, industry, participants, language, topics } = context;
    
    // Interview intelligence
    if (type === 'interview' || topics?.some(t => t.includes('interview'))) {
      return this.modelStrategy.interview;
    }
    
    // Sales optimization
    if (type === 'sales' || topics?.some(t => t.includes('sales'))) {
      return this.modelStrategy.sales;
    }
    
    // Executive/strategic meetings
    if (participants > 5 || topics?.some(t => t.includes('strategic'))) {
      return this.modelStrategy.executive;
    }
    
    // Multi-language support
    if (language && language !== 'en') {
      return this.modelStrategy.multilingual;
    }
    
    // Real-time processing (default for live meetings)
    if (context.realtime || context.live) {
      return this.modelStrategy.realtime;
    }
    
    // Default to monitoring strategy
    return this.modelStrategy.monitoring;
  }
  
  /**
   * Process request using AIMLAPI (primary provider)
   */
  async processWithAIMLAPI(strategy, content, options) {
    const model = this.selectAIMLAPIModel(strategy);
    
    // Check rate limits
    if (!this.checkRateLimit(model)) {
      throw new Error(`Rate limit exceeded for model: ${model}`);
    }
    
    // Check provider health
    if (!this.isProviderHealthy('aimlapi')) {
      throw new Error('AIMLAPI provider unhealthy');
    }
    
    const requestData = {
      model: model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(strategy)
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      stream: options.stream || false
    };
    
    try {
      const response = await axios.post(
        `${this.config.aimlapi.baseUrl}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.aimlapi.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.config.aimlapi.timeout
        }
      );
      
      const result = this.parseAIMLAPIResponse(response.data);
      this.trackUsage('aimlapi', result.usage, strategy.costPer1k);
      this.updateRateLimit(model);
      
      return result;
      
    } catch (error) {
      this.handleProviderError('aimlapi', error);
      throw error;
    }
  }
  
  /**
   * Fallback processing with other providers
   */
  async processWithFallback(context, content, options, primaryError) {
    const fallbackProviders = ['openai', 'google', 'anthropic'];
    
    for (const provider of fallbackProviders) {
      if (!this.isProviderHealthy(provider)) {
        continue;
      }
      
      try {
        let result;
        
        switch (provider) {
          case 'openai':
            result = await this.processWithOpenAI(content, options);
            break;
          case 'google':
            result = await this.processWithGoogle(content, options);
            break;
          case 'anthropic':
            result = await this.processWithAnthropic(content, options);
            break;
        }
        
        this.logFallbackSuccess(provider, primaryError);
        return result;
        
      } catch (error) {
        console.warn(`Fallback provider ${provider} failed:`, error.message);
        this.handleProviderError(provider, error);
        continue;
      }
    }
    
    throw new Error('All AI providers failed');
  }
  
  /**
   * OpenAI fallback processing
   */
  async processWithOpenAI(content, options) {
    const requestData = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an AI meeting assistant providing intelligent insights and analysis.'
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7
    };
    
    const response = await axios.post(
      `${this.config.openai.baseUrl}/chat/completions`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.openai.timeout
      }
    );
    
    const result = this.parseOpenAIResponse(response.data);
    this.trackUsage('openai', result.usage, 0.03); // Higher cost for fallback
    
    return result;
  }
  
  /**
   * Google fallback processing
   */
  async processWithGoogle(content, options) {
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: content
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7
      }
    };
    
    const response = await axios.post(
      `${this.config.google.baseUrl}/models/gemini-pro:generateContent?key=${this.config.google.apiKey}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.config.google.timeout
      }
    );
    
    const result = this.parseGoogleResponse(response.data);
    this.trackUsage('google', result.usage, 0.015); // Moderate cost for fallback
    
    return result;
  }
  
  /**
   * Anthropic fallback processing
   */
  async processWithAnthropic(content, options) {
    const requestData = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: content
        }
      ]
    };
    
    const response = await axios.post(
      `${this.config.anthropic.baseUrl}/messages`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${this.config.anthropic.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: this.config.anthropic.timeout
      }
    );
    
    const result = this.parseAnthropicResponse(response.data);
    this.trackUsage('anthropic', result.usage, 0.045); // Highest cost for fallback
    
    return result;
  }
  
  /**
   * Select optimal AIMLAPI model based on strategy
   */
  selectAIMLAPIModel(strategy) {
    // Check if primary model is available and within rate limits
    if (this.checkRateLimit(strategy.primary)) {
      return strategy.primary;
    }
    
    // Fall back to strategy fallback model
    if (this.checkRateLimit(strategy.fallback)) {
      return strategy.fallback;
    }
    
    // Default to most cost-effective model
    return 'deepseek-v3.1';
  }
  
  /**
   * Generate system prompt based on strategy
   */
  getSystemPrompt(strategy) {
    const basePrompt = `You are an advanced AI meeting assistant providing intelligent insights and analysis.`;
    
    const strategyPrompts = {
      executive: `${basePrompt} Focus on strategic insights, executive-level analysis, and high-level decision support.`,
      realtime: `${basePrompt} Provide quick, actionable insights for real-time meeting assistance and coaching.`,
      monitoring: `${basePrompt} Analyze meeting patterns, sentiment, and provide background intelligence.`,
      multilingual: `${basePrompt} Provide culturally-aware analysis with multi-language support and context.`,
      interview: `${basePrompt} Specialize in interview analysis, candidate assessment, and coaching recommendations.`,
      sales: `${basePrompt} Focus on sales insights, negotiation analysis, and deal optimization strategies.`
    };
    
    return strategyPrompts[strategy.primary?.split('-')[0]] || basePrompt;
  }
  
  /**
   * Parse AIMLAPI response
   */
  parseAIMLAPIResponse(data) {
    return {
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      model: data.model,
      provider: 'aimlapi'
    };
  }
  
  /**
   * Parse OpenAI response
   */
  parseOpenAIResponse(data) {
    return {
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      model: data.model,
      provider: 'openai'
    };
  }
  
  /**
   * Parse Google response
   */
  parseGoogleResponse(data) {
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const estimatedTokens = Math.ceil(content.length / 4); // Rough estimation
    
    return {
      content: content,
      usage: {
        promptTokens: estimatedTokens * 0.3,
        completionTokens: estimatedTokens * 0.7,
        totalTokens: estimatedTokens
      },
      model: 'gemini-pro',
      provider: 'google'
    };
  }
  
  /**
   * Parse Anthropic response
   */
  parseAnthropicResponse(data) {
    const content = data.content?.[0]?.text || '';
    
    return {
      content: content,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      },
      model: data.model,
      provider: 'anthropic'
    };
  }
  
  /**
   * Track usage and costs
   */
  trackUsage(provider, usage, costPer1k) {
    const cost = (usage.totalTokens / 1000) * costPer1k;
    
    this.costTracker.usage[provider].requests++;
    this.costTracker.usage[provider].tokens += usage.totalTokens;
    this.costTracker.usage[provider].cost += cost;
    this.costTracker.currentSpend += cost;
  }
  
  /**
   * Check rate limits
   */
  checkRateLimit(model) {
    const limit = this.rateLimits[model];
    if (!limit) return true;
    
    const now = Date.now();
    
    // Reset if minute has passed
    if (now - limit.resetTime > 60000) {
      limit.current = 0;
      limit.resetTime = now;
    }
    
    return limit.current < limit.limit;
  }
  
  /**
   * Update rate limit counter
   */
  updateRateLimit(model) {
    const limit = this.rateLimits[model];
    if (limit) {
      limit.current++;
    }
  }
  
  /**
   * Check provider health
   */
  isProviderHealthy(provider) {
    const health = this.providerHealth[provider];
    const now = Date.now();
    
    // Consider unhealthy if more than 3 failures in last 5 minutes
    if (health.failures > 3 && (now - health.lastCheck) < 300000) {
      return false;
    }
    
    return health.status === 'healthy';
  }
  
  /**
   * Handle provider errors
   */
  handleProviderError(provider, error) {
    const health = this.providerHealth[provider];
    health.failures++;
    health.lastCheck = Date.now();
    
    if (health.failures > 5) {
      health.status = 'unhealthy';
    }
    
    console.error(`Provider ${provider} error:`, error.message);
  }
  
  /**
   * Log successful operations
   */
  logSuccess(provider, responseTime, result) {
    const health = this.providerHealth[provider];
    health.failures = Math.max(0, health.failures - 1); // Reduce failure count on success
    health.lastCheck = Date.now();
    health.status = 'healthy';
    
    // Track performance metrics
    if (!this.performance.responseTime[provider]) {
      this.performance.responseTime[provider] = [];
    }
    this.performance.responseTime[provider].push(responseTime);
    
    // Keep only last 100 measurements
    if (this.performance.responseTime[provider].length > 100) {
      this.performance.responseTime[provider].shift();
    }
  }
  
  /**
   * Log fallback success
   */
  logFallbackSuccess(provider, primaryError) {
    console.log(`Fallback to ${provider} successful after primary failure:`, primaryError.message);
  }
  
  /**
   * Get cost analysis and savings report
   */
  getCostAnalysis() {
    const totalCost = this.costTracker.currentSpend;
    const estimatedDirectCost = this.estimateDirectProviderCost();
    const savings = estimatedDirectCost - totalCost;
    const savingsPercentage = (savings / estimatedDirectCost) * 100;
    
    return {
      currentSpend: totalCost,
      estimatedDirectCost: estimatedDirectCost,
      savings: savings,
      savingsPercentage: savingsPercentage,
      budgetUtilization: (totalCost / this.costTracker.monthlyBudget) * 100,
      projectedMonthlyCost: totalCost * (30 / new Date().getDate()),
      usageByProvider: this.costTracker.usage,
      targetSavings: this.costTracker.savingsTarget * 100
    };
  }
  
  /**
   * Estimate what costs would be with direct providers
   */
  estimateDirectProviderCost() {
    const usage = this.costTracker.usage;
    
    // Estimate costs at direct provider rates
    const directCosts = {
      openai: usage.aimlapi.tokens * 0.03, // GPT-4 pricing
      google: usage.google.tokens * 0.015, // Gemini Pro pricing
      anthropic: usage.anthropic.tokens * 0.045 // Claude pricing
    };
    
    return Object.values(directCosts).reduce((sum, cost) => sum + cost, 0);
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const metrics = {};
    
    for (const [provider, times] of Object.entries(this.performance.responseTime)) {
      if (times.length > 0) {
        metrics[provider] = {
          averageResponseTime: times.reduce((sum, time) => sum + time, 0) / times.length,
          minResponseTime: Math.min(...times),
          maxResponseTime: Math.max(...times),
          requestCount: times.length,
          health: this.providerHealth[provider].status
        };
      }
    }
    
    return metrics;
  }
  
  /**
   * Get system status
   */
  getStatus() {
    return {
      providers: this.providerHealth,
      costAnalysis: this.getCostAnalysis(),
      performance: this.getPerformanceMetrics(),
      rateLimits: this.rateLimits,
      modelStrategy: this.modelStrategy
    };
  }
}

module.exports = EnhancedHybridAIClient;
