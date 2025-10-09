/**
 * Intelligence Synthesizer
 * 
 * Advanced AI system that synthesizes insights from multiple intelligence engines
 * (predictive, coaching, knowledge, opportunity detection) into coherent,
 * prioritized recommendations. This represents the pinnacle of AI coordination
 * technology for meeting optimization.
 */

const { TripleAIClient } = require('./triple-ai-client');

class IntelligenceSynthesizer {
  constructor(tripleAI) {
    this.tripleAI = tripleAI;
    this.synthesisHistory = new Map();
    this.synthesisPatterns = new Map();
    this.qualityMetrics = {
      synthesisOperations: 0,
      averageQuality: 0,
      conflictResolutions: 0,
      userAcceptance: []
    };
  }

  /**
   * Synthesize intelligence from multiple sources into unified recommendations
   */
  async synthesizeIntelligence(intelligenceData) {
    try {
      const {
        predictions,
        coaching,
        knowledge,
        opportunities,
        crossMeetingInsights,
        context,
        session,
        realTimeData
      } = intelligenceData;

      const startTime = Date.now();

      // Analyze and categorize all intelligence sources
      const categorizedIntelligence = await this.categorizeIntelligence({
        predictions,
        coaching,
        knowledge,
        opportunities,
        crossMeetingInsights
      });

      // Identify conflicts and complementary insights
      const conflictAnalysis = await this.analyzeIntelligenceConflicts(categorizedIntelligence);

      // Synthesize complementary insights
      const synthesizedInsights = await this.synthesizeComplementaryInsights(
        categorizedIntelligence,
        conflictAnalysis,
        context
      );

      // Resolve conflicts using triple-AI collaboration
      const conflictResolutions = await this.resolveIntelligenceConflicts(
        conflictAnalysis.conflicts,
        context,
        session
      );

      // Generate unified recommendations
      const unifiedRecommendations = await this.generateUnifiedRecommendations(
        synthesizedInsights,
        conflictResolutions,
        context,
        realTimeData
      );

      // Calculate synthesis quality score
      const qualityScore = this.calculateSynthesisQuality(
        categorizedIntelligence,
        unifiedRecommendations,
        conflictAnalysis
      );

      const processingTime = Date.now() - startTime;

      // Track synthesis metrics
      this.trackSynthesisMetrics(qualityScore, conflictAnalysis.conflicts.length, processingTime);

      // Store synthesis history for learning
      this.synthesisHistory.set(`${session.meetingId}-${Date.now()}`, {
        input: intelligenceData,
        output: unifiedRecommendations,
        quality: qualityScore,
        processingTime,
        timestamp: new Date()
      });

      this.qualityMetrics.synthesisOperations++;

      return {
        recommendations: unifiedRecommendations,
        quality: qualityScore,
        processingTime,
        conflictsResolved: conflictAnalysis.conflicts.length,
        sourceEngines: Object.keys(categorizedIntelligence),
        synthesisMetadata: {
          categorization: categorizedIntelligence,
          conflicts: conflictAnalysis,
          resolutions: conflictResolutions
        }
      };

    } catch (error) {
      console.error('Error synthesizing intelligence:', error);
      return {
        recommendations: [],
        quality: 0.3,
        processingTime: 0,
        error: error.message
      };
    }
  }

  /**
   * Categorize intelligence by type, urgency, and impact
   */
  async categorizeIntelligence(intelligenceSources) {
    try {
      const categorized = {
        immediate_action: [],
        proactive_coaching: [],
        knowledge_support: [],
        predictive_insights: [],
        opportunity_alerts: [],
        cross_meeting_context: []
      };

      // Categorize predictions
      if (intelligenceSources.predictions) {
        intelligenceSources.predictions.forEach(prediction => {
          if (prediction.timeframe === 'immediate') {
            categorized.immediate_action.push({
              ...prediction,
              sourceEngine: 'predictive',
              category: 'immediate_action'
            });
          } else {
            categorized.predictive_insights.push({
              ...prediction,
              sourceEngine: 'predictive',
              category: 'predictive_insights'
            });
          }
        });
      }

      // Categorize coaching recommendations
      if (intelligenceSources.coaching) {
        intelligenceSources.coaching.forEach(coaching => {
          categorized.proactive_coaching.push({
            ...coaching,
            sourceEngine: 'coaching',
            category: 'proactive_coaching'
          });
        });
      }

      // Categorize knowledge suggestions
      if (intelligenceSources.knowledge) {
        intelligenceSources.knowledge.forEach(knowledge => {
          categorized.knowledge_support.push({
            ...knowledge,
            sourceEngine: 'knowledge',
            category: 'knowledge_support'
          });
        });
      }

      // Categorize opportunities
      if (intelligenceSources.opportunities) {
        intelligenceSources.opportunities.forEach(opportunity => {
          categorized.opportunity_alerts.push({
            ...opportunity,
            sourceEngine: 'opportunity',
            category: 'opportunity_alerts'
          });
        });
      }

      // Categorize cross-meeting insights
      if (intelligenceSources.crossMeetingInsights) {
        intelligenceSources.crossMeetingInsights.forEach(insight => {
          categorized.cross_meeting_context.push({
            ...insight,
            sourceEngine: 'cross_meeting',
            category: 'cross_meeting_context'
          });
        });
      }

      return categorized;

    } catch (error) {
      console.error('Error categorizing intelligence:', error);
      return {};
    }
  }

