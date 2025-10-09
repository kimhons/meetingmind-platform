class JobInterviewIntelligenceService {
  constructor() {
    this.interviewTypes = new Map();
    this.companyProfiles = new Map();
    this.questionDatabase = new Map();
    this.interviewerProfiles = new Map();
    this.candidateProfiles = new Map();
    this.practiceHistory = new Map();
  }

  async initialize() {
    await this.loadInterviewTypes();
    await this.loadCompanyProfiles();
    await this.loadQuestionDatabase();
    await this.loadInterviewerProfiles();
    console.log('Job Interview Intelligence Service initialized');
  }

  async loadInterviewTypes() {
    const interviewTypes = [
      {
        id: 'technical',
        name: 'Technical Interview',
        description: 'Coding, system design, and technical problem solving',
        duration: 60,
        focusAreas: ['coding', 'algorithms', 'system_design', 'technical_knowledge'],
        commonQuestions: ['coding_challenges', 'system_architecture', 'debugging'],
        evaluationCriteria: ['technical_skills', 'problem_solving', 'communication', 'code_quality']
      },
      {
        id: 'behavioral',
        name: 'Behavioral Interview',
        description: 'Past experiences, soft skills, and cultural fit',
        duration: 45,
        focusAreas: ['leadership', 'teamwork', 'conflict_resolution', 'adaptability'],
        commonQuestions: ['star_method', 'leadership_examples', 'failure_stories'],
        evaluationCriteria: ['communication', 'cultural_fit', 'leadership_potential', 'self_awareness']
      },
      {
        id: 'case_study',
        name: 'Case Study Interview',
        description: 'Business problem solving and analytical thinking',
        duration: 90,
        focusAreas: ['analytical_thinking', 'business_acumen', 'presentation_skills'],
        commonQuestions: ['market_sizing', 'profitability_analysis', 'strategic_recommendations'],
        evaluationCriteria: ['analytical_skills', 'business_judgment', 'communication', 'creativity']
      },
      {
        id: 'panel',
        name: 'Panel Interview',
        description: 'Multiple interviewers assessing various competencies',
        duration: 75,
        focusAreas: ['multi_stakeholder_communication', 'pressure_handling', 'versatility'],
        commonQuestions: ['role_specific', 'cross_functional_scenarios', 'leadership_situations'],
        evaluationCriteria: ['communication', 'confidence', 'adaptability', 'stakeholder_management']
      },
      {
        id: 'executive',
        name: 'Executive Interview',
        description: 'Senior leadership assessment and strategic thinking',
        duration: 60,
        focusAreas: ['strategic_vision', 'leadership_philosophy', 'industry_knowledge'],
        commonQuestions: ['vision_setting', 'change_management', 'stakeholder_influence'],
        evaluationCriteria: ['strategic_thinking', 'leadership_presence', 'industry_expertise', 'cultural_impact']
      }
    ];

    interviewTypes.forEach(type => {
      this.interviewTypes.set(type.id, type);
    });
  }

  async loadCompanyProfiles() {
    const companies = [
      {
        id: 'google',
        name: 'Google',
        industry: 'technology',
        size: 'large',
        culture: ['innovation', 'data_driven', 'collaborative', 'ambitious'],
        interviewProcess: {
          stages: ['phone_screen', 'technical_rounds', 'behavioral', 'team_match'],
          duration: '4-6 weeks',
          difficulty: 'high'
        },
        commonQuestions: [
          'Why Google?',
          'Describe a challenging technical problem you solved',
          'How do you handle ambiguity?',
          'Design a system for [specific use case]'
        ],
        values: ['Focus on the user', 'Think big', 'Be bold', 'Do the right thing'],
        interviewTips: [
          'Prepare for system design questions',
          'Practice coding on whiteboard',
          'Research Google products deeply',
          'Demonstrate growth mindset'
        ]
      },
      {
        id: 'amazon',
        name: 'Amazon',
        industry: 'technology',
        size: 'large',
        culture: ['customer_obsession', 'ownership', 'high_standards', 'bias_for_action'],
        interviewProcess: {
          stages: ['phone_screen', 'virtual_onsite', 'behavioral_deep_dive'],
          duration: '3-5 weeks',
          difficulty: 'high'
        },
        commonQuestions: [
          'Tell me about a time you failed',
          'Describe a situation where you had to work with limited resources',
          'How do you prioritize competing demands?',
          'Give an example of when you took ownership'
        ],
        values: ['Customer Obsession', 'Ownership', 'Invent and Simplify', 'Learn and Be Curious'],
        interviewTips: [
          'Master the STAR method',
          'Prepare stories for each leadership principle',
          'Focus on customer impact',
          'Show data-driven decision making'
        ]
      },
      {
        id: 'startup',
        name: 'Early Stage Startup',
        industry: 'various',
        size: 'small',
        culture: ['agility', 'ownership', 'resourcefulness', 'growth_mindset'],
        interviewProcess: {
          stages: ['founder_chat', 'technical_assessment', 'team_fit'],
          duration: '1-3 weeks',
          difficulty: 'medium'
        },
        commonQuestions: [
          'Why do you want to join a startup?',
          'How do you handle uncertainty?',
          'Describe a time you wore multiple hats',
          'What would you do in your first 90 days?'
        ],
        values: ['Move fast', 'Think big', 'Be scrappy', 'Customer first'],
        interviewTips: [
          'Show entrepreneurial mindset',
          'Demonstrate versatility',
          'Research the market and competition',
          'Ask about growth opportunities'
        ]
      }
    ];

    companies.forEach(company => {
      this.companyProfiles.set(company.id, company);
    });
  }

  async loadQuestionDatabase() {
    const questions = [
      // Technical Questions
      {
        id: 'tech_001',
        category: 'technical',
        subcategory: 'coding',
        question: 'Implement a function to reverse a linked list',
        difficulty: 'medium',
        expectedAnswer: 'Iterative or recursive approach with O(n) time complexity',
        followUps: ['What if the list is very large?', 'How would you test this?'],
        companies: ['google', 'amazon', 'microsoft']
      },
      {
        id: 'tech_002',
        category: 'technical',
        subcategory: 'system_design',
        question: 'Design a URL shortening service like bit.ly',
        difficulty: 'hard',
        expectedAnswer: 'Database design, caching, load balancing, analytics',
        followUps: ['How would you handle 1 billion URLs?', 'What about analytics?'],
        companies: ['google', 'amazon', 'uber']
      },
      
      // Behavioral Questions
      {
        id: 'behav_001',
        category: 'behavioral',
        subcategory: 'leadership',
        question: 'Tell me about a time you had to lead a team through a difficult situation',
        difficulty: 'medium',
        expectedAnswer: 'STAR method with clear leadership actions and outcomes',
        followUps: ['What would you do differently?', 'How did team members respond?'],
        companies: ['amazon', 'microsoft', 'startup']
      },
      {
        id: 'behav_002',
        category: 'behavioral',
        subcategory: 'conflict',
        question: 'Describe a time you disagreed with your manager',
        difficulty: 'medium',
        expectedAnswer: 'Professional disagreement with constructive resolution',
        followUps: ['How did you maintain the relationship?', 'What was the outcome?'],
        companies: ['google', 'amazon', 'facebook']
      },
      
      // Case Study Questions
      {
        id: 'case_001',
        category: 'case_study',
        subcategory: 'market_sizing',
        question: 'How many coffee shops are there in San Francisco?',
        difficulty: 'medium',
        expectedAnswer: 'Structured approach with clear assumptions',
        followUps: ['How would you validate this estimate?', 'What factors might change this?'],
        companies: ['consulting', 'product_management']
      }
    ];

    questions.forEach(question => {
      this.questionDatabase.set(question.id, question);
    });
  }

  async loadInterviewerProfiles() {
    const interviewers = [
      {
        id: 'tech_lead_001',
        name: 'Senior Engineering Manager',
        role: 'technical_lead',
        experience: 8,
        focusAreas: ['system_design', 'technical_leadership', 'mentoring'],
        interviewStyle: 'collaborative',
        commonQuestions: ['system_design', 'technical_trade_offs', 'team_leadership'],
        tips: ['Focus on scalability', 'Discuss trade-offs', 'Show mentoring experience']
      },
      {
        id: 'hr_partner_001',
        name: 'HR Business Partner',
        role: 'hr_partner',
        experience: 5,
        focusAreas: ['cultural_fit', 'behavioral_assessment', 'team_dynamics'],
        interviewStyle: 'conversational',
        commonQuestions: ['behavioral_scenarios', 'cultural_values', 'team_collaboration'],
        tips: ['Be authentic', 'Show self-awareness', 'Demonstrate cultural alignment']
      }
    ];

    interviewers.forEach(interviewer => {
      this.interviewerProfiles.set(interviewer.id, interviewer);
    });
  }

  async prepareInterviewSession(interviewData, candidateId) {
    const {
      companyId,
      role,
      interviewType,
      interviewerRole = null,
      duration = 60,
      focusAreas = []
    } = interviewData;

    console.log(`Preparing ${interviewType} interview for ${role} at ${companyId}`);

    const preparation = {
      sessionId: `interview_${Date.now()}`,
      timestamp: new Date().toISOString(),
      candidateId,
      interviewData
    };

    // Get company profile
    preparation.companyProfile = this.companyProfiles.get(companyId) || this.getGenericCompanyProfile();
    
    // Get interview type details
    preparation.interviewTypeDetails = this.interviewTypes.get(interviewType);
    
    // Generate relevant questions
    preparation.relevantQuestions = await this.generateRelevantQuestions(interviewData);
    
    // Create preparation guide
    preparation.preparationGuide = await this.createPreparationGuide(preparation);
    
    // Generate practice scenarios
    preparation.practiceScenarios = await this.generatePracticeScenarios(preparation);
    
    // Create coaching prompts
    preparation.coachingPrompts = await this.createCoachingPrompts(preparation);
    
    // Generate success strategies
    preparation.successStrategies = await this.generateSuccessStrategies(preparation);

    return preparation;
  }

  async generateRelevantQuestions(interviewData) {
    const { companyId, interviewType, role, focusAreas } = interviewData;
    const relevantQuestions = [];

    for (const [id, question] of this.questionDatabase) {
      let relevanceScore = 0;

      // Match interview type
      if (question.category === interviewType) {
        relevanceScore += 3;
      }

      // Match company
      if (question.companies.includes(companyId)) {
        relevanceScore += 2;
      }

      // Match focus areas
      if (focusAreas.some(area => question.subcategory === area)) {
        relevanceScore += 2;
      }

      // Match role level
      if (role.toLowerCase().includes('senior') && question.difficulty === 'hard') {
        relevanceScore += 1;
      }

      if (relevanceScore >= 3) {
        relevantQuestions.push({
          ...question,
          relevanceScore
        });
      }
    }

    return relevantQuestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  async createPreparationGuide(preparation) {
    const { companyProfile, interviewTypeDetails, relevantQuestions } = preparation;
    
    const guide = {
      overview: '',
      keyFocusAreas: [],
      preparationSteps: [],
      commonMistakes: [],
      successTips: []
    };

    // Generate overview
    guide.overview = `Preparing for a ${interviewTypeDetails.name} at ${companyProfile.name}. ` +
      `This ${interviewTypeDetails.duration}-minute interview will focus on ${interviewTypeDetails.focusAreas.join(', ')}. ` +
      `${companyProfile.name} values ${companyProfile.values.slice(0, 2).join(' and ')}.`;

    // Key focus areas
    guide.keyFocusAreas = interviewTypeDetails.focusAreas.map(area => ({
      area: area.replace('_', ' '),
      importance: 'high',
      preparationTips: this.getFocusAreaTips(area, companyProfile)
    }));

    // Preparation steps
    guide.preparationSteps = [
      {
        step: 'Research the company',
        details: `Study ${companyProfile.name}'s products, culture, and recent news`,
        timeRequired: '2-3 hours'
      },
      {
        step: 'Practice relevant questions',
        details: `Focus on ${relevantQuestions.length} high-priority questions`,
        timeRequired: '3-4 hours'
      },
      {
        step: 'Prepare STAR stories',
        details: 'Develop 5-7 compelling examples using Situation, Task, Action, Result',
        timeRequired: '2 hours'
      },
      {
        step: 'Mock interview practice',
        details: 'Practice with MeetingMind\'s AI interviewer simulation',
        timeRequired: '1-2 hours'
      }
    ];

    // Common mistakes
    guide.commonMistakes = this.getCommonMistakes(interviewTypeDetails.id, companyProfile);

    // Success tips
    guide.successTips = companyProfile.interviewTips || this.getGenericSuccessTips(interviewTypeDetails.id);

    return guide;
  }

  getFocusAreaTips(area, companyProfile) {
    const tips = {
      coding: ['Practice on whiteboard', 'Think out loud', 'Test your solution'],
      system_design: ['Start with requirements', 'Consider scalability', 'Discuss trade-offs'],
      leadership: ['Use STAR method', 'Show impact', 'Demonstrate growth'],
      teamwork: ['Highlight collaboration', 'Show conflict resolution', 'Emphasize shared success'],
      problem_solving: ['Break down problems', 'Consider multiple solutions', 'Explain your reasoning']
    };

    return tips[area] || ['Prepare specific examples', 'Practice articulating your approach'];
  }

  getCommonMistakes(interviewType, companyProfile) {
    const mistakes = {
      technical: [
        'Jumping into coding without understanding requirements',
        'Not testing the solution',
        'Poor communication during problem solving'
      ],
      behavioral: [
        'Using vague examples without specific details',
        'Not following the STAR method',
        'Focusing on team success without highlighting personal contribution'
      ],
      case_study: [
        'Not structuring the approach',
        'Making assumptions without stating them',
        'Rushing to conclusions without analysis'
      ]
    };

    return mistakes[interviewType] || [
      'Not researching the company thoroughly',
      'Failing to ask thoughtful questions',
      'Not showing enthusiasm for the role'
    ];
  }

  getGenericSuccessTips(interviewType) {
    const tips = {
      technical: [
        'Practice coding problems daily',
        'Understand time and space complexity',
        'Communicate your thought process clearly'
      ],
      behavioral: [
        'Prepare diverse examples from your experience',
        'Practice the STAR method',
        'Show self-awareness and growth mindset'
      ],
      case_study: [
        'Structure your approach clearly',
        'State your assumptions',
        'Think about implementation challenges'
      ]
    };

    return tips[interviewType] || [
      'Be authentic and enthusiastic',
      'Ask thoughtful questions',
      'Follow up appropriately after the interview'
    ];
  }

  async generatePracticeScenarios(preparation) {
    const { interviewTypeDetails, companyProfile, relevantQuestions } = preparation;
    
    const scenarios = [];

    // Create practice scenarios based on interview type
    switch (interviewTypeDetails.id) {
      case 'technical':
        scenarios.push({
          type: 'coding_challenge',
          title: 'Live Coding Practice',
          description: 'Practice solving coding problems while explaining your approach',
          questions: relevantQuestions.filter(q => q.subcategory === 'coding').slice(0, 3),
          duration: 45,
          tips: ['Think out loud', 'Start with brute force, then optimize', 'Test with examples']
        });
        break;

      case 'behavioral':
        scenarios.push({
          type: 'star_practice',
          title: 'STAR Method Practice',
          description: 'Practice telling compelling stories using the STAR framework',
          questions: relevantQuestions.slice(0, 5),
          duration: 30,
          tips: ['Be specific with details', 'Quantify impact when possible', 'Show learning and growth']
        });
        break;

      case 'case_study':
        scenarios.push({
          type: 'case_analysis',
          title: 'Business Case Practice',
          description: 'Practice structured problem solving and presentation',
          questions: relevantQuestions.slice(0, 2),
          duration: 60,
          tips: ['Structure your approach', 'State assumptions clearly', 'Consider multiple solutions']
        });
        break;
    }

    return scenarios;
  }

  async createCoachingPrompts(preparation) {
    const { interviewTypeDetails, companyProfile } = preparation;
    
    return {
      realTimeCoaching: {
        analysis: `Monitor the candidate's performance in this ${interviewTypeDetails.name} for ${companyProfile.name}. ` +
          `Focus on ${interviewTypeDetails.evaluationCriteria.join(', ')}. Provide real-time feedback on ` +
          `communication clarity, technical accuracy, and cultural fit with ${companyProfile.name}'s values.`,
        
        coaching: `Provide gentle guidance to help the candidate improve their interview performance. ` +
          `Suggest better ways to structure answers, highlight relevant experience, and demonstrate ` +
          `alignment with ${companyProfile.name}'s culture. Focus on ${interviewTypeDetails.focusAreas.join(', ')}.`,
        
        followUp: `Generate specific, actionable feedback for the candidate's interview performance. ` +
          `Highlight strengths, identify improvement areas, and provide concrete suggestions for ` +
          `better answers to similar questions in future interviews.`
      },
      
      practiceMode: {
        questionGeneration: `Generate realistic ${interviewTypeDetails.name} questions that ${companyProfile.name} ` +
          `might ask for this role. Focus on ${interviewTypeDetails.focusAreas.join(', ')} and align with ` +
          `the company's values: ${companyProfile.values.join(', ')}.`,
        
        answerEvaluation: `Evaluate the candidate's practice answers for clarity, relevance, and impact. ` +
          `Provide specific suggestions for improvement and rate the answer on a scale of 1-10 ` +
          `with detailed reasoning.`,
        
        improvementSuggestions: `Based on the candidate's practice session, identify the top 3 areas for improvement ` +
          `and provide specific action items for each area. Include recommended resources and practice exercises.`
      }
    };
  }

  async generateSuccessStrategies(preparation) {
    const { companyProfile, interviewTypeDetails, relevantQuestions } = preparation;
    
    const strategies = {
      beforeInterview: [
        `Research ${companyProfile.name}'s recent news, products, and culture`,
        'Practice your elevator pitch and key stories',
        'Prepare thoughtful questions about the role and company',
        'Review your resume and be ready to discuss any item in detail'
      ],
      
      duringInterview: [
        'Listen carefully and ask clarifying questions',
        'Use the STAR method for behavioral questions',
        'Show enthusiasm and genuine interest',
        'Connect your experience to the company\'s needs'
      ],
      
      afterInterview: [
        'Send a personalized thank-you email within 24 hours',
        'Reiterate your interest and key qualifications',
        'Address any concerns that came up during the interview',
        'Follow up appropriately based on the timeline provided'
      ],
      
      specificToCompany: companyProfile.interviewTips || [],
      
      specificToRole: this.getRoleSpecificStrategies(interviewTypeDetails.id)
    };

    return strategies;
  }

  getRoleSpecificStrategies(interviewType) {
    const strategies = {
      technical: [
        'Practice coding on a whiteboard or shared screen',
        'Understand the company\'s tech stack',
        'Prepare to discuss system design at scale',
        'Be ready to debug code and explain your reasoning'
      ],
      behavioral: [
        'Prepare 7-10 diverse STAR stories',
        'Practice active listening and empathy',
        'Show how you handle feedback and failure',
        'Demonstrate cultural awareness and fit'
      ],
      case_study: [
        'Practice structuring business problems',
        'Learn basic business frameworks (Porter\'s 5 Forces, etc.)',
        'Practice mental math and estimation',
        'Prepare to present your analysis clearly'
      ]
    };

    return strategies[interviewType] || [];
  }

  getGenericCompanyProfile() {
    return {
      name: 'Target Company',
      industry: 'general',
      size: 'medium',
      culture: ['collaboration', 'innovation', 'growth'],
      values: ['Excellence', 'Integrity', 'Customer Focus'],
      interviewTips: [
        'Research the company thoroughly',
        'Prepare specific examples',
        'Show enthusiasm for the role',
        'Ask thoughtful questions'
      ]
    };
  }

  async conductMockInterview(sessionId, candidateResponses) {
    // This would integrate with the AI coaching system for real-time feedback
    const session = this.practiceHistory.get(sessionId);
    if (!session) {
      throw new Error('Practice session not found');
    }

    const feedback = {
      overallScore: 0,
      categoryScores: {},
      strengths: [],
      improvementAreas: [],
      specificFeedback: [],
      nextSteps: []
    };

    // This would be enhanced with actual AI analysis
    return feedback;
  }

  async getInterviewAnalytics(candidateId) {
    const analytics = {
      totalPracticeSessions: 0,
      averageScore: 0,
      improvementTrend: [],
      strongAreas: [],
      developmentAreas: [],
      recommendedFocus: []
    };

    // Analyze practice history for the candidate
    return analytics;
  }
}

module.exports = JobInterviewIntelligenceService;
