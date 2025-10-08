const LegalDisclaimerSystem = require('./legal-disclaimer-system');
const EmployeeProtectionMode = require('./employee-protection-mode');

/**
 * Comprehensive Use Case Selector for Legitimate Stealth Recording
 * 
 * This module provides a complete framework for selecting and configuring
 * appropriate stealth recording modes based on legitimate use cases.
 * Each use case has tailored legal frameworks, security measures, and protections.
 */

class UseCaseSelector {
  constructor(stealthAudioImplementation) {
    this.stealthAudio = stealthAudioImplementation;
    this.legalSystem = new LegalDisclaimerSystem();
    this.employeeProtection = new EmployeeProtectionMode(stealthAudioImplementation, this.legalSystem);
    
    this.useCases = this.initializeUseCases();
    this.currentUseCase = null;
    this.activeModes = [];
  }

  initializeUseCases() {
    return {
      // Professional & Business Protection
      'contract-negotiation': {
        category: 'Professional & Business',
        title: 'Contract Negotiations & Business Deals',
        description: 'Document negotiation terms and prevent misrepresentation in business deals',
        legalBasis: 'Contract law protection against misrepresentation and fraud',
        riskLevel: 'low',
        stealthJustification: 'Prevents parties from denying statements or changing agreed terms',
        applicableLaws: ['Contract Law', 'Commercial Fraud Prevention', 'Business Records'],
        protections: ['Due diligence documentation', 'Breach of contract evidence', 'Misrepresentation claims'],
        features: ['Business meeting optimization', 'Contract term tracking', 'Negotiation analysis'],
        securityLevel: 'standard'
      },
      
      'client-management': {
        category: 'Professional & Business',
        title: 'Client Relationship Management',
        description: 'Document client requirements and prevent scope creep disputes',
        legalBasis: 'Professional liability protection and contract enforcement',
        riskLevel: 'low',
        stealthJustification: 'Prevents "I never said that" disputes and scope creep',
        applicableLaws: ['Professional Liability', 'Contract Law', 'Service Agreements'],
        protections: ['Professional liability defense', 'Scope documentation', 'Client dispute resolution'],
        features: ['Requirement tracking', 'Scope change documentation', 'Client communication logs'],
        securityLevel: 'standard'
      },

      'vendor-negotiations': {
        category: 'Professional & Business',
        title: 'Vendor & Supplier Relations',
        description: 'Document vendor capabilities and prevent false claims',
        legalBasis: 'Commercial fraud prevention and due diligence requirements',
        riskLevel: 'low',
        stealthJustification: 'Documents actual capabilities vs. marketing promises',
        applicableLaws: ['Commercial Law', 'Fraud Prevention', 'Due Diligence Standards'],
        protections: ['Vendor fraud claims', 'Performance disputes', 'Quality assurance'],
        features: ['Vendor capability tracking', 'Performance monitoring', 'Quality documentation'],
        securityLevel: 'standard'
      },

      // Healthcare & Medical Protection
      'medical-consultation': {
        category: 'Healthcare & Medical',
        title: 'Medical Consultation Documentation',
        description: 'Document medical consultations for treatment compliance and malpractice protection',
        legalBasis: 'Patient rights and medical malpractice protection laws',
        riskLevel: 'medium',
        stealthJustification: 'Ensures accurate medical record and prevents treatment disputes',
        applicableLaws: ['Patient Rights', 'Medical Malpractice', 'HIPAA (with patient consent)', 'Healthcare Quality'],
        protections: ['Malpractice evidence', 'Treatment documentation', 'Insurance claim support'],
        features: ['Medical terminology recognition', 'Treatment plan tracking', 'HIPAA compliance tools'],
        securityLevel: 'high'
      },

      'elder-care': {
        category: 'Healthcare & Medical',
        title: 'Elder Care Monitoring',
        description: 'Monitor elderly care to prevent abuse and ensure quality treatment',
        legalBasis: 'Elder protection laws and duty of care requirements',
        riskLevel: 'medium',
        stealthJustification: 'Protects vulnerable adults from abuse and neglect',
        applicableLaws: ['Elder Protection Statutes', 'Adult Protective Services', 'Care Facility Regulations'],
        protections: ['Elder abuse evidence', 'Care quality documentation', 'Regulatory compliance'],
        features: ['Care quality monitoring', 'Abuse detection alerts', 'Regulatory reporting tools'],
        securityLevel: 'high'
      },

      // Personal & Family Protection
      'domestic-violence': {
        category: 'Personal & Family',
        title: 'Domestic Violence Documentation',
        description: 'Document abuse for restraining orders and legal protection',
        legalBasis: 'Personal safety and domestic violence protection laws',
        riskLevel: 'high',
        stealthJustification: 'Prevents escalation of violence if abuser discovers recording',
        applicableLaws: ['Domestic Violence Protection', 'Restraining Order Evidence', 'Criminal Law'],
        protections: ['Protection order evidence', 'Criminal prosecution support', 'Safety documentation'],
        features: ['Emergency panic mode', 'Safety planning tools', 'Legal resource integration'],
        securityLevel: 'maximum'
      },

      'child-custody': {
        category: 'Personal & Family',
        title: 'Child Custody Protection',
        description: 'Document parental behavior for child welfare and custody proceedings',
        legalBasis: 'Child protection laws and best interest standards',
        riskLevel: 'medium',
        stealthJustification: 'Protects child welfare and prevents coached behavior',
        applicableLaws: ['Child Protection', 'Family Court Procedures', 'Best Interest Standards'],
        protections: ['Custody modification evidence', 'Child welfare documentation', 'Parental fitness assessment'],
        features: ['Child welfare monitoring', 'Parental behavior tracking', 'Court documentation tools'],
        securityLevel: 'high'
      },

      'landlord-tenant': {
        category: 'Personal & Family',
        title: 'Landlord-Tenant Disputes',
        description: 'Document landlord harassment and illegal practices',
        legalBasis: 'Tenant rights and housing law protection',
        riskLevel: 'medium',
        stealthJustification: 'Prevents landlord retaliation and denial of statements',
        applicableLaws: ['Tenant Rights', 'Housing Law', 'Anti-Retaliation Statutes'],
        protections: ['Housing court evidence', 'Harassment documentation', 'Lease violation proof'],
        features: ['Harassment tracking', 'Lease compliance monitoring', 'Housing law guidance'],
        securityLevel: 'standard'
      },

      // Employee Protection (Enhanced)
      'wrongful-termination': {
        category: 'Employee Protection',
        title: 'Wrongful Termination Protection',
        description: 'Document discriminatory or retaliatory termination evidence',
        legalBasis: 'Employment law and anti-discrimination statutes',
        riskLevel: 'high',
        stealthJustification: 'Prevents employer from altering behavior or destroying evidence',
        applicableLaws: ['Employment Law', 'Civil Rights', 'Anti-Retaliation', 'Wrongful Termination'],
        protections: ['Wrongful termination claims', 'Discrimination evidence', 'Retaliation documentation'],
        features: ['Employment law guidance', 'Discrimination tracking', 'Legal resource integration'],
        securityLevel: 'high'
      },

      'workplace-harassment': {
        category: 'Employee Protection',
        title: 'Workplace Harassment Documentation',
        description: 'Document workplace harassment for HR and legal action',
        legalBasis: 'Civil rights and employment harassment laws',
        riskLevel: 'high',
        stealthJustification: 'Prevents harasser behavior modification and victim retaliation',
        applicableLaws: ['Title VII', 'State Civil Rights', 'Workplace Harassment', 'EEOC Guidelines'],
        protections: ['Harassment claims', 'Hostile work environment', 'Civil rights violations'],
        features: ['Harassment pattern tracking', 'EEOC complaint tools', 'HR documentation'],
        securityLevel: 'high'
      },

      'whistleblower': {
        category: 'Employee Protection',
        title: 'Whistleblower Protection',
        description: 'Document illegal corporate activities for regulatory reporting',
        legalBasis: 'Whistleblower protection laws and public interest',
        riskLevel: 'maximum',
        stealthJustification: 'Prevents evidence destruction and protects whistleblower safety',
        applicableLaws: ['Whistleblower Protection Act', 'Sarbanes-Oxley', 'False Claims Act', 'SEC Whistleblower'],
        protections: ['Regulatory reporting', 'Criminal evidence', 'Retaliation protection'],
        features: ['Regulatory reporting tools', 'Anonymous submission', 'Whistleblower resources'],
        securityLevel: 'maximum'
      },

      // Legal & Regulatory Protection
      'government-accountability': {
        category: 'Legal & Regulatory',
        title: 'Government Accountability',
        description: 'Document government official misconduct and corruption',
        legalBasis: 'Public accountability and anti-corruption laws',
        riskLevel: 'high',
        stealthJustification: 'Prevents cover-up and ensures public accountability',
        applicableLaws: ['Public Records', 'Anti-Corruption', 'Government Ethics', 'First Amendment'],
        protections: ['Corruption evidence', 'Public accountability', 'Ethics violations'],
        features: ['Public records integration', 'Ethics violation tracking', 'Transparency tools'],
        securityLevel: 'high'
      },

      'police-accountability': {
        category: 'Legal & Regulatory',
        title: 'Police Interaction Documentation',
        description: 'Document police misconduct and civil rights violations',
        legalBasis: 'Civil rights protection and police accountability',
        riskLevel: 'high',
        stealthJustification: 'Protects against false reports and ensures accountability',
        applicableLaws: ['Civil Rights Act', 'Police Accountability', 'Fourth Amendment', 'Due Process'],
        protections: ['Civil rights lawsuits', 'Criminal defense', 'Police misconduct claims'],
        features: ['Civil rights guidance', 'Police interaction tracking', 'Legal defense tools'],
        securityLevel: 'high'
      },

      // Financial & Investment Protection
      'financial-advisor': {
        category: 'Financial & Investment',
        title: 'Financial Advisor Oversight',
        description: 'Document unsuitable investment recommendations and misconduct',
        legalBasis: 'Securities law and fiduciary duty protection',
        riskLevel: 'medium',
        stealthJustification: 'Prevents advisor from denying statements and recommendations',
        applicableLaws: ['Securities Law', 'Fiduciary Duty', 'Investment Advisor Act', 'FINRA Rules'],
        protections: ['Securities fraud claims', 'Fiduciary breach', 'FINRA complaints'],
        features: ['Investment tracking', 'Fiduciary analysis', 'FINRA complaint tools'],
        securityLevel: 'standard'
      },

      'insurance-disputes': {
        category: 'Financial & Investment',
        title: 'Insurance Claim Documentation',
        description: 'Document insurance company bad faith and claim disputes',
        legalBasis: 'Insurance law and bad faith claim protection',
        riskLevel: 'medium',
        stealthJustification: 'Documents actual statements vs. written claim denials',
        applicableLaws: ['Insurance Law', 'Bad Faith Claims', 'Consumer Protection', 'State Insurance Codes'],
        protections: ['Bad faith lawsuits', 'Claim dispute resolution', 'Consumer protection'],
        features: ['Claim tracking', 'Bad faith analysis', 'Insurance law guidance'],
        securityLevel: 'standard'
      },

      // Investigation & Research
      'journalistic-investigation': {
        category: 'Investigation & Research',
        title: 'Journalistic Investigation',
        description: 'Investigate corporate wrongdoing and public corruption',
        legalBasis: 'Press freedom and public interest protection',
        riskLevel: 'high',
        stealthJustification: 'Prevents cover-up and ensures accurate reporting',
        applicableLaws: ['First Amendment', 'Press Freedom', 'Shield Laws', 'Public Interest'],
        protections: ['Investigative reporting', 'Source protection', 'Public accountability'],
        features: ['Source protection', 'Investigation tools', 'Press law guidance'],
        securityLevel: 'maximum'
      },

      'consumer-protection': {
        category: 'Investigation & Research',
        title: 'Consumer Protection Investigation',
        description: 'Document deceptive business practices and consumer fraud',
        legalBasis: 'Consumer protection laws and public interest',
        riskLevel: 'medium',
        stealthJustification: 'Prevents businesses from hiding deceptive practices',
        applicableLaws: ['Consumer Protection Act', 'FTC Act', 'State Consumer Laws', 'Deceptive Practices'],
        protections: ['Consumer fraud claims', 'Regulatory enforcement', 'Class action evidence'],
        features: ['Consumer fraud tracking', 'FTC complaint tools', 'Class action resources'],
        securityLevel: 'standard'
      },

      // Security & Safety Protection
      'workplace-safety': {
        category: 'Security & Safety',
        title: 'Workplace Safety Documentation',
        description: 'Document unsafe working conditions and safety violations',
        legalBasis: 'Occupational safety laws and whistleblower protection',
        riskLevel: 'medium',
        stealthJustification: 'Prevents employer retaliation and safety cover-ups',
        applicableLaws: ['OSHA', 'Workplace Safety', 'Whistleblower Protection', 'State Safety Laws'],
        protections: ['OSHA complaints', 'Safety enforcement', 'Retaliation protection'],
        features: ['Safety violation tracking', 'OSHA complaint tools', 'Safety law guidance'],
        securityLevel: 'standard'
      },

      'environmental-protection': {
        category: 'Security & Safety',
        title: 'Environmental Violation Documentation',
        description: 'Document environmental violations and public health threats',
        legalBasis: 'Environmental law and public health protection',
        riskLevel: 'high',
        stealthJustification: 'Prevents evidence destruction and environmental cover-ups',
        applicableLaws: ['Environmental Protection Act', 'Clean Air Act', 'Clean Water Act', 'Public Health'],
        protections: ['Environmental enforcement', 'Public health protection', 'Regulatory compliance'],
        features: ['Environmental monitoring', 'EPA complaint tools', 'Health impact tracking'],
        securityLevel: 'high'
      }
    };
  }

