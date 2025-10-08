const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const AdvancedPromptEngine = require('./advanced-prompts');
const ModelOptimizer = require('./model-optimizer');

class AIService {
  constructor() {
    this.openai = null;
    this.settings = {};
    this.isInitialized = false;
    this.promptEngine = new AdvancedPromptEngine();
    this.modelOptimizer = null;
    this.conversationBuffer = [];
    this.contextWindow = 5;
    this.performanceTracking = true;
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const settingsPath = path.join(os.homedir(), '.meetingmind', 'ai-settings.json');
      const settingsData = await fs.readFile(settingsPath, 'utf8');
      this.settings = JSON.parse(settingsData);
      await this.initializeAI();
    } catch (error) {
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
    }
  }

  async saveSettings() {
    try {
      const settingsDir = path.join(os.homedir(), '.meetingmind');
      const settingsPath = path.join(settingsDir, 'ai-settings.json');
      
      await fs.mkdir(settingsDir, { recursive: true });
      await fs.writeFile(settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Failed to save AI settings:', error);
    }
  }

  getDefaultSettings() {
    return {
      provider: 'openai',
      openai: {
        apiKey: '',
        model: 'gpt-4',
        baseURL: 'https://api.openai.com/v1',
        maxTokens: 1000,
        temperature: 0.7
      },
      local: {
        endpoint: 'http://localhost:11434',
        model: 'llama2',
        timeout: 30000
      },
      features: {
        realTimeInsights: true,
        knowledgeSearch: true,
        followUpGeneration: true,
        contextAwareness: true,
        performanceOptimization: true
      }
    };
  }

  async initializeAI() {
    try {
      if (this.settings.provider === 'openai' && this.settings.openai.apiKey) {
        this.openai = new OpenAI({
          apiKey: this.settings.openai.apiKey,
          baseURL: this.settings.openai.baseURL
        });
        this.isInitialized = true;
        
        // Initialize model optimizer
        if (this.settings.features.performanceOptimization) {
          this.modelOptimizer = new ModelOptimizer(this);
        }
      } else if (this.settings.provider === 'local') {
        // Test local connection
        await this.testLocalConnection();
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      this.isInitialized = false;
    }
  }

  async testLocalConnection() {
    try {
      const response = await axios.get(`${this.settings.local.endpoint}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      throw new Error(`Local AI connection failed: ${error.message}`);
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    await this.initializeAI();
    
    return {
      success: true,
      settings: this.settings
    };
  }

  getSettings() {
    return {
      ...this.settings,
      openai: {
        ...this.settings.openai,
        apiKey: this.settings.openai.apiKey ? '***' : ''
      }
    };
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      provider: this.settings.provider,
      hasApiKey: !!this.settings.openai.apiKey,
      model: this.settings.provider === 'openai' ? this.settings.openai.model : this.settings.local.model,
      features: this.settings.features,
      performanceMetrics: this.modelOptimizer ? this.modelOptimizer.performanceMetrics : null
    };
  }

  async testConnection() {
    try {
      if (this.settings.provider === 'openai') {
        if (!this.settings.openai.apiKey) {
          throw new Error('OpenAI API key not configured');
        }
        
        const testClient = new OpenAI({
          apiKey: this.settings.openai.apiKey,
          baseURL: this.settings.openai.baseURL
        });
        
        const response = await testClient.chat.completions.create({
          model: this.settings.openai.model,
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 10
        });
        
        return {
          success: true,
          message: 'OpenAI connection successful',
          model: response.model,
          usage: response.usage
        };
      } else {
        await this.testLocalConnection();
        return {
          success: true,
          message: 'Local AI connection successful',
          endpoint: this.settings.local.endpoint
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Enhanced insights generation with model optimization
  async generateInsights(text, context = {}) {
    if (!this.isInitialized) {
      return this.getFallbackInsights();
    }

    const startTime = Date.now();
    
    try {
      // Select optimal model variant based on context
      const modelConfig = this.modelOptimizer ? 
        this.modelOptimizer.selectOptimalModel(context, 'insights') : 
        this.getDefaultModelConfig();
      
      // Generate optimized prompt
      const basePrompt = this.promptEngine.generateInsightsPrompt(text, context);
      const optimizedPrompt = this.modelOptimizer ? 
        this.modelOptimizer.optimizePrompt(basePrompt, context, this.modelOptimizer.performanceMetrics) :
        basePrompt;
      
      let result;
      if (this.settings.provider === 'openai') {
        result = await this.generateOpenAIInsights(optimizedPrompt, context, modelConfig);
      } else {
        result = await this.generateLocalInsights(optimizedPrompt, context);
      }
      
      // Add performance tracking
      const responseTime = Date.now() - startTime;
      result.responseTime = responseTime;
      result.modelConfig = modelConfig;
      
      return result;
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return this.getFallbackInsights();
    }
  }

  async generateOpenAIInsights(prompt, context = {}, modelConfig = null) {
    try {
      const config = modelConfig || this.getDefaultModelConfig();
      
      // Build conversation history for context
      const messages = this.buildConversationHistory(prompt, context, config);
      
      const completion = await this.openai.chat.completions.create({
        model: this.settings.openai.model,
        messages: messages,
        max_tokens: config.max_tokens || this.settings.openai.maxTokens,
        temperature: config.temperature || this.settings.openai.temperature,
        top_p: config.top_p || 0.9,
        frequency_penalty: config.frequency_penalty || 0.1,
        presence_penalty: config.presence_penalty || 0.1,
        response_format: { type: "json_object" }
      });

      const rawResponse = completion.choices[0].message.content;
      
      // Validate and enhance response using prompt engine
      const validatedResponse = this.promptEngine.validateAndEnhanceResponse(
        rawResponse, 
        { required: ['conversationDynamics', 'businessIntelligence', 'strategicInsights'] }
      );

      // Add conversation to buffer for context
      this.addToConversationBuffer('insights', prompt, rawResponse, context);

      const result = {
        success: true,
        provider: 'openai',
        model: this.settings.openai.model,
        usage: completion.usage,
        ...validatedResponse,
        timestamp: new Date().toISOString(),
        contextQuality: this.assessContextQuality(context)
      };

      // Track performance if optimizer is available
      if (this.modelOptimizer && this.performanceTracking) {
        // Performance tracking will be done when user provides feedback
        result.trackingId = this.generateTrackingId();
      }

      return result;
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async generateLocalInsights(prompt, context = {}) {
    try {
      const response = await axios.post(`${this.settings.local.endpoint}/api/generate`, {
        model: this.settings.local.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1000
        }
      }, {
        timeout: this.settings.local.timeout
      });

      // Parse and structure local AI response
      const structuredResponse = this.structureLocalResponse(response.data.response, 'insights');
      
      return {
        success: true,
        provider: 'local',
        model: this.settings.local.model,
        ...structuredResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Local AI error: ${error.message}`);
    }
  }

  // Enhanced knowledge search with expert-level research
  async searchKnowledge(query, context = {}) {
    if (!this.isInitialized) {
      return this.getFallbackKnowledge(query);
    }

    const startTime = Date.now();

    try {
      const modelConfig = this.modelOptimizer ? 
        this.modelOptimizer.selectOptimalModel(context, 'knowledge_search') : 
        this.getDefaultModelConfig();

      const basePrompt = this.promptEngine.generateKnowledgeSearchPrompt(query, context);
      const optimizedPrompt = this.modelOptimizer ? 
        this.modelOptimizer.optimizePrompt(basePrompt, context, this.modelOptimizer.performanceMetrics) :
        basePrompt;
      
      let result;
      if (this.settings.provider === 'openai') {
        const messages = [
          {
            role: "system",
            content: this.promptEngine.promptTemplates.systemPrompts.knowledgeExpert
          },
          {
            role: "user",
            content: optimizedPrompt
          }
        ];

        const completion = await this.openai.chat.completions.create({
          model: this.settings.openai.model,
          messages: messages,
          max_tokens: modelConfig.max_tokens || this.settings.openai.maxTokens,
          temperature: modelConfig.temperature || 0.3, // Lower temperature for factual information
          response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content);
        
        // Enhance response with source validation
        const enhancedResponse = this.enhanceKnowledgeResponse(response, query, context);
        
        result = {
          success: true,
          query,
          provider: 'openai',
          usage: completion.usage,
          ...enhancedResponse,
          timestamp: new Date().toISOString()
        };
      } else {
        result = await this.generateLocalKnowledge(optimizedPrompt, query, context);
      }

      result.responseTime = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error('Knowledge search failed:', error);
      return this.getFallbackKnowledge(query);
    }
  }

  // Enhanced follow-up generation with strategic communication
  async generateFollowUp(meetingData) {
    if (!this.isInitialized) {
      return this.getFallbackFollowUp(meetingData);
    }

    const startTime = Date.now();

    try {
      const modelConfig = this.modelOptimizer ? 
        this.modelOptimizer.selectOptimalModel(meetingData, 'follow_up') : 
        this.getDefaultModelConfig();

      const basePrompt = this.promptEngine.generateFollowUpPrompt(meetingData);
      const optimizedPrompt = this.modelOptimizer ? 
        this.modelOptimizer.optimizePrompt(basePrompt, meetingData, this.modelOptimizer.performanceMetrics) :
        basePrompt;
      
      let result;
      if (this.settings.provider === 'openai') {
        const messages = [
          {
            role: "system",
            content: this.promptEngine.promptTemplates.systemPrompts.communicationSpecialist
          },
          {
            role: "user",
            content: optimizedPrompt
          }
        ];

        const completion = await this.openai.chat.completions.create({
          model: this.settings.openai.model,
          messages: messages,
          max_tokens: modelConfig.max_tokens || this.settings.openai.maxTokens,
          temperature: modelConfig.temperature || 0.5, // Balanced creativity for communication
          response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content);
        
        // Enhance with communication strategy validation
        const enhancedResponse = this.enhanceFollowUpResponse(response, meetingData);
        
        result = {
          success: true,
          provider: 'openai',
          usage: completion.usage,
          ...enhancedResponse,
          generatedAt: new Date().toISOString()
        };
      } else {
        result = await this.generateLocalFollowUp(optimizedPrompt, meetingData);
      }

      result.responseTime = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error('Follow-up generation failed:', error);
      return this.getFallbackFollowUp(meetingData);
    }
  }

  // User feedback integration for continuous improvement
  async processFeedback(trackingId, userFeedback) {
    if (!this.modelOptimizer) {
      return { success: false, message: 'Performance optimization not enabled' };
    }

    try {
      // Find the corresponding request/response pair
      const requestData = this.findRequestByTrackingId(trackingId);
      if (!requestData) {
        return { success: false, message: 'Request not found for tracking ID' };
      }

      // Process feedback through model optimizer
      const performanceData = await this.modelOptimizer.monitorPerformance(
        requestData.request,
        requestData.response,
        userFeedback
      );

      // Update prompt engine with user feedback
      this.promptEngine.updateUserProfile(userFeedback);
      
      // Adjust AI parameters based on feedback
      if (userFeedback.responseQuality === 'too_generic') {
        this.settings.openai.temperature = Math.max(0.1, this.settings.openai.temperature - 0.1);
      } else if (userFeedback.responseQuality === 'too_creative') {
        this.settings.openai.temperature = Math.min(1.0, this.settings.openai.temperature + 0.1);
      }
      
      await this.saveSettings();
      
      return {
        success: true,
        message: 'Feedback processed and system updated',
        performanceData: performanceData,
        adjustments: {
          temperature: this.settings.openai.temperature,
          profileUpdated: true
        }
      };
    } catch (error) {
      console.error('Failed to process feedback:', error);
      return { success: false, message: error.message };
    }
  }

  // Performance monitoring and optimization
  async getPerformanceReport() {
    if (!this.modelOptimizer) {
      return { success: false, message: 'Performance optimization not enabled' };
    }

    return {
      success: true,
      report: this.modelOptimizer.generateOptimizationReport()
    };
  }

  // Helper methods
  buildConversationHistory(currentPrompt, context, modelConfig) {
    const messages = [];
    
    // System prompt with role-based expertise and model-specific modifications
    let systemPrompt = this.promptEngine.promptTemplates.systemPrompts.meetingAnalyst;
    if (modelConfig && modelConfig.systemPromptModifier) {
      systemPrompt += '\n\n' + modelConfig.systemPromptModifier;
    }
    
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
        return exchange.context?.meetingType === context.meetingType &&
               Date.now() - new Date(exchange.timestamp).getTime() < 3600000; // Last hour
      })
      .slice(-this.contextWindow);
  }

  addToConversationBuffer(type, prompt, response, context) {
    this.conversationBuffer.push({
      type,
      prompt: prompt.substring(0, 500),
      response: response.substring(0, 1000),
      context,
      timestamp: new Date().toISOString()
    });

    if (this.conversationBuffer.length > 50) {
      this.conversationBuffer = this.conversationBuffer.slice(-30);
    }
  }

  assessContextQuality(context) {
    let score = 0.5;
    
    if (context.meetingType) score += 0.1;
    if (context.industry) score += 0.1;
    if (context.participants && context.participants.length > 0) score += 0.1;
    if (context.conversationText && context.conversationText.length > 100) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  getDefaultModelConfig() {
    return {
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
      max_tokens: 1000
    };
  }

  generateTrackingId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  findRequestByTrackingId(trackingId) {
    // This would store request/response pairs with tracking IDs
    // Implementation depends on how you want to store this data
    return null; // Placeholder
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

    return response;
  }

  enhanceFollowUpResponse(response, meetingData) {
    // Add communication effectiveness scoring
    if (response.emailContent) {
      response.communicationMetrics = {
        clarityScore: this.assessCommunicationClarity(response.emailContent.body),
        professionalismScore: this.assessProfessionalism(response.emailContent),
        actionOrientationScore: this.assessActionOrientation(response.emailContent.body)
      };
    }

    return response;
  }

  calculateRelevanceScore(finding, query, context) {
    let score = 0.5;
    
    const queryWords = query.toLowerCase().split(/\s+/);
    const findingText = (finding.finding + ' ' + finding.relevance).toLowerCase();
    const matchCount = queryWords.filter(word => findingText.includes(word)).length;
    score += (matchCount / queryWords.length) * 0.3;
    
    if (context.industry && findingText.includes(context.industry.toLowerCase())) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  assessSourceCredibility(source) {
    const highCredibilitySources = ['research', 'study', 'report', 'analysis', 'survey'];
    const sourceLower = (source || '').toLowerCase();
    
    if (highCredibilitySources.some(s => sourceLower.includes(s))) {
      return 'high';
    }
    return 'medium';
  }

  assessKnowledgeActionability(finding) {
    const actionableIndicators = ['implement', 'use', 'apply', 'consider', 'adopt'];
    const findingText = (finding.finding + ' ' + finding.relevance).toLowerCase();
    
    const actionableCount = actionableIndicators.filter(indicator => 
      findingText.includes(indicator)
    ).length;
    
    return actionableCount > 0 ? 'high' : 'medium';
  }

  assessCommunicationClarity(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    if (avgSentenceLength >= 15 && avgSentenceLength <= 20) return 0.9;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) return 0.7;
    return 0.5;
  }

  assessProfessionalism(emailContent) {
    const professionalIndicators = ['please', 'thank you', 'appreciate', 'best regards'];
    const fullText = (emailContent.subject + ' ' + emailContent.body).toLowerCase();
    
    const professionalCount = professionalIndicators.filter(indicator => 
      fullText.includes(indicator)
    ).length;
    
    return professionalCount > 1 ? 0.8 : 0.6;
  }

  assessActionOrientation(text) {
    const actionWords = ['will', 'shall', 'next steps', 'action items', 'follow up'];
    const textLower = text.toLowerCase();
    
    const actionCount = actionWords.filter(word => textLower.includes(word)).length;
    return Math.min(actionCount * 0.2, 1.0);
  }

  structureLocalResponse(rawResponse, type) {
    // Convert unstructured local AI response to structured format
    // This is a simplified implementation
    return {
      insights: [{
        type: 'general',
        title: 'AI Analysis',
        content: rawResponse.substring(0, 200),
        confidence: 0.7,
        priority: 'medium'
      }],
      suggestions: ['Review the analysis', 'Consider the context'],
      timestamp: new Date().toISOString()
    };
  }

  getFallbackInsights() {
    return {
      success: false,
      error: 'AI service not available',
      insights: [{
        type: 'system',
        title: 'Service Unavailable',
        content: 'AI insights are currently unavailable. Please check your configuration.',
        confidence: 1.0,
        priority: 'high'
      }],
      suggestions: ['Check AI settings', 'Verify connection'],
      timestamp: new Date().toISOString()
    };
  }

  getFallbackKnowledge(query) {
    return {
      success: false,
      error: 'AI service not available',
      query,
      results: [{
        title: 'Service Unavailable',
        content: 'Knowledge search is currently unavailable.',
        relevance: 1.0,
        source: 'System'
      }],
      timestamp: new Date().toISOString()
    };
  }

  getFallbackFollowUp(meetingData) {
    return {
      success: false,
      error: 'AI service not available',
      subject: `Follow-up: ${meetingData.topics?.[0] || 'Our Meeting'}`,
      body: 'Follow-up generation is currently unavailable. Please check your AI configuration.',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AIService;
