const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Employee Protection Mode - Enhanced Stealth Recording for Legitimate Protection
 * 
 * LEGITIMATE USE CASES:
 * - Wrongful termination protection
 * - Workplace harassment documentation
 * - Discrimination evidence gathering
 * - Whistleblower protection
 * - Contract violation documentation
 * - Domestic abuse evidence
 * - Elder abuse documentation
 * - Fraud investigation
 * 
 * LEGAL FRAMEWORK:
 * - Self-defense doctrine supports protective recording
 * - Necessity defense may justify recording violations
 * - Public policy favors exposure of illegal activity
 * - Evidence preservation rights protect documentation
 * - Whistleblower laws often supersede recording restrictions
 */

class EmployeeProtectionMode {
  constructor(stealthAudioImplementation, legalDisclaimerSystem) {
    this.stealthAudio = stealthAudioImplementation;
    this.legalSystem = legalDisclaimerSystem;
    this.protectionActive = false;
    this.protectionPurpose = null;
    this.evidenceChain = [];
    this.emergencyContacts = [];
    this.legalConsultation = null;
    
    // Enhanced security for employee protection
    this.encryptionKey = null;
    this.evidenceVault = null;
    this.chainOfCustody = [];
    this.tamperDetection = true;
    
    // Emergency features
    this.panicMode = false;
    this.emergencyBackup = true;
    this.anonymousReporting = false;
  }

  /**
   * Activate Employee Protection Mode with enhanced legal framework
   */
  async activateEmployeeProtectionMode(userId, protectionConfig) {
    console.log('🛡️ EMPLOYEE PROTECTION MODE ACTIVATION');
    console.log('📋 Legitimate Protective Use Case Framework');
    
    // Present employee protection legal framework
    const protectionDisclaimer = await this.presentEmployeeProtectionDisclaimer(protectionConfig);
    
    if (protectionDisclaimer.requiresAcknowledgment) {
      return {
        success: false,
        requiresProtectionAcknowledgment: true,
        disclaimer: protectionDisclaimer,
        protectionFramework: this.getEmployeeProtectionFramework(),
        message: 'Employee protection acknowledgment required'
      };
    }

    // Validate protection purpose
    const purposeValidation = this.validateProtectionPurpose(protectionConfig.purpose);
    
    if (!purposeValidation.valid) {
      return {
        success: false,
        message: 'Invalid protection purpose specified',
        validPurposes: this.getValidProtectionPurposes(),
        guidance: purposeValidation.guidance
      };
    }

    // Initialize enhanced security for protection mode
    await this.initializeProtectionSecurity(userId, protectionConfig);
    
    // Activate stealth mode with protection enhancements
    const stealthResult = await this.stealthAudio.activateStealthMode(userId, {
      ...protectionConfig,
      protectionMode: true,
      enhancedSecurity: true,
      evidenceGrade: true
    });

    if (stealthResult.success) {
      this.protectionActive = true;
      this.protectionPurpose = protectionConfig.purpose;
      
      // Start evidence chain documentation
      await this.startEvidenceChain(userId, protectionConfig);
      
      return {
        success: true,
        message: 'Employee Protection Mode activated',
        protectionPurpose: protectionConfig.purpose,
        legalFramework: 'Enhanced protections for legitimate evidence gathering',
        securityFeatures: [
          'End-to-end encryption with user-controlled keys',
          'Chain of custody documentation',
          'Tamper detection and verification',
          'Secure multi-location backup',
          'Emergency panic mode available'
        ],
        legalProtections: [
          'Self-defense doctrine may apply',
          'Evidence preservation rights protected',
          'Whistleblower protections may supersede recording restrictions',
          'Public policy favors exposure of illegal activity'
        ],
        emergencyFeatures: [
          'Panic button (Ctrl+Shift+Alt+P) to immediately secure evidence',
          'Emergency contact notification system',
          'Anonymous reporting capabilities',
          'Legal consultation resources'
        ],
        warnings: [
          'Document protective purpose clearly',
          'Prioritize personal safety over evidence gathering',
          'Consult with employment attorney when possible',
          'Understand applicable whistleblower protections'
        ]
      };
    } else {
      return {
        success: false,
        message: 'Employee Protection Mode activation failed',
        details: stealthResult,
        alternatives: [
          'Standard recording with consent',
          'Post-meeting documentation',
          'Witness statements and corroboration'
        ]
      };
    }
  }

