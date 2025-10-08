const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Import our enhanced modules
const AIService = require('./ai-service-enhanced');
const ScreenCapture = require('./screen-capture');
const AudioProcessor = require('./audio-processor');
const AudioModeToggle = require('./audio-mode-toggle');
const StealthAudioImplementation = require('./stealth-audio-implementation');
const LegalDisclaimerSystem = require('./legal-disclaimer-system');
const PlatformIntegrations = require('./platform-integrations');
const RealTimeProcessor = require('./real-time-processor');
const MultiVisionAPISystem = require('./multi-vision-api-system');
const CollaborativeAIOverlay = require('./collaborative-ai-overlay');

/**
 * MeetingMind Desktop Application with Stealth Capabilities
 * 
 * USER RESPONSIBILITY FRAMEWORK:
 * - Users choose to record their own meetings
 * - Users assume full legal responsibility
 * - Software provides tools with appropriate warnings
 * - Legal compliance is user's responsibility
 */

class MeetingMindApp {
  constructor() {
    this.mainWindow = null;
    this.aiSettingsWindow = null;
    this.legalDisclaimerWindow = null;
    this.overlayWindow = null;
    
    // Initialize core services
    this.aiService = new AIService();
    this.screenCapture = new ScreenCapture();
    this.audioProcessor = new AudioProcessor();
    this.audioModeToggle = new AudioModeToggle(this.audioProcessor);
    this.stealthAudio = new StealthAudioImplementation();
    this.legalSystem = new LegalDisclaimerSystem();
    this.platformIntegrations = new PlatformIntegrations();
    this.realTimeProcessor = new RealTimeProcessor(
      this.aiService,
      this.screenCapture,
      this.audioProcessor,
      this.platformIntegrations
    );
    
    this.isStealthModeActive = false;
    this.currentUserId = 'default-user'; // In real app, this would be from authentication
  }

  async initialize() {
    console.log('🚀 Initializing MeetingMind Desktop Application');
    
    // Set up app event handlers
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupApplicationMenu();
      this.setupIpcHandlers();
      this.initializeServices();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // Handle app termination
    app.on('before-quit', async () => {
      await this.cleanup();
    });
  }

