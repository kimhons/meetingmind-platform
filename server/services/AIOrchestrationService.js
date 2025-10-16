const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const DatabaseService = require('./DatabaseService');
const EventEmitter = require('events');

class AIOrchestrationService extends EventEmitter {
    constructor() {
        super();
        this.models = new Map();
        this.activeJobs = new Map();
        this.costTracker = {
            daily: 0,
            monthly: 0,
            total: 0
        };
        this.performanceMetrics = {
            averageResponseTime: 0,
            successRate: 0,
            totalRequests: 0
        };
        
        this.initializeProviders();
        this.setupCostMonitoring();
    }

    async initializeProviders() {
        try {
            // Initialize OpenAI
            if (process.env.OPENAI_API_KEY) {
                this.models.set('openai', new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY
                }));
                console.log('✅ OpenAI provider initialized');
            }

            // Initialize Anthropic
            if (process.env.ANTHROPIC_API_KEY) {
                this.models.set('anthropic', new Anthropic({
                    apiKey: process.env.ANTHROPIC_API_KEY
                }));
                console.log('✅ Anthropic provider initialized');
            }

            // Initialize Google AI
            if (process.env.GOOGLE_AI_API_KEY) {
                this.models.set('google', new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY));
                console.log('✅ Google AI provider initialized');
            }

            // Initialize AIMLAPI
            if (process.env.AIMLAPI_KEY) {
                this.models.set('aimlapi', new OpenAI({
                    apiKey: process.env.AIMLAPI_KEY,
                    baseURL: 'https://api.aimlapi.com/v1'
                }));
                console.log('✅ AIMLAPI provider initialized');
            }

            console.log(`🤖 AI Orchestration Service initialized with ${this.models.size} providers`);
        } catch (error) {
            console.error('❌ Failed to initialize AI providers:', error);
            throw error;
        }
    }

    setupCostMonitoring() {
        // Reset daily costs at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        setTimeout(() => {
            this.costTracker.daily = 0;
            // Set up daily reset interval
            setInterval(() => {
                this.costTracker.daily = 0;
            }, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    async processWithMultiModel(request) {
        const jobId = this.generateJobId();
        const startTime = Date.now();
        
        try {
            this.activeJobs.set(jobId, {
                id: jobId,
                type: request.type,
                startTime,
                status: 'processing'
            });

            const strategy = this.selectProcessingStrategy(request);
            let result;

            switch (strategy) {
                case 'parallel':
                    result = await this.processParallel(request);
                    break;
                case 'sequential':
                    result = await this.processSequential(request);
                    break;
                case 'consensus':
                    result = await this.processConsensus(request);
                    break;
                case 'specialized':
                    result = await this.processSpecialized(request);
                    break;
                default:
                    result = await this.processSingle(request);
            }

            const duration = Date.now() - startTime;
            await this.recordAnalysis(request, result, duration);
            
            this.activeJobs.delete(jobId);
            this.updatePerformanceMetrics(duration, true);

            return {
                jobId,
                result,
                duration,
                strategy,
                cost: result.totalCost || 0
            };

        } catch (error) {
            this.activeJobs.delete(jobId);
            this.updatePerformanceMetrics(Date.now() - startTime, false);
            console.error(`❌ AI processing failed for job ${jobId}:`, error);
            throw error;
        }
    }

    selectProcessingStrategy(request) {
        const { type, priority, complexity, budget } = request;

        // High-priority requests get consensus processing
        if (priority === 'high' || type === 'interview_analysis') {
            return 'consensus';
        }

        // Complex analysis gets parallel processing
        if (complexity === 'high' || type === 'meeting_summary') {
            return 'parallel';
        }

        // Specialized tasks get domain-specific models
        if (type === 'legal_analysis' || type === 'medical_analysis' || type === 'financial_analysis') {
            return 'specialized';
        }

        // Budget-conscious requests get sequential processing
        if (budget === 'low') {
            return 'sequential';
        }

        // Default to single model for simple tasks
        return 'single';
    }

    async processParallel(request) {
        const models = this.selectModelsForTask(request.type);
        const promises = models.map(model => this.processWithModel(model, request));
        
        const results = await Promise.allSettled(promises);
        const successfulResults = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);

        if (successfulResults.length === 0) {
            throw new Error('All parallel processing attempts failed');
        }

        return this.synthesizeResults(successfulResults, 'parallel');
    }

    async processSequential(request) {
        const models = this.selectModelsForTask(request.type);
        let bestResult = null;
        let totalCost = 0;

        for (const model of models) {
            try {
                const result = await this.processWithModel(model, request);
                totalCost += result.cost;

                if (!bestResult || result.confidence > bestResult.confidence) {
                    bestResult = result;
                }

                // Stop if we get a high-confidence result
                if (result.confidence > 0.9) {
                    break;
                }
            } catch (error) {
                console.warn(`Model ${model} failed, trying next:`, error.message);
                continue;
            }
        }

        if (!bestResult) {
            throw new Error('All sequential processing attempts failed');
        }

        return {
            ...bestResult,
            totalCost,
            strategy: 'sequential'
        };
    }

    async processConsensus(request) {
        const models = this.selectModelsForTask(request.type);
        const promises = models.map(model => this.processWithModel(model, request));
        
        const results = await Promise.allSettled(promises);
        const successfulResults = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);

        if (successfulResults.length < 2) {
            throw new Error('Consensus requires at least 2 successful results');
        }

        return this.buildConsensus(successfulResults);
    }

    async processSpecialized(request) {
        const specializedModel = this.selectSpecializedModel(request.type);
        const result = await this.processWithModel(specializedModel, request);
        
        return {
            ...result,
            strategy: 'specialized'
        };
    }

    async processSingle(request) {
        const model = this.selectOptimalModel(request);
        const result = await this.processWithModel(model, request);
        
        return {
            ...result,
            strategy: 'single'
        };
    }

    async processWithModel(modelName, request) {
        const startTime = Date.now();
        const provider = this.models.get(modelName);
        
        if (!provider) {
            throw new Error(`Model ${modelName} not available`);
        }

        try {
            let result;
            const modelConfig = this.getModelConfig(modelName, request.type);

            switch (modelName) {
                case 'openai':
                case 'aimlapi':
                    result = await this.processWithOpenAI(provider, request, modelConfig);
                    break;
                case 'anthropic':
                    result = await this.processWithAnthropic(provider, request, modelConfig);
                    break;
                case 'google':
                    result = await this.processWithGoogle(provider, request, modelConfig);
                    break;
                default:
                    throw new Error(`Unsupported model: ${modelName}`);
            }

            const duration = Date.now() - startTime;
            const cost = this.calculateCost(modelName, result.usage);
            
            this.trackCost(cost);

            return {
                model: modelName,
                result: result.content,
                confidence: result.confidence || 0.8,
                duration,
                cost,
                usage: result.usage
            };

        } catch (error) {
            console.error(`❌ Error processing with ${modelName}:`, error);
            throw error;
        }
    }

    async processWithOpenAI(client, request, config) {
        const messages = this.buildMessages(request);
        
        const completion = await client.chat.completions.create({
            model: config.model,
            messages,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
            top_p: config.topP,
            frequency_penalty: config.frequencyPenalty,
            presence_penalty: config.presencePenalty
        });

        return {
            content: completion.choices[0].message.content,
            usage: completion.usage,
            confidence: this.calculateConfidence(completion)
        };
    }

    async processWithAnthropic(client, request, config) {
        const messages = this.buildMessages(request, 'anthropic');
        
        const completion = await client.messages.create({
            model: config.model,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            messages
        });

        return {
            content: completion.content[0].text,
            usage: {
                prompt_tokens: completion.usage.input_tokens,
                completion_tokens: completion.usage.output_tokens,
                total_tokens: completion.usage.input_tokens + completion.usage.output_tokens
            },
            confidence: this.calculateConfidence(completion)
        };
    }

    async processWithGoogle(client, request, config) {
        const model = client.getGenerativeModel({ model: config.model });
        const prompt = this.buildPrompt(request);
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return {
            content: response.text(),
            usage: {
                prompt_tokens: response.usage?.promptTokenCount || 0,
                completion_tokens: response.usage?.candidatesTokenCount || 0,
                total_tokens: response.usage?.totalTokenCount || 0
            },
            confidence: this.calculateConfidence(response)
        };
    }

    selectModelsForTask(taskType) {
        const taskModelMap = {
            'meeting_summary': ['openai', 'anthropic', 'aimlapi'],
            'action_items': ['openai', 'aimlapi'],
            'sentiment_analysis': ['anthropic', 'google', 'aimlapi'],
            'interview_analysis': ['openai', 'anthropic', 'aimlapi'],
            'legal_analysis': ['anthropic', 'openai'],
            'medical_analysis': ['openai', 'anthropic'],
            'financial_analysis': ['openai', 'aimlapi'],
            'transcription_cleanup': ['openai', 'aimlapi'],
            'translation': ['google', 'openai'],
            'code_analysis': ['openai', 'anthropic'],
            'default': ['aimlapi', 'openai']
        };

        const models = taskModelMap[taskType] || taskModelMap.default;
        return models.filter(model => this.models.has(model));
    }

    selectSpecializedModel(taskType) {
        const specializedMap = {
            'legal_analysis': 'anthropic',
            'medical_analysis': 'openai',
            'financial_analysis': 'openai',
            'code_analysis': 'openai',
            'translation': 'google',
            'creative_writing': 'anthropic'
        };

        const model = specializedMap[taskType] || 'aimlapi';
        return this.models.has(model) ? model : 'aimlapi';
    }

    selectOptimalModel(request) {
        const { type, budget, speed } = request;

        // Budget-conscious selection
        if (budget === 'low') {
            return 'aimlapi';
        }

        // Speed-focused selection
        if (speed === 'high') {
            return 'aimlapi';
        }

        // Quality-focused selection
        if (type === 'interview_analysis' || type === 'legal_analysis') {
            return 'anthropic';
        }

        // Default to cost-effective option
        return 'aimlapi';
    }

    getModelConfig(modelName, taskType) {
        const baseConfigs = {
            openai: {
                model: 'gpt-4-turbo-preview',
                temperature: 0.7,
                maxTokens: 2048,
                topP: 0.9,
                frequencyPenalty: 0,
                presencePenalty: 0
            },
            anthropic: {
                model: 'claude-3-sonnet-20240229',
                temperature: 0.7,
                maxTokens: 2048
            },
            google: {
                model: 'gemini-pro',
                temperature: 0.7,
                maxTokens: 2048
            },
            aimlapi: {
                model: 'gpt-4o-mini',
                temperature: 0.7,
                maxTokens: 2048,
                topP: 0.9,
                frequencyPenalty: 0,
                presencePenalty: 0
            }
        };

        const taskAdjustments = {
            'creative_writing': { temperature: 0.9 },
            'code_analysis': { temperature: 0.1 },
            'legal_analysis': { temperature: 0.3 },
            'interview_analysis': { temperature: 0.5, maxTokens: 4096 }
        };

        const config = { ...baseConfigs[modelName] };
        const adjustments = taskAdjustments[taskType];
        
        if (adjustments) {
            Object.assign(config, adjustments);
        }

        return config;
    }

    buildMessages(request, format = 'openai') {
        const { type, content, context, instructions } = request;
        
        const systemPrompt = this.getSystemPrompt(type);
        const userPrompt = this.buildUserPrompt(content, context, instructions);

        if (format === 'anthropic') {
            return [
                { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
            ];
        }

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
    }

    buildPrompt(request) {
        const { type, content, context, instructions } = request;
        const systemPrompt = this.getSystemPrompt(type);
        const userPrompt = this.buildUserPrompt(content, context, instructions);
        
        return `${systemPrompt}\n\n${userPrompt}`;
    }

    getSystemPrompt(taskType) {
        const prompts = {
            'meeting_summary': 'You are an expert meeting analyst. Create comprehensive, actionable summaries that capture key decisions, action items, and next steps.',
            'action_items': 'You are a task management expert. Extract and organize action items with clear ownership, deadlines, and priorities.',
            'sentiment_analysis': 'You are an emotional intelligence expert. Analyze sentiment, engagement levels, and team dynamics with nuanced insights.',
            'interview_analysis': 'You are a hiring expert. Provide detailed candidate assessments including strengths, concerns, cultural fit, and hiring recommendations.',
            'legal_analysis': 'You are a legal expert. Analyze content for legal implications, risks, and compliance requirements with precision.',
            'medical_analysis': 'You are a medical expert. Analyze health-related content with accuracy and appropriate medical terminology.',
            'financial_analysis': 'You are a financial expert. Analyze financial data, trends, and implications with detailed insights.',
            'transcription_cleanup': 'You are a transcription expert. Clean up and improve transcription accuracy while preserving meaning.',
            'translation': 'You are a professional translator. Provide accurate, culturally appropriate translations.',
            'code_analysis': 'You are a senior software engineer. Analyze code for quality, security, performance, and best practices.'
        };

        return prompts[taskType] || 'You are an AI assistant providing helpful, accurate, and professional analysis.';
    }

    buildUserPrompt(content, context, instructions) {
        let prompt = '';

        if (context) {
            prompt += `Context: ${context}\n\n`;
        }

        prompt += `Content to analyze:\n${content}\n\n`;

        if (instructions) {
            prompt += `Specific instructions: ${instructions}\n\n`;
        }

        prompt += 'Please provide a thorough analysis following the guidelines for this task type.';

        return prompt;
    }

    async synthesizeResults(results, strategy) {
        if (results.length === 1) {
            return results[0];
        }

        // Calculate weighted average confidence
        const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
        const avgConfidence = totalConfidence / results.length;

        // Combine costs
        const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

        // Select best result or create synthesis
        const bestResult = results.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
        );

        return {
            ...bestResult,
            confidence: avgConfidence,
            totalCost,
            strategy,
            synthesizedFrom: results.length,
            alternativeResults: results.filter(r => r !== bestResult)
        };
    }

    async buildConsensus(results) {
        // For consensus, we need at least 2 results
        if (results.length < 2) {
            return results[0];
        }

        // Use the highest confidence model to synthesize consensus
        const synthesizer = this.models.get('anthropic') || this.models.get('openai');
        
        const consensusPrompt = {
            type: 'consensus_building',
            content: JSON.stringify(results.map(r => ({
                model: r.model,
                result: r.result,
                confidence: r.confidence
            }))),
            instructions: 'Analyze these AI model results and create a consensus response that incorporates the best insights from each. Highlight areas of agreement and note any significant disagreements.'
        };

        const consensus = await this.processWithModel('anthropic', consensusPrompt);
        
        return {
            result: consensus.result,
            confidence: Math.min(0.95, consensus.confidence + 0.1), // Bonus for consensus
            totalCost: results.reduce((sum, r) => sum + r.cost, 0) + consensus.cost,
            strategy: 'consensus',
            sourceResults: results,
            consensusAnalysis: consensus
        };
    }

    calculateConfidence(response) {
        // Implement confidence calculation based on response characteristics
        let confidence = 0.8; // Base confidence

        // Adjust based on response length (longer responses often more confident)
        if (response.choices?.[0]?.message?.content?.length > 500) {
            confidence += 0.05;
        }

        // Adjust based on finish reason
        if (response.choices?.[0]?.finish_reason === 'stop') {
            confidence += 0.05;
        }

        // Adjust based on usage efficiency
        if (response.usage?.completion_tokens < response.usage?.prompt_tokens) {
            confidence -= 0.05;
        }

        return Math.min(0.99, Math.max(0.1, confidence));
    }

    calculateCost(modelName, usage) {
        const pricing = {
            openai: {
                'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
                'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
            },
            anthropic: {
                'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 }
            },
            google: {
                'gemini-pro': { input: 0.0005, output: 0.0015 }
            },
            aimlapi: {
                'gpt-4o-mini': { input: 0.000075, output: 0.0003 }
            }
        };

        const modelPricing = pricing[modelName]?.['gpt-4o-mini'] || { input: 0.001, output: 0.002 };
        
        const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
        const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;
        
        return inputCost + outputCost;
    }

    trackCost(cost) {
        this.costTracker.daily += cost;
        this.costTracker.monthly += cost;
        this.costTracker.total += cost;

        // Emit cost alerts if needed
        if (this.costTracker.daily > parseFloat(process.env.DAILY_COST_LIMIT || 100)) {
            this.emit('costAlert', {
                type: 'daily',
                current: this.costTracker.daily,
                limit: process.env.DAILY_COST_LIMIT
            });
        }
    }

    updatePerformanceMetrics(duration, success) {
        this.performanceMetrics.totalRequests++;
        
        // Update average response time
        const currentAvg = this.performanceMetrics.averageResponseTime;
        const totalRequests = this.performanceMetrics.totalRequests;
        this.performanceMetrics.averageResponseTime = 
            (currentAvg * (totalRequests - 1) + duration) / totalRequests;

        // Update success rate
        const currentSuccessRate = this.performanceMetrics.successRate;
        const successCount = Math.round(currentSuccessRate * (totalRequests - 1)) + (success ? 1 : 0);
        this.performanceMetrics.successRate = successCount / totalRequests;
    }

    async recordAnalysis(request, result, duration) {
        try {
            await DatabaseService.create('ai_analyses', {
                meeting_id: request.meetingId || null,
                analysis_type: request.type,
                model_used: result.model || 'multi-model',
                input_data: JSON.stringify({
                    type: request.type,
                    contentLength: request.content?.length || 0,
                    strategy: result.strategy
                }),
                output_data: JSON.stringify({
                    result: result.result,
                    confidence: result.confidence,
                    strategy: result.strategy,
                    models_used: result.synthesizedFrom || 1
                }),
                confidence: result.confidence,
                processing_time: duration,
                cost: result.totalCost || result.cost || 0
            });
        } catch (error) {
            console.error('Failed to record analysis:', error);
        }
    }

    generateJobId() {
        return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getStatus() {
        return {
            activeJobs: this.activeJobs.size,
            availableModels: Array.from(this.models.keys()),
            costTracker: this.costTracker,
            performanceMetrics: this.performanceMetrics
        };
    }
}

module.exports = new AIOrchestrationService();
