const KnowledgeIntegrationService = require('./knowledge-integration-service');
const OrganizationalContextService = require('./organizational-context-service');
const TemplateManagementService = require('./template-management-service');

class EnhancedMeetingPreparationService {
  constructor() {
    this.knowledgeService = new KnowledgeIntegrationService();
    this.orgContextService = new OrganizationalContextService();
    this.templateService = new TemplateManagementService();
    this.preparationCache = new Map();
  }

  async initialize(config) {
    await this.knowledgeService.initialize(config.knowledge || {});
    await this.orgContextService.initialize(config.organizational || {});
    await this.templateService.initialize();
    
    console.log('Enhanced Meeting Preparation Service initialized');
  }

  async prepareMeeting(meetingData, userId) {
    const {
      participants = [],
      agenda = [],
      meetingType = 'general',
      industry = 'general',
      projectId = null,
      customerId = null,
      templateId = null,
      duration = 60
    } = meetingData;

    console.log(`Preparing meeting: ${meetingType} for ${participants.length} participants`);

    const preparation = {
      meetingId: `meeting_${Date.now()}`,
      timestamp: new Date().toISOString(),
      meetingData,
      userId
    };

    try {
      // 1. Get organizational context
      console.log('Getting organizational context...');
      preparation.organizationalContext = await this.orgContextService.prepareMeetingContext({
        participants,
        agenda,
        projectId,
        customerId
      });

      // 2. Get knowledge context
      console.log('Preparing knowledge context...');
      preparation.knowledgeContext = await this.knowledgeService.prepareMeetingKnowledge({
        meetingType,
        industry,
        participants: preparation.organizationalContext.participants,
        agenda,
        customerContext: preparation.organizationalContext.customerContext
      });

      // 3. Select or get template
      console.log('Selecting template...');
      if (templateId) {
        preparation.template = await this.templateService.getTemplate(templateId);
      } else {
        const suggestedTemplates = await this.templateService.getTemplatesByType(meetingType, industry);
        preparation.template = suggestedTemplates[0] || null;
        preparation.suggestedTemplates = suggestedTemplates.slice(1, 4); // Additional suggestions
      }

      // 4. Generate contextual insights
      console.log('Generating contextual insights...');
      preparation.insights = await this.generateContextualInsights(preparation);

      // 5. Create meeting briefing
      console.log('Creating meeting briefing...');
      preparation.briefing = await this.createMeetingBriefing(preparation);

      // 6. Prepare AI prompts
      console.log('Preparing AI prompts...');
      preparation.aiPrompts = await this.prepareAIPrompts(preparation);

      // 7. Generate recommendations
      console.log('Generating recommendations...');
      preparation.recommendations = await this.generateRecommendations(preparation);

      // Cache the preparation
      this.preparationCache.set(preparation.meetingId, preparation);

      console.log('Meeting preparation completed successfully');
      return preparation;

    } catch (error) {
      console.error('Meeting preparation failed:', error.message);
      throw new Error(`Meeting preparation failed: ${error.message}`);
    }
  }

  async generateContextualInsights(preparation) {
    const insights = {
      participantDynamics: [],
      projectRelevance: [],
      customerInsights: [],
      policyAlerts: [],
      knowledgeGaps: []
    };

    const { organizationalContext, knowledgeContext } = preparation;

    // Participant dynamics insights
    if (organizationalContext.hierarchyDynamics) {
      const dynamics = organizationalContext.hierarchyDynamics;
      
      if (dynamics.levelSpread > 2) {
        insights.participantDynamics.push({
          type: 'hierarchy_span',
          message: 'Large hierarchy span detected - ensure all voices are heard',
          priority: 'medium'
        });
      }

      if (dynamics.crossFunctional) {
        insights.participantDynamics.push({
          type: 'cross_functional',
          message: 'Cross-functional team - focus on alignment and clear communication',
          priority: 'high'
        });
      }

      if (dynamics.seniorMostLevel === 1) {
        insights.participantDynamics.push({
          type: 'executive_present',
          message: 'Executive leadership present - prepare for strategic-level discussion',
          priority: 'high'
        });
      }
    }

    // Project relevance insights
    if (organizationalContext.sharedProjects && organizationalContext.sharedProjects.length > 0) {
      organizationalContext.sharedProjects.forEach(project => {
        insights.projectRelevance.push({
          type: 'shared_project',
          message: `Shared project: ${project.name} (${project.status})`,
          details: project,
          priority: project.priority
        });
      });
    }

    // Customer insights
    if (organizationalContext.customerContext) {
      const customer = organizationalContext.customerContext;
      insights.customerInsights.push({
        type: 'customer_stage',
        message: `Customer ${customer.customerName} is in ${customer.stage} stage`,
        details: customer,
        priority: 'high'
      });

      if (customer.nextSteps && customer.nextSteps.length > 0) {
        insights.customerInsights.push({
          type: 'next_steps',
          message: `Pending next steps: ${customer.nextSteps.join(', ')}`,
          priority: 'medium'
        });
      }
    }

    // Policy alerts
    if (organizationalContext.relevantPolicies && organizationalContext.relevantPolicies.length > 0) {
      organizationalContext.relevantPolicies.forEach(policy => {
        insights.policyAlerts.push({
          type: 'policy_reminder',
          message: `Relevant policy: ${policy.title}`,
          details: policy.keyPoints,
          priority: 'medium'
        });
      });
    }

    // Knowledge gaps
    if (knowledgeContext.proactiveKnowledge && knowledgeContext.proactiveKnowledge.length === 0) {
      insights.knowledgeGaps.push({
        type: 'limited_knowledge',
        message: 'Limited relevant knowledge found - consider additional research',
        priority: 'low'
      });
    }

    return insights;
  }

