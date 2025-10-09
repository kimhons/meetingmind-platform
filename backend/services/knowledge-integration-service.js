const ConnectorManager = require('./connector-manager');

class KnowledgeIntegrationService {
  constructor() {
    this.connectorManager = new ConnectorManager();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async initialize(config) {
    await this.connectorManager.initialize(config);
    console.log('Knowledge Integration Service initialized');
  }

  async searchKnowledge(query, context = {}) {
    const cacheKey = `search:${query}:${JSON.stringify(context)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Search all connected sources
      const results = await this.connectorManager.searchAllSources(query, 20);
      
      // Add context scoring
      const scoredResults = this.scoreResultsWithContext(results, context);
      
      // Cache results
      this.cache.set(cacheKey, {
        data: scoredResults,
        timestamp: Date.now()
      });
      
      return scoredResults;
    } catch (error) {
      console.error('Knowledge search failed:', error.message);
      return [];
    }
  }

  async getProactiveKnowledge(meetingContext) {
    const suggestions = [];
    
    try {
      // Generate search queries based on meeting context
      const queries = this.generateContextualQueries(meetingContext);
      
      // Search for each query
      for (const query of queries) {
        const results = await this.searchKnowledge(query, meetingContext);
        suggestions.push({
          query,
          results: results.slice(0, 3), // Top 3 results per query
          relevance: this.calculateRelevance(query, meetingContext)
        });
      }
      
      // Sort by relevance
      return suggestions
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5); // Top 5 suggestions
        
    } catch (error) {
      console.error('Failed to get proactive knowledge:', error.message);
      return [];
    }
  }

  generateContextualQueries(context) {
    const queries = [];
    
    // Add participant-based queries
    if (context.participants) {
      context.participants.forEach(participant => {
        if (participant.company) {
          queries.push(`${participant.company} background`);
          queries.push(`${participant.company} recent news`);
        }
      });
    }
    
    // Add topic-based queries
    if (context.agenda) {
      context.agenda.forEach(item => {
        queries.push(item);
        queries.push(`${item} best practices`);
      });
    }
    
    // Add meeting type queries
    if (context.meetingType) {
      queries.push(`${context.meetingType} meeting guidelines`);
      queries.push(`${context.meetingType} templates`);
    }
    
    // Add industry queries
    if (context.industry) {
      queries.push(`${context.industry} industry trends`);
      queries.push(`${context.industry} regulations`);
    }
    
    return queries.slice(0, 10); // Limit to 10 queries
  }

  scoreResultsWithContext(results, context) {
    return results.map(result => {
      let contextScore = result.score || 0;
      
      // Boost score based on context relevance
      if (context.meetingType && result.content.toLowerCase().includes(context.meetingType.toLowerCase())) {
        contextScore += 20;
      }
      
      if (context.industry && result.content.toLowerCase().includes(context.industry.toLowerCase())) {
        contextScore += 15;
      }
      
      if (context.participants) {
        context.participants.forEach(participant => {
          if (participant.company && result.content.toLowerCase().includes(participant.company.toLowerCase())) {
            contextScore += 10;
          }
        });
      }
      
      // Boost recent content
      const daysSinceModified = (Date.now() - new Date(result.lastModified)) / (1000 * 60 * 60 * 24);
      if (daysSinceModified < 7) {
        contextScore += 10;
      }
      
      return {
        ...result,
        contextScore
      };
    }).sort((a, b) => (b.contextScore || 0) - (a.contextScore || 0));
  }

  calculateRelevance(query, context) {
    let relevance = 50; // Base relevance
    
    // Higher relevance for meeting type matches
    if (context.meetingType && query.toLowerCase().includes(context.meetingType.toLowerCase())) {
      relevance += 30;
    }
    
    // Higher relevance for industry matches
    if (context.industry && query.toLowerCase().includes(context.industry.toLowerCase())) {
      relevance += 20;
    }
    
    // Higher relevance for participant company matches
    if (context.participants) {
      context.participants.forEach(participant => {
        if (participant.company && query.toLowerCase().includes(participant.company.toLowerCase())) {
          relevance += 25;
        }
      });
    }
    
    return Math.min(relevance, 100);
  }

  async getRecentKnowledge(limit = 10) {
    try {
      return await this.connectorManager.getRecentContent(limit);
    } catch (error) {
      console.error('Failed to get recent knowledge:', error.message);
      return [];
    }
  }

  async getKnowledgeContent(source, contentId) {
    try {
      return await this.connectorManager.getContent(source, contentId);
    } catch (error) {
      console.error('Failed to get knowledge content:', error.message);
      return null;
    }
  }

  getAvailableSources() {
    return this.connectorManager.getAvailableSources();
  }

  async testConnections() {
    return await this.connectorManager.testAllConnections();
  }

  clearCache() {
    this.cache.clear();
  }

  // Simple method to prepare knowledge for a meeting
  async prepareMeetingKnowledge(meetingContext) {
    const preparation = {
      proactiveKnowledge: await this.getProactiveKnowledge(meetingContext),
      recentContent: await this.getRecentKnowledge(5),
      availableSources: this.getAvailableSources(),
      timestamp: new Date().toISOString()
    };
    
    return preparation;
  }
}

module.exports = KnowledgeIntegrationService;