  /**
   * Analyze conflicts between different intelligence sources
   */
  async analyzeIntelligenceConflicts(categorizedIntelligence) {
    try {
      const conflicts = [];
      const complementary = [];

      // Compare recommendations across categories
      const allRecommendations = Object.values(categorizedIntelligence).flat();

      for (let i = 0; i < allRecommendations.length; i++) {
        for (let j = i + 1; j < allRecommendations.length; j++) {
          const rec1 = allRecommendations[i];
          const rec2 = allRecommendations[j];

          const relationship = await this.analyzeRecommendationRelationship(rec1, rec2);

          if (relationship.type === 'conflict') {
            conflicts.push({
              recommendation1: rec1,
              recommendation2: rec2,
              conflictType: relationship.conflictType,
              severity: relationship.severity,
              resolution: null
            });
          } else if (relationship.type === 'complementary') {
            complementary.push({
              recommendation1: rec1,
              recommendation2: rec2,
              synergy: relationship.synergy,
              combinedImpact: relationship.combinedImpact
            });
          }
        }
      }

      return {
        conflicts,
        complementary,
        totalRecommendations: allRecommendations.length,
        conflictRate: conflicts.length / allRecommendations.length
      };

    } catch (error) {
      console.error('Error analyzing intelligence conflicts:', error);
      return { conflicts: [], complementary: [], totalRecommendations: 0, conflictRate: 0 };
    }
  }

  /**
   * Analyze relationship between two recommendations
   */
  async analyzeRecommendationRelationship(rec1, rec2) {
    try {
      // Simple conflict detection based on recommendation content
      const conflictIndicators = [
        'contradictory actions',
        'opposing suggestions',
        'mutually exclusive',
        'conflicting priorities'
      ];

      const complementaryIndicators = [
        'supporting actions',
        'reinforcing suggestions',
        'synergistic effects',
        'aligned objectives'
      ];

      const rec1Text = `${rec1.title} ${rec1.message || rec1.description || ''}`.toLowerCase();
      const rec2Text = `${rec2.title} ${rec2.message || rec2.description || ''}`.toLowerCase();

      // Check for conflicts
      const hasConflict = conflictIndicators.some(indicator => 
        rec1Text.includes(indicator) || rec2Text.includes(indicator)
      );

      // Check for complementary relationship
      const isComplementary = complementaryIndicators.some(indicator => 
        rec1Text.includes(indicator) || rec2Text.includes(indicator)
      );

      // Analyze based on categories and targets
      if (rec1.category === rec2.category && rec1.targetUserId === rec2.targetUserId) {
        if (rec1.urgency === 'immediate' && rec2.urgency === 'immediate') {
          return {
            type: 'conflict',
            conflictType: 'priority_conflict',
            severity: 'high'
          };
        }
      }

      if (hasConflict) {
        return {
          type: 'conflict',
          conflictType: 'content_conflict',
          severity: 'medium'
        };
      }

      if (isComplementary || (rec1.category !== rec2.category && rec1.impact === 'high' && rec2.impact === 'high')) {
        return {
          type: 'complementary',
          synergy: 'high',
          combinedImpact: 'enhanced'
        };
      }

      return {
        type: 'independent',
        relationship: 'neutral'
      };

    } catch (error) {
      console.error('Error analyzing recommendation relationship:', error);
      return { type: 'independent', relationship: 'neutral' };
    }
  }