  async createMeetingBriefing(preparation) {
    const { meetingData, organizationalContext, knowledgeContext, insights } = preparation;

    const briefing = {
      summary: '',
      keyParticipants: [],
      objectives: [],
      potentialChallenges: [],
      successFactors: [],
      preparationItems: []
    };

    // Generate summary
    briefing.summary = `${meetingData.meetingType} meeting with ${meetingData.participants.length} participants. `;
    
    if (organizationalContext.customerContext) {
      briefing.summary += `Customer: ${organizationalContext.customerContext.customerName} (${organizationalContext.customerContext.stage} stage). `;
    }

    if (organizationalContext.sharedProjects.length > 0) {
      briefing.summary += `Related projects: ${organizationalContext.sharedProjects.map(p => p.name).join(', ')}. `;
    }

    // Key participants
    briefing.keyParticipants = organizationalContext.participants.map(p => ({
      name: p.name,
      title: p.title,
      department: p.department,
      role: this.determineParticipantRole(p, organizationalContext),
      projects: p.projects.map(proj => proj.name)
    }));

    // Objectives based on meeting type and context
    briefing.objectives = this.generateMeetingObjectives(preparation);

    // Potential challenges
    briefing.potentialChallenges = this.identifyPotentialChallenges(preparation);

    // Success factors
    briefing.successFactors = this.identifySuccessFactors(preparation);

    // Preparation items
    briefing.preparationItems = this.generatePreparationItems(preparation);

    return briefing;
  }

  determineParticipantRole(participant, context) {
    if (participant.level === 1) return 'Decision Maker';
    if (participant.level === 2) return 'Key Stakeholder';
    if (context.customerContext && context.customerContext.accountManager === participant.id) {
      return 'Account Manager';
    }
    if (participant.projects && participant.projects.length > 0) {
      return 'Project Contributor';
    }
    return 'Participant';
  }

  generateMeetingObjectives(preparation) {
    const { meetingData, organizationalContext } = preparation;
    const objectives = [];

    switch (meetingData.meetingType) {
      case 'sales':
        objectives.push('Understand customer needs and pain points');
        objectives.push('Present relevant solutions and value propositions');
        objectives.push('Identify decision-making process and timeline');
        if (organizationalContext.customerContext) {
          objectives.push(`Advance ${organizationalContext.customerContext.customerName} to next stage`);
        }
        break;

      case 'strategy':
        objectives.push('Align on strategic priorities and goals');
        objectives.push('Identify opportunities and threats');
        objectives.push('Define action plans and accountability');
        break;

      case 'review':
        objectives.push('Assess current performance and progress');
        objectives.push('Identify improvement opportunities');
        objectives.push('Set goals and expectations for next period');
        break;

      default:
        objectives.push('Achieve meeting agenda items');
        objectives.push('Ensure clear communication and alignment');
        objectives.push('Define next steps and accountability');
    }

    return objectives;
  }

  identifyPotentialChallenges(preparation) {
    const challenges = [];
    const { insights, organizationalContext } = preparation;

    // Based on insights
    insights.participantDynamics.forEach(insight => {
      if (insight.type === 'hierarchy_span') {
        challenges.push('Managing participation across hierarchy levels');
      }
      if (insight.type === 'cross_functional') {
        challenges.push('Aligning different departmental perspectives');
      }
    });

    // Based on customer context
    if (organizationalContext.customerContext) {
      const customer = organizationalContext.customerContext;
      if (customer.stage === 'negotiation') {
        challenges.push('Navigating pricing and contract discussions');
      }
      if (customer.interactionHistory.some(h => h.outcome === 'neutral')) {
        challenges.push('Overcoming previous neutral interactions');
      }
    }

    // Based on project context
    if (organizationalContext.sharedProjects.some(p => p.status === 'at-risk')) {
      challenges.push('Addressing project risks and delays');
    }

    return challenges;
  }