  /**
   * Present use case selection interface
   */
  async presentUseCaseSelection() {
    console.log('🎯 COMPREHENSIVE USE CASE SELECTION');
    console.log('📋 Select Your Legitimate Recording Purpose');
    
    const categories = this.groupUseCasesByCategory();
    
    return {
      title: 'Select Your Recording Purpose',
      subtitle: 'Choose the category that best describes your legitimate need for recording',
      categories: categories,
      legalNotice: 'Each use case has specific legal protections and requirements',
      userResponsibility: 'You are responsible for ensuring your use case is legitimate and legal in your jurisdiction'
    };
  }

  groupUseCasesByCategory() {
    const categories = {};
    
    Object.entries(this.useCases).forEach(([id, useCase]) => {
      if (!categories[useCase.category]) {
        categories[useCase.category] = {
          name: useCase.category,
          description: this.getCategoryDescription(useCase.category),
          useCases: []
        };
      }
      
      categories[useCase.category].useCases.push({
        id: id,
        ...useCase
      });
    });
    
    return categories;
  }

  getCategoryDescription(category) {
    const descriptions = {
      'Professional & Business': 'Business negotiations, client relations, and commercial protection',
      'Healthcare & Medical': 'Medical consultations, elder care, and healthcare quality monitoring',
      'Personal & Family': 'Family protection, domestic safety, and personal legal matters',
      'Employee Protection': 'Workplace rights, harassment documentation, and employment law',
      'Legal & Regulatory': 'Government accountability, civil rights, and regulatory compliance',
      'Financial & Investment': 'Financial protection, investment oversight, and insurance disputes',
      'Investigation & Research': 'Journalistic investigation, consumer protection, and research documentation',
      'Security & Safety': 'Workplace safety, environmental protection, and public health'
    };
    
    return descriptions[category] || 'Specialized recording purposes';
  }