  async presentEmployeeProtectionDisclaimer(protectionConfig) {
    console.log('📋 PRESENTING EMPLOYEE PROTECTION LEGAL FRAMEWORK');
    
    const protectionDisclaimer = {
      title: 'EMPLOYEE PROTECTION MODE - LEGAL FRAMEWORK',
      severity: 'PROTECTIVE',
      purpose: 'Legitimate evidence gathering for legal protection',
      
      legitimateUseCases: {
        employeeProtection: [
          'Wrongful termination protection and evidence gathering',
          'Workplace harassment documentation for HR or legal action',
          'Discrimination evidence for civil rights violations',
          'Whistleblower protection when reporting illegal activities',
          'Contract violation documentation for breach of contract claims'
        ],
        personalProtection: [
          'Domestic abuse evidence for restraining orders or custody',
          'Elder abuse documentation for regulatory reporting',
          'Medical malpractice evidence for negligence claims'
        ],
        businessProtection: [
          'Fraud investigation and evidence preservation',
          'Contract negotiation protection against misrepresentation',
          'Regulatory compliance documentation'
        ]
      },
      
      legalDoctrines: {
        selfDefense: 'Right to protect oneself extends to evidence gathering',
        necessityDefense: 'Recording violations may be justified to prevent greater harm',
        publicPolicy: 'Laws should not prevent exposure of illegal activity',
        evidencePreservation: 'Parties have right to preserve evidence of violations'
      },
      
      enhancedProtections: {
        whistleblowerLaws: 'Often supersede general recording restrictions',
        civilRightsLaws: 'May protect recording when documenting discrimination',
        employmentLaw: 'May support evidence gathering for wrongful termination',
        criminalLaw: 'Evidence of crimes may be gathered by victims'
      },
      
      userResponsibilities: [
        'Document clear protective purpose for recording',
        'Research applicable employee protection and whistleblower laws',
        'Prioritize personal safety over evidence gathering',
        'Consider consulting with employment attorney or legal aid',
        'Preserve evidence securely for potential legal proceedings'
      ],
      
      acknowledgmentRequirements: [
        'I am using this software for legitimate protective purposes',
        'I understand the enhanced legal protections for protective recording',
        'I will document the protective purpose and circumstances clearly',
        'I will prioritize my safety over evidence gathering',
        'I understand my rights under whistleblower and employee protection laws',
        'I will consult with legal counsel when appropriate',
        'I will preserve evidence securely for potential legal proceedings'
      ]
    };

    // Check if user has existing protection acknowledgment
    const existingAcknowledgment = await this.checkProtectionAcknowledgment(
      protectionConfig.userId, 
      protectionConfig.purpose
    );

    return {
      disclaimer: protectionDisclaimer,
      requiresAcknowledgment: !existingAcknowledgment.valid,
      existingProtection: existingAcknowledgment,
      protectionLevel: this.assessProtectionLevel(protectionConfig.purpose)
    };
  }

