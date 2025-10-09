/**
 * Hybrid AI Provider Client for MeetingMind
 * Implements cost-effective AIMLAPI primary with direct provider fallbacks
 */

class HybridAIClient {
  constructor() {
    this.providers = {
      aimlapi: {
        baseURL: 'https://api.aimlapi.com/v1',
        apiKey: process.env.AIMLAPI_API_KEY,
        models: {
          'gpt-5': 'openai/gpt-5',
          'gpt-4.1': 'openai/gpt-4.1',
          'claude-4.5-sonnet': 'anthropic/claude-4.5-sonnet',
          'gemini-2.5-flash': 'google/gemini-2.5-flash',
          'deepseek-r1': 'deepseek/deepseek-r1'
        },
        costMultiplier: 0.3 // 70% cost savings
      },
      openai: {
        baseURL: 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        models: {
          'gpt-5': 'gpt-5',
          'gpt-4.1': 'gpt-4.1-preview',
          'gpt-4o': 'gpt-4o'
        },
        costMultiplier: 1.0
      },
      anthropic: {
        baseURL: 'https://api.anthropic.com/v1',
        apiKey: process.env.ANTHROPIC_API_KEY,
        models: {
          'claude-4.5-sonnet': 'claude-3-5-sonnet-20241022',
          'claude-3.5-haiku': 'claude-3-5-haiku-20241022'
        },
        costMultiplier: 1.0
      },
      google: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: process.env.GOOGLE_API_KEY,
        models: {
          'gemini-2.5-flash': 'gemini-2.0-flash-exp',
          'gemini-pro': 'gemini-1.5-pro'
        },
        costMultiplier: 1.0
      }
    };

    this.routingRules = {
      // Critical operations use direct providers
      critical: ['openai', 'anthropic', 'google'],
      // High-volume operations use AIMLAPI
      standard: ['aimlapi'],
      // Experimentation uses AIMLAPI for cost efficiency
      experimental: ['aimlapi']
    };

