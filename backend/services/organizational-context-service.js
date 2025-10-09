class OrganizationalContextService {
  constructor() {
    this.orgHierarchy = new Map();
    this.projects = new Map();
    this.customerRelationships = new Map();
    this.policies = new Map();
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  async initialize(config) {
    this.config = config;
    
    // Initialize with sample organizational data
    await this.loadOrganizationalHierarchy();
    await this.loadProjects();
    await this.loadCustomerRelationships();
    await this.loadPolicies();
    
    console.log('Organizational Context Service initialized');
  }

  async loadOrganizationalHierarchy() {
    // Sample organizational hierarchy - in production, this would come from HR systems
    const sampleHierarchy = [
      {
        id: 'ceo-001',
        name: 'Sarah Johnson',
        title: 'CEO',
        department: 'Executive',
        reportsTo: null,
        directReports: ['cto-001', 'cfo-001', 'cmo-001'],
        level: 1
      },
      {
        id: 'cto-001',
        name: 'Michael Chen',
        title: 'CTO',
        department: 'Technology',
        reportsTo: 'ceo-001',
        directReports: ['eng-001', 'eng-002'],
        level: 2
      },
      {
        id: 'cfo-001',
        name: 'Emily Rodriguez',
        title: 'CFO',
        department: 'Finance',
        reportsTo: 'ceo-001',
        directReports: ['fin-001', 'fin-002'],
        level: 2
      },
      {
        id: 'eng-001',
        name: 'David Kim',
        title: 'VP Engineering',
        department: 'Technology',
        reportsTo: 'cto-001',
        directReports: ['dev-001', 'dev-002'],
        level: 3
      }
    ];

    sampleHierarchy.forEach(person => {
      this.orgHierarchy.set(person.id, person);
    });
  }

  async loadProjects() {
    // Sample project data - in production, this would come from project management systems
    const sampleProjects = [
      {
        id: 'proj-001',
        name: 'AI Platform Enhancement',
        status: 'active',
        priority: 'high',
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        owner: 'eng-001',
        team: ['dev-001', 'dev-002', 'cto-001'],
        budget: 500000,
        milestones: [
          { name: 'Phase 1 Complete', date: '2024-03-15', status: 'completed' },
          { name: 'Phase 2 Complete', date: '2024-05-15', status: 'in-progress' },
          { name: 'Final Deployment', date: '2024-06-30', status: 'planned' }
        ]
      },
      {
        id: 'proj-002',
        name: 'Customer Onboarding Optimization',
        status: 'active',
        priority: 'medium',
        startDate: '2024-02-01',
        endDate: '2024-08-31',
        owner: 'cmo-001',
        team: ['sales-001', 'cs-001'],
        budget: 200000,
        milestones: [
          { name: 'Requirements Gathering', date: '2024-03-01', status: 'completed' },
          { name: 'Prototype Development', date: '2024-05-01', status: 'in-progress' }
        ]
      }
    ];

    sampleProjects.forEach(project => {
      this.projects.set(project.id, project);
    });
  }

  async loadCustomerRelationships() {
    // Sample customer relationship data - in production, this would come from CRM
    const sampleRelationships = [
      {
        customerId: 'cust-001',
        customerName: 'TechCorp Industries',
        relationship: 'enterprise_client',
        accountManager: 'sales-001',
        lastInteraction: '2024-10-01',
        interactionHistory: [
          { date: '2024-10-01', type: 'demo', outcome: 'positive', participants: ['sales-001', 'eng-001'] },
          { date: '2024-09-15', type: 'discovery', outcome: 'qualified', participants: ['sales-001'] },
          { date: '2024-09-01', type: 'initial_contact', outcome: 'interested', participants: ['sales-001'] }
        ],
        dealValue: 150000,
        stage: 'negotiation',
        nextSteps: ['Contract review', 'Technical integration planning']
      },
      {
        customerId: 'cust-002',
        customerName: 'InnovateCo',
        relationship: 'prospect',
        accountManager: 'sales-002',
        lastInteraction: '2024-09-28',
        interactionHistory: [
          { date: '2024-09-28', type: 'demo', outcome: 'neutral', participants: ['sales-002', 'cto-001'] },
          { date: '2024-09-20', type: 'discovery', outcome: 'qualified', participants: ['sales-002'] }
        ],
        dealValue: 75000,
        stage: 'evaluation',
        nextSteps: ['Technical deep dive', 'ROI analysis']
      }
    ];

    sampleRelationships.forEach(relationship => {
      this.customerRelationships.set(relationship.customerId, relationship);
    });
  }

  async loadPolicies() {
    // Sample company policies - in production, this would come from policy management systems
    const samplePolicies = [
      {
        id: 'pol-001',
        title: 'Data Privacy Policy',
        category: 'security',
        content: 'All customer data must be handled according to GDPR and CCPA requirements...',
        lastUpdated: '2024-08-15',
        applicableTo: ['all'],
        keyPoints: [
          'No customer data in external tools without approval',
          'Data retention limits apply',
          'Encryption required for all data transmission'
        ]
      },
      {
        id: 'pol-002',
        title: 'Sales Discount Authorization',
        category: 'sales',
        content: 'Discount authorization levels and approval processes...',
        lastUpdated: '2024-09-01',
        applicableTo: ['sales', 'management'],
        keyPoints: [
          'Up to 10% discount: Sales rep approval',
          '10-20% discount: Sales manager approval',
          'Above 20%: VP approval required'
        ]
      }
    ];

    samplePolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  async getPersonContext(personId) {
    const person = this.orgHierarchy.get(personId);
    if (!person) return null;

    return {
      ...person,
      manager: person.reportsTo ? this.orgHierarchy.get(person.reportsTo) : null,
      team: person.directReports.map(id => this.orgHierarchy.get(id)).filter(Boolean),
      projects: this.getPersonProjects(personId)
    };
  }

  getPersonProjects(personId) {
    const projects = [];
    for (const [id, project] of this.projects) {
      if (project.owner === personId || project.team.includes(personId)) {
        projects.push(project);
      }
    }
    return projects;
  }

  async getMeetingContext(participants, agenda = []) {
    const context = {
      participants: [],
      sharedProjects: [],
      relevantPolicies: [],
      customerContext: null,
      hierarchyDynamics: null
    };

    // Get participant context
    for (const participantId of participants) {
      const personContext = await this.getPersonContext(participantId);
      if (personContext) {
        context.participants.push(personContext);
      }
    }

    // Find shared projects
    context.sharedProjects = this.findSharedProjects(participants);

    // Get relevant policies
    context.relevantPolicies = this.getRelevantPolicies(agenda, context.participants);

    // Check for customer context
    context.customerContext = this.getCustomerContext(agenda, participants);

    // Analyze hierarchy dynamics
    context.hierarchyDynamics = this.analyzeHierarchyDynamics(context.participants);

    return context;
  }

  findSharedProjects(participants) {
    const sharedProjects = [];
    
    for (const [id, project] of this.projects) {
      const involvedParticipants = participants.filter(p => 
        project.owner === p || project.team.includes(p)
      );
      
      if (involvedParticipants.length >= 2) {
        sharedProjects.push({
          ...project,
          involvedParticipants
        });
      }
    }
    
    return sharedProjects;
  }

  getRelevantPolicies(agenda, participants) {
    const relevantPolicies = [];
    
    for (const [id, policy] of this.policies) {
      // Check if policy applies to participants
      const appliesToParticipants = policy.applicableTo.includes('all') || 
        participants.some(p => policy.applicableTo.includes(p.department?.toLowerCase()));
      
      // Check if agenda items relate to policy
      const relatedToAgenda = agenda.some(item => 
        policy.content.toLowerCase().includes(item.toLowerCase()) ||
        item.toLowerCase().includes(policy.category)
      );
      
      if (appliesToParticipants && (relatedToAgenda || policy.category === 'general')) {
        relevantPolicies.push(policy);
      }
    }
    
    return relevantPolicies;
  }

  getCustomerContext(agenda, participants) {
    // Look for customer mentions in agenda
    for (const [customerId, relationship] of this.customerRelationships) {
      const customerMentioned = agenda.some(item => 
        item.toLowerCase().includes(relationship.customerName.toLowerCase())
      );
      
      const accountManagerPresent = participants.includes(relationship.accountManager);
      
      if (customerMentioned || accountManagerPresent) {
        return relationship;
      }
    }
    
    return null;
  }

  analyzeHierarchyDynamics(participants) {
    if (participants.length < 2) return null;

    const levels = participants.map(p => p.level).sort((a, b) => a - b);
    const levelSpread = levels[levels.length - 1] - levels[0];
    
    const dynamics = {
      levelSpread,
      seniorMostLevel: levels[0],
      juniorMostLevel: levels[levels.length - 1],
      crossFunctional: new Set(participants.map(p => p.department)).size > 1,
      recommendations: []
    };

    // Generate recommendations based on hierarchy
    if (levelSpread > 2) {
      dynamics.recommendations.push('Large hierarchy span - ensure junior members feel comfortable contributing');
    }
    
    if (dynamics.crossFunctional) {
      dynamics.recommendations.push('Cross-functional meeting - focus on clear communication and alignment');
    }
    
    if (dynamics.seniorMostLevel === 1) {
      dynamics.recommendations.push('Executive present - prepare for strategic-level discussion');
    }

    return dynamics;
  }

  async getProjectContext(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return null;

    return {
      ...project,
      teamMembers: project.team.map(id => this.orgHierarchy.get(id)).filter(Boolean),
      owner: this.orgHierarchy.get(project.owner),
      upcomingMilestones: project.milestones.filter(m => m.status === 'planned'),
      currentMilestone: project.milestones.find(m => m.status === 'in-progress')
    };
  }

  async getCustomerHistory(customerId) {
    return this.customerRelationships.get(customerId) || null;
  }

  async searchPolicies(query) {
    const results = [];
    
    for (const [id, policy] of this.policies) {
      if (policy.title.toLowerCase().includes(query.toLowerCase()) ||
          policy.content.toLowerCase().includes(query.toLowerCase()) ||
          policy.category.toLowerCase().includes(query.toLowerCase())) {
        results.push(policy);
      }
    }
    
    return results;
  }

  // Helper method to prepare comprehensive meeting context
  async prepareMeetingContext(meetingData) {
    const { participants = [], agenda = [], projectId = null, customerId = null } = meetingData;
    
    const context = await this.getMeetingContext(participants, agenda);
    
    if (projectId) {
      context.projectContext = await this.getProjectContext(projectId);
    }
    
    if (customerId) {
      context.customerHistory = await this.getCustomerHistory(customerId);
    }
    
    return context;
  }
}

module.exports = OrganizationalContextService;
