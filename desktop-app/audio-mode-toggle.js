/**
 * Audio Processing Mode Toggle Implementation
 * 
 * BRUTAL HONESTY: Mode Toggle Reality
 * - Standard Mode: Uses Electron APIs with user permission (legal, limited)
 * - Stealth Mode: Attempts system-level capture (powerful, illegal without consent)
 * 
 * This module provides the toggle functionality between modes with full
 * transparency about capabilities, limitations, and legal implications.
 */

class AudioModeToggle {
  constructor(audioProcessor) {
    this.audioProcessor = audioProcessor;
    this.currentMode = 'standard';
    this.modeCapabilities = {
      standard: {
        name: 'Standard Mode',
        description: 'Uses standard Electron audio APIs with user permission',
        legalStatus: 'LEGAL - Requires user consent',
        detectability: 'Fully visible to user and system',
        capabilities: {
          microphoneAccess: true,
          systemAudio: false, // Requires virtual audio cable
          realTimeProcessing: true,
          speakerIdentification: false,
          backgroundNoise: 'Poor handling',
          accuracy: '70-85%'
        },
        limitations: [
          'User permission dialog required',
          'System audio needs virtual cable setup',
          'Visible in all system monitoring',
          'Corporate security may block'
        ],
        requirements: [
          'User grants microphone permission',
          'Virtual audio cable for system audio',
          'Stable internet for cloud STT'
        ]
      },
      stealth: {
        name: 'Stealth Mode',
        description: 'Attempts system-level audio capture with minimal detection',
        legalStatus: 'ILLEGAL WITHOUT CONSENT - Severe legal risks',
        detectability: 'Low to Medium - depends on implementation',
        capabilities: {
          microphoneAccess: true,
          systemAudio: true, // Direct system audio capture
          realTimeProcessing: true,
          speakerIdentification: true, // Better audio quality
          backgroundNoise: 'Better handling',
          accuracy: '80-95%'
        },
        limitations: [
          'Requires administrator/root privileges',
          'May be detected by security software',
          'OS updates frequently break functionality',
          'High technical complexity'
        ],
        requirements: [
          'Administrator/root access',
          'Native system audio drivers',
          'Security software bypass',
          'Legal consent from all participants'
        ]
      }
    };
  }

  /**
   * Toggle between standard and stealth modes
   */
  async toggleMode() {
    const newMode = this.currentMode === 'standard' ? 'stealth' : 'standard';
    return await this.setMode(newMode);
  }

