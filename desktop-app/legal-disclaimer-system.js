const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Legal Disclaimer System for User-Controlled Stealth Mode
 * 
 * FRAMEWORK CLARIFICATION:
 * - The USER is recording their own meetings using this software
 * - The USER makes the decision to use stealth mode
 * - The USER assumes full legal responsibility for compliance
 * - The SOFTWARE provides tools; the USER controls usage
 * - Legal liability rests entirely with the USER, not the software provider
 * 
 * This system ensures users understand their responsibilities and legal obligations
 * before enabling advanced features that could have legal implications.
 */

class LegalDisclaimerSystem {
  constructor() {
    this.disclaimerVersion = '1.0.0';
    this.disclaimerDate = new Date().toISOString();
    this.userAcknowledgments = new Map();
    this.disclaimerPath = path.join(__dirname, 'legal-acknowledgments.json');
    
    // Comprehensive legal disclaimer content
    this.disclaimers = {
      stealthMode: {
        title: 'STEALTH MODE LEGAL DISCLAIMER AND USER RESPONSIBILITY',
        severity: 'CRITICAL',
        version: '1.0.0',
        sections: {
          userResponsibility: {
            title: 'USER RESPONSIBILITY AND CONTROL',
            content: [
              'YOU, the user, are choosing to record meetings using this software',
              'YOU control when and how the software operates',
              'YOU are responsible for obtaining all necessary consents',
              'YOU must comply with all applicable laws in your jurisdiction',
              'The software provider assumes NO responsibility for your usage'
            ]
          },
          legalObligations: {
            title: 'LEGAL OBLIGATIONS AND COMPLIANCE',
            content: [
              'Recording conversations may require consent from ALL participants',
              'Wiretapping laws vary by jurisdiction and can carry criminal penalties',
              'Privacy laws (GDPR, CCPA, etc.) may apply to recorded data',
              'Corporate policies may prohibit unauthorized recording',
              'Meeting platform Terms of Service may be violated',
              'You must research and comply with ALL applicable laws'
            ]
          },
          criminalLiability: {
            title: 'POTENTIAL CRIMINAL AND CIVIL LIABILITY',
            content: [
              'Unauthorized recording may constitute wiretapping (FELONY in many jurisdictions)',
              'Privacy law violations can result in fines up to €20M or 4% of revenue (GDPR)',
              'Civil lawsuits from recorded parties are possible',
              'Criminal prosecution is possible in many jurisdictions',
              'Employment termination may result from policy violations',
              'Professional licensing may be affected'
            ]
          },
          technicalRisks: {
            title: 'TECHNICAL AND SECURITY RISKS',
            content: [
              'Stealth features may be detected by security software',
              'Antivirus programs may flag the software as malicious',
              'Corporate security systems may detect and block usage',
              'System instability or crashes may occur',
              'Data may be lost or corrupted during stealth operation',
              'Software updates may break stealth functionality'
            ]
          },
          consentRequirements: {
            title: 'CONSENT AND NOTIFICATION REQUIREMENTS',
            content: [
              'You MUST obtain explicit consent from ALL meeting participants',
              'Consent requirements vary by jurisdiction (one-party vs. all-party)',
              'Some jurisdictions require audible notification of recording',
              'Written consent may be required in certain circumstances',
              'Consent must be informed (participants must understand what is being recorded)',
              'You must provide participants with your contact information'
            ]
          },
          dataHandling: {
            title: 'DATA HANDLING AND PRIVACY OBLIGATIONS',
            content: [
              'You are responsible for secure storage of recorded data',
              'Data retention policies must comply with applicable laws',
              'Participants may have rights to access, modify, or delete their data',
              'Cross-border data transfers may require additional compliance',
              'Data breaches must be reported according to applicable laws',
              'You must implement appropriate security measures'
            ]
          },
          corporateUse: {
            title: 'CORPORATE AND PROFESSIONAL USE',
            content: [
              'Corporate policies may prohibit unauthorized recording software',
              'IT security policies may be violated by stealth software',
              'Professional ethics codes may prohibit covert recording',
              'Client confidentiality agreements may be breached',
              'Regulatory compliance (SOX, HIPAA, etc.) may be affected',
              'You must obtain appropriate corporate approvals'
            ]
          },
          softwareProviderDisclaimer: {
            title: 'SOFTWARE PROVIDER DISCLAIMER',
            content: [
              'The software provider makes NO warranties about legal compliance',
              'The software provider assumes NO liability for user actions',
              'Users are solely responsible for legal compliance',
              'The software provider does not provide legal advice',
              'Users must consult qualified legal counsel',
              'This software is provided "AS IS" without warranties'
            ]
          }
        },
        acknowledgmentRequirements: [
          'I understand that I am choosing to record meetings using this software',
          'I acknowledge that I am solely responsible for legal compliance',
          'I will obtain all necessary consents before recording any meeting',
          'I have researched the laws in my jurisdiction regarding recording',
          'I understand the potential criminal and civil penalties',
          'I will not hold the software provider liable for my actions',
          'I will comply with all applicable privacy and data protection laws',
          'I will obtain appropriate corporate/professional approvals if required',
          'I understand that stealth features may be detected by security software',
          'I assume all risks associated with using stealth recording features'
        ]
      },
      audioRecording: {
        title: 'AUDIO RECORDING LEGAL DISCLAIMER',
        severity: 'HIGH',
        version: '1.0.0',
        sections: {
          consentLaws: {
            title: 'RECORDING CONSENT LAWS BY JURISDICTION',
            content: [
              'United States: Varies by state (one-party vs. all-party consent)',
              'European Union: Generally requires consent from all parties',
              'Canada: One-party consent in most provinces',
              'Australia: Varies by state/territory',
              'You MUST research the specific laws in your jurisdiction',
              'Laws may differ for in-person vs. electronic communications'
            ]
          },
          businessUse: {
            title: 'BUSINESS AND PROFESSIONAL RECORDING',
            content: [
              'Employee recording may require specific policies and consent',
              'Client recording may violate confidentiality agreements',
              'Regulatory industries may have specific recording requirements',
              'Cross-border calls may involve multiple jurisdictions',
              'Professional licensing boards may have recording restrictions'
            ]
          }
        },
        acknowledgmentRequirements: [
          'I understand the recording consent laws in my jurisdiction',
          'I will obtain appropriate consent before recording audio',
          'I understand the business and professional implications',
          'I will comply with all applicable regulations and policies'
        ]
      },
      screenCapture: {
        title: 'SCREEN CAPTURE LEGAL DISCLAIMER',
        severity: 'MEDIUM',
        version: '1.0.0',
        sections: {
          privacyRights: {
            title: 'SCREEN CONTENT PRIVACY RIGHTS',
            content: [
              'Screen content may contain confidential information',
              'Participants may have privacy expectations for shared content',
              'Screenshots may capture personal or sensitive information',
              'Corporate data may be subject to confidentiality agreements',
              'You must respect intellectual property rights in captured content'
            ]
          }
        },
        acknowledgmentRequirements: [
          'I understand privacy implications of screen capture',
          'I will respect confidentiality of captured content',
          'I will comply with intellectual property rights'
        ]
      }
    };
  }