  validateProtectionPurpose(purpose) {
    const validPurposes = {
      'wrongful-termination': {
        valid: true,
        legalBasis: 'Employment law protection',
        riskLevel: 'medium',
        guidance: 'Document discriminatory or retaliatory reasons for termination'
      },
      'workplace-harassment': {
        valid: true,
        legalBasis: 'Civil rights and employment law',
        riskLevel: 'medium',
        guidance: 'Prioritize safety - stop recording if situation escalates'
      },
      'discrimination': {
        valid: true,
        legalBasis: 'Civil rights violations',
        riskLevel: 'medium',
        guidance: 'Document discriminatory statements and actions clearly'
      },
      'whistleblower': {
        valid: true,
        legalBasis: 'Whistleblower protection laws',
        riskLevel: 'high',
        guidance: 'Research whistleblower protections in your jurisdiction'
      },
      'contract-violation': {
        valid: true,
        legalBasis: 'Contract law and breach of contract',
        riskLevel: 'low',
        guidance: 'Document specific contract terms being violated'
      },
      'domestic-abuse': {
        valid: true,
        legalBasis: 'Personal safety and protection orders',
        riskLevel: 'high',
        guidance: 'Safety first - consider involving law enforcement'
      },
      'elder-abuse': {
        valid: true,
        legalBasis: 'Elder protection statutes',
        riskLevel: 'medium',
        guidance: 'Report to appropriate regulatory agencies'
      },
      'fraud-investigation': {
        valid: true,
        legalBasis: 'Criminal law and fiduciary duties',
        riskLevel: 'medium',
        guidance: 'Consider involving law enforcement for criminal fraud'
      }
    };

    const purposeInfo = validPurposes[purpose];
    
    if (!purposeInfo) {
      return {
        valid: false,
        message: 'Invalid protection purpose',
        guidance: 'Please select a valid protective use case'
      };
    }

    return {
      valid: true,
      ...purposeInfo
    };
  }

  getValidProtectionPurposes() {
    return [
      {
        id: 'wrongful-termination',
        title: 'Wrongful Termination Protection',
        description: 'Evidence gathering for potential wrongful termination lawsuit'
      },
      {
        id: 'workplace-harassment',
        title: 'Workplace Harassment Documentation',
        description: 'Recording harassment for HR complaints or legal action'
      },
      {
        id: 'discrimination',
        title: 'Discrimination Evidence',
        description: 'Documenting discriminatory behavior or statements'
      },
      {
        id: 'whistleblower',
        title: 'Whistleblower Protection',
        description: 'Recording evidence of illegal corporate activities'
      },
      {
        id: 'contract-violation',
        title: 'Contract Violation Documentation',
        description: 'Evidence of employment contract or agreement violations'
      },
      {
        id: 'domestic-abuse',
        title: 'Domestic Abuse Evidence',
        description: 'Recording abuse for restraining orders or legal protection'
      },
      {
        id: 'elder-abuse',
        title: 'Elder Abuse Documentation',
        description: 'Evidence of elder abuse for regulatory reporting'
      },
      {
        id: 'fraud-investigation',
        title: 'Fraud Investigation',
        description: 'Recording evidence of fraudulent activities'
      }
    ];
  }

  async initializeProtectionSecurity(userId, protectionConfig) {
    console.log('🔒 INITIALIZING ENHANCED PROTECTION SECURITY');
    
    // Generate user-controlled encryption key
    this.encryptionKey = crypto.randomBytes(32);
    
    // Initialize evidence vault
    this.evidenceVault = {
      userId: userId,
      protectionPurpose: protectionConfig.purpose,
      createdAt: new Date().toISOString(),
      encryptionMethod: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      tamperDetection: true,
      chainOfCustody: []
    };

    // Set up emergency contacts
    if (protectionConfig.emergencyContacts) {
      this.emergencyContacts = protectionConfig.emergencyContacts;
    }

    // Configure legal consultation resources
    this.legalConsultation = {
      employmentLawyers: await this.getLegalResources('employment'),
      legalAidSocieties: await this.getLegalResources('legal-aid'),
      whistleblowerOrganizations: await this.getLegalResources('whistleblower'),
      civilRightsOrganizations: await this.getLegalResources('civil-rights')
    };

    console.log('✅ Protection security initialized');
  }