  /**
   * Configure recording mode based on selected use case
   */
  async configureUseCaseMode(useCaseId, userId, additionalConfig = {}) {
    console.log(`🔧 CONFIGURING USE CASE: ${useCaseId.toUpperCase()}`);
    
    const useCase = this.useCases[useCaseId];
    
    if (!useCase) {
      return {
        success: false,
        message: 'Invalid use case selected',
        availableUseCases: Object.keys(this.useCases)
      };
    }

    // Present use case-specific legal framework
    const legalFramework = await this.presentUseCaseLegalFramework(useCase);
    
    if (legalFramework.requiresAcknowledgment) {
      return {
        success: false,
        requiresUseCaseAcknowledgment: true,
        useCase: useCase,
        legalFramework: legalFramework,
        message: 'Use case-specific legal acknowledgment required'
      };
    }

    // Configure stealth mode with use case-specific settings
    const stealthConfig = this.buildStealthConfiguration(useCase, additionalConfig);
    
    // Activate appropriate protection mode
    let activationResult;
    
    if (useCase.category === 'Employee Protection') {
      activationResult = await this.employeeProtection.activateEmployeeProtectionMode(userId, {
        purpose: useCaseId,
        ...stealthConfig
      });
    } else {
      activationResult = await this.stealthAudio.activateStealthMode(userId, stealthConfig);
    }

    if (activationResult.success) {
      this.currentUseCase = useCaseId;
      this.activeModes.push({
        useCaseId: useCaseId,
        category: useCase.category,
        activatedAt: new Date().toISOString(),
        configuration: stealthConfig
      });

      return {
        success: true,
        message: `${useCase.title} mode activated`,
        useCase: useCase,
        configuration: stealthConfig,
        legalProtections: useCase.protections,
        applicableLaws: useCase.applicableLaws,
        securityLevel: useCase.securityLevel,
        features: useCase.features,
        warnings: this.getUseCaseWarnings(useCase),
        resources: await this.getUseCaseResources(useCase)
      };
    } else {
      return {
        success: false,
        message: `Failed to activate ${useCase.title} mode`,
        details: activationResult,
        useCase: useCase
      };
    }
  }