  /**
   * Present comprehensive legal disclaimer for stealth mode activation
   */
  async presentStealthModeDisclaimer() {
    console.log('📋 PRESENTING STEALTH MODE LEGAL DISCLAIMER');
    console.log('=' .repeat(80));
    
    const disclaimer = this.disclaimers.stealthMode;
    
    console.log(`\n${disclaimer.title}`);
    console.log(`Severity: ${disclaimer.severity}`);
    console.log(`Version: ${disclaimer.version}`);
    console.log(`Date: ${new Date().toLocaleDateString()}`);
    console.log('=' .repeat(80));

    // Present each section of the disclaimer
    for (const [sectionKey, section] of Object.entries(disclaimer.sections)) {
      console.log(`\n📌 ${section.title}`);
      console.log('-' .repeat(section.title.length + 4));
      
      section.content.forEach((item, index) => {
        console.log(`${index + 1}. ${item}`);
      });
    }

    console.log('\n' + '=' .repeat(80));
    console.log('📝 REQUIRED ACKNOWLEDGMENTS');
    console.log('=' .repeat(80));
    
    disclaimer.acknowledgmentRequirements.forEach((requirement, index) => {
      console.log(`☐ ${index + 1}. ${requirement}`);
    });

    console.log('\n' + '=' .repeat(80));
    console.log('⚠️  FINAL WARNING');
    console.log('=' .repeat(80));
    console.log('By proceeding, you acknowledge that:');
    console.log('• You have read and understood all sections above');
    console.log('• You assume FULL legal responsibility for your actions');
    console.log('• The software provider has NO liability for your usage');
    console.log('• You will consult legal counsel if you have any doubts');
    console.log('• You understand this may be your only warning');

    return {
      disclaimer: disclaimer,
      requiresAcknowledgment: true,
      acknowledgmentMethod: 'explicit-checkbox-confirmation'
    };
  }

