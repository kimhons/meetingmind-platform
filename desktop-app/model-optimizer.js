const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ModelOptimizer {
  constructor(aiService) {
    this.aiService = aiService;
    this.trainingData = [];
    this.performanceMetrics = {};
    this.optimizationHistory = [];
    this.modelVariants = {};
    this.initializeOptimizer();
  }

  async initializeOptimizer() {
    await this.loadTrainingData();
    await this.loadPerformanceMetrics();
    this.initializeModelVariants();
  }

  async loadTrainingData() {
    try {
      const dataPath = path.join(os.homedir(), '.meetingmind', 'training-data.json');
      const data = await fs.readFile(dataPath, 'utf8');
      this.trainingData = JSON.parse(data);
    } catch (error) {
      this.trainingData = [];
    }
  }

  async saveTrainingData() {
    try {
      const dataDir = path.join(os.homedir(), '.meetingmind');
      const dataPath = path.join(dataDir, 'training-data.json');
      
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(dataPath, JSON.stringify(this.trainingData, null, 2));
    } catch (error) {
      console.error('Failed to save training data:', error);
    }
  }

  async loadPerformanceMetrics() {
    try {
      const metricsPath = path.join(os.homedir(), '.meetingmind', 'performance-metrics.json');
      const data = await fs.readFile(metricsPath, 'utf8');
      this.performanceMetrics = JSON.parse(data);
    } catch (error) {
      this.performanceMetrics = {
        accuracy: 0.7,
        relevance: 0.7,
        actionability: 0.6,
        userSatisfaction: 0.7,
        responseTime: 2.5,
        contextUtilization: 0.6
      };
    }
  }

  async savePerformanceMetrics() {
    try {
      const dataDir = path.join(os.homedir(), '.meetingmind');
      const metricsPath = path.join(dataDir, 'performance-metrics.json');
      
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(metricsPath, JSON.stringify(this.performanceMetrics, null, 2));
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }

  initializeModelVariants() {
    this.modelVariants = {
      // High accuracy variant for critical decisions
      precision: {
        temperature: 0.2,
        top_p: 0.8,
        frequency_penalty: 0.2,
        presence_penalty: 0.1,
        max_tokens: 1500,
        systemPromptModifier: 'Focus on accuracy and precision. Provide detailed evidence for all claims.',
        useCase: 'critical_decisions'
      },
      
      // Creative variant for brainstorming and ideation
      creative: {
        temperature: 0.8,
        top_p: 0.95,
        frequency_penalty: 0.1,
        presence_penalty: 0.3,
        max_tokens: 1200,
        systemPromptModifier: 'Think creatively and provide innovative perspectives. Explore multiple angles.',
        useCase: 'brainstorming'
      },
      
      // Balanced variant for general use
      balanced: {
        temperature: 0.5,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        max_tokens: 1000,
        systemPromptModifier: 'Provide balanced, practical insights with clear reasoning.',
        useCase: 'general'
      },
      
      // Speed-optimized variant for real-time responses
      rapid: {
        temperature: 0.4,
        top_p: 0.85,
        frequency_penalty: 0.05,
        presence_penalty: 0.05,
        max_tokens: 600,
        systemPromptModifier: 'Provide concise, actionable insights quickly.',
        useCase: 'real_time'
      },
      
      // Relationship-focused variant for sensitive communications
      diplomatic: {
        temperature: 0.3,
        top_p: 0.85,
        frequency_penalty: 0.15,
        presence_penalty: 0.2,
        max_tokens: 1200,
        systemPromptModifier: 'Focus on relationship preservation and diplomatic communication.',
        useCase: 'sensitive_communications'
      }
    };
  }

  // Adaptive model selection based on context
  selectOptimalModel(context, requestType) {
    const contextFactors = this.analyzeContext(context);
    const requestFactors = this.analyzeRequestType(requestType);
    
    // Decision matrix for model selection
    let selectedVariant = 'balanced'; // default
    
    if (contextFactors.criticality === 'high' && requestFactors.accuracy_required === 'high') {
      selectedVariant = 'precision';
    } else if (contextFactors.creativity_needed === 'high') {
      selectedVariant = 'creative';
    } else if (requestFactors.speed_required === 'high') {
      selectedVariant = 'rapid';
    } else if (contextFactors.sensitivity === 'high') {
      selectedVariant = 'diplomatic';
    }
    
    return this.modelVariants[selectedVariant];
  }

  analyzeContext(context) {
    const factors = {
      criticality: 'medium',
      creativity_needed: 'medium',
      sensitivity: 'medium',
      time_pressure: 'medium'
    };
    
    // Analyze meeting type
    if (context.meetingType === 'board_meeting' || context.meetingType === 'executive_review') {
      factors.criticality = 'high';
      factors.sensitivity = 'high';
    } else if (context.meetingType === 'brainstorming' || context.meetingType === 'innovation') {
      factors.creativity_needed = 'high';
    }
    
    // Analyze participants
    if (context.participants) {
      const hasExecutives = context.participants.some(p => 
        (p.title || '').toLowerCase().includes('ceo') || 
        (p.title || '').toLowerCase().includes('president')
      );
      if (hasExecutives) {
        factors.criticality = 'high';
        factors.sensitivity = 'high';
      }
    }
    
    // Analyze conversation content
    const conversationText = (context.conversationText || '').toLowerCase();
    if (conversationText.includes('urgent') || conversationText.includes('asap')) {
      factors.time_pressure = 'high';
    }
    
    if (conversationText.includes('sensitive') || conversationText.includes('confidential')) {
      factors.sensitivity = 'high';
    }
    
    return factors;
  }

  analyzeRequestType(requestType) {
    const factors = {
      accuracy_required: 'medium',
      speed_required: 'medium',
      creativity_required: 'medium'
    };
    
    switch (requestType) {
      case 'insights':
        factors.accuracy_required = 'high';
        break;
      case 'quick_insight':
        factors.speed_required = 'high';
        break;
      case 'knowledge_search':
        factors.accuracy_required = 'high';
        break;
      case 'follow_up':
        factors.creativity_required = 'medium';
        break;
    }
    
    return factors;
  }

  // Dynamic prompt optimization based on performance feedback
  optimizePrompt(basePrompt, context, performanceFeedback) {
    let optimizedPrompt = basePrompt;
    
    // Add performance-based modifications
    if (performanceFeedback.accuracy < 0.7) {
      optimizedPrompt += '\n\nIMPORTANT: Provide specific evidence and reasoning for all insights. Avoid generalizations.';
    }
    
    if (performanceFeedback.relevance < 0.7) {
      optimizedPrompt += `\n\nCONTEXT FOCUS: Pay special attention to the ${context.meetingType} context and ${context.industry} industry specifics.`;
    }
    
    if (performanceFeedback.actionability < 0.7) {
      optimizedPrompt += '\n\nACTIONABILITY: Ensure all recommendations include specific, executable actions with clear next steps.';
    }
    
    // Add context-specific enhancements
    optimizedPrompt += this.addContextualEnhancements(context);
    
    return optimizedPrompt;
  }

  addContextualEnhancements(context) {
    let enhancements = '';
    
    // Industry-specific enhancements
    if (context.industry === 'technology') {
      enhancements += '\n\nTECH FOCUS: Consider technical feasibility, scalability, and integration challenges.';
    } else if (context.industry === 'finance') {
      enhancements += '\n\nFINANCE FOCUS: Emphasize risk assessment, compliance, and ROI considerations.';
    } else if (context.industry === 'healthcare') {
      enhancements += '\n\nHEALTHCARE FOCUS: Prioritize patient safety, regulatory compliance, and clinical outcomes.';
    }
    
    // Meeting stage enhancements
    if (context.meetingStage === 'negotiation') {
      enhancements += '\n\nNEGOTIATION CONTEXT: Focus on win-win solutions and relationship preservation.';
    } else if (context.meetingStage === 'closing') {
      enhancements += '\n\nCLOSING CONTEXT: Emphasize decision facilitation and next step clarity.';
    }
    
    return enhancements;
  }

  // Real-time performance monitoring and adjustment
  async monitorPerformance(request, response, userFeedback) {
    const performanceData = {
      timestamp: new Date().toISOString(),
      requestType: request.type,
      context: request.context,
      responseTime: response.responseTime,
      modelUsed: response.model,
      userRating: userFeedback.rating,
      specificFeedback: userFeedback.feedback,
      metrics: this.calculateResponseMetrics(request, response, userFeedback)
    };
    
    // Add to training data
    this.trainingData.push(performanceData);
    
    // Update performance metrics
    await this.updatePerformanceMetrics(performanceData);
    
    // Trigger optimization if performance drops
    if (this.shouldTriggerOptimization()) {
      await this.performOptimization();
    }
    
    // Save data
    await this.saveTrainingData();
    await this.savePerformanceMetrics();
    
    return performanceData;
  }

  calculateResponseMetrics(request, response, userFeedback) {
    return {
      accuracy: this.calculateAccuracy(response, userFeedback),
      relevance: this.calculateRelevance(request, response, userFeedback),
      actionability: this.calculateActionability(response, userFeedback),
      clarity: this.calculateClarity(response, userFeedback),
      completeness: this.calculateCompleteness(response, userFeedback),
      timeliness: this.calculateTimeliness(response)
    };
  }

  calculateAccuracy(response, userFeedback) {
    // Base accuracy from user rating
    let accuracy = (userFeedback.rating || 3) / 5;
    
    // Adjust based on specific feedback
    if (userFeedback.feedback) {
      const feedback = userFeedback.feedback.toLowerCase();
      if (feedback.includes('accurate') || feedback.includes('correct')) {
        accuracy += 0.2;
      } else if (feedback.includes('wrong') || feedback.includes('incorrect')) {
        accuracy -= 0.3;
      }
    }
    
    // Check for confidence indicators in response
    if (response.confidence && response.confidence > 0.8) {
      accuracy += 0.1;
    }
    
    return Math.max(0, Math.min(1, accuracy));
  }

  calculateRelevance(request, response, userFeedback) {
    let relevance = (userFeedback.rating || 3) / 5;
    
    // Check context alignment
    if (request.context && response.contextQuality) {
      relevance += response.contextQuality * 0.2;
    }
    
    // Check for context-specific keywords
    const contextKeywords = this.extractContextKeywords(request.context);
    const responseText = JSON.stringify(response).toLowerCase();
    const keywordMatches = contextKeywords.filter(keyword => 
      responseText.includes(keyword.toLowerCase())
    ).length;
    
    relevance += (keywordMatches / Math.max(contextKeywords.length, 1)) * 0.2;
    
    return Math.max(0, Math.min(1, relevance));
  }

  calculateActionability(response, userFeedback) {
    let actionability = (userFeedback.rating || 3) / 5;
    
    // Check for action words in response
    const actionWords = ['should', 'recommend', 'suggest', 'next step', 'action', 'implement'];
    const responseText = JSON.stringify(response).toLowerCase();
    const actionCount = actionWords.filter(word => responseText.includes(word)).length;
    
    actionability += Math.min(actionCount * 0.1, 0.3);
    
    // Check for specific recommendations
    if (response.recommendedActions && response.recommendedActions.length > 0) {
      actionability += 0.2;
    }
    
    return Math.max(0, Math.min(1, actionability));
  }

  calculateClarity(response, userFeedback) {
    let clarity = (userFeedback.rating || 3) / 5;
    
    // Simple clarity metrics
    const responseText = JSON.stringify(response);
    const avgSentenceLength = this.calculateAverageSentenceLength(responseText);
    
    // Optimal sentence length for clarity
    if (avgSentenceLength >= 10 && avgSentenceLength <= 20) {
      clarity += 0.2;
    } else if (avgSentenceLength > 30) {
      clarity -= 0.2;
    }
    
    return Math.max(0, Math.min(1, clarity));
  }

  calculateCompleteness(response, userFeedback) {
    let completeness = (userFeedback.rating || 3) / 5;
    
    // Check for required response components
    const requiredComponents = ['insights', 'recommendations', 'analysis'];
    const responseKeys = Object.keys(response);
    const componentMatches = requiredComponents.filter(component => 
      responseKeys.some(key => key.toLowerCase().includes(component))
    ).length;
    
    completeness += (componentMatches / requiredComponents.length) * 0.3;
    
    return Math.max(0, Math.min(1, completeness));
  }

  calculateTimeliness(response) {
    const responseTime = response.responseTime || 3000; // Default 3 seconds
    
    // Optimal response time is under 2 seconds
    if (responseTime < 2000) return 1.0;
    if (responseTime < 5000) return 0.8;
    if (responseTime < 10000) return 0.6;
    return 0.4;
  }

  extractContextKeywords(context) {
    const keywords = [];
    
    if (context.industry) keywords.push(context.industry);
    if (context.meetingType) keywords.push(context.meetingType);
    if (context.participants) {
      context.participants.forEach(p => {
        if (p.role) keywords.push(p.role);
        if (p.department) keywords.push(p.department);
      });
    }
    
    return keywords;
  }

  calculateAverageSentenceLength(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
    
    return totalWords / sentences.length;
  }

  async updatePerformanceMetrics(performanceData) {
    const metrics = performanceData.metrics;
    const alpha = 0.1; // Learning rate
    
    // Exponential moving average update
    this.performanceMetrics.accuracy = 
      (1 - alpha) * this.performanceMetrics.accuracy + alpha * metrics.accuracy;
    this.performanceMetrics.relevance = 
      (1 - alpha) * this.performanceMetrics.relevance + alpha * metrics.relevance;
    this.performanceMetrics.actionability = 
      (1 - alpha) * this.performanceMetrics.actionability + alpha * metrics.actionability;
    
    // Update response time
    this.performanceMetrics.responseTime = 
      (1 - alpha) * this.performanceMetrics.responseTime + alpha * performanceData.responseTime;
  }

  shouldTriggerOptimization() {
    // Trigger optimization if any metric falls below threshold
    const thresholds = {
      accuracy: 0.6,
      relevance: 0.6,
      actionability: 0.5
    };
    
    return Object.entries(thresholds).some(([metric, threshold]) => 
      this.performanceMetrics[metric] < threshold
    );
  }

  async performOptimization() {
    console.log('Triggering model optimization...');
    
    // Analyze recent performance data
    const recentData = this.trainingData.slice(-50);
    const optimizationInsights = this.analyzePerformancePatterns(recentData);
    
    // Adjust model parameters
    await this.adjustModelParameters(optimizationInsights);
    
    // Update prompt templates
    await this.optimizePromptTemplates(optimizationInsights);
    
    // Record optimization
    this.optimizationHistory.push({
      timestamp: new Date().toISOString(),
      insights: optimizationInsights,
      adjustments: 'Model parameters and prompts updated'
    });
    
    console.log('Model optimization completed');
  }

  analyzePerformancePatterns(data) {
    const patterns = {
      lowPerformanceContexts: [],
      highPerformanceContexts: [],
      commonIssues: [],
      successFactors: []
    };
    
    // Identify low and high performance contexts
    data.forEach(item => {
      const avgScore = (item.metrics.accuracy + item.metrics.relevance + item.metrics.actionability) / 3;
      
      if (avgScore < 0.6) {
        patterns.lowPerformanceContexts.push({
          context: item.context,
          issues: this.identifyIssues(item)
        });
      } else if (avgScore > 0.8) {
        patterns.highPerformanceContexts.push({
          context: item.context,
          factors: this.identifySuccessFactors(item)
        });
      }
    });
    
    return patterns;
  }

  identifyIssues(performanceData) {
    const issues = [];
    
    if (performanceData.metrics.accuracy < 0.6) {
      issues.push('low_accuracy');
    }
    if (performanceData.metrics.relevance < 0.6) {
      issues.push('low_relevance');
    }
    if (performanceData.metrics.actionability < 0.5) {
      issues.push('low_actionability');
    }
    if (performanceData.responseTime > 5000) {
      issues.push('slow_response');
    }
    
    return issues;
  }

  identifySuccessFactors(performanceData) {
    const factors = [];
    
    if (performanceData.metrics.accuracy > 0.8) {
      factors.push('high_accuracy');
    }
    if (performanceData.metrics.relevance > 0.8) {
      factors.push('high_relevance');
    }
    if (performanceData.metrics.actionability > 0.8) {
      factors.push('high_actionability');
    }
    if (performanceData.responseTime < 2000) {
      factors.push('fast_response');
    }
    
    return factors;
  }

  async adjustModelParameters(insights) {
    // Adjust temperature based on accuracy issues
    if (insights.commonIssues.includes('low_accuracy')) {
      Object.values(this.modelVariants).forEach(variant => {
        variant.temperature = Math.max(0.1, variant.temperature - 0.1);
      });
    }
    
    // Adjust max_tokens based on completeness issues
    if (insights.commonIssues.includes('low_completeness')) {
      Object.values(this.modelVariants).forEach(variant => {
        variant.max_tokens = Math.min(2000, variant.max_tokens + 200);
      });
    }
  }

  async optimizePromptTemplates(insights) {
    // This would update the prompt engine with optimization insights
    if (this.aiService.promptEngine) {
      // Add performance-based prompt modifications
      insights.lowPerformanceContexts.forEach(context => {
        // Update prompt templates based on identified issues
        console.log('Optimizing prompts for context:', context.context.meetingType);
      });
    }
  }

  // Generate optimization report
  generateOptimizationReport() {
    const recentData = this.trainingData.slice(-100);
    
    return {
      performanceMetrics: this.performanceMetrics,
      dataPoints: recentData.length,
      optimizationHistory: this.optimizationHistory.slice(-10),
      modelVariants: Object.keys(this.modelVariants),
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.performanceMetrics.accuracy < 0.7) {
      recommendations.push({
        type: 'accuracy_improvement',
        suggestion: 'Consider using precision model variant for critical decisions',
        priority: 'high'
      });
    }
    
    if (this.performanceMetrics.responseTime > 3000) {
      recommendations.push({
        type: 'performance_optimization',
        suggestion: 'Use rapid model variant for real-time responses',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }
}

module.exports = ModelOptimizer;