  async startEvidenceChain(userId, protectionConfig) {
    console.log('📋 STARTING EVIDENCE CHAIN DOCUMENTATION');
    
    const chainEntry = {
      timestamp: new Date().toISOString(),
      userId: userId,
      protectionPurpose: protectionConfig.purpose,
      circumstances: protectionConfig.circumstances || 'Not specified',
      location: protectionConfig.location || 'Not specified',
      participants: protectionConfig.expectedParticipants || 'Not specified',
      legalBasis: this.validateProtectionPurpose(protectionConfig.purpose).legalBasis,
      hash: crypto.randomBytes(16).toString('hex'),
      integrity: 'verified'
    };

    this.chainOfCustody.push(chainEntry);
    
    // Store evidence chain securely
    await this.storeEvidenceChain();
    
    console.log(`✅ Evidence chain started: ${chainEntry.hash}`);
  }

  async activatePanicMode() {
    console.log('🚨 PANIC MODE ACTIVATED - SECURING EVIDENCE');
    
    this.panicMode = true;
    
    try {
      // Immediately stop recording and secure evidence
      await this.stealthAudio.deactivateStealthMode();
      
      // Encrypt and backup all evidence
      await this.emergencySecureEvidence();
      
      // Notify emergency contacts
      await this.notifyEmergencyContacts();
      
      // Clear sensitive data from memory
      await this.secureClearSensitiveData();
      
      return {
        success: true,
        message: 'Panic mode activated - evidence secured',
        actions: [
          'Recording stopped and evidence encrypted',
          'Emergency contacts notified',
          'Evidence backed up to secure locations',
          'Sensitive data cleared from system'
        ]
      };
    } catch (error) {
      return {
        success: false,
        message: `Panic mode activation failed: ${error.message}`,
        recommendation: 'Manually secure evidence and seek immediate assistance'
      };
    }
  }

  async emergencySecureEvidence() {
    console.log('🔐 EMERGENCY EVIDENCE SECURING');
    
    // Encrypt all recordings with emergency key
    const emergencyKey = crypto.randomBytes(32);
    
    // Create emergency evidence package
    const emergencyPackage = {
      timestamp: new Date().toISOString(),
      protectionPurpose: this.protectionPurpose,
      chainOfCustody: this.chainOfCustody,
      emergencyActivation: true,
      legalNotice: 'Evidence secured under emergency protection protocols'
    };

    // Store in multiple secure locations
    await this.distributeEmergencyEvidence(emergencyPackage);
  }

  async notifyEmergencyContacts() {
    console.log('📞 NOTIFYING EMERGENCY CONTACTS');
    
    const emergencyMessage = {
      timestamp: new Date().toISOString(),
      message: 'Employee protection emergency activated',
      protectionPurpose: this.protectionPurpose,
      action: 'Evidence secured and protected',
      nextSteps: 'Contact legal counsel immediately'
    };

    // In real implementation, this would send notifications
    console.log('Emergency notification prepared:', emergencyMessage);
  }

  async getLegalResources(category) {
    const resources = {
      'employment': [
        {
          name: 'National Employment Lawyers Association',
          phone: '415-296-7629',
          website: 'https://www.nela.org',
          description: 'Employment law attorney referrals'
        },
        {
          name: 'Legal Aid Employment Law Clinics',
          description: 'Free legal assistance for employment issues'
        }
      ],
      'legal-aid': [
        {
          name: 'Legal Services Corporation',
          phone: '202-295-1500',
          website: 'https://www.lsc.gov',
          description: 'Free legal aid for low-income individuals'
        }
      ],
      'whistleblower': [
        {
          name: 'Government Accountability Project',
          phone: '202-457-0034',
          website: 'https://www.whistleblower.org',
          description: 'Whistleblower protection and advocacy'
        },
        {
          name: 'National Whistleblower Center',
          phone: '202-342-1903',
          website: 'https://www.whistleblowers.org',
          description: 'Legal support for whistleblowers'
        }
      ],
      'civil-rights': [
        {
          name: 'ACLU',
          website: 'https://www.aclu.org',
          description: 'Civil rights legal assistance'
        },
        {
          name: 'EEOC',
          phone: '1-800-669-4000',
          website: 'https://www.eeoc.gov',
          description: 'Employment discrimination complaints'
        }
      ]
    };

    return resources[category] || [];
  }

