/**
 * Fallback Provider System
 * 
 * Implements 4-tier provider redundancy for 99.99% uptime:
 * Tier 1: AIMLAPI (Primary) - 70% cost savings
 * Tier 2: OpenAI (Fallback 1) - Premium reliability
 * Tier 3: Google (Fallback 2) - Moderate cost
 * Tier 4: Anthropic (Fallback 3) - Highest quality
 */

const axios = require('axios');
const EventEmitter = require('events');
const AIMLAPIClient = require('./aimlapi-client');

class FallbackProviderSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize all providers
    this.providers = {
      aimlapi: new AIMLAPIClient(config.aimlapi || {}),
      openai: new OpenAIProvider(config.openai || {}),
      google: new GoogleProvider(config.google || {}),
      anthropic: new AnthropicProvider(config.anthropic || {})
    };
    
    // Provider priority order
    this.providerOrder = ['aimlapi', 'openai', 'google', 'anthropic'];
    
    // Health monitoring for each provider
    this.providerHealth = {};
    this.providerOrder.forEach(provider => {
      this.providerHealth[provider] = {
        status: 'healthy',
        failures: 0,
        lastFailure: null,
        successRate: 1.0,
        averageResponseTime: 0,
        totalRequests: 0,
        circuitBreakerOpen: false,
        circuitBreakerOpenTime: null
      };
    });
    
    // Circuit breaker configuration
    this.circuitBreaker = {
      failureThreshold: parseInt(process.env.HEALTH_FAILURE_THRESHOLD || '3'),
      recoveryThreshold: parseInt(process.env.HEALTH_RECOVERY_THRESHOLD || '2'),
      openTimeout: 60000, // 1 minute
      enabled: process.env.PROVIDER_CIRCUIT_BREAKER_ENABLED !== 'false'
    };
    
    // Performance tracking
    this.systemMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackUsage: {
        aimlapi: 0,
        openai: 0,
        google: 0,
        anthropic: 0
      },
      averageResponseTime: 0,
      costSavings: 0
    };
    
    // Set up provider event listeners
    this.setupProviderEventListeners();
    
    // Start health monitoring
    this.startHealthMonitoring();
  }
  
  /**
   * Main processing method with intelligent fallback
   */
  async processRequest(context, content, options = {}) {
    const startTime = Date.now();
    let lastError = null;
    
    this.systemMetrics.totalRequests++;
    
    // Try each provider in order
    for (const providerName of this.providerOrder) {
      // Skip if circuit breaker is open
      if (this.isCircuitBreakerOpen(providerName)) {
        this.emit('provider_skipped', {
          provider: providerName,
          reason: 'circuit_breaker_open',
          context
        });
        continue;
      }
      
      // Skip if provider is unhealthy
      if (!this.isProviderHealthy(providerName)) {
        this.emit('provider_skipped', {
          provider: providerName,
          reason: 'unhealthy',
          context
        });
        continue;
      }
      
      try {
        const provider = this.providers[providerName];
        const result = await provider.processRequest(context, content, options);
        
        // Success - track metrics and return
        this.trackProviderSuccess(providerName, Date.now() - startTime);
        this.systemMetrics.successfulRequests++;
        this.systemMetrics.fallbackUsage[providerName]++;
        
        // Calculate cost savings if not using primary provider
        if (providerName !== 'aimlapi') {
          this.trackFallbackUsage(providerName, result);
        }
        
        this.emit('request_success', {
          provider: providerName,
          responseTime: Date.now() - startTime,
          result,
          context
        });
        
        return {
          ...result,
          provider: providerName,
          fallbackLevel: this.providerOrder.indexOf(providerName),
          responseTime: Date.now() - startTime
        };
        
      } catch (error) {
        lastError = error;
        
        // Track provider failure
        this.trackProviderFailure(providerName, error);
        
        this.emit('provider_failure', {
          provider: providerName,
          error: error.message,
          context,
          responseTime: Date.now() - startTime
        });
        
        // Continue to next provider
        continue;
      }
    }
    
    // All providers failed
    this.systemMetrics.failedRequests++;
    
    this.emit('all_providers_failed', {
      lastError: lastError?.message,
      context,
      totalResponseTime: Date.now() - startTime
    });
    
    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }
  
  /**
   * Check if provider is healthy
   */
  isProviderHealthy(providerName) {
    const health = this.providerHealth[providerName];
    
    // Consider unhealthy if too many recent failures
    if (health.failures >= this.circuitBreaker.failureThreshold) {
      return false;
    }
    
    // Consider unhealthy if success rate is too low
    if (health.totalRequests > 10 && health.successRate < 0.5) {
      return false;
    }
    
    return health.status === 'healthy';
  }
  
  /**
   * Check if circuit breaker is open for a provider
   */
  isCircuitBreakerOpen(providerName) {
    if (!this.circuitBreaker.enabled) {
      return false;
    }
    
    const health = this.providerHealth[providerName];
    
    if (!health.circuitBreakerOpen) {
      return false;
    }
    
    // Check if circuit breaker should be closed (recovery period passed)
    const now = Date.now();
    if (now - health.circuitBreakerOpenTime > this.circuitBreaker.openTimeout) {
      health.circuitBreakerOpen = false;
      health.circuitBreakerOpenTime = null;
      
      this.emit('circuit_breaker_closed', {
        provider: providerName,
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
    
    return true;
  }
  
  /**
   * Track provider success
   */
  trackProviderSuccess(providerName, responseTime) {
    const health = this.providerHealth[providerName];
    
    health.totalRequests++;
    health.failures = Math.max(0, health.failures - 1); // Reduce failure count on success
    health.status = 'healthy';
    
    // Update response time
    if (!health.responseTimes) {
      health.responseTimes = [];
    }
    health.responseTimes.push(responseTime);
    if (health.responseTimes.length > 50) {
      health.responseTimes.shift();
    }
    
    health.averageResponseTime = 
      health.responseTimes.reduce((sum, time) => sum + time, 0) / 
      health.responseTimes.length;
    
    // Update success rate
    const successfulRequests = health.totalRequests - health.failures;
    health.successRate = successfulRequests / health.totalRequests;
    
    // Close circuit breaker if recovery threshold met
    if (health.circuitBreakerOpen && health.failures <= this.circuitBreaker.recoveryThreshold) {
      health.circuitBreakerOpen = false;
      health.circuitBreakerOpenTime = null;
      
      this.emit('circuit_breaker_closed', {
        provider: providerName,
        reason: 'recovery_threshold_met',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Track provider failure
   */
  trackProviderFailure(providerName, error) {
    const health = this.providerHealth[providerName];
    
    health.totalRequests++;
    health.failures++;
    health.lastFailure = new Date().toISOString();
    
    // Update success rate
    const successfulRequests = health.totalRequests - health.failures;
    health.successRate = successfulRequests / health.totalRequests;
    
    // Update health status
    if (health.failures >= this.circuitBreaker.failureThreshold) {
      health.status = 'unhealthy';
      
      // Open circuit breaker
      if (this.circuitBreaker.enabled && !health.circuitBreakerOpen) {
        health.circuitBreakerOpen = true;
        health.circuitBreakerOpenTime = Date.now();
        
        this.emit('circuit_breaker_opened', {
          provider: providerName,
          failures: health.failures,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  /**
   * Track fallback usage for cost analysis
   */
  trackFallbackUsage(providerName, result) {
    // Estimate cost difference between fallback and primary provider
    const primaryCost = this.estimatePrimaryCost(result.usage);
    const fallbackCost = this.estimateFallbackCost(providerName, result.usage);
    const costDifference = fallbackCost - primaryCost;
    
    this.systemMetrics.costSavings -= costDifference; // Negative because fallback is more expensive
    
    this.emit('fallback_cost_impact', {
      provider: providerName,
      primaryCost,
      fallbackCost,
      costDifference,
      tokens: result.usage.totalTokens
    });
  }
  
  /**
   * Estimate cost if request was processed by primary provider
   */
  estimatePrimaryCost(usage) {
    // Assume average AIMLAPI cost of $0.005 per 1K tokens
    return (usage.totalTokens / 1000) * 0.005;
  }
  
  /**
   * Estimate actual fallback provider cost
   */
  estimateFallbackCost(providerName, usage) {
    const costPer1K = {
      openai: 0.03,    // GPT-4 pricing
      google: 0.015,   // Gemini Pro pricing
      anthropic: 0.045 // Claude pricing
    };
    
    return (usage.totalTokens / 1000) * (costPer1K[providerName] || 0.03);
  }
  
  /**
   * Set up event listeners for all providers
   */
  setupProviderEventListeners() {
    Object.keys(this.providers).forEach(providerName => {
      const provider = this.providers[providerName];
      
      // Forward provider events
      provider.on('request_success', (data) => {
        this.emit('provider_request_success', {
          provider: providerName,
          ...data
        });
      });
      
      provider.on('request_failure', (data) => {
        this.emit('provider_request_failure', {
          provider: providerName,
          ...data
        });
      });
      
      provider.on('cost_alert', (data) => {
        this.emit('provider_cost_alert', {
          provider: providerName,
          ...data
        });
      });
      
      provider.on('health_degraded', (data) => {
        this.emit('provider_health_degraded', {
          provider: providerName,
          ...data
        });
      });
    });
  }
  
  /**
   * Start health monitoring for all providers
   */
  startHealthMonitoring() {
    const interval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000');
    
    setInterval(() => {
      this.performHealthCheck();
    }, interval);
  }
  
  /**
   * Perform health check on all providers
   */
  async performHealthCheck() {
    const healthReport = {
      timestamp: new Date().toISOString(),
      providers: {},
      systemMetrics: this.systemMetrics
    };
    
    for (const providerName of this.providerOrder) {
      const health = this.providerHealth[providerName];
      
      healthReport.providers[providerName] = {
        status: health.status,
        failures: health.failures,
        successRate: health.successRate,
        averageResponseTime: health.averageResponseTime,
        totalRequests: health.totalRequests,
        circuitBreakerOpen: health.circuitBreakerOpen,
        lastFailure: health.lastFailure
      };
    }
    
    this.emit('health_report', healthReport);
  }
  
  /**
   * Get system status
   */
  getStatus() {
    return {
      providers: this.providerHealth,
      systemMetrics: this.systemMetrics,
      circuitBreaker: this.circuitBreaker,
      providerOrder: this.providerOrder
    };
  }
  
  /**
   * Reset provider health (for testing or recovery)
   */
  resetProviderHealth(providerName) {
    if (this.providerHealth[providerName]) {
      this.providerHealth[providerName] = {
        status: 'healthy',
        failures: 0,
        lastFailure: null,
        successRate: 1.0,
        averageResponseTime: 0,
        totalRequests: 0,
        circuitBreakerOpen: false,
        circuitBreakerOpenTime: null
      };
      
      this.emit('provider_health_reset', {
        provider: providerName,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Force circuit breaker state (for testing)
   */
  setCircuitBreakerState(providerName, open) {
    if (this.providerHealth[providerName]) {
      this.providerHealth[providerName].circuitBreakerOpen = open;
      this.providerHealth[providerName].circuitBreakerOpenTime = open ? Date.now() : null;
      
      this.emit('circuit_breaker_forced', {
        provider: providerName,
        state: open ? 'open' : 'closed',
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * OpenAI Provider Implementation
 */
class OpenAIProvider extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseUrl: config.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: config.model || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
      timeout: parseInt(config.timeout || process.env.OPENAI_TIMEOUT || '30000'),
      retries: parseInt(config.retries || process.env.OPENAI_RETRIES || '2')
    };
  }
  
  async processRequest(context, content, options = {}) {
    const requestData = {
      model: options.model || this.config.model,
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
      `${this.config.baseUrl}/chat/completions`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      }
    );
    
    return {
      content: response.data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.data.usage?.prompt_tokens || 0,
        completionTokens: response.data.usage?.completion_tokens || 0,
        totalTokens: response.data.usage?.total_tokens || 0
      },
      model: response.data.model,
      provider: 'openai'
    };
  }
}

/**
 * Google Provider Implementation
 */
class GoogleProvider extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      apiKey: config.apiKey || process.env.GOOGLE_API_KEY,
      baseUrl: config.baseUrl || process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      model: config.model || process.env.GOOGLE_DEFAULT_MODEL || 'gemini-pro',
      timeout: parseInt(config.timeout || process.env.GOOGLE_TIMEOUT || '30000'),
      retries: parseInt(config.retries || process.env.GOOGLE_RETRIES || '2')
    };
  }
  
  async processRequest(context, content, options = {}) {
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
      `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      }
    );
    
    const content_text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const estimatedTokens = Math.ceil(content_text.length / 4);
    
    return {
      content: content_text,
      usage: {
        promptTokens: Math.ceil(estimatedTokens * 0.3),
        completionTokens: Math.ceil(estimatedTokens * 0.7),
        totalTokens: estimatedTokens
      },
      model: this.config.model,
      provider: 'google'
    };
  }
}

/**
 * Anthropic Provider Implementation
 */
class AnthropicProvider extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      baseUrl: config.baseUrl || process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
      model: config.model || process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet-20240229',
      timeout: parseInt(config.timeout || process.env.ANTHROPIC_TIMEOUT || '30000'),
      retries: parseInt(config.retries || process.env.ANTHROPIC_RETRIES || '2')
    };
  }
  
  async processRequest(context, content, options = {}) {
    const requestData = {
      model: this.config.model,
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
      `${this.config.baseUrl}/messages`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: this.config.timeout
      }
    );
    
    return {
      content: response.data.content?.[0]?.text || '',
      usage: {
        promptTokens: response.data.usage?.input_tokens || 0,
        completionTokens: response.data.usage?.output_tokens || 0,
        totalTokens: (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0)
      },
      model: response.data.model,
      provider: 'anthropic'
    };
  }
}

module.exports = FallbackProviderSystem;