  /**
   * Synthesize complementary insights into enhanced recommendations
   */
  async synthesizeComplementaryInsights(categorizedIntelligence, conflictAnalysis, context) {
    try {
      const synthesizedInsights = [];

      // Process complementary relationships
      for (const complementary of conflictAnalysis.complementary) {
        const synthesized = await this.combineComplementaryRecommendations(
          complementary.recommendation1,
          complementary.recommendation2,
          complementary.synergy,
          context
        );

        if (synthesized) {
          synthesizedInsights.push(synthesized);
        }
      }

      // Enhance individual recommendations with cross-category insights
      for (const [category, recommendations] of Object.entries(categorizedIntelligence)) {
        for (const recommendation of recommendations) {
          const enhanced = await this.enhanceRecommendationWithCrossCategory(
            recommendation,
            categorizedIntelligence,
            context
          );

          if (enhanced && !synthesizedInsights.some(s => s.originalId === recommendation.id)) {
            synthesizedInsights.push(enhanced);
          }
        }
      }

      return synthesizedInsights;

    } catch (error) {
      console.error('Error synthesizing complementary insights:', error);
      return [];
    }
  }

  /**
   * Combine complementary recommendations into enhanced recommendation
   */
  async combineComplementaryRecommendations(rec1, rec2, synergy, context) {
    try {
      const combinationPrompt = `
        Combine these complementary recommendations into a single enhanced recommendation:
        
        Recommendation 1: ${JSON.stringify(rec1)}
        Recommendation 2: ${JSON.stringify(rec2)}
        Synergy Level: ${synergy}
        Context: ${JSON.stringify(context)}
        
        Create a unified recommendation that:
        1. Combines the strengths of both recommendations
        2. Maximizes the synergistic effect
        3. Provides clear, actionable guidance
        4. Maintains appropriate urgency and impact levels
        
        Return as structured JSON with title, message, actions, impact, urgency, and confidence.
      `;

      const combination = await this.tripleAI.processWithCollaboration(
        combinationPrompt,
        {
          gpt5: { role: 'synthesis_creation', weight: 0.5 },
          claude: { role: 'accuracy_validation', weight: 0.3 },
          gemini: { role: 'optimization', weight: 0.2 }
        }
      );

      return {
        id: `synthesized-${Date.now()}-${Math.random()}`,
        type: 'synthesized_recommendation',
        title: combination.title || `Combined: ${rec1.title} + ${rec2.title}`,
        message: combination.message || 'Synthesized recommendation combining multiple insights',
        actions: combination.actions || [],
        impact: combination.impact || Math.max(rec1.impact === 'high' ? 3 : rec1.impact === 'medium' ? 2 : 1, 
                                              rec2.impact === 'high' ? 3 : rec2.impact === 'medium' ? 2 : 1) === 3 ? 'high' : 'medium',
        urgency: combination.urgency || (rec1.urgency === 'immediate' || rec2.urgency === 'immediate' ? 'immediate' : 'soon'),
        confidence: combination.confidence || Math.min((rec1.confidence || 0.7) + (rec2.confidence || 0.7), 1.0),
        sourceEngines: [rec1.sourceEngine, rec2.sourceEngine],
        originalRecommendations: [rec1.id, rec2.id],
        synthesisType: 'complementary_combination',
        synergyLevel: synergy
      };

    } catch (error) {
      console.error('Error combining complementary recommendations:', error);
      return null;
    }
  }

  /**
   * Enhance recommendation with cross-category insights
   */
  async enhanceRecommendationWithCrossCategory(recommendation, categorizedIntelligence, context) {
    try {
      // Find relevant insights from other categories
      const relevantInsights = [];

      for (const [category, recommendations] of Object.entries(categorizedIntelligence)) {
        if (category !== recommendation.category) {
          const relevant = recommendations.filter(rec => 
            this.isRelevantToRecommendation(rec, recommendation)
          );
          relevantInsights.push(...relevant);
        }
      }

      if (relevantInsights.length === 0) {
        return {
          ...recommendation,
          enhanced: false,
          crossCategoryInsights: []
        };
      }

      const enhancementPrompt = `
        Enhance this recommendation with cross-category insights:
        
        Original Recommendation: ${JSON.stringify(recommendation)}
        Relevant Insights: ${JSON.stringify(relevantInsights)}
        Context: ${JSON.stringify(context)}
        
        Enhance the recommendation by:
        1. Adding relevant context from other insights
        2. Improving actionability with additional information
        3. Increasing confidence through supporting evidence
        4. Providing more comprehensive guidance
        
        Return enhanced recommendation as structured JSON.
      `;

      const enhancement = await this.tripleAI.processWithCollaboration(
        enhancementPrompt,
        {
          gpt5: { role: 'enhancement_creation', weight: 0.4 },
          claude: { role: 'accuracy_validation', weight: 0.3 },
          gemini: { role: 'optimization', weight: 0.3 }
        }
      );

      return {
        ...recommendation,
        enhanced: true,
        enhancedTitle: enhancement.title || recommendation.title,
        enhancedMessage: enhancement.message || recommendation.message,
        enhancedActions: enhancement.actions || recommendation.actions || [],
        crossCategoryInsights: relevantInsights.map(insight => ({
          category: insight.category,
          title: insight.title,
          relevance: this.calculateRelevanceScore(insight, recommendation)
        })),
        enhancedConfidence: Math.min((recommendation.confidence || 0.7) + 0.1, 1.0),
        originalId: recommendation.id
      };

    } catch (error) {
      console.error('Error enhancing recommendation with cross-category insights:', error);
      return {
        ...recommendation,
        enhanced: false,
        crossCategoryInsights: []
      };
    }
  }