    this.healthStatus = new Map();
    this.requestMetrics = new Map();
    this.initializeHealthMonitoring();
  }

  /**
   * Smart routing based on operation criticality and provider health
   */
  async generateCompletion(request) {
    const { model, messages, operation = 'standard', maxRetries = 3 } = request;
    
    let providers = this.getProvidersForOperation(operation);
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      for (const providerName of providers) {
        try {
          const provider = this.providers[providerName];
          
          // Check provider health
          if (!this.isProviderHealthy(providerName)) {
            console.warn(`Provider ${providerName} unhealthy, skipping`);
            continue;
          }

          // Map model name to provider-specific format
          const providerModel = provider.models[model] || model;
          
          const response = await this.callProvider(providerName, {
            model: providerModel,
            messages,
            ...request
          });

          // Track successful request
          this.trackRequest(providerName, 'success', response.usage);
          
          return {
            ...response,
            provider: providerName,
            cost: this.calculateCost(response.usage, provider.costMultiplier)
          };

        } catch (error) {
          lastError = error;
          console.error(`Provider ${providerName} failed:`, error.message);
          this.trackRequest(providerName, 'error', null);
          
          // Mark provider as unhealthy if multiple failures
          this.updateProviderHealth(providerName, false);
        }
      }

      // If all providers failed, try fallback providers
      if (attempt < maxRetries - 1) {
        providers = this.getFallbackProviders(operation);
        await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Triple-AI collaboration with intelligent provider selection
   */
  async tripleAICollaboration(request) {
    const { prompt, context, operation = 'standard' } = request;

    const tasks = [
      {
        model: 'gpt-5',
        role: 'reasoning',
        prompt: `${prompt}\n\nProvide comprehensive reasoning and analysis.`,
        operation: operation === 'critical' ? 'critical' : 'standard'
      },
      {
        model: 'claude-4.5-sonnet',
        role: 'accuracy',
        prompt: `${prompt}\n\nFocus on accuracy, safety, and risk assessment.`,
        operation: operation === 'critical' ? 'critical' : 'standard'
      },
      {
        model: 'gemini-2.5-flash',
        role: 'speed',
        prompt: `${prompt}\n\nProvide fast, efficient response with key insights.`,
        operation: 'standard' // Always use cost-effective for speed model
      }
    ];

    const results = await Promise.allSettled(
      tasks.map(task => this.generateCompletion({
        model: task.model,
        messages: [
          { role: 'system', content: `You are the ${task.role} AI in a triple-AI collaboration.` },
          { role: 'user', content: task.prompt }
        ],
        operation: task.operation,
        temperature: 0.7,
        max_tokens: 2000
      }))
    );

    // Synthesize results from successful responses
    const successfulResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    if (successfulResults.length === 0) {
      throw new Error('All triple-AI collaboration attempts failed');
    }

    return {
      synthesis: await this.synthesizeTripleAIResults(successfulResults),
      individual_results: successfulResults,
      total_cost: successfulResults.reduce((sum, result) => sum + result.cost, 0),
      providers_used: successfulResults.map(result => result.provider)
    };
  }

  /**
   * Provider-specific API calls
   */
  async callProvider(providerName, request) {
    const provider = this.providers[providerName];
    
    switch (providerName) {
      case 'aimlapi':
        return await this.callAIMLAPI(provider, request);
      case 'openai':
        return await this.callOpenAI(provider, request);
      case 'anthropic':
        return await this.callAnthropic(provider, request);
      case 'google':
        return await this.callGoogle(provider, request);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  async callAIMLAPI(provider, request) {
    const response = await fetch(`${provider.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`AIMLAPI error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async callOpenAI(provider, request) {
    const response = await fetch(`${provider.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async callAnthropic(provider, request) {
    // Convert OpenAI format to Anthropic format
    const anthropicRequest = {
      model: request.model,
      max_tokens: request.max_tokens || 2000,
      messages: request.messages,
      temperature: request.temperature || 0.7
    };

    const response = await fetch(`${provider.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicRequest)
    });

    if (!response.ok) {
      throw new Error(`Anthropic error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert back to OpenAI format
    return {
      choices: [{
        message: {
          role: 'assistant',
          content: result.content[0].text
        }
      }],
      usage: {
        prompt_tokens: result.usage.input_tokens,
        completion_tokens: result.usage.output_tokens,
        total_tokens: result.usage.input_tokens + result.usage.output_tokens
      }
    };
  }

  async callGoogle(provider, request) {
    // Convert OpenAI format to Google format
    const googleRequest = {
      contents: request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.max_tokens || 2000
      }
    };

    const response = await fetch(`${provider.baseURL}/models/${request.model}:generateContent?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googleRequest)
    });

    if (!response.ok) {
      throw new Error(`Google error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert back to OpenAI format
    return {
      choices: [{
        message: {
          role: 'assistant',
          content: result.candidates[0].content.parts[0].text
        }
      }],
      usage: {
        prompt_tokens: result.usageMetadata.promptTokenCount || 0,
        completion_tokens: result.usageMetadata.candidatesTokenCount || 0,
        total_tokens: result.usageMetadata.totalTokenCount || 0
      }
    };
  }

  /**
   * Intelligent provider selection based on operation type
   */
  getProvidersForOperation(operation) {
    switch (operation) {
      case 'critical':
        return ['openai', 'anthropic']; // Direct providers for critical ops
      case 'real-time':
        return ['aimlapi', 'openai']; // Fast providers for real-time
      case 'experimental':
        return ['aimlapi']; // Cost-effective for experimentation
      case 'standard':
      default:
        return ['aimlapi', 'openai']; // AIMLAPI primary, OpenAI fallback
    }
  }

  getFallbackProviders(operation) {
    return ['openai', 'anthropic', 'google']; // All direct providers as fallback
  }

  /**
   * Health monitoring and metrics
   */
  initializeHealthMonitoring() {
    // Initialize health status for all providers
    Object.keys(this.providers).forEach(provider => {
      this.healthStatus.set(provider, { healthy: true, lastCheck: Date.now() });
      this.requestMetrics.set(provider, { success: 0, error: 0, totalCost: 0 });
    });

    // Periodic health checks
    setInterval(() => this.performHealthChecks(), 60000); // Every minute
  }

  isProviderHealthy(providerName) {
    const health = this.healthStatus.get(providerName);
    return health?.healthy && (Date.now() - health.lastCheck) < 300000; // 5 minutes
  }

  updateProviderHealth(providerName, isHealthy) {
    this.healthStatus.set(providerName, {
      healthy: isHealthy,
      lastCheck: Date.now()
    });
  }

  trackRequest(providerName, status, usage) {
    const metrics = this.requestMetrics.get(providerName);
    if (metrics) {
      metrics[status]++;
      if (usage) {
        metrics.totalCost += this.calculateCost(usage, this.providers[providerName].costMultiplier);
      }
    }
  }

  calculateCost(usage, costMultiplier) {
    // Simplified cost calculation (actual rates would be more complex)
    const inputCost = (usage.prompt_tokens / 1000000) * 1.0 * costMultiplier;
    const outputCost = (usage.completion_tokens / 1000000) * 3.0 * costMultiplier;
    return inputCost + outputCost;
  }

  async performHealthChecks() {
    // Simple health check for each provider
    Object.keys(this.providers).forEach(async (providerName) => {
      try {
        await this.generateCompletion({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Health check' }],
          max_tokens: 10,
          operation: 'standard'
        });
        this.updateProviderHealth(providerName, true);
      } catch (error) {
        this.updateProviderHealth(providerName, false);
      }
    });
  }

  async synthesizeTripleAIResults(results) {
    // Synthesize insights from multiple AI responses
    const synthesis = {
      reasoning: results.find(r => r.provider.includes('gpt'))?.choices[0]?.message?.content || '',
      accuracy: results.find(r => r.provider.includes('claude'))?.choices[0]?.message?.content || '',
      insights: results.find(r => r.provider.includes('gemini'))?.choices[0]?.message?.content || '',
      confidence: results.length / 3, // Confidence based on successful responses
      consensus: this.findConsensus(results)
    };

    return synthesis;
  }

  findConsensus(results) {
    // Simple consensus finding (could be enhanced with NLP)
    const responses = results.map(r => r.choices[0]?.message?.content || '');
    return {
      common_themes: this.extractCommonThemes(responses),
      disagreements: this.findDisagreements(responses),
      recommendation: responses[0] // Primary recommendation from first successful response
    };
  }

  extractCommonThemes(responses) {
    // Placeholder for theme extraction logic
    return ['collaboration', 'efficiency', 'intelligence'];
  }

  findDisagreements(responses) {
    // Placeholder for disagreement detection
    return [];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get provider statistics and costs
   */
  getProviderStats() {
    const stats = {};
    this.requestMetrics.forEach((metrics, provider) => {
      stats[provider] = {
        ...metrics,
        success_rate: metrics.success / (metrics.success + metrics.error),
        health: this.healthStatus.get(provider)
      };
    });
    return stats;
  }
}

module.exports = HybridAIClient;