  /**
   * Create detailed acknowledgment form for stealth mode
   */
  async createStealthModeAcknowledgmentForm() {
    const disclaimer = this.disclaimers.stealthMode;
    
    const acknowledgmentForm = {
      title: 'STEALTH MODE ACTIVATION - LEGAL ACKNOWLEDGMENT REQUIRED',
      instructions: [
        'You MUST check ALL boxes below to proceed',
        'Each checkbox represents a legal acknowledgment',
        'False acknowledgment may increase your legal liability',
        'When in doubt, consult qualified legal counsel'
      ],
      sections: [
        {
          title: 'Legal Understanding',
          checkboxes: [
            {
              id: 'understand_laws',
              text: 'I have researched and understand the recording laws in my jurisdiction',
              required: true,
              severity: 'critical'
            },
            {
              id: 'understand_penalties',
              text: 'I understand the potential criminal and civil penalties for unauthorized recording',
              required: true,
              severity: 'critical'
            },
            {
              id: 'understand_consent',
              text: 'I understand my obligation to obtain consent from all meeting participants',
              required: true,
              severity: 'critical'
            }
          ]
        },
        {
          title: 'Responsibility Acceptance',
          checkboxes: [
            {
              id: 'accept_responsibility',
              text: 'I accept full legal responsibility for my use of this software',
              required: true,
              severity: 'critical'
            },
            {
              id: 'no_provider_liability',
              text: 'I will not hold the software provider liable for my actions or legal consequences',
              required: true,
              severity: 'critical'
            },
            {
              id: 'own_legal_counsel',
              text: 'I understand I should consult my own legal counsel for legal advice',
              required: true,
              severity: 'critical'
            }
          ]
        },
        {
          title: 'Compliance Commitment',
          checkboxes: [
            {
              id: 'obtain_consent',
              text: 'I commit to obtaining all necessary consents before recording',
              required: true,
              severity: 'critical'
            },
            {
              id: 'comply_laws',
              text: 'I commit to complying with all applicable laws and regulations',
              required: true,
              severity: 'critical'
            },
            {
              id: 'corporate_approval',
              text: 'I will obtain appropriate corporate/professional approvals if required',
              required: true,
              severity: 'high'
            }
          ]
        },
        {
          title: 'Technical Understanding',
          checkboxes: [
            {
              id: 'detection_risk',
              text: 'I understand that stealth features may be detected by security software',
              required: true,
              severity: 'medium'
            },
            {
              id: 'system_risks',
              text: 'I accept the risks of system instability or software conflicts',
              required: true,
              severity: 'medium'
            }
          ]
        }
      ],
      finalConfirmation: {
        text: 'I have read, understood, and agree to all terms above. I am proceeding with full knowledge of the legal and technical risks.',
        required: true,
        severity: 'critical'
      },
      legalNotice: [
        'This acknowledgment creates a legal record of your informed consent',
        'Your IP address, timestamp, and device information will be logged',
        'This acknowledgment may be used as evidence in legal proceedings',
        'Proceeding constitutes acceptance of all terms and conditions'
      ]
    };

    return acknowledgmentForm;
  }