  /**
   * Set specific processing mode with full validation
   */
  async setMode(mode) {
    console.log(`🔄 SWITCHING FROM ${this.currentMode.toUpperCase()} TO ${mode.toUpperCase()} MODE`);

    if (!this.modeCapabilities[mode]) {
      return {
        success: false,
        message: `Unknown mode: ${mode}`,
        availableModes: Object.keys(this.modeCapabilities)
      };
    }

    // Stop current recording if active
    if (this.audioProcessor.isRecording) {
      console.log('⏹️  Stopping current recording before mode switch...');
      await this.audioProcessor.stopAudioRecording();
    }

    // Show mode information and warnings
    const modeInfo = this.modeCapabilities[mode];
    console.log(`📋 MODE: ${modeInfo.name}`);
    console.log(`📝 DESCRIPTION: ${modeInfo.description}`);
    console.log(`⚖️  LEGAL STATUS: ${modeInfo.legalStatus}`);
    console.log(`👁️  DETECTABILITY: ${modeInfo.detectability}`);

    // Handle stealth mode with extra warnings
    if (mode === 'stealth') {
      const stealthWarning = await this.handleStealthModeWarnings();
      if (!stealthWarning.proceed) {
        return {
          success: false,
          message: 'Stealth mode activation cancelled',
          reason: stealthWarning.reason,
          recommendation: 'Use standard mode with explicit participant consent'
        };
      }
    }

    // Attempt to initialize the new mode
    try {
      const initResult = await this.initializeMode(mode);
      
      if (initResult.success) {
        this.currentMode = mode;
        this.audioProcessor.processingMode = mode;
        
        return {
          success: true,
          mode: mode,
          capabilities: modeInfo.capabilities,
          limitations: modeInfo.limitations,
          requirements: modeInfo.requirements,
          initializationDetails: initResult,
          warning: mode === 'stealth' ? 'USER ASSUMES FULL LEGAL RESPONSIBILITY' : null
        };
      } else {
        return {
          success: false,
          message: `Failed to initialize ${mode} mode`,
          details: initResult,
          fallbackMode: this.currentMode
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Mode switch failed: ${error.message}`,
        technicalDetails: error.stack,
        fallbackMode: this.currentMode
      };
    }
  }

  async handleStealthModeWarnings() {
    console.log('🚨 STEALTH MODE ACTIVATION WARNINGS');
    console.log('');
    console.log('⚖️  LEGAL RISKS:');
    console.log('   • Recording without consent may constitute wiretapping (FELONY)');
    console.log('   • Privacy law violations: GDPR fines up to €20M or 4% revenue');
    console.log('   • Corporate policy violations may result in termination');
    console.log('   • Meeting platform ToS violations can result in legal action');
    console.log('');
    console.log('🔒 TECHNICAL RISKS:');
    console.log('   • May be detected by antivirus/security software');
    console.log('   • Requires administrator privileges');
    console.log('   • System instability possible');
    console.log('   • OS updates may break functionality');
    console.log('');
    console.log('📋 REQUIREMENTS:');
    console.log('   • Explicit consent from ALL meeting participants');
    console.log('   • Compliance with local wiretapping laws');
    console.log('   • Corporate security policy approval');
    console.log('   • Technical expertise for troubleshooting');

    // BRUTAL HONESTY: In a real implementation, this would require explicit user acknowledgment
    const userAcknowledgment = await this.requireExplicitAcknowledgment();
    
    return userAcknowledgment;
  }

  async requireExplicitAcknowledgment() {
    // BRUTAL HONESTY: This should be a serious dialog requiring multiple confirmations
    console.log('');
    console.log('📝 EXPLICIT ACKNOWLEDGMENT REQUIRED:');
    console.log('   [ ] I have obtained explicit consent from ALL meeting participants');
    console.log('   [ ] I have verified compliance with local wiretapping laws');
    console.log('   [ ] I have approval from corporate security (if applicable)');
    console.log('   [ ] I understand the severe legal and technical risks');
    console.log('   [ ] I assume full legal responsibility for stealth audio capture');
    console.log('');

    // In a real implementation, this would show a dialog with checkboxes
    // For this demonstration, we default to NOT proceeding for safety
    return {
      proceed: false,
      reason: 'User acknowledgment required for stealth mode activation',
      message: 'Stealth mode requires explicit user acknowledgment of legal risks'
    };
  }

  async initializeMode(mode) {
    if (mode === 'standard') {
      return await this.initializeStandardMode();
    } else if (mode === 'stealth') {
      return await this.initializeStealthMode();
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }
  }

  async initializeStandardMode() {
    console.log('📢 INITIALIZING STANDARD MODE');
    
    // Standard mode uses Electron's built-in audio APIs
    const standardCapabilities = {
      audioAPI: 'Electron MediaDevices API',
      permissionRequired: true,
      systemAudioSupport: false,
      detectability: 'Fully visible',
      legalCompliance: 'Transparent operation'
    };

    // Check if audio devices are available
    const deviceCheck = await this.audioProcessor.detectAudioDevices();
    
    return {
      success: deviceCheck.success,
      mode: 'standard',
      capabilities: standardCapabilities,
      deviceStatus: deviceCheck,
      warnings: [
        'User permission dialog will be shown',
        'System audio requires virtual cable setup',
        'Fully visible to system monitoring'
      ]
    };
  }

  async initializeStealthMode() {
    console.log('🥷 INITIALIZING STEALTH MODE');
    
    // Use the stealth methods module
    const stealthResult = await this.audioProcessor.stealthMethods.setProcessingMode('stealth');
    
    if (stealthResult.success) {
      return {
        success: true,
        mode: 'stealth',
        capabilities: stealthResult.capabilities,
        detectabilityRisk: stealthResult.detectabilityRisk,
        technicalDetails: stealthResult.technicalDetails,
        warnings: [
          'LEGAL RESPONSIBILITY ASSUMED BY USER',
          'May be detected by security software',
          'Requires elevated system privileges',
          'OS updates may break functionality'
        ]
      };
    } else {
      return {
        success: false,
        mode: 'stealth',
        message: stealthResult.message,
        limitations: stealthResult.limitations,
        recommendation: stealthResult.recommendation
      };
    }
  }

  /**
   * Get current mode information
   */
  getCurrentModeInfo() {
    const modeInfo = this.modeCapabilities[this.currentMode];
    
    return {
      currentMode: this.currentMode,
      name: modeInfo.name,
      description: modeInfo.description,
      legalStatus: modeInfo.legalStatus,
      detectability: modeInfo.detectability,
      capabilities: modeInfo.capabilities,
      limitations: modeInfo.limitations,
      requirements: modeInfo.requirements
    };
  }

  /**
   * Get comparison between modes
   */
  getModeComparison() {
    return {
      comparison: {
        legalCompliance: {
          standard: '✅ Legal with user consent',
          stealth: '❌ Illegal without participant consent'
        },
        audioQuality: {
          standard: '⚠️  Limited - microphone only',
          stealth: '✅ Full system audio capture'
        },
        detectability: {
          standard: '❌ Fully visible to users',
          stealth: '⚠️  Low to medium detection risk'
        },
        setup: {
          standard: '✅ Simple - built-in APIs',
          stealth: '❌ Complex - requires system access'
        },
        reliability: {
          standard: '✅ Stable across OS updates',
          stealth: '❌ Breaks with system updates'
        },
        accuracy: {
          standard: '⚠️  70-85% (microphone dependent)',
          stealth: '✅ 80-95% (direct audio capture)'
        }
      },
      recommendation: {
        forLegalUse: 'standard',
        forMaximumCapability: 'stealth (with legal consent)',
        forCorporateEnvironment: 'standard',
        forPersonalUse: 'standard (with participant consent)'
      }
    };
  }

  /**
   * BRUTAL HONESTY: Overall assessment of mode toggle functionality
   */
  getModeToggleAssessment() {
    return {
      implementationStatus: 'FUNCTIONAL WITH LIMITATIONS',
      legalWarning: 'STEALTH MODE CARRIES SEVERE LEGAL RISKS',
      technicalReality: 'STEALTH MODE REQUIRES SIGNIFICANT ADDITIONAL DEVELOPMENT',
      
      assessment: {
        standardMode: {
          status: 'Ready for implementation',
          complexity: 'Low',
          legalRisk: 'Low (with consent)',
          userExperience: 'Good (transparent)',
          reliability: 'High'
        },
        stealthMode: {
          status: 'Prototype/concept only',
          complexity: 'Very High',
          legalRisk: 'Extremely High',
          userExperience: 'Poor (complex setup)',
          reliability: 'Low (OS dependent)'
        }
      },

      honestRecommendation: {
        summary: 'IMPLEMENT STANDARD MODE ONLY',
        reasoning: [
          'Legal compliance is essential',
          'Standard mode provides sufficient functionality',
          'Stealth mode development cost/risk is too high',
          'Alternative approaches are more effective'
        ],
        alternatives: [
          'Use official meeting platform APIs',
          'Focus on post-meeting audio processing',
          'Implement excellent text-based analysis',
          'Provide clear value through transparency'
        ]
      }
    };
  }
}

module.exports = AudioModeToggle;