  async presentUseCaseLegalFramework(useCase) {
    console.log(`📋 PRESENTING LEGAL FRAMEWORK: ${useCase.title.toUpperCase()}`);
    
    const framework = {
      title: `${useCase.title} - Legal Framework`,
      useCase: useCase.title,
      category: useCase.category,
      legalBasis: useCase.legalBasis,
      stealthJustification: useCase.stealthJustification,
      riskLevel: useCase.riskLevel,
      applicableLaws: useCase.applicableLaws,
      protections: useCase.protections,
      
      requirements: [
        'Document legitimate purpose for recording',
        'Understand applicable laws in your jurisdiction',
        'Ensure recording serves protective or evidentiary purpose',
        'Consider less intrusive alternatives when appropriate',
        'Maintain appropriate security and confidentiality'
      ],
      
      acknowledgments: [
        `I have a legitimate need for ${useCase.title.toLowerCase()}`,
        'I understand the legal basis and protections for this use case',
        'I will use recordings only for the stated legitimate purpose',
        'I understand my responsibilities under applicable laws',
        'I will maintain appropriate security and confidentiality'
      ]
    };

    // Check existing acknowledgment
    const existingAck = await this.checkUseCaseAcknowledgment(useCase, 'default-user');
    
    return {
      framework: framework,
      requiresAcknowledgment: !existingAck.valid,
      existingAcknowledgment: existingAck
    };
  }

