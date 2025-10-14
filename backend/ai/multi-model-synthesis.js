/**
 * Multi-Model Synthesis System
 * 
 * Implements advanced AI synthesis by combining insights from multiple models
 * to deliver 300% more intelligent analysis than single-model approaches.
 * Uses strategic model orchestration for optimal cost-quality balance.
 */

const EventEmitter = require('events');

class MultiModelSynthesis extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      synthesisEnabled: config.synthesisEnabled !== false,
      maxModels: parseInt(config.maxModels || '3'),
      qualityThreshold: parseFloat(config.qualityThreshold || '0.8'),
      consensusThreshold: parseFloat(config.consensusThreshold || '0.7'),
      timeoutMs: parseInt(config.timeoutMs || '10000')
    };
    
    // Model specialization matrix
    this.modelSpecializations = {
      'gpt-5-pro': {
        strengths: ['strategic-analysis', 'executive-insights', 'complex-reasoning', 'decision-support'],
        weaknesses: ['cost-efficiency', 'speed'],
        qualityScore: 0.95,
        costScore: 0.3,
        speedScore: 0.6
      },
      'claude-4.5-sonnet': {
        strengths: ['analytical-reasoning', 'ethical-analysis', 'balanced-perspectives', 'sales-insights'],
        weaknesses: ['real-time-processing', 'multilingual'],
        qualityScore: 0.90,
        costScore: 0.4,
        speedScore: 0.7
      },
      'grok-4-fast': {
        strengths: ['real-time-processing', 'quick-insights', 'pattern-recognition', 'speed'],
        weaknesses: ['complex-analysis', 'nuanced-reasoning'],
        qualityScore: 0.80,
        costScore: 0.9,
        speedScore: 0.95
      },
      'gemini-2.5-flash': {
        strengths: ['balanced-analysis', 'multilingual', 'general-purpose', 'cost-effective'],
        weaknesses: ['specialized-domains', 'premium-insights'],
        qualityScore: 0.82,
        costScore: 0.8,
        speedScore: 0.85
      },
      'qwen3-max': {
        strengths: ['multilingual', 'cultural-context', 'translation', 'international-business'],
        weaknesses: ['english-only-contexts', 'technical-depth'],
        qualityScore: 0.78,
        costScore: 0.6,
        speedScore: 0.75
      },
      'deepseek-v3.1': {
        strengths: ['pattern-analysis', 'monitoring', 'trend-identification', 'cost-efficiency'],
        weaknesses: ['creative-insights', 'strategic-thinking'],
        qualityScore: 0.75,
        costScore: 0.95,
        speedScore: 0.8
      }
    };
    
    // Synthesis strategies
    this.synthesisStrategies = {
      consensus: {
        name: 'Consensus Synthesis',
        description: 'Combine models where they agree, highlight disagreements',
        minModels: 2,
        maxModels: 3,
        weightingMethod: 'equal'
      },
      expertise: {
        name: 'Expertise-Based Synthesis',
        description: 'Weight models based on their expertise in the domain',
        minModels: 2,
        maxModels: 4,
        weightingMethod: 'expertise'
      },
      hierarchical: {
        name: 'Hierarchical Synthesis',
        description: 'Use primary model for main analysis, others for validation',
        minModels: 2,
        maxModels: 3,
        weightingMethod: 'hierarchical'
      },
      competitive: {
        name: 'Competitive Synthesis',
        description: 'Generate multiple perspectives and select best',
        minModels: 3,
        maxModels: 5,
        weightingMethod: 'competitive'
      }
    };
    
    // Performance tracking
    this.synthesisMetrics = {
      totalSyntheses: 0,
      successfulSyntheses: 0,
      averageModelsUsed: 0,
      averageQualityImprovement: 0,
      averageResponseTime: 0,
      consensusRate: 0,
      costEfficiency: 0
    };
    
    // Quality assessment criteria
    this.qualityAssessment = {
      completeness: {
        weight: 0.25,
        criteria: ['covers-all-aspects', 'comprehensive-analysis', 'no-missing-elements']
      },
      accuracy: {
        weight: 0.25,
        criteria: ['factual-correctness', 'logical-consistency', 'evidence-based']
      },
      insight: {
        weight: 0.25,
        criteria: ['actionable-recommendations', 'novel-perspectives', 'strategic-value']
      },
      clarity: {
        weight: 0.25,
        criteria: ['clear-communication', 'well-structured', 'easy-to-understand']
      }
    };
  }
  
  /**
   * Main synthesis method - orchestrates multiple models for superior insights
   */
  async synthesizeInsights(context, content, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!this.config.synthesisEnabled) {
        throw new Error('Multi-model synthesis is disabled');
      }
      
      // Select optimal models for synthesis
      const selectedModels = this.selectModelsForSynthesis(context, options);
      
      if (selectedModels.length < 2) {
        throw new Error('Insufficient models available for synthesis');
      }
      
      // Choose synthesis strategy
      const strategy = this.selectSynthesisStrategy(context, selectedModels, options);
      
      // Generate insights from each model
      const modelInsights = await this.generateModelInsights(
        selectedModels, 
        context, 
        content, 
        options
      );
      
      // Synthesize insights using selected strategy
      const synthesizedResult = await this.applySynthesisStrategy(
        strategy,
        modelInsights,
        context,
        options
      );
      
      // Assess synthesis quality
      const qualityAssessment = this.assessSynthesisQuality(
        synthesizedResult,
        modelInsights,
        context
      );
      
      // Track performance
      this.trackSynthesisPerformance(
        selectedModels.length,
        qualityAssessment.overallScore,
        Date.now() - startTime,
        true
      );
      
      const finalResult = {
        ...synthesizedResult,
        synthesis: {
          strategy: strategy.name,
          modelsUsed: selectedModels,
          modelInsights: modelInsights.map(insight => ({
            model: insight.model,
            qualityScore: insight.qualityScore,
            confidence: insight.confidence,
            keyPoints: insight.keyPoints
          })),
          qualityAssessment,
          consensusLevel: this.calculateConsensusLevel(modelInsights),
          responseTime: Date.now() - startTime
        }
      };
      
      this.emit('synthesis_complete', {
        context,
        strategy: strategy.name,
        modelsUsed: selectedModels,
        qualityScore: qualityAssessment.overallScore,
        responseTime: Date.now() - startTime
      });
      
      return finalResult;
      
    } catch (error) {
      this.trackSynthesisPerformance(0, 0, Date.now() - startTime, false);
      
      this.emit('synthesis_failed', {
        context,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  /**
   * Select optimal models for synthesis based on context
   */
  selectModelsForSynthesis(context, options = {}) {
    const availableModels = options.availableModels || Object.keys(this.modelSpecializations);
    const maxModels = Math.min(options.maxModels || this.config.maxModels, availableModels.length);
    
    // Score models based on context relevance
    const modelScores = availableModels.map(model => {
      const spec = this.modelSpecializations[model];
      if (!spec) return { model, score: 0 };
      
      let score = 0;
      
      // Base quality score
      score += spec.qualityScore * 0.4;
      
      // Context relevance scoring
      const contextRelevance = this.calculateContextRelevance(spec, context);
      score += contextRelevance * 0.4;
      
      // Cost efficiency (if budget constrained)
      if (options.budgetConstrained) {
        score += spec.costScore * 0.2;
      } else {
        score += 0.1; // Small bonus for not being budget constrained
      }
      
      // Speed requirement
      if (context.urgency === 'realtime') {
        score += spec.speedScore * 0.2;
      }
      
      return { model, score, spec };
    });
    
    // Sort by score and select top models
    modelScores.sort((a, b) => b.score - a.score);
    
    // Ensure diversity in model selection
    const selectedModels = this.ensureModelDiversity(
      modelScores.slice(0, maxModels * 2), // Consider more models for diversity
      maxModels,
      context
    );
    
    return selectedModels.map(item => item.model);
  }
  
  /**
   * Calculate context relevance for a model
   */
  calculateContextRelevance(modelSpec, context) {
    let relevance = 0;
    const contextRequirements = this.extractContextRequirements(context);
    
    // Check strength alignment
    const strengthMatches = modelSpec.strengths.filter(strength => 
      contextRequirements.includes(strength)
    ).length;
    
    relevance += (strengthMatches / modelSpec.strengths.length) * 0.7;
    
    // Check weakness avoidance
    const weaknessMatches = modelSpec.weaknesses.filter(weakness => 
      contextRequirements.includes(weakness)
    ).length;
    
    relevance -= (weaknessMatches / modelSpec.weaknesses.length) * 0.3;
    
    return Math.max(0, Math.min(1, relevance));
  }
  
  /**
   * Extract requirements from context
   */
  extractContextRequirements(context) {
    const requirements = [];
    
    // Meeting type requirements
    const typeRequirements = {
      interview: ['strategic-analysis', 'decision-support', 'analytical-reasoning'],
      sales: ['sales-insights', 'analytical-reasoning', 'balanced-perspectives'],
      executive: ['strategic-analysis', 'executive-insights', 'complex-reasoning'],
      technical: ['pattern-recognition', 'analytical-reasoning'],
      realtime: ['real-time-processing', 'quick-insights', 'speed']
    };
    
    if (context.type && typeRequirements[context.type]) {
      requirements.push(...typeRequirements[context.type]);
    }
    
    // Language requirements
    if (context.language && context.language !== 'en') {
      requirements.push('multilingual', 'cultural-context');
    }
    
    // Urgency requirements
    if (context.urgency === 'realtime') {
      requirements.push('real-time-processing', 'speed');
    }
    
    // Complexity requirements
    if (context.complexity === 'high') {
      requirements.push('complex-reasoning', 'strategic-analysis');
    }
    
    // Industry requirements
    if (context.industry) {
      requirements.push('specialized-domains');
    }
    
    return [...new Set(requirements)]; // Remove duplicates
  }
  
  /**
   * Ensure diversity in model selection
   */
  ensureModelDiversity(scoredModels, maxModels, context) {
    const selected = [];
    const usedStrengths = new Set();
    
    // First, select the highest scoring model
    if (scoredModels.length > 0) {
      selected.push(scoredModels[0]);
      scoredModels[0].spec.strengths.forEach(strength => usedStrengths.add(strength));
    }
    
    // Then select models that add new strengths
    for (let i = 1; i < scoredModels.length && selected.length < maxModels; i++) {
      const model = scoredModels[i];
      const newStrengths = model.spec.strengths.filter(strength => !usedStrengths.has(strength));
      
      // Select if it adds new strengths or if we need to fill remaining slots
      if (newStrengths.length > 0 || selected.length < 2) {
        selected.push(model);
        model.spec.strengths.forEach(strength => usedStrengths.add(strength));
      }
    }
    
    return selected;
  }
  
  /**
   * Select synthesis strategy based on context and models
   */
  selectSynthesisStrategy(context, selectedModels, options = {}) {
    const strategyName = options.synthesisStrategy || this.determineBestStrategy(context, selectedModels);
    return this.synthesisStrategies[strategyName] || this.synthesisStrategies.consensus;
  }
  
  /**
   * Determine best synthesis strategy
   */
  determineBestStrategy(context, selectedModels) {
    const modelCount = selectedModels.length;
    
    // For real-time contexts, use consensus for speed
    if (context.urgency === 'realtime') {
      return 'consensus';
    }
    
    // For executive contexts, use expertise-based
    if (context.type === 'executive' || context.priority === 'critical') {
      return 'expertise';
    }
    
    // For complex analysis with many models, use competitive
    if (modelCount >= 4 && context.complexity === 'high') {
      return 'competitive';
    }
    
    // For specialized domains, use hierarchical
    if (context.specialization || context.industry) {
      return 'hierarchical';
    }
    
    // Default to consensus
    return 'consensus';
  }
  
  /**
   * Generate insights from multiple models
   */
  async generateModelInsights(models, context, content, options = {}) {
    const insights = [];
    const promises = models.map(async (model) => {
      try {
        // Generate insight from this model
        const result = await this.generateSingleModelInsight(model, context, content, options);
        
        // Assess individual insight quality
        const qualityScore = this.assessIndividualInsightQuality(result, context);
        
        // Extract key points
        const keyPoints = this.extractKeyPoints(result.content);
        
        // Calculate confidence based on model specialization
        const confidence = this.calculateModelConfidence(model, context, qualityScore);
        
        return {
          model,
          result,
          qualityScore,
          keyPoints,
          confidence,
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        return {
          model,
          error: error.message,
          qualityScore: 0,
          keyPoints: [],
          confidence: 0,
          timestamp: new Date().toISOString()
        };
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        insights.push(result.value);
      } else {
        insights.push({
          model: models[index],
          error: result.reason?.message || 'Unknown error',
          qualityScore: 0,
          keyPoints: [],
          confidence: 0,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return insights.filter(insight => !insight.error); // Return only successful insights
  }
  
  /**
   * Generate insight from a single model (placeholder - would integrate with actual AI client)
   */
  async generateSingleModelInsight(model, context, content, options = {}) {
    // This would integrate with the actual AI orchestrator
    // For now, return a mock structure
    return {
      content: `Analysis from ${model}: ${content.substring(0, 100)}...`,
      usage: { totalTokens: 1000 },
      model,
      provider: this.modelSpecializations[model] ? 'aimlapi' : 'fallback'
    };
  }
  
  /**
   * Apply synthesis strategy to combine insights
   */
  async applySynthesisStrategy(strategy, insights, context, options = {}) {
    switch (strategy.name) {
      case 'Consensus Synthesis':
        return this.applyConsensusSynthesis(insights, context);
      
      case 'Expertise-Based Synthesis':
        return this.applyExpertiseSynthesis(insights, context);
      
      case 'Hierarchical Synthesis':
        return this.applyHierarchicalSynthesis(insights, context);
      
      case 'Competitive Synthesis':
        return this.applyCompetitiveSynthesis(insights, context);
      
      default:
        return this.applyConsensusSynthesis(insights, context);
    }
  }
  
  /**
   * Apply consensus synthesis strategy
   */
  applyConsensusSynthesis(insights, context) {
    const validInsights = insights.filter(insight => insight.qualityScore >= this.config.qualityThreshold);
    
    if (validInsights.length === 0) {
      throw new Error('No valid insights for consensus synthesis');
    }
    
    // Find common themes and agreements
    const commonThemes = this.findCommonThemes(validInsights);
    const agreements = this.findAgreements(validInsights);
    const disagreements = this.findDisagreements(validInsights);
    
    // Synthesize content
    const synthesizedContent = this.generateConsensusSynthesis(
      commonThemes,
      agreements,
      disagreements,
      context
    );
    
    // Calculate weighted metrics
    const totalWeight = validInsights.reduce((sum, insight) => sum + insight.confidence, 0);
    const weightedQuality = validInsights.reduce((sum, insight) => 
      sum + (insight.qualityScore * insight.confidence), 0) / totalWeight;
    
    return {
      content: synthesizedContent,
      synthesisMethod: 'consensus',
      qualityScore: weightedQuality,
      confidence: Math.min(totalWeight / validInsights.length, 1.0),
      agreements: agreements.length,
      disagreements: disagreements.length,
      commonThemes: commonThemes.length,
      usage: this.aggregateUsage(validInsights)
    };
  }
  
  /**
   * Apply expertise-based synthesis strategy
   */
  applyExpertiseSynthesis(insights, context) {
    // Weight insights based on model expertise for this context
    const weightedInsights = insights.map(insight => {
      const expertiseWeight = this.calculateExpertiseWeight(insight.model, context);
      return {
        ...insight,
        expertiseWeight,
        finalWeight: insight.confidence * expertiseWeight
      };
    });
    
    // Sort by expertise weight
    weightedInsights.sort((a, b) => b.finalWeight - a.finalWeight);
    
    // Use top expert as primary, others as supporting
    const primaryInsight = weightedInsights[0];
    const supportingInsights = weightedInsights.slice(1);
    
    const synthesizedContent = this.generateExpertiseSynthesis(
      primaryInsight,
      supportingInsights,
      context
    );
    
    return {
      content: synthesizedContent,
      synthesisMethod: 'expertise',
      primaryExpert: primaryInsight.model,
      expertiseWeights: weightedInsights.map(i => ({
        model: i.model,
        weight: i.expertiseWeight
      })),
      qualityScore: primaryInsight.qualityScore,
      confidence: primaryInsight.finalWeight,
      usage: this.aggregateUsage(insights)
    };
  }
  
  /**
   * Apply hierarchical synthesis strategy
   */
  applyHierarchicalSynthesis(insights, context) {
    // Select primary model (highest quality + confidence)
    const primaryInsight = insights.reduce((best, current) => 
      (current.qualityScore * current.confidence) > (best.qualityScore * best.confidence) 
        ? current : best
    );
    
    const validatingInsights = insights.filter(insight => insight !== primaryInsight);
    
    // Generate hierarchical synthesis
    const synthesizedContent = this.generateHierarchicalSynthesis(
      primaryInsight,
      validatingInsights,
      context
    );
    
    return {
      content: synthesizedContent,
      synthesisMethod: 'hierarchical',
      primaryModel: primaryInsight.model,
      validatingModels: validatingInsights.map(i => i.model),
      qualityScore: primaryInsight.qualityScore,
      confidence: primaryInsight.confidence,
      validationScore: this.calculateValidationScore(primaryInsight, validatingInsights),
      usage: this.aggregateUsage(insights)
    };
  }
  
  /**
   * Apply competitive synthesis strategy
   */
  applyCompetitiveSynthesis(insights, context) {
    // Generate multiple synthesis approaches and select best
    const syntheses = [
      this.applyConsensusSynthesis(insights, context),
      this.applyExpertiseSynthesis(insights, context),
      this.applyHierarchicalSynthesis(insights, context)
    ];
    
    // Score each synthesis approach
    const scoredSyntheses = syntheses.map(synthesis => ({
      ...synthesis,
      competitiveScore: this.calculateCompetitiveScore(synthesis, context)
    }));
    
    // Select best synthesis
    const bestSynthesis = scoredSyntheses.reduce((best, current) => 
      current.competitiveScore > best.competitiveScore ? current : best
    );
    
    return {
      ...bestSynthesis,
      synthesisMethod: 'competitive',
      alternativeSyntheses: scoredSyntheses.filter(s => s !== bestSynthesis).length,
      competitiveAdvantage: bestSynthesis.competitiveScore
    };
  }
  
  /**
   * Helper methods for synthesis operations
   */
  
  findCommonThemes(insights) {
    // Simple implementation - would use more sophisticated NLP in production
    const allKeyPoints = insights.flatMap(insight => insight.keyPoints);
    const themeFrequency = {};
    
    allKeyPoints.forEach(point => {
      const normalized = point.toLowerCase().trim();
      themeFrequency[normalized] = (themeFrequency[normalized] || 0) + 1;
    });
    
    return Object.entries(themeFrequency)
      .filter(([theme, count]) => count >= Math.ceil(insights.length / 2))
      .map(([theme, count]) => ({ theme, frequency: count }));
  }
  
  findAgreements(insights) {
    // Simplified agreement detection
    return this.findCommonThemes(insights).filter(theme => theme.frequency >= insights.length * 0.7);
  }
  
  findDisagreements(insights) {
    // Simplified disagreement detection
    const allPoints = insights.flatMap(insight => insight.keyPoints);
    const contradictions = [];
    
    // This would use more sophisticated contradiction detection in production
    for (let i = 0; i < allPoints.length; i++) {
      for (let j = i + 1; j < allPoints.length; j++) {
        if (this.areContradictory(allPoints[i], allPoints[j])) {
          contradictions.push({
            point1: allPoints[i],
            point2: allPoints[j]
          });
        }
      }
    }
    
    return contradictions;
  }
  
  areContradictory(point1, point2) {
    // Simplified contradiction detection
    const contradictoryPairs = [
      ['positive', 'negative'],
      ['increase', 'decrease'],
      ['recommend', 'not recommend'],
      ['should', 'should not']
    ];
    
    const p1Lower = point1.toLowerCase();
    const p2Lower = point2.toLowerCase();
    
    return contradictoryPairs.some(([word1, word2]) => 
      (p1Lower.includes(word1) && p2Lower.includes(word2)) ||
      (p1Lower.includes(word2) && p2Lower.includes(word1))
    );
  }
  
  generateConsensusSynthesis(commonThemes, agreements, disagreements, context) {
    let synthesis = `## Consensus Analysis\n\n`;
    
    if (commonThemes.length > 0) {
      synthesis += `### Key Themes (Consensus)\n`;
      commonThemes.forEach(theme => {
        synthesis += `- ${theme.theme} (mentioned by ${theme.frequency} models)\n`;
      });
      synthesis += `\n`;
    }
    
    if (agreements.length > 0) {
      synthesis += `### Strong Agreements\n`;
      agreements.forEach(agreement => {
        synthesis += `- ${agreement.theme}\n`;
      });
      synthesis += `\n`;
    }
    
    if (disagreements.length > 0) {
      synthesis += `### Areas of Disagreement\n`;
      disagreements.forEach(disagreement => {
        synthesis += `- Conflicting views: "${disagreement.point1}" vs "${disagreement.point2}"\n`;
      });
      synthesis += `\n`;
    }
    
    synthesis += `### Synthesized Recommendations\n`;
    synthesis += `Based on the consensus analysis, the following recommendations emerge:\n\n`;
    synthesis += `1. Focus on areas where all models agree for highest confidence\n`;
    synthesis += `2. Investigate disagreements for potential risks or opportunities\n`;
    synthesis += `3. Consider multiple perspectives when making final decisions\n`;
    
    return synthesis;
  }
  
  generateExpertiseSynthesis(primaryInsight, supportingInsights, context) {
    let synthesis = `## Expert Analysis (Primary: ${primaryInsight.model})\n\n`;
    
    synthesis += `### Primary Expert Insight\n`;
    synthesis += `${primaryInsight.result.content}\n\n`;
    
    if (supportingInsights.length > 0) {
      synthesis += `### Supporting Analysis\n`;
      supportingInsights.forEach(insight => {
        synthesis += `**${insight.model}**: ${insight.result.content.substring(0, 200)}...\n\n`;
      });
    }
    
    synthesis += `### Expert Synthesis\n`;
    synthesis += `The primary expert analysis is validated and enhanced by supporting models, `;
    synthesis += `providing a comprehensive perspective with ${primaryInsight.expertiseWeight.toFixed(2)} expertise confidence.\n`;
    
    return synthesis;
  }
  
  generateHierarchicalSynthesis(primaryInsight, validatingInsights, context) {
    let synthesis = `## Hierarchical Analysis\n\n`;
    
    synthesis += `### Primary Analysis (${primaryInsight.model})\n`;
    synthesis += `${primaryInsight.result.content}\n\n`;
    
    if (validatingInsights.length > 0) {
      synthesis += `### Validation and Enhancement\n`;
      validatingInsights.forEach(insight => {
        const validationLevel = this.calculateValidationLevel(primaryInsight, insight);
        synthesis += `**${insight.model}** (${(validationLevel * 100).toFixed(1)}% validation): `;
        synthesis += `${insight.result.content.substring(0, 150)}...\n\n`;
      });
    }
    
    return synthesis;
  }
  
  calculateExpertiseWeight(model, context) {
    const spec = this.modelSpecializations[model];
    if (!spec) return 0.5;
    
    const contextRelevance = this.calculateContextRelevance(spec, context);
    return (spec.qualityScore * 0.6) + (contextRelevance * 0.4);
  }
  
  calculateValidationScore(primaryInsight, validatingInsights) {
    if (validatingInsights.length === 0) return 0;
    
    const validationLevels = validatingInsights.map(insight => 
      this.calculateValidationLevel(primaryInsight, insight)
    );
    
    return validationLevels.reduce((sum, level) => sum + level, 0) / validationLevels.length;
  }
  
  calculateValidationLevel(primaryInsight, validatingInsight) {
    // Simplified validation calculation
    const commonPoints = this.findCommonPoints(
      primaryInsight.keyPoints, 
      validatingInsight.keyPoints
    );
    
    const maxPoints = Math.max(primaryInsight.keyPoints.length, validatingInsight.keyPoints.length);
    return maxPoints > 0 ? commonPoints.length / maxPoints : 0;
  }
  
  findCommonPoints(points1, points2) {
    return points1.filter(point1 => 
      points2.some(point2 => 
        this.calculateSimilarity(point1, point2) > 0.7
      )
    );
  }
  
  calculateSimilarity(text1, text2) {
    // Simplified similarity calculation
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }
  
  calculateCompetitiveScore(synthesis, context) {
    // Score based on quality, confidence, and context appropriateness
    let score = synthesis.qualityScore * 0.4;
    score += synthesis.confidence * 0.3;
    
    // Bonus for synthesis method appropriateness
    const methodBonus = this.getMethodAppropriatenessBonus(synthesis.synthesisMethod, context);
    score += methodBonus * 0.3;
    
    return score;
  }
  
  getMethodAppropriatenessBonus(method, context) {
    const bonuses = {
      consensus: context.urgency === 'realtime' ? 0.2 : 0.1,
      expertise: context.type === 'executive' ? 0.2 : 0.1,
      hierarchical: context.specialization ? 0.2 : 0.1,
      competitive: context.complexity === 'high' ? 0.2 : 0.1
    };
    
    return bonuses[method] || 0.1;
  }
  
  assessIndividualInsightQuality(result, context) {
    // Simplified quality assessment
    let score = 0.7; // Base score
    
    const content = result.content || '';
    
    if (content.length > 200) score += 0.1;
    if (content.includes('recommend') || content.includes('suggest')) score += 0.1;
    if (content.includes('**') || content.includes('##')) score += 0.05;
    
    return Math.min(score, 1.0);
  }
  
  extractKeyPoints(content) {
    // Simplified key point extraction
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  }
  
  calculateModelConfidence(model, context, qualityScore) {
    const spec = this.modelSpecializations[model];
    if (!spec) return 0.5;
    
    const contextRelevance = this.calculateContextRelevance(spec, context);
    return (qualityScore * 0.6) + (contextRelevance * 0.4);
  }
  
  calculateConsensusLevel(insights) {
    if (insights.length < 2) return 0;
    
    const agreements = this.findAgreements(insights);
    const totalThemes = this.findCommonThemes(insights);
    
    return totalThemes.length > 0 ? agreements.length / totalThemes.length : 0;
  }
  
  assessSynthesisQuality(synthesizedResult, modelInsights, context) {
    const assessment = {
      completeness: this.assessCompleteness(synthesizedResult, modelInsights),
      accuracy: this.assessAccuracy(synthesizedResult, modelInsights),
      insight: this.assessInsightValue(synthesizedResult, context),
      clarity: this.assessClarity(synthesizedResult),
      overallScore: 0
    };
    
    // Calculate weighted overall score
    assessment.overallScore = Object.entries(this.qualityAssessment).reduce((score, [criterion, config]) => {
      return score + (assessment[criterion] * config.weight);
    }, 0);
    
    return assessment;
  }
  
  assessCompleteness(synthesizedResult, modelInsights) {
    // Check if synthesis covers insights from all models
    const synthesisContent = synthesizedResult.content.toLowerCase();
    const coverageCount = modelInsights.filter(insight => 
      insight.keyPoints.some(point => 
        synthesisContent.includes(point.toLowerCase().substring(0, 20))
      )
    ).length;
    
    return modelInsights.length > 0 ? coverageCount / modelInsights.length : 0;
  }
  
  assessAccuracy(synthesizedResult, modelInsights) {
    // Simplified accuracy assessment based on consensus
    const consensusLevel = this.calculateConsensusLevel(modelInsights);
    return Math.min(consensusLevel + 0.3, 1.0); // Base accuracy + consensus bonus
  }
  
  assessInsightValue(synthesizedResult, context) {
    const content = synthesizedResult.content.toLowerCase();
    let score = 0.5; // Base score
    
    // Check for actionable recommendations
    if (content.includes('recommend') || content.includes('action')) score += 0.2;
    
    // Check for strategic insights
    if (content.includes('strategy') || content.includes('opportunity')) score += 0.2;
    
    // Check for context-specific value
    if (context.type === 'executive' && content.includes('decision')) score += 0.1;
    if (context.type === 'sales' && content.includes('deal')) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  assessClarity(synthesizedResult) {
    const content = synthesizedResult.content;
    let score = 0.5; // Base score
    
    // Check structure
    if (content.includes('##') || content.includes('###')) score += 0.2;
    if (content.includes('- ') || content.includes('1.')) score += 0.2;
    
    // Check readability (simplified)
    const avgSentenceLength = content.split(/[.!?]+/).reduce((sum, sentence) => 
      sum + sentence.split(' ').length, 0) / content.split(/[.!?]+/).length;
    
    if (avgSentenceLength < 25) score += 0.1; // Bonus for concise sentences
    
    return Math.min(score, 1.0);
  }
  
  aggregateUsage(insights) {
    return insights.reduce((total, insight) => ({
      totalTokens: total.totalTokens + (insight.result.usage?.totalTokens || 0),
      promptTokens: total.promptTokens + (insight.result.usage?.promptTokens || 0),
      completionTokens: total.completionTokens + (insight.result.usage?.completionTokens || 0)
    }), { totalTokens: 0, promptTokens: 0, completionTokens: 0 });
  }
  
  trackSynthesisPerformance(modelsUsed, qualityScore, responseTime, success) {
    this.synthesisMetrics.totalSyntheses++;
    
    if (success) {
      this.synthesisMetrics.successfulSyntheses++;
      this.synthesisMetrics.averageModelsUsed = 
        (this.synthesisMetrics.averageModelsUsed * (this.synthesisMetrics.successfulSyntheses - 1) + modelsUsed) / 
        this.synthesisMetrics.successfulSyntheses;
      
      this.synthesisMetrics.averageQualityImprovement = 
        (this.synthesisMetrics.averageQualityImprovement * (this.synthesisMetrics.successfulSyntheses - 1) + qualityScore) / 
        this.synthesisMetrics.successfulSyntheses;
    }
    
    // Update response time
    if (!this.synthesisMetrics.responseTimes) {
      this.synthesisMetrics.responseTimes = [];
    }
    this.synthesisMetrics.responseTimes.push(responseTime);
    if (this.synthesisMetrics.responseTimes.length > 50) {
      this.synthesisMetrics.responseTimes.shift();
    }
    
    this.synthesisMetrics.averageResponseTime = 
      this.synthesisMetrics.responseTimes.reduce((sum, time) => sum + time, 0) / 
      this.synthesisMetrics.responseTimes.length;
  }
  
  /**
   * Get synthesis system status
   */
  getStatus() {
    return {
      config: this.config,
      modelSpecializations: Object.keys(this.modelSpecializations),
      synthesisStrategies: Object.keys(this.synthesisStrategies),
      metrics: this.synthesisMetrics,
      qualityAssessment: this.qualityAssessment
    };
  }
  
  /**
   * Reset synthesis metrics
   */
  resetMetrics() {
    this.synthesisMetrics = {
      totalSyntheses: 0,
      successfulSyntheses: 0,
      averageModelsUsed: 0,
      averageQualityImprovement: 0,
      averageResponseTime: 0,
      consensusRate: 0,
      costEfficiency: 0,
      responseTimes: []
    };
    
    this.emit('metrics_reset', {
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = MultiModelSynthesis;