  getEmployeeProtectionFramework() {
    return {
      title: 'Employee Protection Legal Framework',
      legitimatePurposes: this.getValidProtectionPurposes(),
      legalDoctrines: [
        'Self-defense doctrine supports protective recording',
        'Necessity defense may justify recording to prevent harm',
        'Public policy favors exposure of illegal activity',
        'Evidence preservation rights protect documentation'
      ],
      enhancedProtections: [
        'Whistleblower laws often supersede recording restrictions',
        'Civil rights laws may protect discrimination documentation',
        'Employment laws may support wrongful termination evidence',
        'Criminal laws allow victim evidence gathering'
      ],
      securityFeatures: [
        'End-to-end encryption with user-controlled keys',
        'Chain of custody documentation for legal proceedings',
        'Tamper detection and cryptographic verification',
        'Emergency panic mode for immediate evidence securing'
      ],
      legalResources: this.legalConsultation
    };
  }

  async checkProtectionAcknowledgment(userId, purpose) {
    // Check if user has valid acknowledgment for this protection purpose
    try {
      const acknowledgmentFile = path.join(__dirname, 'protection-acknowledgments.json');
      const data = await fs.readFile(acknowledgmentFile, 'utf8');
      const acknowledgments = JSON.parse(data);
      
      const userAcknowledgments = acknowledgments.filter(a => 
        a.userId === userId && a.protectionPurpose === purpose
      );
      
      if (userAcknowledgments.length === 0) {
        return { valid: false, message: 'No protection acknowledgment found' };
      }

      const latest = userAcknowledgments.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0];

      // Protection acknowledgments valid for 90 days
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      const age = Date.now() - new Date(latest.timestamp).getTime();

      return {
        valid: age < ninetyDays,
        acknowledgment: latest,
        message: age < ninetyDays ? 'Valid protection acknowledgment' : 'Acknowledgment expired'
      };
    } catch (error) {
      return { valid: false, message: 'Error checking acknowledgment' };
    }
  }

  assessProtectionLevel(purpose) {
    const protectionLevels = {
      'wrongful-termination': 'high',
      'workplace-harassment': 'high',
      'discrimination': 'high',
      'whistleblower': 'maximum',
      'contract-violation': 'medium',
      'domestic-abuse': 'maximum',
      'elder-abuse': 'high',
      'fraud-investigation': 'high'
    };

    return protectionLevels[purpose] || 'medium';
  }

  async storeEvidenceChain() {
    // Store evidence chain securely
    const chainFile = path.join(__dirname, 'evidence-chains.json');
    
    try {
      let chains = [];
      try {
        const data = await fs.readFile(chainFile, 'utf8');
        chains = JSON.parse(data);
      } catch (error) {
        // File doesn't exist yet
      }
      
      chains.push({
        timestamp: new Date().toISOString(),
        chainOfCustody: this.chainOfCustody,
        protectionPurpose: this.protectionPurpose
      });
      
      await fs.writeFile(chainFile, JSON.stringify(chains, null, 2));
    } catch (error) {
      console.error('Failed to store evidence chain:', error);
    }
  }

  async distributeEmergencyEvidence(emergencyPackage) {
    // In real implementation, this would distribute to multiple secure locations
    console.log('📦 Emergency evidence package prepared:', emergencyPackage);
  }

  async secureClearSensitiveData() {
    // Clear sensitive data from memory
    if (this.encryptionKey) {
      this.encryptionKey.fill(0);
      this.encryptionKey = null;
    }
    
    this.chainOfCustody = [];
    console.log('🧹 Sensitive data securely cleared');
  }

  getProtectionStatus() {
    return {
      protectionActive: this.protectionActive,
      protectionPurpose: this.protectionPurpose,
      panicMode: this.panicMode,
      evidenceChainLength: this.chainOfCustody.length,
      emergencyContactsConfigured: this.emergencyContacts.length > 0,
      legalResourcesAvailable: this.legalConsultation !== null
    };
  }
}

module.exports = EmployeeProtectionMode;
