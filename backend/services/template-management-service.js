class TemplateManagementService {
  constructor() {
    this.templates = new Map();
    this.templateUsage = new Map();
    this.templateRatings = new Map();
    this.userTemplates = new Map(); // userId -> templateIds[]
  }

  async initialize() {
    // Load default templates
    await this.loadDefaultTemplates();
    console.log('Template Management Service initialized');
  }

  async loadDefaultTemplates() {
    const defaultTemplates = [
      {
        id: 'sales_discovery_default',
        name: 'Sales Discovery Call',
        description: 'Uncover customer needs and pain points',
        meetingType: 'sales',
        industry: 'general',
        isDefault: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        prompts: {
          analysis: 'Analyze the conversation for buying signals, decision makers, budget indicators, and pain points. Focus on {{customer_name}} specific needs and how our solution addresses them.',
          coaching: 'Provide guidance on questioning techniques, active listening, and relationship building. Help identify the best approach for {{customer_name}} based on their industry and role.',
          followUp: 'Generate a follow-up email that reinforces value proposition, addresses concerns raised, and proposes clear next steps for {{customer_name}}.'
        },
        variables: [
          { id: 1, name: 'customer_name', description: 'Customer company name', type: 'text' },
          { id: 2, name: 'customer_industry', description: 'Customer industry', type: 'select' },
          { id: 3, name: 'deal_size', description: 'Potential deal value', type: 'number' }
        ],
        tags: ['sales', 'discovery', 'qualification'],
        usage: 0,
        rating: 4.5
      },
      {
        id: 'strategy_planning_default',
        name: 'Strategic Planning Session',
        description: 'Long-term planning and goal setting',
        meetingType: 'strategy',
        industry: 'general',
        isDefault: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        prompts: {
          analysis: 'Analyze strategic opportunities, competitive threats, and market positioning. Focus on {{planning_horizon}} timeframe and {{strategic_focus}} objectives.',
          coaching: 'Guide strategic thinking, decision frameworks, and stakeholder alignment. Ensure discussion stays focused on {{strategic_focus}} priorities.',
          followUp: 'Document strategic decisions, action plans, and accountability measures for {{planning_horizon}} execution.'
        },
        variables: [
          { id: 1, name: 'planning_horizon', description: 'Planning timeframe (e.g., Q1 2024)', type: 'text' },
          { id: 2, name: 'strategic_focus', description: 'Main strategic focus area', type: 'text' },
          { id: 3, name: 'budget_range', description: 'Budget considerations', type: 'number' }
        ],
        tags: ['strategy', 'planning', 'goals'],
        usage: 0,
        rating: 4.3
      },
      {
        id: 'performance_review_default',
        name: 'Performance Review',
        description: 'Employee performance evaluation and development',
        meetingType: 'review',
        industry: 'general',
        isDefault: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        prompts: {
          analysis: 'Track performance metrics, improvement areas, and development opportunities for {{employee_name}}. Focus on {{review_period}} achievements and challenges.',
          coaching: 'Guide constructive feedback delivery, goal setting, and development planning. Ensure balanced discussion of strengths and growth areas.',
          followUp: 'Document performance goals, development plans, and follow-up actions for {{employee_name}} covering the next {{review_period}}.'
        },
        variables: [
          { id: 1, name: 'employee_name', description: 'Employee name', type: 'text' },
          { id: 2, name: 'review_period', description: 'Review period (e.g., Q3 2024)', type: 'text' },
          { id: 3, name: 'performance_rating', description: 'Overall performance rating', type: 'select' }
        ],
        tags: ['review', 'performance', 'development'],
        usage: 0,
        rating: 4.1
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async createTemplate(templateData, userId) {
    const template = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...templateData,
      isDefault: false,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usage: 0,
      rating: 0,
      ratingCount: 0
    };

    // Validate template
    if (!this.validateTemplate(template)) {
      throw new Error('Invalid template data');
    }

    this.templates.set(template.id, template);
    
    // Add to user's templates
    if (!this.userTemplates.has(userId)) {
      this.userTemplates.set(userId, []);
    }
    this.userTemplates.get(userId).push(template.id);

    return template;
  }

  async updateTemplate(templateId, updates, userId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Check permissions
    if (template.createdBy !== userId && !template.isDefault) {
      throw new Error('Permission denied');
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (!this.validateTemplate(updatedTemplate)) {
      throw new Error('Invalid template data');
    }

    this.templates.set(templateId, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(templateId, userId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Can't delete default templates
    if (template.isDefault) {
      throw new Error('Cannot delete default template');
    }

    // Check permissions
    if (template.createdBy !== userId) {
      throw new Error('Permission denied');
    }

    this.templates.delete(templateId);
    
    // Remove from user's templates
    const userTemplateList = this.userTemplates.get(userId) || [];
    const updatedList = userTemplateList.filter(id => id !== templateId);
    this.userTemplates.set(userId, updatedList);

    return true;
  }

  async getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  async getUserTemplates(userId) {
    const userTemplateIds = this.userTemplates.get(userId) || [];
    const userTemplates = userTemplateIds.map(id => this.templates.get(id)).filter(Boolean);
    
    // Also include default templates
    const defaultTemplates = Array.from(this.templates.values()).filter(t => t.isDefault);
    
    return [...defaultTemplates, ...userTemplates];
  }

  async searchTemplates(query, filters = {}) {
    const results = [];
    
    for (const [id, template] of this.templates) {
      let matches = true;

      // Text search
      if (query) {
        const searchText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
        if (!searchText.includes(query.toLowerCase())) {
          matches = false;
        }
      }

      // Filter by meeting type
      if (filters.meetingType && template.meetingType !== filters.meetingType) {
        matches = false;
      }

      // Filter by industry
      if (filters.industry && template.industry !== filters.industry && template.industry !== 'general') {
        matches = false;
      }

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => template.tags.includes(tag));
        if (!hasMatchingTag) {
          matches = false;
        }
      }

      // Filter by creator
      if (filters.createdBy && template.createdBy !== filters.createdBy) {
        matches = false;
      }

      if (matches) {
        results.push(template);
      }
    }

    // Sort by usage and rating
    return results.sort((a, b) => {
      const scoreA = (a.usage * 0.3) + (a.rating * 0.7);
      const scoreB = (b.usage * 0.3) + (b.rating * 0.7);
      return scoreB - scoreA;
    });
  }

  async getTemplatesByType(meetingType, industry = 'general') {
    return this.searchTemplates('', { meetingType, industry });
  }

  async recordTemplateUsage(templateId, userId, meetingData = {}) {
    const template = this.templates.get(templateId);
    if (!template) return;

    // Increment usage count
    template.usage = (template.usage || 0) + 1;
    this.templates.set(templateId, template);

    // Record usage details
    const usageKey = `${templateId}_${userId}_${Date.now()}`;
    this.templateUsage.set(usageKey, {
      templateId,
      userId,
      timestamp: new Date().toISOString(),
      meetingData
    });
  }

  async rateTemplate(templateId, userId, rating, feedback = '') {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Store individual rating
    const ratingKey = `${templateId}_${userId}`;
    this.templateRatings.set(ratingKey, {
      templateId,
      userId,
      rating,
      feedback,
      timestamp: new Date().toISOString()
    });

    // Update template average rating
    this.updateTemplateRating(templateId);

    return true;
  }

  updateTemplateRating(templateId) {
    const template = this.templates.get(templateId);
    if (!template) return;

    const ratings = [];
    for (const [key, ratingData] of this.templateRatings) {
      if (ratingData.templateId === templateId) {
        ratings.push(ratingData.rating);
      }
    }

    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      template.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
      template.ratingCount = ratings.length;
      this.templates.set(templateId, template);
    }
  }

  async getTemplateAnalytics(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const usage = [];
    const ratings = [];

    for (const [key, usageData] of this.templateUsage) {
      if (usageData.templateId === templateId) {
        usage.push(usageData);
      }
    }

    for (const [key, ratingData] of this.templateRatings) {
      if (ratingData.templateId === templateId) {
        ratings.push(ratingData);
      }
    }

    return {
      template,
      totalUsage: usage.length,
      averageRating: template.rating,
      ratingCount: template.ratingCount,
      recentUsage: usage.slice(-10), // Last 10 uses
      recentRatings: ratings.slice(-10) // Last 10 ratings
    };
  }

  validateTemplate(template) {
    // Basic validation
    if (!template.name || !template.description) {
      return false;
    }

    if (!template.prompts || !template.prompts.analysis || !template.prompts.coaching || !template.prompts.followUp) {
      return false;
    }

    if (!Array.isArray(template.variables)) {
      return false;
    }

    if (!Array.isArray(template.tags)) {
      return false;
    }

    return true;
  }

  async duplicateTemplate(templateId, userId, newName = null) {
    const originalTemplate = this.templates.get(templateId);
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    const duplicatedTemplate = {
      ...originalTemplate,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newName || `${originalTemplate.name} (Copy)`,
      isDefault: false,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usage: 0,
      rating: 0,
      ratingCount: 0
    };

    this.templates.set(duplicatedTemplate.id, duplicatedTemplate);
    
    // Add to user's templates
    if (!this.userTemplates.has(userId)) {
      this.userTemplates.set(userId, []);
    }
    this.userTemplates.get(userId).push(duplicatedTemplate.id);

    return duplicatedTemplate;
  }

  async getPopularTemplates(limit = 10) {
    const templates = Array.from(this.templates.values());
    return templates
      .sort((a, b) => (b.usage || 0) - (a.usage || 0))
      .slice(0, limit);
  }

  async getTopRatedTemplates(limit = 10) {
    const templates = Array.from(this.templates.values());
    return templates
      .filter(t => t.ratingCount > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
}

module.exports = TemplateManagementService;
