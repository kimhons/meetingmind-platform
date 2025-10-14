/**
 * Advanced Cost Optimization System
 * 
 * Implements intelligent cost management with dynamic budget allocation,
 * predictive spending analysis, and automated cost optimization strategies
 * to maintain 70% cost savings while maximizing AI performance.
 */

const EventEmitter = require('events');

class CostOptimizationSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      monthlyBudget: parseFloat(config.monthlyBudget || process.env.AI_MONTHLY_BUDGET || '5000'),
      savingsTarget: parseFloat(config.savingsTarget || '0.70'), // 70% savings target
      alertThresholds: {
        info: parseFloat(config.infoThreshold || '0.70'),
        warning: parseFloat(config.warningThreshold || '0.85'),
        critical: parseFloat(config.criticalThreshold || '0.95')
      },
      optimizationEnabled: config.optimizationEnabled !== false,
      predictiveAnalysis: config.predictiveAnalysis !== false
    };
    
    // Budget allocation strategy
    this.budgetAllocation = {
      realtime: 0.40,      // 40% for real-time processing
      analysis: 0.35,      // 35% for deep analysis
      monitoring: 0.20,    // 20% for background monitoring
      experimental: 0.05   // 5% for testing new models
    };
    
    // Cost tracking
    this.costTracking = {
      current: {
        total: 0,
        daily: 0,
        byProvider: {
          aimlapi: 0,
          openai: 0,
          google: 0,
          anthropic: 0
        },
        byCategory: {
          realtime: 0,
          analysis: 0,
          monitoring: 0,
          experimental: 0
        },
        byModel: {}
      },
      historical: {
        daily: [],
        weekly: [],
        monthly: []
      },
      projections: {
        dailyBurn: 0,
        monthlyProjection: 0,
        budgetExhaustionDate: null
      }
    };
    
    // Model cost database
    this.modelCosts = {
      // AIMLAPI Models (Primary - Cost Effective)
      'gpt-5-pro': { inputCost: 0.00131, outputCost: 0.00525, provider: 'aimlapi' },
      'claude-4.5-sonnet': { inputCost: 0.00315, outputCost: 0.01575, provider: 'aimlapi' },
      'grok-4-fast': { inputCost: 0.00021, outputCost: 0.000525, provider: 'aimlapi' },
      'deepseek-v3.1': { inputCost: 0.000588, outputCost: 0.001764, provider: 'aimlapi' },
      'qwen3-max': { inputCost: 0.00168, outputCost: 0.00672, provider: 'aimlapi' },
      'gemini-2.5-flash': { inputCost: 0.000315, outputCost: 0.002625, provider: 'aimlapi' },
      
      // Fallback Models (Higher Cost)
      'gpt-4o': { inputCost: 0.015, outputCost: 0.06, provider: 'openai' },
      'gpt-4-turbo': { inputCost: 0.01, outputCost: 0.03, provider: 'openai' },
      'gemini-pro': { inputCost: 0.007, outputCost: 0.021, provider: 'google' },
      'claude-3-sonnet': { inputCost: 0.015, outputCost: 0.075, provider: 'anthropic' },
      'claude-3-haiku': { inputCost: 0.0025, outputCost: 0.0125, provider: 'anthropic' }
    };
    
    // Optimization strategies
    this.optimizationStrategies = {
      aggressive: {
        name: 'Aggressive Cost Optimization',
        description: 'Prioritize lowest cost models, use caching extensively',
        costMultiplier: 0.6,
        qualityThreshold: 0.7
      },
      balanced: {
        name: 'Balanced Optimization',
        description: 'Balance cost and quality based on context',
        costMultiplier: 0.8,
        qualityThreshold: 0.8
      },
      quality: {
        name: 'Quality-First Optimization',
        description: 'Prioritize quality while maintaining cost savings',
        costMultiplier: 1.0,
        qualityThreshold: 0.9
      }
    };
    
    // Current optimization mode
    this.currentStrategy = 'balanced';
    
    // Performance tracking
    this.performanceMetrics = {
      totalRequests: 0,
      costPerRequest: 0,
      savingsAchieved: 0,
      optimizationDecisions: 0,
      budgetUtilization: 0
    };
    
    // Initialize tracking
    this.lastResetDate = new Date().toDateString();
    this.startCostTracking();
  }
  
  /**
   * Calculate cost for a request before processing
   */
  calculateRequestCost(model, inputTokens, outputTokens) {
    const modelConfig = this.modelCosts[model];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`);
    }
    
    const inputCost = (inputTokens / 1000) * modelConfig.inputCost;
    const outputCost = (outputTokens / 1000) * modelConfig.outputCost;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      provider: modelConfig.provider,
      model
    };
  }
  
  /**
   * Optimize model selection based on budget constraints and context
   */
  optimizeModelSelection(context, availableModels, estimatedTokens) {
    if (!this.config.optimizationEnabled) {
      return availableModels[0]; // Return first available model
    }
    
    const budgetUtilization = this.getBudgetUtilization();
    const strategy = this.getOptimizationStrategy(budgetUtilization, context);
    
    // Calculate cost-quality score for each model
    const modelScores = availableModels.map(model => {
      const cost = this.estimateModelCost(model, estimatedTokens);
      const quality = this.getModelQualityScore(model, context);
      const efficiency = this.calculateCostEfficiency(model);
      
      return {
        model,
        cost,
        quality,
        efficiency,
        score: this.calculateOptimizationScore(cost, quality, efficiency, strategy)
      };
    });
    
    // Sort by optimization score (higher is better)
    modelScores.sort((a, b) => b.score - a.score);
    
    const selectedModel = modelScores[0].model;
    
    this.performanceMetrics.optimizationDecisions++;
    
    this.emit('model_optimized', {
      context,
      availableModels,
      selectedModel,
      strategy: strategy.name,
      budgetUtilization,
      scores: modelScores
    });
    
    return selectedModel;
  }
  
  /**
   * Get current optimization strategy based on budget utilization
   */
  getOptimizationStrategy(budgetUtilization, context) {
    // Override strategy based on budget pressure
    if (budgetUtilization > 0.9) {
      return this.optimizationStrategies.aggressive;
    }
    
    if (budgetUtilization < 0.5 && (context.priority === 'critical' || context.type === 'executive')) {
      return this.optimizationStrategies.quality;
    }
    
    return this.optimizationStrategies[this.currentStrategy];
  }
  
  /**
   * Calculate optimization score for model selection
   */
  calculateOptimizationScore(cost, quality, efficiency, strategy) {
    // Normalize scores (0-1)
    const normalizedCost = 1 - Math.min(cost / 0.1, 1); // Invert cost (lower cost = higher score)
    const normalizedQuality = Math.min(quality, 1);
    const normalizedEfficiency = Math.min(efficiency, 1);
    
    // Weight based on strategy
    let costWeight, qualityWeight, efficiencyWeight;
    
    switch (strategy.name) {
      case 'Aggressive Cost Optimization':
        costWeight = 0.6;
        qualityWeight = 0.2;
        efficiencyWeight = 0.2;
        break;
      case 'Quality-First Optimization':
        costWeight = 0.2;
        qualityWeight = 0.6;
        efficiencyWeight = 0.2;
        break;
      default: // Balanced
        costWeight = 0.4;
        qualityWeight = 0.4;
        efficiencyWeight = 0.2;
    }
    
    return (normalizedCost * costWeight) + 
           (normalizedQuality * qualityWeight) + 
           (normalizedEfficiency * efficiencyWeight);
  }
  
  /**
   * Estimate model cost for given token count
   */
  estimateModelCost(model, estimatedTokens) {
    const modelConfig = this.modelCosts[model];
    if (!modelConfig) {
      return 0.05; // Default high cost for unknown models
    }
    
    // Assume 30% input, 70% output token distribution
    const inputTokens = estimatedTokens * 0.3;
    const outputTokens = estimatedTokens * 0.7;
    
    return this.calculateRequestCost(model, inputTokens, outputTokens).totalCost;
  }
  
  /**
   * Get model quality score based on context
   */
  getModelQualityScore(model, context) {
    // Base quality scores for models
    const baseQuality = {
      'gpt-5-pro': 0.95,
      'claude-4.5-sonnet': 0.90,
      'gpt-4o': 0.92,
      'claude-3-sonnet': 0.88,
      'grok-4-fast': 0.80,
      'gemini-pro': 0.85,
      'gemini-2.5-flash': 0.82,
      'qwen3-max': 0.78,
      'deepseek-v3.1': 0.75,
      'claude-3-haiku': 0.70
    };
    
    let quality = baseQuality[model] || 0.7;
    
    // Adjust based on context
    if (context.type === 'executive' && model.includes('gpt-5')) {
      quality += 0.05; // GPT-5 excels at executive analysis
    }
    
    if (context.type === 'sales' && model.includes('claude')) {
      quality += 0.05; // Claude excels at sales analysis
    }
    
    if (context.language !== 'en' && model.includes('qwen')) {
      quality += 0.1; // Qwen excels at multilingual
    }
    
    if (context.urgency === 'realtime' && model.includes('grok')) {
      quality += 0.05; // Grok excels at real-time processing
    }
    
    return Math.min(quality, 1.0);
  }
  
  /**
   * Calculate cost efficiency (savings vs direct providers)
   */
  calculateCostEfficiency(model) {
    const modelConfig = this.modelCosts[model];
    if (!modelConfig) {
      return 0.5;
    }
    
    // Compare to equivalent direct provider model
    const directProviderCost = this.getEquivalentDirectProviderCost(model);
    const currentCost = (modelConfig.inputCost + modelConfig.outputCost) / 2;
    
    const savings = (directProviderCost - currentCost) / directProviderCost;
    return Math.max(0, Math.min(savings, 1));
  }
  
  /**
   * Get equivalent direct provider cost for comparison
   */
  getEquivalentDirectProviderCost(model) {
    // Mapping to equivalent direct provider costs
    const directCosts = {
      'gpt-5-pro': 0.0375,      // vs direct GPT-4 Turbo
      'claude-4.5-sonnet': 0.045, // vs direct Claude 3 Sonnet
      'grok-4-fast': 0.025,     // vs direct GPT-3.5 Turbo
      'deepseek-v3.1': 0.02,    // vs direct basic models
      'qwen3-max': 0.03,        // vs direct multilingual models
      'gemini-2.5-flash': 0.014 // vs direct Gemini Pro
    };
    
    return directCosts[model] || 0.03;
  }
  
  /**
   * Track actual cost after request completion
   */
  trackCost(model, usage, actualCost, category = 'analysis') {
    const provider = this.modelCosts[model]?.provider || 'unknown';
    
    // Update current tracking
    this.costTracking.current.total += actualCost;
    this.costTracking.current.daily += actualCost;
    this.costTracking.current.byProvider[provider] += actualCost;
    this.costTracking.current.byCategory[category] += actualCost;
    
    if (!this.costTracking.current.byModel[model]) {
      this.costTracking.current.byModel[model] = 0;
    }
    this.costTracking.current.byModel[model] += actualCost;
    
    // Update performance metrics
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.costPerRequest = 
      this.costTracking.current.total / this.performanceMetrics.totalRequests;
    
    // Calculate savings achieved
    const directProviderCost = this.getEquivalentDirectProviderCost(model);
    const estimatedDirectCost = (usage.totalTokens / 1000) * directProviderCost;
    const savings = estimatedDirectCost - actualCost;
    this.performanceMetrics.savingsAchieved += savings;
    
    // Update budget utilization
    this.performanceMetrics.budgetUtilization = this.getBudgetUtilization();
    
    // Check for alerts
    this.checkBudgetAlerts();
    
    // Update projections
    this.updateProjections();
    
    this.emit('cost_tracked', {
      model,
      provider,
      category,
      actualCost,
      usage,
      savings,
      budgetUtilization: this.performanceMetrics.budgetUtilization
    });
  }
  
  /**
   * Get current budget utilization
   */
  getBudgetUtilization() {
    return this.costTracking.current.total / this.config.monthlyBudget;
  }
  
  /**
   * Check budget alerts and emit warnings
   */
  checkBudgetAlerts() {
    const utilization = this.getBudgetUtilization();
    
    if (utilization >= this.config.alertThresholds.critical) {
      this.emit('budget_alert', {
        level: 'critical',
        utilization,
        current: this.costTracking.current.total,
        budget: this.config.monthlyBudget,
        message: 'Critical: 95% of monthly budget consumed'
      });
    } else if (utilization >= this.config.alertThresholds.warning) {
      this.emit('budget_alert', {
        level: 'warning',
        utilization,
        current: this.costTracking.current.total,
        budget: this.config.monthlyBudget,
        message: 'Warning: 85% of monthly budget consumed'
      });
    } else if (utilization >= this.config.alertThresholds.info) {
      this.emit('budget_alert', {
        level: 'info',
        utilization,
        current: this.costTracking.current.total,
        budget: this.config.monthlyBudget,
        message: 'Info: 70% of monthly budget consumed'
      });
    }
  }
  
  /**
   * Update cost projections
   */
  updateProjections() {
    const daysInMonth = new Date().getDate();
    const dailyAverage = this.costTracking.current.total / daysInMonth;
    
    this.costTracking.projections.dailyBurn = dailyAverage;
    this.costTracking.projections.monthlyProjection = dailyAverage * 30;
    
    // Calculate budget exhaustion date
    const remainingBudget = this.config.monthlyBudget - this.costTracking.current.total;
    if (dailyAverage > 0) {
      const daysRemaining = remainingBudget / dailyAverage;
      const exhaustionDate = new Date();
      exhaustionDate.setDate(exhaustionDate.getDate() + daysRemaining);
      this.costTracking.projections.budgetExhaustionDate = exhaustionDate;
    }
  }
  
  /**
   * Get cost optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const utilization = this.getBudgetUtilization();
    const savingsRate = this.calculateCurrentSavingsRate();
    
    // Budget utilization recommendations
    if (utilization > 0.8) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        title: 'High Budget Utilization',
        description: 'Consider switching to more aggressive cost optimization',
        action: 'switch_to_aggressive_mode',
        impact: 'Reduce costs by 20-30%'
      });
    }
    
    // Savings rate recommendations
    if (savingsRate < this.config.savingsTarget) {
      recommendations.push({
        type: 'savings',
        priority: 'medium',
        title: 'Below Savings Target',
        description: `Current savings: ${(savingsRate * 100).toFixed(1)}%, Target: ${(this.config.savingsTarget * 100).toFixed(1)}%`,
        action: 'optimize_model_selection',
        impact: 'Increase savings rate'
      });
    }
    
    // Model usage recommendations
    const expensiveModels = this.getExpensiveModelUsage();
    if (expensiveModels.length > 0) {
      recommendations.push({
        type: 'models',
        priority: 'medium',
        title: 'Expensive Model Usage',
        description: `High usage of expensive models: ${expensiveModels.join(', ')}`,
        action: 'review_model_selection',
        impact: 'Reduce per-request costs'
      });
    }
    
    // Category spending recommendations
    const categoryAnalysis = this.analyzeCategorySpending();
    if (categoryAnalysis.overBudget.length > 0) {
      recommendations.push({
        type: 'categories',
        priority: 'medium',
        title: 'Category Budget Overrun',
        description: `Over budget in: ${categoryAnalysis.overBudget.join(', ')}`,
        action: 'rebalance_category_budgets',
        impact: 'Better budget allocation'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculate current savings rate
   */
  calculateCurrentSavingsRate() {
    if (this.performanceMetrics.totalRequests === 0) {
      return 0;
    }
    
    const totalSavings = this.performanceMetrics.savingsAchieved;
    const totalSpent = this.costTracking.current.total;
    const estimatedDirectCost = totalSpent + totalSavings;
    
    return totalSavings / estimatedDirectCost;
  }
  
  /**
   * Get expensive model usage analysis
   */
  getExpensiveModelUsage() {
    const expensiveThreshold = 0.02; // $20 per 1M tokens
    const expensiveModels = [];
    
    for (const [model, cost] of Object.entries(this.costTracking.current.byModel)) {
      const modelConfig = this.modelCosts[model];
      if (modelConfig) {
        const avgCost = (modelConfig.inputCost + modelConfig.outputCost) / 2;
        if (avgCost > expensiveThreshold && cost > this.costTracking.current.total * 0.1) {
          expensiveModels.push(model);
        }
      }
    }
    
    return expensiveModels;
  }
  
  /**
   * Analyze category spending vs budget allocation
   */
  analyzeCategorySpending() {
    const overBudget = [];
    const underBudget = [];
    
    for (const [category, allocation] of Object.entries(this.budgetAllocation)) {
      const budgetForCategory = this.config.monthlyBudget * allocation;
      const spentInCategory = this.costTracking.current.byCategory[category] || 0;
      const utilization = spentInCategory / budgetForCategory;
      
      if (utilization > 1.1) { // 10% over budget
        overBudget.push(category);
      } else if (utilization < 0.5) { // Under 50% utilization
        underBudget.push(category);
      }
    }
    
    return { overBudget, underBudget };
  }
  
  /**
   * Apply optimization strategy
   */
  applyOptimizationStrategy(strategyName) {
    if (!this.optimizationStrategies[strategyName]) {
      throw new Error(`Unknown optimization strategy: ${strategyName}`);
    }
    
    const oldStrategy = this.currentStrategy;
    this.currentStrategy = strategyName;
    
    this.emit('strategy_changed', {
      oldStrategy,
      newStrategy: strategyName,
      strategy: this.optimizationStrategies[strategyName],
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Reset cost tracking for new billing period
   */
  resetCostTracking() {
    // Archive current data
    const currentMonth = {
      date: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(this.costTracking.current))
    };
    
    this.costTracking.historical.monthly.push(currentMonth);
    
    // Keep only last 12 months
    if (this.costTracking.historical.monthly.length > 12) {
      this.costTracking.historical.monthly.shift();
    }
    
    // Reset current tracking
    this.costTracking.current = {
      total: 0,
      daily: 0,
      byProvider: {
        aimlapi: 0,
        openai: 0,
        google: 0,
        anthropic: 0
      },
      byCategory: {
        realtime: 0,
        analysis: 0,
        monitoring: 0,
        experimental: 0
      },
      byModel: {}
    };
    
    // Reset performance metrics
    this.performanceMetrics = {
      totalRequests: 0,
      costPerRequest: 0,
      savingsAchieved: 0,
      optimizationDecisions: 0,
      budgetUtilization: 0
    };
    
    this.lastResetDate = new Date().toDateString();
    
    this.emit('cost_tracking_reset', {
      timestamp: new Date().toISOString(),
      archivedData: currentMonth
    });
  }
  
  /**
   * Start cost tracking with daily reset
   */
  startCostTracking() {
    // Check for daily reset
    setInterval(() => {
      const today = new Date().toDateString();
      if (this.lastResetDate !== today) {
        // Archive daily data
        this.costTracking.historical.daily.push({
          date: this.lastResetDate,
          cost: this.costTracking.current.daily
        });
        
        // Keep only last 30 days
        if (this.costTracking.historical.daily.length > 30) {
          this.costTracking.historical.daily.shift();
        }
        
        // Reset daily tracking
        this.costTracking.current.daily = 0;
        this.lastResetDate = today;
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      config: this.config,
      currentStrategy: this.currentStrategy,
      budgetAllocation: this.budgetAllocation,
      costTracking: this.costTracking,
      performanceMetrics: this.performanceMetrics,
      budgetUtilization: this.getBudgetUtilization(),
      savingsRate: this.calculateCurrentSavingsRate(),
      recommendations: this.getOptimizationRecommendations()
    };
  }
  
  /**
   * Generate cost report
   */
  generateCostReport() {
    const utilization = this.getBudgetUtilization();
    const savingsRate = this.calculateCurrentSavingsRate();
    
    return {
      summary: {
        totalSpent: this.costTracking.current.total,
        budgetRemaining: this.config.monthlyBudget - this.costTracking.current.total,
        budgetUtilization: utilization,
        savingsRate: savingsRate,
        savingsTarget: this.config.savingsTarget,
        targetMet: savingsRate >= this.config.savingsTarget
      },
      breakdown: {
        byProvider: this.costTracking.current.byProvider,
        byCategory: this.costTracking.current.byCategory,
        byModel: this.costTracking.current.byModel
      },
      projections: this.costTracking.projections,
      recommendations: this.getOptimizationRecommendations(),
      performance: this.performanceMetrics
    };
  }
}

module.exports = CostOptimizationSystem;