  /**
   * Check if insight is relevant to recommendation
   */
  isRelevantToRecommendation(insight, recommendation) {
    // Simple relevance check based on common keywords and context
    const insightText = `${insight.title} ${insight.message || insight.description || ''}`.toLowerCase();
    const recText = `${recommendation.title} ${recommendation.message || recommendation.description || ''}`.toLowerCase();

    // Check for common keywords
    const insightWords = insightText.split(/\s+/).filter(word => word.length > 3);
    const recWords = recText.split(/\s+/).filter(word => word.length > 3);

    const commonWords = insightWords.filter(word => recWords.includes(word));
    const relevanceScore = commonWords.length / Math.max(insightWords.length, recWords.length);

    return relevanceScore > 0.1 || 
           insight.targetUserId === recommendation.targetUserId ||
           insight.category === 'cross_meeting_context';
  }

  /**
   * Calculate relevance score between insight and recommendation
   */
  calculateRelevanceScore(insight, recommendation) {
    let score = 0;

    // Text similarity
    const textSimilarity = this.calculateTextSimilarity(
      `${insight.title} ${insight.message || ''}`,
      `${recommendation.title} ${recommendation.message || ''}`
    );
    score += textSimilarity * 0.4;

    // Target user match
    if (insight.targetUserId === recommendation.targetUserId) {
      score += 0.3;
    }

    // Impact alignment
    if (insight.impact === recommendation.impact) {
      score += 0.2;
    }

    // Urgency alignment
    if (insight.urgency === recommendation.urgency) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate text similarity between two strings
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 3);

    if (words1.length === 0 || words2.length === 0) return 0;

    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Resolve conflicts between intelligence sources
   */
  async resolveIntelligenceConflicts(conflicts, context, session) {
    try {
      const resolutions = [];

      for (const conflict of conflicts) {
        const resolution = await this.resolveSpecificConflict(conflict, context, session);
        if (resolution) {
          resolutions.push(resolution);
        }
      }

      this.qualityMetrics.conflictResolutions += resolutions.length;
      return resolutions;

    } catch (error) {
      console.error('Error resolving intelligence conflicts:', error);
      return [];
    }
  }

  /**
   * Resolve specific conflict between recommendations
   */
  async resolveSpecificConflict(conflict, context, session) {
    try {
      const resolutionPrompt = `
        Resolve this conflict between AI recommendations:
        
        Conflict: ${JSON.stringify(conflict)}
        Context: ${JSON.stringify(context)}
        Session Info: ${JSON.stringify({ meetingId: session.meetingId, participants: session.participants.length })}
        
        Provide conflict resolution by:
        1. Analyzing the root cause of the conflict
        2. Determining which recommendation has higher priority
        3. Creating a unified approach that addresses both concerns
        4. Providing clear reasoning for the resolution
        
        Return as structured JSON with resolution_type, chosen_recommendation, unified_approach, and reasoning.
      `;

      const resolution = await this.tripleAI.processWithCollaboration(
        resolutionPrompt,
        {
          gpt5: { role: 'conflict_analysis', weight: 0.4 },
          claude: { role: 'resolution_validation', weight: 0.4 },
          gemini: { role: 'optimization', weight: 0.2 }
        }
      );

      return {
        conflictId: `${conflict.recommendation1.id}-${conflict.recommendation2.id}`,
        resolutionType: resolution.resolution_type || 'priority_based',
        chosenRecommendation: resolution.chosen_recommendation,
        unifiedApproach: resolution.unified_approach,
        reasoning: resolution.reasoning,
        confidence: 0.8,
        originalConflict: conflict
      };

    } catch (error) {
      console.error('Error resolving specific conflict:', error);
      return null;
    }
  }