  /**
   * Process user acknowledgment with comprehensive validation
   */
  async processStealthModeAcknowledgment(acknowledgmentData) {
    console.log('🔍 PROCESSING STEALTH MODE ACKNOWLEDGMENT');
    
    const form = await this.createStealthModeAcknowledgmentForm();
    const validation = this.validateAcknowledgment(acknowledgmentData, form);
    
    if (!validation.valid) {
      return {
        success: false,
        message: 'Incomplete acknowledgment - all required items must be confirmed',
        missingItems: validation.missingItems,
        requiresCompletion: true
      };
    }

    // Create acknowledgment record
    const acknowledgmentRecord = {
      userId: acknowledgmentData.userId || 'anonymous',
      timestamp: new Date().toISOString(),
      ipAddress: acknowledgmentData.ipAddress || 'unknown',
      userAgent: acknowledgmentData.userAgent || 'unknown',
      disclaimerVersion: this.disclaimerVersion,
      acknowledgmentHash: this.generateAcknowledgmentHash(acknowledgmentData),
      allItemsConfirmed: validation.allConfirmed,
      legalWarningShown: true,
      proceedingWithFullKnowledge: true
    };

    // Store acknowledgment record
    await this.storeAcknowledgmentRecord(acknowledgmentRecord);

    return {
      success: true,
      message: 'Legal acknowledgment completed - stealth mode may be activated',
      acknowledgmentId: acknowledgmentRecord.acknowledgmentHash,
      legalNotice: 'You have assumed full legal responsibility for stealth mode usage',
      activationPermitted: true,
      warnings: [
        'Remember to obtain consent from all meeting participants',
        'Comply with all applicable laws in your jurisdiction',
        'Consider consulting legal counsel for complex situations',
        'The software provider assumes no liability for your actions'
      ]
    };
  }

  validateAcknowledgment(acknowledgmentData, form) {
    const missingItems = [];
    let allConfirmed = true;

    // Check all required checkboxes
    for (const section of form.sections) {
      for (const checkbox of section.checkboxes) {
        if (checkbox.required && !acknowledgmentData.checkboxes[checkbox.id]) {
          missingItems.push(`${section.title}: ${checkbox.text}`);
          allConfirmed = false;
        }
      }
    }

    // Check final confirmation
    if (!acknowledgmentData.finalConfirmation) {
      missingItems.push('Final confirmation required');
      allConfirmed = false;
    }

    return {
      valid: allConfirmed,
      allConfirmed: allConfirmed,
      missingItems: missingItems
    };
  }

  generateAcknowledgmentHash(acknowledgmentData) {
    const hashInput = JSON.stringify({
      timestamp: acknowledgmentData.timestamp,
      userId: acknowledgmentData.userId,
      disclaimerVersion: this.disclaimerVersion,
      checkboxes: acknowledgmentData.checkboxes
    });
    
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  async storeAcknowledgmentRecord(record) {
    try {
      let existingRecords = [];
      
      try {
        const existingData = await fs.readFile(this.disclaimerPath, 'utf8');
        existingRecords = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist yet, start with empty array
      }
      
      existingRecords.push(record);
      
      await fs.writeFile(this.disclaimerPath, JSON.stringify(existingRecords, null, 2));
      
      console.log(`✅ Acknowledgment record stored: ${record.acknowledgmentHash}`);
    } catch (error) {
      console.error('Failed to store acknowledgment record:', error);
    }
  }

  /**
   * Check if user has valid acknowledgment for stealth mode
   */
  async checkStealthModeAcknowledgment(userId) {
    try {
      const records = await this.getAcknowledgmentRecords();
      const userRecords = records.filter(r => r.userId === userId);
      
      if (userRecords.length === 0) {
        return {
          hasValidAcknowledgment: false,
          message: 'No acknowledgment found - legal disclaimer required'
        };
      }

      const latestRecord = userRecords.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0];

      // Check if acknowledgment is recent (within 30 days)
      const acknowledgmentAge = Date.now() - new Date(latestRecord.timestamp).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      if (acknowledgmentAge > thirtyDays) {
        return {
          hasValidAcknowledgment: false,
          message: 'Acknowledgment expired - please re-acknowledge legal terms',
          lastAcknowledgment: latestRecord.timestamp
        };
      }

      return {
        hasValidAcknowledgment: true,
        acknowledgmentDate: latestRecord.timestamp,
        acknowledgmentId: latestRecord.acknowledgmentHash,
        message: 'Valid legal acknowledgment found'
      };
    } catch (error) {
      return {
        hasValidAcknowledgment: false,
        message: 'Error checking acknowledgment records',
        error: error.message
      };
    }
  }

