const { ipcMain, Notification, powerMonitor, screen, desktopCapturer } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const AIService = require('./ai-service');

class DesktopFeatures {
  constructor() {
    this.isListening = false;
    this.meetingData = [];
    this.settings = {};
    this.aiService = new AIService();
    this.initializeFeatures();
  }

  initializeFeatures() {
    this.setupIpcHandlers();
    this.setupPowerMonitoring();
    this.loadSettings();
  }

  setupIpcHandlers() {
    // Audio/Meeting features
    ipcMain.handle('start-listening', async () => {
      this.isListening = true;
      this.showNotification('MeetingMind', 'Started listening for meeting audio');
      return { success: true, message: 'Listening started' };
    });

    ipcMain.handle('stop-listening', async () => {
      this.isListening = false;
      this.showNotification('MeetingMind', 'Stopped listening');
      return { success: true, message: 'Listening stopped' };
    });

    // AI Insights simulation
    ipcMain.handle('get-insights', async (event, text) => {
      const insights = await this.generateInsights(text);
      return insights;
    });

    // Knowledge search
    ipcMain.handle('search-knowledge', async (event, query) => {
      const results = await this.searchKnowledge(query);
      return results;
    });

    // Follow-up email generation
    ipcMain.handle('generate-follow-up', async (event, meetingData) => {
      const email = await this.generateFollowUpEmail(meetingData);
      return email;
    });

    // Notifications
    ipcMain.handle('show-notification', async (event, title, body) => {
      this.showNotification(title, body);
      return { success: true };
    });

    // Settings management
    ipcMain.handle('get-settings', async () => {
      return this.settings;
    });

    ipcMain.handle('save-settings', async (event, newSettings) => {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();
      return { success: true };
    });

    // AI service management
    ipcMain.handle('get-ai-settings', async () => {
      return this.aiService.getSettings();
    });

    ipcMain.handle('save-ai-settings', async (event, newSettings) => {
      return await this.aiService.updateSettings(newSettings);
    });

    ipcMain.handle('get-ai-status', async () => {
      return this.aiService.getStatus();
    });

    ipcMain.handle('test-ai-connection', async () => {
      return await this.aiService.testConnection();
    });

    // Screen capture for context
    ipcMain.handle('capture-screen', async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1920, height: 1080 }
        });
        
        if (sources.length > 0) {
          return {
            success: true,
            thumbnail: sources[0].thumbnail.toDataURL()
          };
        }
        return { success: false, error: 'No screen sources available' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // System information
    ipcMain.handle('get-system-info', async () => {
      const displays = screen.getAllDisplays();
      return {
        platform: os.platform(),
        arch: os.arch(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        displays: displays.map(d => ({
          id: d.id,
          bounds: d.bounds,
          workArea: d.workArea,
          scaleFactor: d.scaleFactor
        }))
      };
    });

    // Overlay window controls
    ipcMain.handle('minimize-overlay', async () => {
      // This would be handled by the main process
      return { success: true };
    });

    ipcMain.handle('close-overlay', async () => {
      // This would be handled by the main process
      return { success: true };
    });

    ipcMain.handle('update-overlay-position', async (event, deltaX, deltaY) => {
      // This would be handled by the main process
      return { success: true };
    });

    ipcMain.handle('overlay-to-main', async (event, data) => {
      // Handle communication from overlay to main window
      return { success: true, data };
    });
  }

  setupPowerMonitoring() {
    powerMonitor.on('suspend', () => {
      this.showNotification('MeetingMind', 'System is going to sleep - pausing monitoring');
      this.isListening = false;
    });

    powerMonitor.on('resume', () => {
      this.showNotification('MeetingMind', 'System resumed - ready to continue');
    });

    powerMonitor.on('lock-screen', () => {
      // Optionally pause monitoring when screen is locked
      if (this.settings.pauseOnLock) {
        this.isListening = false;
      }
    });
  }

  async generateInsights(text, context = {}) {
    try {
      const result = await this.aiService.generateInsights(text, context);
      return result;
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return {
        success: false,
        error: error.message,
        insights: [{
          type: 'error',
          title: 'AI Service Error',
          content: 'Unable to generate insights. Please check your AI configuration.',
          confidence: 1.0,
          priority: 'high'
        }],
        suggestions: ['Check AI settings', 'Verify API key or local service'],
        timestamp: new Date().toISOString()
      };
    }
  }

  async searchKnowledge(query, context = {}) {
    try {
      const result = await this.aiService.searchKnowledge(query, context);
      return result;
    } catch (error) {
      console.error('Failed to search knowledge:', error);
      return {
        success: false,
        error: error.message,
        query,
        results: [{
          title: 'AI Service Error',
          content: 'Unable to search knowledge base. Please check your AI configuration.',
          relevance: 1.0,
          source: 'System Error',
          actionable: true
        }],
        summary: 'Knowledge search failed due to AI service error',
        recommendations: ['Check AI settings', 'Verify API key or local service'],
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateFollowUpEmail(meetingData) {
    try {
      const result = await this.aiService.generateFollowUp(meetingData);
      return result;
    } catch (error) {
      console.error('Failed to generate follow-up email:', error);
      return {
        success: false,
        error: error.message,
        subject: `Follow-up: ${meetingData.topics?.[0] || 'Our Meeting'}`,
        body: 'Unable to generate follow-up email. Please check your AI configuration and try again.',
        actionItems: ['Configure AI service', 'Generate email manually'],
        nextSteps: ['Check AI settings', 'Verify API key or local service'],
        attachments: [],
        generatedAt: new Date().toISOString()
      };
    }
  }

  showNotification(title, body) {
    if (Notification.isSupported()) {
      new Notification({
        title,
        body,
        icon: path.join(__dirname, 'assets', 'icon.png')
      }).show();
    }
  }

  async loadSettings() {
    try {
      const settingsPath = path.join(os.homedir(), '.meetingmind', 'settings.json');
      const settingsData = await fs.readFile(settingsPath, 'utf8');
      this.settings = JSON.parse(settingsData);
    } catch (error) {
      // Use default settings if file doesn't exist
      this.settings = {
        autoStart: false,
        pauseOnLock: true,
        notificationsEnabled: true,
        overlayEnabled: true,
        hotkeys: {
          toggleOverlay: 'CommandOrControl+Shift+O',
          startListening: 'CommandOrControl+Shift+L',
          quickInsight: 'CommandOrControl+Shift+I'
        },
        aiSettings: {
          confidenceThreshold: 0.7,
          maxInsightsPerMinute: 3,
          enableRealTimeAnalysis: true
        }
      };
    }
  }

  async saveSettings() {
    try {
      const settingsDir = path.join(os.homedir(), '.meetingmind');
      const settingsPath = path.join(settingsDir, 'settings.json');
      
      // Ensure directory exists
      await fs.mkdir(settingsDir, { recursive: true });
      
      // Save settings
      await fs.writeFile(settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  // Method to save meeting data for later analysis
  async saveMeetingData(data) {
    try {
      const dataDir = path.join(os.homedir(), '.meetingmind', 'meetings');
      await fs.mkdir(dataDir, { recursive: true });
      
      const filename = `meeting-${Date.now()}.json`;
      const filepath = path.join(dataDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      return { success: true, filepath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Method to get meeting history
  async getMeetingHistory() {
    try {
      const dataDir = path.join(os.homedir(), '.meetingmind', 'meetings');
      const files = await fs.readdir(dataDir);
      
      const meetings = [];
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const filepath = path.join(dataDir, file);
        const data = await fs.readFile(filepath, 'utf8');
        meetings.push(JSON.parse(data));
      }
      
      return { success: true, meetings: meetings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = DesktopFeatures;
