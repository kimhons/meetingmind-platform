const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');

/**
 * Enhanced Platform Integrations with Meeting BaaS
 * 
 * SEAMLESS INTEGRATION CAPABILITIES:
 * - Universal bot deployment across all major platforms
 * - Hands-free meeting joining with calendar integration
 * - Real-time processing with WebSocket streams
 * - Automatic platform detection and optimization
 * 
 * SUPPORTED PLATFORMS:
 * - Zoom (via Meeting BaaS + Direct SDK)
 * - Microsoft Teams (via Meeting BaaS + Graph API)
 * - Google Meet (via Meeting BaaS)
 * - Cisco Webex (via Meeting BaaS + Direct API)
 * - Amazon Chime (via AWS SDK)
 * - Gong (via API for post-meeting data)
 */

class EnhancedPlatformIntegrations extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      meetingBaasApiKey: config.meetingBaasApiKey || process.env.MEETING_BAAS_API_KEY,
      webhookBaseUrl: config.webhookBaseUrl || process.env.WEBHOOK_BASE_URL,
      awsCredentials: config.awsCredentials,
      ...config
    };

    // Meeting BaaS client
    this.meetingBaasClient = axios.create({
      baseURL: 'https://api.meetingbaas.com',
      headers: {
        'x-meeting-baas-api-key': this.config.meetingBaasApiKey,
        'Content-Type': 'application/json'
      }
    });

    // Active meeting sessions
    this.activeMeetings = new Map();
    this.websocketConnections = new Map();
    
    // Platform detection patterns
    this.platformPatterns = {
      zoom: /zoom\.us\/j\/|zoom\.us\/meeting\/|zoom\.us\/webinar\//,
      teams: /teams\.microsoft\.com\/|teams\.live\.com\//,
      meet: /meet\.google\.com\/|meet\.google\.com\/lookup\//,
      webex: /webex\.com\/meet\/|webex\.com\/join\//,
      chime: /chime\.aws\/|chime\.amazon\.com\//,
      gotomeeting: /gotomeeting\.com\/join\/|gotomeet\.me\//,
      bluejeans: /bluejeans\.com\/|bjn\.vc\//
    };

    console.log('🚀 Enhanced Platform Integrations initialized');
  }

  /**
   * SEAMLESS MEETING JOIN - The core functionality
   * Automatically joins any meeting URL with zero user intervention
   */
  async joinMeetingSeamlessly(meetingUrl, options = {}) {
    console.log(`🤖 Joining meeting seamlessly: ${meetingUrl}`);
    
    try {
      const platform = this.detectPlatform(meetingUrl);
      const botConfig = this.createBotConfiguration(meetingUrl, platform, options);
      
      // Deploy bot via Meeting BaaS
      const response = await this.meetingBaasClient.post('/bots', botConfig);
      const { bot_id, status } = response.data;
      
      // Setup real-time processing
      await this.setupRealTimeProcessing(bot_id, meetingUrl, platform);
      
      // Store meeting session
      this.activeMeetings.set(bot_id, {
        meetingUrl,
        platform,
        botId: bot_id,
        startTime: Date.now(),
        status: 'joining',
        options
      });

      this.emit('meeting_join_initiated', {
        botId: bot_id,
        meetingUrl,
        platform,
        status
      });

      return {
        success: true,
        botId: bot_id,
        platform,
        status,
        message: `Successfully initiated join for ${platform} meeting`,
        capabilities: this.getPlatformCapabilities(platform)
      };

    } catch (error) {
      console.error('❌ Seamless join failed:', error);
      
      return {
        success: false,
        error: error.message,
        fallbackOptions: await this.getFallbackOptions(meetingUrl)
      };
    }
  }

  /**
   * AUTOMATIC PLATFORM DETECTION
   * Identifies meeting platform from URL patterns
   */
  detectPlatform(meetingUrl) {
    for (const [platform, pattern] of Object.entries(this.platformPatterns)) {
      if (pattern.test(meetingUrl)) {
        return platform;
      }
    }
    
    // Default to generic WebRTC if no pattern matches
    return 'generic';
  }

  /**
   * INTELLIGENT BOT CONFIGURATION
   * Creates optimized bot settings for each platform
   */
  createBotConfiguration(meetingUrl, platform, options) {
    const baseConfig = {
      meeting_url: meetingUrl,
      bot_name: options.botName || "MeetingMind AI Assistant",
      recording_mode: options.recordingMode || "speaker_view",
      entry_message: options.entryMessage || "MeetingMind AI Assistant has joined to provide intelligent insights",
      reserved: options.reserved || false,
      
      // Advanced configuration
      speech_to_text: {
        provider: options.transcriptionProvider || "Default",
        language: options.language || "en-US"
      },
      
      automatic_leave: {
        waiting_room_timeout: 600,
        no_participant_timeout: 300
      },
      
      // Webhook configuration
      webhooks: {
        complete: `${this.config.webhookBaseUrl}/meeting-complete`,
        failed: `${this.config.webhookBaseUrl}/meeting-failed`,
        status_change: `${this.config.webhookBaseUrl}/status-change`,
        transcription_complete: `${this.config.webhookBaseUrl}/transcription-complete`
      }
    };

    // Platform-specific optimizations
    switch (platform) {
      case 'zoom':
        return {
          ...baseConfig,
          bot_image: options.botImage || "https://meetingmind.com/assets/zoom-bot-avatar.png",
          recording_mode: "gallery_view", // Better for Zoom
          deduplication: true
        };
        
      case 'teams':
        return {
          ...baseConfig,
          bot_image: options.botImage || "https://meetingmind.com/assets/teams-bot-avatar.png",
          recording_mode: "speaker_view", // Teams optimization
          entry_message: "MeetingMind AI Assistant has joined this Teams meeting"
        };
        
      case 'meet':
        return {
          ...baseConfig,
          bot_image: options.botImage || "https://meetingmind.com/assets/meet-bot-avatar.png",
          recording_mode: "speaker_view",
          automatic_leave: {
            waiting_room_timeout: 300 // Google Meet has shorter timeouts
          }
        };
        
      default:
        return baseConfig;
    }
  }

  /**
   * REAL-TIME PROCESSING SETUP
   * Establishes WebSocket connections for live data
   */
  async setupRealTimeProcessing(botId, meetingUrl, platform) {
    console.log(`🔄 Setting up real-time processing for bot ${botId}`);
    
    try {
      // WebSocket connection for live events
      const wsUrl = `wss://api.meetingbaas.com/bots/${botId}/stream`;
      const ws = new WebSocket(wsUrl, {
        headers: {
          'x-meeting-baas-api-key': this.config.meetingBaasApiKey
        }
      });

      ws.on('open', () => {
        console.log(`✅ WebSocket connected for bot ${botId}`);
        this.emit('realtime_connected', { botId, meetingUrl });
      });

      ws.on('message', (data) => {
        const event = JSON.parse(data);
        this.handleRealTimeEvent(botId, event);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for bot ${botId}:`, error);
        this.emit('realtime_error', { botId, error: error.message });
      });

      ws.on('close', () => {
        console.log(`🔌 WebSocket closed for bot ${botId}`);
        this.websocketConnections.delete(botId);
      });

      this.websocketConnections.set(botId, ws);
      
      return { success: true, wsUrl };
      
    } catch (error) {
      console.error('❌ Real-time setup failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * REAL-TIME EVENT PROCESSING
   * Handles live meeting events and transcripts
   */
  handleRealTimeEvent(botId, event) {
    const meeting = this.activeMeetings.get(botId);
    if (!meeting) return;

    switch (event.type) {
      case 'transcript':
        this.emit('live_transcript', {
          botId,
          meetingUrl: meeting.meetingUrl,
          transcript: event.text,
          speaker: event.speaker,
          timestamp: event.timestamp
        });
        break;
        
      case 'participant_joined':
        this.emit('participant_joined', {
          botId,
          participant: event.participant,
          timestamp: event.timestamp
        });
        break;
        
      case 'participant_left':
        this.emit('participant_left', {
          botId,
          participant: event.participant,
          timestamp: event.timestamp
        });
        break;
        
      case 'status_change':
        meeting.status = event.status;
        this.emit('bot_status_change', {
          botId,
          status: event.status,
          timestamp: event.timestamp
        });
        break;
        
      case 'recording_started':
        this.emit('recording_started', {
          botId,
          timestamp: event.timestamp
        });
        break;
        
      default:
        console.log(`📝 Unhandled event type: ${event.type}`);
    }
  }

  /**
   * CALENDAR INTEGRATION FOR AUTO-JOIN
   * Monitors calendars and automatically joins upcoming meetings
   */
  async setupCalendarAutoJoin(calendarConfig) {
    console.log('📅 Setting up calendar auto-join');
    
    const calendarService = new CalendarIntegrationService(calendarConfig);
    
    // Monitor for upcoming meetings
    setInterval(async () => {
      try {
        const upcomingMeetings = await calendarService.getUpcomingMeetings(5); // Next 5 minutes
        
        for (const meeting of upcomingMeetings) {
          if (meeting.startsIn < 120000 && meeting.startsIn > 60000) { // 1-2 minutes before
            await this.joinMeetingSeamlessly(meeting.url, {
              botName: `MeetingMind - ${meeting.title}`,
              reserved: true
            });
          }
        }
      } catch (error) {
        console.error('❌ Calendar auto-join error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * AMAZON CHIME INTEGRATION
   * Direct SDK integration for Chime meetings
   */
  async setupChimeIntegration(credentials) {
    console.log('🔗 Setting up Amazon Chime integration');
    
    try {
      const AWS = require('aws-sdk');
      const chime = new AWS.Chime({
        region: 'us-east-1',
        credentials: credentials
      });

      return {
        success: true,
        platform: 'chime',
        capabilities: {
          createMeeting: true,
          joinMeeting: true,
          realTimeAudio: true,
          realTimeVideo: true,
          screenShare: true,
          recording: true
        },
        client: chime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        setupInstructions: [
          'Configure AWS credentials',
          'Enable Chime SDK in AWS account',
          'Set up IAM permissions for Chime operations'
        ]
      };
    }
  }

  /**
   * GONG INTEGRATION
   * Post-meeting analytics and conversation intelligence
   */
  async setupGongIntegration(credentials) {
    console.log('🔗 Setting up Gong integration');
    
    const gongClient = axios.create({
      baseURL: 'https://api.gong.io/v2',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      platform: 'gong',
      capabilities: {
        accessRecordings: true,
        getCallAnalytics: true,
        participantMetrics: true,
        conversationIntelligence: true,
        dealInsights: true
      },
      client: gongClient,
      limitations: [
        'Post-meeting data only',
        'No real-time access',
        'Requires Gong enterprise account'
      ]
    };
  }

  /**
   * PLATFORM CAPABILITIES MATRIX
   * Returns what each platform can do
   */
  getPlatformCapabilities(platform) {
    const capabilities = {
      zoom: {
        realTimeTranscription: true,
        participantList: true,
        chatMessages: true,
        screenShare: true,
        recording: true,
        webhooks: true
      },
      teams: {
        realTimeTranscription: true,
        participantList: false,
        chatMessages: true,
        screenShare: true,
        recording: true,
        webhooks: true
      },
      meet: {
        realTimeTranscription: true,
        participantList: false,
        chatMessages: false,
        screenShare: true,
        recording: true,
        webhooks: true
      },
      webex: {
        realTimeTranscription: true,
        participantList: true,
        chatMessages: true,
        screenShare: true,
        recording: true,
        webhooks: true
      },
      chime: {
        realTimeTranscription: true,
        participantList: true,
        chatMessages: true,
        screenShare: true,
        recording: true,
        webhooks: false
      }
    };

    return capabilities[platform] || {
      realTimeTranscription: false,
      participantList: false,
      chatMessages: false,
      screenShare: false,
      recording: false,
      webhooks: false
    };
  }

  /**
   * FALLBACK OPTIONS
   * Provides alternatives when primary integration fails
   */
  async getFallbackOptions(meetingUrl) {
    const platform = this.detectPlatform(meetingUrl);
    
    return {
      browserAutomation: {
        available: true,
        description: 'Use browser automation to join meeting',
        limitations: ['Requires user interaction', 'Less reliable']
      },
      manualJoin: {
        available: true,
        description: 'Manual meeting join with overlay assistance',
        instructions: [
          'Join the meeting manually',
          'Enable MeetingMind overlay',
          'AI assistance will activate automatically'
        ]
      },
      platformSpecific: this.getPlatformSpecificFallbacks(platform)
    };
  }

  getPlatformSpecificFallbacks(platform) {
    const fallbacks = {
      zoom: {
        sdkIntegration: 'Use Zoom SDK for direct integration',
        phoneDialIn: 'Join via phone with audio processing'
      },
      teams: {
        graphApi: 'Use Microsoft Graph API for meeting data',
        outlookIntegration: 'Access via Outlook calendar integration'
      },
      meet: {
        calendarApi: 'Use Google Calendar API for meeting info',
        chromeExtension: 'Browser extension for enhanced access'
      }
    };

    return fallbacks[platform] || {};
  }

  /**
   * MEETING MANAGEMENT
   * Control active meetings and bots
   */
  async leaveMeeting(botId) {
    console.log(`🚪 Leaving meeting with bot ${botId}`);
    
    try {
      await this.meetingBaasClient.delete(`/bots/${botId}`);
      
      // Close WebSocket connection
      const ws = this.websocketConnections.get(botId);
      if (ws) {
        ws.close();
        this.websocketConnections.delete(botId);
      }
      
      // Remove from active meetings
      this.activeMeetings.delete(botId);
      
      this.emit('meeting_left', { botId });
      
      return { success: true, message: 'Successfully left meeting' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMeetingStatus(botId) {
    try {
      const response = await this.meetingBaasClient.get(`/bots/${botId}`);
      return response.data;
    } catch (error) {
      return { error: error.message };
    }
  }

  getActiveMeetings() {
    return Array.from(this.activeMeetings.values());
  }

  /**
   * WEBHOOK HANDLERS
   * Process Meeting BaaS webhook events
   */
  handleWebhookEvent(event) {
    const { bot_id, event_type } = event;
    
    switch (event_type) {
      case 'complete':
        this.handleMeetingComplete(event);
        break;
      case 'failed':
        this.handleMeetingFailed(event);
        break;
      case 'transcription_complete':
        this.handleTranscriptionComplete(event);
        break;
      default:
        console.log(`📝 Unhandled webhook event: ${event_type}`);
    }
  }

  handleMeetingComplete(event) {
    const { bot_id, recording_url, transcript_url, duration, participants } = event;
    
    this.emit('meeting_complete', {
      botId: bot_id,
      recordingUrl: recording_url,
      transcriptUrl: transcript_url,
      duration,
      participants
    });
    
    // Cleanup
    this.activeMeetings.delete(bot_id);
    const ws = this.websocketConnections.get(bot_id);
    if (ws) {
      ws.close();
      this.websocketConnections.delete(bot_id);
    }
  }

  handleMeetingFailed(event) {
    const { bot_id, error_message } = event;
    
    this.emit('meeting_failed', {
      botId: bot_id,
      error: error_message
    });
    
    // Cleanup
    this.activeMeetings.delete(bot_id);
  }

  handleTranscriptionComplete(event) {
    const { bot_id, transcript_url } = event;
    
    this.emit('transcription_complete', {
      botId: bot_id,
      transcriptUrl: transcript_url
    });
  }
}

/**
 * CALENDAR INTEGRATION SERVICE
 * Monitors calendars for automatic meeting detection
 */
class CalendarIntegrationService {
  constructor(config) {
    this.config = config;
    this.connectedCalendars = [];
  }

  async getUpcomingMeetings(minutesAhead = 5) {
    const meetings = [];
    const now = new Date();
    const futureTime = new Date(now.getTime() + (minutesAhead * 60000));

    for (const calendar of this.connectedCalendars) {
      const events = await calendar.getEvents(now, futureTime);
      
      for (const event of events) {
        const meetingUrl = this.extractMeetingUrl(event.description || event.location);
        if (meetingUrl) {
          meetings.push({
            title: event.summary,
            url: meetingUrl,
            startTime: event.start,
            startsIn: new Date(event.start) - now,
            calendar: calendar.name
          });
        }
      }
    }

    return meetings;
  }

  extractMeetingUrl(text) {
    if (!text) return null;
    
    const urlPatterns = [
      /https:\/\/zoom\.us\/j\/\d+/,
      /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]+/,
      /https:\/\/meet\.google\.com\/[a-z-]+/,
      /https:\/\/[^\.]+\.webex\.com\/meet\/[^\s]+/
    ];

    for (const pattern of urlPatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }

    return null;
  }
}

module.exports = {
  EnhancedPlatformIntegrations,
  CalendarIntegrationService
};