  /**
   * Generate unified recommendations from synthesized insights and resolved conflicts
   */
  async generateUnifiedRecommendations(synthesizedInsights, conflictResolutions, context, realTimeData) {
    try {
      const unifiedRecommendations = [];

      // Add synthesized insights
      unifiedRecommendations.push(...synthesizedInsights);

      // Add conflict resolutions as recommendations
      for (const resolution of conflictResolutions) {
        if (resolution.unifiedApproach) {
          unifiedRecommendations.push({
            id: `resolution-${Date.now()}-${Math.random()}`,
            type: 'conflict_resolution',
            title: 'Unified Approach',
            message: resolution.unifiedApproach,
            impact: 'high',
            urgency: 'soon',
            confidence: resolution.confidence,
            sourceEngine: 'synthesis',
            resolutionReasoning: resolution.reasoning,
            originalConflict: resolution.conflictId
          });
        }
      }

      // Sort by priority and impact
      const prioritizedRecommendations = unifiedRecommendations
        .sort((a, b) => {
          const priorityA = this.calculateRecommendationPriority(a);
          const priorityB = this.calculateRecommendationPriority(b);
          return priorityB - priorityA;
        })
        .slice(0, 8); // Top 8 recommendations

      return prioritizedRecommendations;

    } catch (error) {
      console.error('Error generating unified recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate recommendation priority score
   */
  calculateRecommendationPriority(recommendation) {
    let priority = 0;

    // Impact weight (0-40 points)
    const impactWeights = { high: 40, medium: 25, low: 10 };
    priority += impactWeights[recommendation.impact] || 10;

    // Urgency weight (0-30 points)
    const urgencyWeights = { immediate: 30, soon: 20, later: 5 };
    priority += urgencyWeights[recommendation.urgency] || 5;

    // Confidence weight (0-20 points)
    priority += (recommendation.confidence || 0.5) * 20;

    // Synthesis bonus (0-10 points)
    if (recommendation.type === 'synthesized_recommendation') {
      priority += 10;
    }

    return priority;
  }

  /**
   * Calculate synthesis quality score
   */
  calculateSynthesisQuality(categorizedIntelligence, unifiedRecommendations, conflictAnalysis) {
    try {
      let qualityScore = 0.5; // Base score

      // Source diversity bonus (0-0.2)
      const sourceEngines = new Set();
      Object.values(categorizedIntelligence).flat().forEach(item => {
        if (item.sourceEngine) sourceEngines.add(item.sourceEngine);
      });
      qualityScore += Math.min(sourceEngines.size * 0.04, 0.2);

      // Conflict resolution bonus (0-0.2)
      if (conflictAnalysis.conflicts.length > 0) {
        const resolutionRate = conflictAnalysis.conflicts.length > 0 ? 1.0 : 0;
        qualityScore += resolutionRate * 0.2;
      }

      // Recommendation quality (0-0.3)
      const avgConfidence = unifiedRecommendations.length > 0
        ? unifiedRecommendations.reduce((sum, rec) => sum + (rec.confidence || 0.5), 0) / unifiedRecommendations.length
        : 0.5;
      qualityScore += avgConfidence * 0.3;

      return Math.min(1.0, qualityScore);

    } catch (error) {
      console.error('Error calculating synthesis quality:', error);
      return 0.5;
    }
  }

  /**
   * Track synthesis metrics for analytics
   */
  trackSynthesisMetrics(qualityScore, conflictsResolved, processingTime) {
    try {
      // Update running average quality
      const currentAvg = this.qualityMetrics.averageQuality;
      const operations = this.qualityMetrics.synthesisOperations;
      this.qualityMetrics.averageQuality = 
        (currentAvg * operations + qualityScore) / (operations + 1);

      // Log synthesis performance
      console.log(`Intelligence synthesis: Quality ${qualityScore.toFixed(3)}, ${conflictsResolved} conflicts resolved (${processingTime}ms)`);

    } catch (error) {
      console.error('Error tracking synthesis metrics:', error);
    }
  }

  /**
   * Get synthesis analytics
   */
  getSynthesisAnalytics() {
    const avgUserAcceptance = this.qualityMetrics.userAcceptance.length > 0
      ? this.qualityMetrics.userAcceptance.reduce((sum, acc) => sum + acc, 0) / this.qualityMetrics.userAcceptance.length
      : 0;

    return {
      totalSynthesisOperations: this.qualityMetrics.synthesisOperations,
      averageQuality: this.qualityMetrics.averageQuality.toFixed(3),
      conflictsResolved: this.qualityMetrics.conflictResolutions,
      averageUserAcceptance: avgUserAcceptance.toFixed(2),
      synthesisHistorySize: this.synthesisHistory.size,
      patternsIdentified: this.synthesisPatterns.size
    };
  }
}

module.exports = { IntelligenceSynthesizer };