  buildStealthConfiguration(useCase, additionalConfig) {
    const baseConfig = {
      useCaseId: useCase.title,
      category: useCase.category,
      securityLevel: useCase.securityLevel,
      riskLevel: useCase.riskLevel,
      legalBasis: useCase.legalBasis
    };

    // Security level configurations
    const securityConfigs = {
      'standard': {
        encryption: 'AES-256',
        obfuscation: 'basic',
        chainOfCustody: true,
        emergencyFeatures: false
      },
      'high': {
        encryption: 'AES-256-GCM',
        obfuscation: 'advanced',
        chainOfCustody: true,
        emergencyFeatures: true,
        multipleBackups: true
      },
      'maximum': {
        encryption: 'AES-256-GCM',
        obfuscation: 'maximum',
        chainOfCustody: true,
        emergencyFeatures: true,
        multipleBackups: true,
        anonymousMode: true,
        panicMode: true
      }
    };

    return {
      ...baseConfig,
      ...securityConfigs[useCase.securityLevel],
      ...additionalConfig
    };
  }

  getUseCaseWarnings(useCase) {
    const baseWarnings = [
      'Ensure your use case is legitimate and legal in your jurisdiction',
      'Document the protective purpose clearly',
      'Consider less intrusive alternatives when appropriate'
    ];

    const riskWarnings = {
      'low': ['Standard legal compliance required'],
      'medium': ['Increased legal scrutiny possible', 'Consider consulting legal counsel'],
      'high': ['High legal risk - legal consultation recommended', 'Prioritize safety over evidence gathering'],
      'maximum': ['Maximum legal risk - legal counsel essential', 'Emergency safety planning required']
    };

    return [...baseWarnings, ...riskWarnings[useCase.riskLevel]];
  }