  createMainWindow() {
    console.log('🪟 Creating main application window');
    
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, 'assets', 'icon.png'),
      title: 'MeetingMind - AI Meeting Assistant',
      show: false
    });

    // Load the React app
    this.mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      console.log('✅ Main window ready and visible');
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  setupApplicationMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'AI Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.openAISettings()
          },
          {
            label: 'Legal Disclaimer',
            click: () => this.openLegalDisclaimer()
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'Recording',
        submenu: [
          {
            label: 'Standard Mode',
            type: 'radio',
            checked: !this.isStealthModeActive,
            click: () => this.setRecordingMode('standard')
          },
          {
            label: 'Stealth Mode',
            type: 'radio',
            checked: this.isStealthModeActive,
            click: () => this.requestStealthModeActivation()
          },
          { type: 'separator' },
          {
            label: 'Start Recording',
            accelerator: 'CmdOrCtrl+R',
            click: () => this.startRecording()
          },
          {
            label: 'Stop Recording',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.stopRecording()
          }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Real-Time Processing',
            type: 'checkbox',
            click: (menuItem) => this.toggleRealTimeProcessing(menuItem.checked)
          },
          {
            label: 'Show Overlay',
            type: 'checkbox',
            click: (menuItem) => this.toggleOverlay(menuItem.checked)
          },
          { type: 'separator' },
          {
            label: 'Platform Integrations',
            click: () => this.openPlatformIntegrations()
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Legal Compliance Guide',
            click: () => this.openLegalComplianceGuide()
          },
          {
            label: 'User Responsibility Framework',
            click: () => this.openUserResponsibilityGuide()
          },
          { type: 'separator' },
          {
            label: 'About MeetingMind',
            click: () => this.showAboutDialog()
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIpcHandlers() {
    console.log('🔗 Setting up IPC handlers');

    // AI Service handlers
    ipcMain.handle('ai-generate-insights', async (event, text, context) => {
      return await this.aiService.generateInsights(text, context);
    });

    ipcMain.handle('ai-search-knowledge', async (event, query, context) => {
      return await this.aiService.searchKnowledge(query, context);
    });

    ipcMain.handle('ai-generate-followup', async (event, meetingData) => {
      return await this.aiService.generateFollowUpEmail(meetingData);
    });

    // Audio processing handlers
    ipcMain.handle('audio-toggle-mode', async (event) => {
      return await this.audioModeToggle.toggleMode();
    });

    ipcMain.handle('audio-set-mode', async (event, mode) => {
      return await this.audioModeToggle.setMode(mode);
    });

    ipcMain.handle('audio-start-recording', async (event, options) => {
      return await this.audioProcessor.startAudioRecording(options);
    });

    ipcMain.handle('audio-stop-recording', async (event) => {
      return await this.audioProcessor.stopAudioRecording();
    });

    // Stealth mode handlers
    ipcMain.handle('stealth-request-activation', async (event, options) => {
      return await this.requestStealthModeActivation(options);
    });

    ipcMain.handle('stealth-process-acknowledgment', async (event, acknowledgmentData) => {
      return await this.processStealthAcknowledgment(acknowledgmentData);
    });

    ipcMain.handle('stealth-deactivate', async (event) => {
      return await this.deactivateStealthMode();
    });

    ipcMain.handle('stealth-get-status', async (event) => {
      return this.getStealthStatus();
    });

    // Legal system handlers
    ipcMain.handle('legal-get-disclaimer', async (event, type) => {
      return await this.legalSystem.presentStealthModeDisclaimer();
    });

    ipcMain.handle('legal-get-acknowledgment-form', async (event) => {
      return await this.legalSystem.createStealthModeAcknowledgmentForm();
    });

    ipcMain.handle('legal-check-acknowledgment', async (event, userId) => {
      return await this.legalSystem.checkStealthModeAcknowledgment(userId);
    });

    // Screen capture handlers
    ipcMain.handle('screen-start-capture', async (event, options) => {
      return await this.screenCapture.startScreenCapture(options);
    });

    ipcMain.handle('screen-stop-capture', async (event) => {
      return await this.screenCapture.stopScreenCapture();
    });

    // Real-time processing handlers
    ipcMain.handle('realtime-start', async (event, options) => {
      return await this.realTimeProcessor.startRealTimeProcessing(options);
    });

    ipcMain.handle('realtime-stop', async (event) => {
      return await this.realTimeProcessor.stopRealTimeProcessing();
    });

    ipcMain.handle('realtime-get-status', async (event) => {
      return this.realTimeProcessor.getProcessingStatus();
    });

    // Platform integration handlers
    ipcMain.handle('platform-initialize', async (event, platform, credentials) => {
      return await this.platformIntegrations.initializePlatformIntegration(platform, credentials);
    });

    // System handlers
    ipcMain.handle('app-get-version', async (event) => {
      return app.getVersion();
    });

    ipcMain.handle('app-show-message-box', async (event, options) => {
      return await dialog.showMessageBox(this.mainWindow, options);
    });
  }

  async initializeServices() {
    console.log('⚙️  Initializing application services');
    
    try {
      // Initialize AI service
      await this.aiService.initialize();
      console.log('✅ AI service initialized');

      // Initialize other services
      console.log('✅ All services initialized successfully');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
    }
  }

  async requestStealthModeActivation(options = {}) {
    console.log('🥷 Stealth mode activation requested');
    
    try {
      const result = await this.stealthAudio.activateStealthMode(this.currentUserId, options);
      
      if (result.requiresLegalAcknowledgment) {
        // Show legal disclaimer window
        await this.showLegalDisclaimerWindow(result);
        return result;
      }

      if (result.success) {
        this.isStealthModeActive = true;
        this.updateMenuStealthMode(true);
        
        // Show success notification
        await dialog.showMessageBox(this.mainWindow, {
          type: 'warning',
          title: 'Stealth Mode Activated',
          message: 'Stealth mode is now active. Remember your legal responsibilities.',
          detail: 'You must obtain consent from ALL meeting participants before recording.',
          buttons: ['I Understand']
        });
      }

      return result;
    } catch (error) {
      console.error('Stealth mode activation error:', error);
      return {
        success: false,
        message: `Stealth mode activation failed: ${error.message}`
      };
    }
  }

  async processStealthAcknowledgment(acknowledgmentData) {
    console.log('📋 Processing stealth mode legal acknowledgment');
    
    try {
      acknowledgmentData.userId = this.currentUserId;
      acknowledgmentData.timestamp = new Date().toISOString();
      
      const result = await this.legalSystem.processStealthModeAcknowledgment(acknowledgmentData);
      
      if (result.success && result.activationPermitted) {
        // Now attempt to activate stealth mode
        const activationResult = await this.stealthAudio.activateStealthMode(this.currentUserId);
        
        if (activationResult.success) {
          this.isStealthModeActive = true;
          this.updateMenuStealthMode(true);
        }
        
        return {
          ...result,
          stealthActivation: activationResult
        };
      }
      
      return result;
    } catch (error) {
      console.error('Acknowledgment processing error:', error);
      return {
        success: false,
        message: `Acknowledgment processing failed: ${error.message}`
      };
    }
  }

  async deactivateStealthMode() {
    console.log('🛑 Deactivating stealth mode');
    
    try {
      const result = await this.stealthAudio.deactivateStealthMode();
      
      if (result.success) {
        this.isStealthModeActive = false;
        this.updateMenuStealthMode(false);
      }
      
      return result;
    } catch (error) {
      console.error('Stealth mode deactivation error:', error);
      return {
        success: false,
        message: `Stealth mode deactivation failed: ${error.message}`
      };
    }
  }

  getStealthStatus() {
    return {
      isActive: this.isStealthModeActive,
      stealthAudioStatus: this.stealthAudio.getStealthStatus(),
      legalFramework: 'User responsibility model',
      currentUser: this.currentUserId
    };
  }

  updateMenuStealthMode(isActive) {
    const menu = Menu.getApplicationMenu();
    if (menu) {
      const recordingMenu = menu.items.find(item => item.label === 'Recording');
      if (recordingMenu) {
        const standardMode = recordingMenu.submenu.items.find(item => item.label === 'Standard Mode');
        const stealthMode = recordingMenu.submenu.items.find(item => item.label === 'Stealth Mode');
        
        if (standardMode) standardMode.checked = !isActive;
        if (stealthMode) stealthMode.checked = isActive;
      }
    }
  }

  async showLegalDisclaimerWindow(disclaimerData) {
    console.log('📋 Showing legal disclaimer window');
    
    if (this.legalDisclaimerWindow) {
      this.legalDisclaimerWindow.focus();
      return;
    }

    this.legalDisclaimerWindow = new BrowserWindow({
      width: 900,
      height: 700,
      parent: this.mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      title: 'Legal Disclaimer - Stealth Mode Activation'
    });

    // Load legal disclaimer HTML
    await this.legalDisclaimerWindow.loadFile(path.join(__dirname, 'legal-disclaimer.html'));
    
    // Send disclaimer data to window
    this.legalDisclaimerWindow.webContents.once('dom-ready', () => {
      this.legalDisclaimerWindow.webContents.send('disclaimer-data', disclaimerData);
    });

    this.legalDisclaimerWindow.on('closed', () => {
      this.legalDisclaimerWindow = null;
    });
  }

  async setRecordingMode(mode) {
    console.log(`🔄 Setting recording mode: ${mode}`);
    
    if (mode === 'stealth') {
      await this.requestStealthModeActivation();
    } else {
      await this.deactivateStealthMode();
    }
  }

  async startRecording() {
    console.log('🎙️  Starting recording');
    
    const mode = this.isStealthModeActive ? 'stealth' : 'standard';
    
    try {
      const result = await this.audioProcessor.startAudioRecording({
        mode: mode,
        engine: 'whisper',
        realTime: true
      });
      
      if (result.success) {
        await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Recording Started',
          message: `Recording started in ${mode} mode`,
          detail: mode === 'stealth' ? 
            'Remember: You are legally responsible for obtaining consent from all participants.' :
            'Standard recording mode active with user permissions.',
          buttons: ['OK']
        });
      } else {
        await dialog.showErrorBox('Recording Failed', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('Recording start error:', error);
      await dialog.showErrorBox('Recording Error', error.message);
    }
  }

  async stopRecording() {
    console.log('⏹️  Stopping recording');
    
    try {
      const result = await this.audioProcessor.stopAudioRecording();
      
      if (result.success) {
        await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Recording Stopped',
          message: 'Recording has been stopped successfully',
          buttons: ['OK']
        });
      }
      
      return result;
    } catch (error) {
      console.error('Recording stop error:', error);
      await dialog.showErrorBox('Recording Error', error.message);
    }
  }

  async toggleRealTimeProcessing(enabled) {
    console.log(`🔄 Toggling real-time processing: ${enabled}`);
    
    try {
      if (enabled) {
        const result = await this.realTimeProcessor.startRealTimeProcessing({
          mode: 'balanced',
          enableScreenCapture: false,
          enableAudioProcessing: true,
          enablePlatformIntegration: false
        });
        
        if (!result.success) {
          await dialog.showErrorBox('Real-Time Processing Failed', result.message);
        }
      } else {
        await this.realTimeProcessor.stopRealTimeProcessing();
      }
    } catch (error) {
      console.error('Real-time processing toggle error:', error);
    }
  }

  async toggleOverlay(enabled) {
    console.log(`🔄 Toggling overlay window: ${enabled}`);
    
    if (enabled) {
      await this.createOverlayWindow();
    } else {
      if (this.overlayWindow) {
        this.overlayWindow.close();
        this.overlayWindow = null;
      }
    }
  }

  async createOverlayWindow() {
    if (this.overlayWindow) {
      this.overlayWindow.focus();
      return;
    }

    this.overlayWindow = new BrowserWindow({
      width: 300,
      height: 200,
      alwaysOnTop: true,
      frame: false,
      transparent: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      title: 'MeetingMind Overlay'
    });

    await this.overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });
  }

  openAISettings() {
    console.log('⚙️  Opening AI settings');
    
    if (this.aiSettingsWindow) {
      this.aiSettingsWindow.focus();
      return;
    }

    this.aiSettingsWindow = new BrowserWindow({
      width: 600,
      height: 500,
      parent: this.mainWindow,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      title: 'AI Settings'
    });

    this.aiSettingsWindow.loadFile(path.join(__dirname, 'ai-settings.html'));

    this.aiSettingsWindow.on('closed', () => {
      this.aiSettingsWindow = null;
    });
  }

  async openLegalComplianceGuide() {
    const checklist = this.legalSystem.createLegalComplianceChecklist();
    
    await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Legal Compliance Guide',
      message: 'Legal Compliance Checklist',
      detail: 'Please review the legal compliance requirements before using recording features.',
      buttons: ['Open Full Guide', 'Close']
    });
  }

  async openUserResponsibilityGuide() {
    await dialog.showMessageBox(this.mainWindow, {
      type: 'warning',
      title: 'User Responsibility Framework',
      message: 'Important: User Responsibility for Recording',
      detail: 'You, the user, are responsible for:\n\n' +
              '• Obtaining consent from ALL meeting participants\n' +
              '• Complying with local recording laws\n' +
              '• Following corporate policies\n' +
              '• Respecting privacy rights\n' +
              '• Secure data handling\n\n' +
              'The software provider assumes NO liability for your usage.',
      buttons: ['I Understand']
    });
  }

  async showAboutDialog() {
    await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About MeetingMind',
      message: 'MeetingMind - AI Meeting Assistant',
      detail: `Version: ${app.getVersion()}\n\n` +
              'Advanced AI-powered meeting assistance with user-controlled recording capabilities.\n\n' +
              'User Responsibility Framework: Users assume full legal responsibility for recording compliance.\n\n' +
              'Built with Electron, React, and advanced AI integration.',
      buttons: ['OK']
    });
  }

  async cleanup() {
    console.log('🧹 Cleaning up application resources');
    
    try {
      // Stop any active recording
      if (this.audioProcessor.isRecording) {
        await this.audioProcessor.stopAudioRecording();
      }

      // Deactivate stealth mode
      if (this.isStealthModeActive) {
        await this.stealthAudio.deactivateStealthMode();
      }

      // Stop real-time processing
      if (this.realTimeProcessor.isProcessing) {
        await this.realTimeProcessor.stopRealTimeProcessing();
      }

      console.log('✅ Application cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

// Initialize and start the application
const meetingMindApp = new MeetingMindApp();
meetingMindApp.initialize();

module.exports = MeetingMindApp;
