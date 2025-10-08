  // Advanced context management methods
  buildConversationHistory(currentPrompt, context) {
    const messages = [];
    
    // System prompt with role-based expertise
    const systemPrompt = this.promptEngine.promptTemplates.systemPrompts.meetingAnalyst;
    messages.push({
      role: "system",
      content: systemPrompt
    });

    // Add relevant conversation history for context
    const relevantHistory = this.getRelevantConversationHistory(context);
    relevantHistory.forEach(exchange => {
      messages.push({
        role: "assistant",
        content: `Previous analysis: ${exchange.response.substring(0, 200)}...`
      });
    });

    // Current prompt
    messages.push({
      role: "user", 
      content: currentPrompt
    });

    return messages;
  }

  getRelevantConversationHistory(context) {
    return this.conversationBuffer
      .filter(exchange => {
        // Filter by meeting type and recency
        return exchange.context?.meetingType === context.meetingType &&
               Date.now() - new Date(exchange.timestamp).getTime() < 3600000; // Last hour
      })
      .slice(-this.contextWindow);
  }

  addToConversationBuffer(type, prompt, response, context) {
    this.conversationBuffer.push({
      type,
      prompt: prompt.substring(0, 500), // Store truncated prompt
      response: response.substring(0, 1000), // Store truncated response
      context,
      timestamp: new Date().toISOString()
    });

    // Keep buffer size manageable
    if (this.conversationBuffer.length > 50) {
      this.conversationBuffer = this.conversationBuffer.slice(-30);
    }
  }

  assessContextQuality(context) {
    let score = 0.5; // Base score
    
    // Increase score for rich context
    if (context.meetingType) score += 0.1;
    if (context.industry) score += 0.1;
    if (context.participants && context.participants.length > 0) score += 0.1;
    if (context.conversationText && context.conversationText.length > 100) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  // Enhanced knowledge search with domain expertise
  async searchKnowledge(query, context = {}) {
    if (!this.isInitialized) {
      return this.getFallbackKnowledge(query);
    }

    try {
      const prompt = this.buildKnowledgeSearchPrompt(query, context);
      
      if (this.settings.provider === 'openai') {
        const messages = [
          {
            role: "system",
            content: this.promptEngine.promptTemplates.systemPrompts.knowledgeExpert
          },
          {
            role: "user",
            content: prompt
          }
        ];

        const completion = await this.openai.chat.completions.create({
          model: this.settings.openai.model,
          messages: messages,
          max_tokens: this.settings.openai.maxTokens,
          temperature: 0.3, // Lower temperature for factual information
          response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content);
        
        // Enhance response with source validation
        const enhancedResponse = this.enhanceKnowledgeResponse(response, query, context);
        
        return {
          success: true,
          query,
          provider: 'openai',
          usage: completion.usage,
          ...enhancedResponse,
          timestamp: new Date().toISOString()
        };
      } else {
        return await this.generateLocalKnowledge(prompt, query, context);
      }
    } catch (error) {
      console.error('Knowledge search failed:', error);
      return this.getFallbackKnowledge(query);
    }
  }

  enhanceKnowledgeResponse(response, query, context) {
    // Add relevance scoring and source validation
    if (response.keyFindings) {
      response.keyFindings = response.keyFindings.map(finding => ({
        ...finding,
        relevanceScore: this.calculateRelevanceScore(finding, query, context),
        sourceCredibility: this.assessSourceCredibility(finding.source),
        actionabilityScore: this.assessKnowledgeActionability(finding)
      }));
    }

    // Add strategic recommendations based on context
    if (context.meetingType && context.industry) {
      response.contextualRecommendations = this.generateContextualRecommendations(
        response, 
        context
      );
    }

    return response;
  }

  calculateRelevanceScore(finding, query, context) {
    let score = 0.5;
    
    // Keyword matching
    const queryWords = query.toLowerCase().split(/\s+/);
    const findingText = (finding.finding + ' ' + finding.relevance).toLowerCase();
    const matchCount = queryWords.filter(word => findingText.includes(word)).length;
    score += (matchCount / queryWords.length) * 0.3;
    
    // Context alignment
    if (context.industry && findingText.includes(context.industry.toLowerCase())) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  assessSourceCredibility(source) {
    const highCredibilitySources = ['research', 'study', 'report', 'analysis', 'survey'];
    const mediumCredibilitySources = ['article', 'blog', 'news', 'interview'];
    
    const sourceLower = (source || '').toLowerCase();
    
    if (highCredibilitySources.some(s => sourceLower.includes(s))) {
      return 'high';
    } else if (mediumCredibilitySources.some(s => sourceLower.includes(s))) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  assessKnowledgeActionability(finding) {
    const actionableIndicators = ['implement', 'use', 'apply', 'consider', 'adopt'];
    const findingText = (finding.finding + ' ' + finding.relevance).toLowerCase();
    
    const actionableCount = actionableIndicators.filter(indicator => 
      findingText.includes(indicator)
    ).length;
    
    return actionableCount > 0 ? 'high' : 'medium';
  }

  generateContextualRecommendations(response, context) {
    const recommendations = [];
    
    // Industry-specific recommendations
    if (context.industry === 'technology') {
      recommendations.push({
        type: 'technical_validation',
        recommendation: 'Validate technical feasibility and integration requirements',
        priority: 'high'
      });
    }
    
    // Meeting type recommendations
    if (context.meetingType === 'sales') {
      recommendations.push({
        type: 'value_proposition',
        recommendation: 'Align findings with customer value proposition and ROI',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  // Enhanced follow-up generation with strategic communication
  async generateFollowUp(meetingData) {
    if (!this.isInitialized) {
      return this.getFallbackFollowUp(meetingData);
    }

    try {
      const prompt = this.buildFollowUpPrompt(meetingData);
      
      if (this.settings.provider === 'openai') {
        const messages = [
          {
            role: "system",
            content: this.promptEngine.promptTemplates.systemPrompts.communicationSpecialist
          },
          {
            role: "user",
            content: prompt
          }
        ];

        const completion = await this.openai.chat.completions.create({
          model: this.settings.openai.model,
          messages: messages,
          max_tokens: this.settings.openai.maxTokens,
          temperature: 0.5, // Balanced creativity for communication
          response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content);
        
        // Enhance with communication strategy validation
        const enhancedResponse = this.enhanceFollowUpResponse(response, meetingData);
        
        return {
          success: true,
          provider: 'openai',
          usage: completion.usage,
          ...enhancedResponse,
          generatedAt: new Date().toISOString()
        };
      } else {
        return await this.generateLocalFollowUp(prompt, meetingData);
      }
    } catch (error) {
      console.error('Follow-up generation failed:', error);
      return this.getFallbackFollowUp(meetingData);
    }
  }

  enhanceFollowUpResponse(response, meetingData) {
    // Add communication effectiveness scoring
    if (response.emailContent) {
      response.communicationMetrics = {
        clarityScore: this.assessCommunicationClarity(response.emailContent.body),
        professionalismScore: this.assessProfessionalism(response.emailContent),
        actionOrientationScore: this.assessActionOrientation(response.emailContent.body),
        relationshipScore: this.assessRelationshipBuilding(response.emailContent.body)
      };
    }

    // Add timing recommendations
    response.timingStrategy = this.generateTimingStrategy(meetingData);
    
    // Add follow-up sequence optimization
    if (response.followUpSequence) {
      response.followUpSequence = response.followUpSequence.map(followUp => ({
        ...followUp,
        effectivenessScore: this.assessFollowUpEffectiveness(followUp),
        personalizedElements: this.generatePersonalizedElements(followUp, meetingData)
      }));
    }

    return response;
  }

  assessCommunicationClarity(text) {
    // Simple clarity assessment based on sentence length and structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    // Optimal sentence length is 15-20 words
    if (avgSentenceLength >= 15 && avgSentenceLength <= 20) return 0.9;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) return 0.7;
    return 0.5;
  }

  assessProfessionalism(emailContent) {
    const professionalIndicators = ['please', 'thank you', 'appreciate', 'best regards', 'sincerely'];
    const casualIndicators = ['hey', 'thanks', 'cheers', 'talk soon'];
    
    const fullText = (emailContent.subject + ' ' + emailContent.body + ' ' + emailContent.closing).toLowerCase();
    
    const professionalCount = professionalIndicators.filter(indicator => 
      fullText.includes(indicator)
    ).length;
    
    const casualCount = casualIndicators.filter(indicator => 
      fullText.includes(indicator)
    ).length;
    
    return professionalCount > casualCount ? 0.8 : 0.6;
  }

  assessActionOrientation(text) {
    const actionWords = ['will', 'shall', 'next steps', 'action items', 'follow up', 'schedule', 'plan'];
    const textLower = text.toLowerCase();
    
    const actionCount = actionWords.filter(word => textLower.includes(word)).length;
    return Math.min(actionCount * 0.2, 1.0);
  }

  assessRelationshipBuilding(text) {
    const relationshipWords = ['partnership', 'collaboration', 'together', 'mutual', 'shared', 'appreciate'];
    const textLower = text.toLowerCase();
    
    const relationshipCount = relationshipWords.filter(word => textLower.includes(word)).length;
    return Math.min(relationshipCount * 0.25, 1.0);
  }

  generateTimingStrategy(meetingData) {
    const now = new Date();
    const strategy = {
      immediateFollowUp: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
      secondFollowUp: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
      weeklyCheck: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week
    };

    // Adjust based on meeting urgency
    if (meetingData.urgency === 'high') {
      strategy.immediateFollowUp = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
      strategy.secondFollowUp = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    }

    return strategy;
  }

  assessFollowUpEffectiveness(followUp) {
    let score = 0.5;
    
    // Clear purpose increases effectiveness
    if (followUp.purpose && followUp.purpose.length > 10) score += 0.2;
    
    // Appropriate timing
    if (followUp.timing && followUp.timing !== 'undefined') score += 0.2;
    
    // Specific content
    if (followUp.content && followUp.content.length > 20) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  generatePersonalizedElements(followUp, meetingData) {
    const elements = [];
    
    // Add participant-specific elements
    if (meetingData.participants && meetingData.participants.length > 0) {
      const primaryContact = meetingData.participants[0];
      if (primaryContact.interests) {
        elements.push(`Reference to ${primaryContact.interests[0]}`);
      }
    }
    
    // Add meeting-specific references
    if (meetingData.keyMoments && meetingData.keyMoments.length > 0) {
      elements.push(`Reference to ${meetingData.keyMoments[0]}`);
    }
    
    return elements;
  }

  // User feedback integration for continuous improvement
  async processFeedback(feedback) {
    // Update prompt engine with user feedback
    this.promptEngine.updateUserProfile(feedback);
    
    // Adjust AI parameters based on feedback
    if (feedback.responseQuality === 'too_generic') {
      this.settings.openai.temperature = Math.max(0.1, this.settings.openai.temperature - 0.1);
    } else if (feedback.responseQuality === 'too_creative') {
      this.settings.openai.temperature = Math.min(1.0, this.settings.openai.temperature + 0.1);
    }
    
    await this.saveSettings();
    
    return {
      success: true,
      message: 'Feedback processed and system updated',
      adjustments: {
        temperature: this.settings.openai.temperature,
        profileUpdated: true
      }
    };
  }