  async getUseCaseResources(useCase) {
    const resourceMap = {
      'Employee Protection': [
        { name: 'EEOC', url: 'https://www.eeoc.gov', type: 'Government Agency' },
        { name: 'National Employment Lawyers Association', url: 'https://www.nela.org', type: 'Legal Resources' }
      ],
      'Healthcare & Medical': [
        { name: 'Patient Advocate Foundation', url: 'https://www.patientadvocate.org', type: 'Patient Rights' },
        { name: 'National Academy of Elder Law Attorneys', url: 'https://www.naela.org', type: 'Elder Law' }
      ],
      'Personal & Family': [
        { name: 'National Domestic Violence Hotline', phone: '1-800-799-7233', type: 'Crisis Support' },
        { name: 'Legal Aid Society', url: 'https://www.legalaid.org', type: 'Legal Assistance' }
      ],
      'Legal & Regulatory': [
        { name: 'ACLU', url: 'https://www.aclu.org', type: 'Civil Rights' },
        { name: 'Government Accountability Project', url: 'https://www.whistleblower.org', type: 'Whistleblower' }
      ]
    };

    return resourceMap[useCase.category] || [];
  }

  async checkUseCaseAcknowledgment(useCase, userId) {
    // Simplified acknowledgment check
    return {
      valid: false,
      message: 'Use case acknowledgment required'
    };
  }

  getCurrentUseCase() {
    return this.currentUseCase ? this.useCases[this.currentUseCase] : null;
  }

  getActiveModes() {
    return this.activeModes;
  }

  async deactivateAllModes() {
    console.log('🛑 DEACTIVATING ALL USE CASE MODES');
    
    try {
      // Deactivate stealth mode
      await this.stealthAudio.deactivateStealthMode();
      
      // Deactivate employee protection if active
      if (this.employeeProtection.getProtectionStatus().protectionActive) {
        await this.employeeProtection.deactivateStealthMode();
      }

      this.currentUseCase = null;
      this.activeModes = [];

      return {
        success: true,
        message: 'All use case modes deactivated'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error deactivating modes: ${error.message}`
      };
    }
  }
}

module.exports = UseCaseSelector;