  async getAcknowledgmentRecords() {
    try {
      const data = await fs.readFile(this.disclaimerPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate jurisdiction-specific legal guidance
   */
  getJurisdictionGuidance(jurisdiction) {
    const guidance = {
      'united-states': {
        consentLaws: 'Varies by state - 11 states require all-party consent, others allow one-party consent',
        keyStates: {
          allPartyConsent: ['California', 'Connecticut', 'Florida', 'Illinois', 'Maryland', 'Massachusetts', 'Montana', 'New Hampshire', 'Pennsylvania', 'Washington'],
          onePartyConsent: 'Most other states allow recording with consent of one party (yourself)'
        },
        federalLaws: 'Federal wiretapping laws generally allow one-party consent for calls you participate in',
        recommendations: [
          'Check your specific state laws',
          'When in doubt, obtain consent from all parties',
          'Be aware of interstate call complications',
          'Consider corporate policies and professional ethics'
        ]
      },
      'european-union': {
        consentLaws: 'GDPR generally requires consent from all parties for recording',
        keyRequirements: [
          'Explicit consent required for personal data processing',
          'Clear information about recording purpose and duration',
          'Right to withdraw consent at any time',
          'Data minimization and purpose limitation principles apply'
        ],
        penalties: 'Up to €20M or 4% of annual revenue, whichever is higher',
        recommendations: [
          'Always obtain explicit consent from all participants',
          'Provide clear privacy notices',
          'Implement data subject rights (access, deletion, etc.)',
          'Consider data protection impact assessments'
        ]
      },
      'canada': {
        consentLaws: 'Generally one-party consent, but varies by province',
        federalLaw: 'Criminal Code allows recording with consent of one party to the conversation',
        provincialVariations: 'Some provinces have additional privacy legislation',
        recommendations: [
          'One-party consent generally sufficient federally',
          'Check provincial privacy laws',
          'Be aware of workplace recording policies',
          'Consider professional regulatory requirements'
        ]
      },
      'australia': {
        consentLaws: 'Varies by state and territory',
        keyStates: {
          allPartyConsent: ['Queensland', 'South Australia', 'Tasmania', 'Western Australia'],
          onePartyConsent: ['New South Wales', 'Victoria', 'Australian Capital Territory', 'Northern Territory']
        },
        recommendations: [
          'Check your specific state/territory laws',
          'Workplace recording may have additional requirements',
          'Consider Privacy Act implications for personal information'
        ]
      }
    };

    return guidance[jurisdiction] || {
      message: 'Jurisdiction-specific guidance not available',
      recommendation: 'Consult local legal counsel for recording laws in your jurisdiction'
    };
  }

  /**
   * Create comprehensive legal compliance checklist
   */
  createLegalComplianceChecklist() {
    return {
      title: 'LEGAL COMPLIANCE CHECKLIST FOR MEETING RECORDING',
      sections: {
        beforeRecording: {
          title: 'BEFORE STARTING ANY RECORDING',
          items: [
            '☐ Research recording laws in your jurisdiction',
            '☐ Research recording laws in participants\' jurisdictions (for international calls)',
            '☐ Check corporate/organizational policies on recording',
            '☐ Review meeting platform Terms of Service',
            '☐ Prepare consent scripts or forms',
            '☐ Plan secure storage for recorded data',
            '☐ Consider data retention and deletion policies'
          ]
        },
        duringMeeting: {
          title: 'DURING THE MEETING',
          items: [
            '☐ Announce recording at the beginning',
            '☐ Obtain explicit consent from ALL participants',
            '☐ Provide your contact information',
            '☐ Explain the purpose of recording',
            '☐ Inform participants of their rights',
            '☐ Stop recording if anyone objects or leaves',
            '☐ Document consent in meeting notes'
          ]
        },
        afterRecording: {
          title: 'AFTER RECORDING',
          items: [
            '☐ Store recordings securely with appropriate access controls',
            '☐ Implement data retention policy',
            '☐ Provide access to participants if requested',
            '☐ Honor deletion requests promptly',
            '☐ Report data breaches if required by law',
            '☐ Maintain records of consent and data handling',
            '☐ Regular review of stored recordings for retention compliance'
          ]
        },
        corporateUse: {
          title: 'CORPORATE/PROFESSIONAL USE',
          items: [
            '☐ Obtain IT/Legal department approval',
            '☐ Ensure compliance with industry regulations',
            '☐ Review client confidentiality agreements',
            '☐ Check professional licensing requirements',
            '☐ Implement appropriate security measures',
            '☐ Train users on proper recording procedures',
            '☐ Regular compliance audits'
          ]
        }
      },
      emergencyContacts: {
        title: 'WHEN IN DOUBT',
        contacts: [
          'Consult qualified legal counsel in your jurisdiction',
          'Contact your corporate legal department',
          'Review professional association guidelines',
          'Consult privacy regulators if applicable'
        ]
      }
    };
  }
}

module.exports = LegalDisclaimerSystem;