  identifySuccessFactors(preparation) {
    const factors = [];
    const { meetingData, organizationalContext, template } = preparation;

    // Template-based factors
    if (template) {
      factors.push(`Follow ${template.name} framework for optimal results`);
    }

    // Context-based factors
    if (organizationalContext.hierarchyDynamics?.crossFunctional) {
      factors.push('Ensure all departments contribute their perspectives');
    }

    if (organizationalContext.customerContext) {
      factors.push('Focus on customer-specific value propositions');
    }

    // General factors
    factors.push('Maintain clear agenda and time management');
    factors.push('Document decisions and action items');
    factors.push('Ensure follow-up commitments are specific and measurable');

    return factors;
  }

  generatePreparationItems(preparation) {
    const items = [];
    const { knowledgeContext, organizationalContext, insights } = preparation;

    // Knowledge preparation
    if (knowledgeContext.proactiveKnowledge.length > 0) {
      items.push({
        category: 'Knowledge',
        item: 'Review proactive knowledge suggestions',
        priority: 'high'
      });
    }

    // Customer preparation
    if (organizationalContext.customerContext) {
      items.push({
        category: 'Customer',
        item: `Review ${organizationalContext.customerContext.customerName} interaction history`,
        priority: 'high'
      });
    }

    // Project preparation
    if (organizationalContext.sharedProjects.length > 0) {
      items.push({
        category: 'Projects',
        item: 'Review current project status and milestones',
        priority: 'medium'
      });
    }

    // Policy preparation
    if (organizationalContext.relevantPolicies.length > 0) {
      items.push({
        category: 'Compliance',
        item: 'Review relevant company policies',
        priority: 'medium'
      });
    }

    return items;
  }

  async prepareAIPrompts(preparation) {
    const { template, organizationalContext, knowledgeContext } = preparation;
    
    if (!template) {
      return {
        analysis: 'Provide comprehensive meeting analysis',
        coaching: 'Offer real-time coaching and guidance',
        followUp: 'Generate professional follow-up communication'
      };
    }

    const prompts = { ...template.prompts };
    
    // Replace variables with actual context
    const variables = this.extractContextVariables(preparation);
    
    Object.keys(prompts).forEach(key => {
      let prompt = prompts[key];
      
      // Replace template variables
      template.variables.forEach(variable => {
        const value = variables[variable.name] || `[${variable.name}]`;
        prompt = prompt.replace(new RegExp(`{{${variable.name}}}`, 'g'), value);
      });
      
      prompts[key] = prompt;
    });

    return prompts;
  }

  extractContextVariables(preparation) {
    const variables = {};
    const { organizationalContext, meetingData } = preparation;

    // Customer variables
    if (organizationalContext.customerContext) {
      variables.customer_name = organizationalContext.customerContext.customerName;
      variables.customer_industry = organizationalContext.customerContext.industry || 'Unknown';
      variables.deal_size = organizationalContext.customerContext.dealValue || 0;
    }

    // Project variables
    if (organizationalContext.sharedProjects.length > 0) {
      const project = organizationalContext.sharedProjects[0];
      variables.project_name = project.name;
      variables.project_status = project.status;
    }

    // Meeting variables
    variables.meeting_type = meetingData.meetingType;
    variables.participant_count = meetingData.participants.length;

    return variables;
  }

  async generateRecommendations(preparation) {
    const recommendations = {
      beforeMeeting: [],
      duringMeeting: [],
      afterMeeting: []
    };

    const { insights, briefing, organizationalContext } = preparation;

    // Before meeting recommendations
    recommendations.beforeMeeting.push('Review meeting briefing and preparation items');
    recommendations.beforeMeeting.push('Test technology and meeting setup');
    
    if (organizationalContext.customerContext) {
      recommendations.beforeMeeting.push('Prepare customer-specific talking points');
    }

    // During meeting recommendations
    recommendations.duringMeeting.push('Follow agenda and manage time effectively');
    recommendations.duringMeeting.push('Encourage participation from all attendees');
    
    if (insights.participantDynamics.some(d => d.type === 'executive_present')) {
      recommendations.duringMeeting.push('Focus on strategic-level discussion points');
    }

    // After meeting recommendations
    recommendations.afterMeeting.push('Send follow-up within 24 hours');
    recommendations.afterMeeting.push('Update CRM and project management systems');
    recommendations.afterMeeting.push('Schedule follow-up meetings as needed');

    return recommendations;
  }

  async getMeetingPreparation(meetingId) {
    return this.preparationCache.get(meetingId) || null;
  }

  async updateMeetingPreparation(meetingId, updates) {
    const preparation = this.preparationCache.get(meetingId);
    if (!preparation) {
      throw new Error('Meeting preparation not found');
    }

    const updatedPreparation = {
      ...preparation,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.preparationCache.set(meetingId, updatedPreparation);
    return updatedPreparation;
  }
}

module.exports = EnhancedMeetingPreparationService;
