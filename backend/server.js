const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { createServer } = require('http');
const WebSocket = require('ws');
require('dotenv').config();

// Import our revolutionary AI services
const { UnifiedIntelligenceHub } = require('./services/unified-intelligence-hub');
const { TripleAIClient } = require('./ai/triple-ai-client');
const { ContextualAnalysisService } = require('./services/contextual-analysis');
const { MeetingMemoryService } = require('./services/meeting-memory-service');
const { OpportunityDetectionEngine } = require('./services/opportunity-detection-engine');
const { AICoachingEngine } = require('./services/ai-coaching-engine');
const { KnowledgeBaseService } = require('./services/knowledge-base-service');
const { EnterpriseSecurityFramework } = require('./security/enterprise-security-framework');
const { PerformanceOptimizationEngine } = require('./performance/performance-optimization-engine');
const { RealTimeMonitoringDashboard } = require('./monitoring/real-time-monitoring-dashboard');

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Environment configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'staging';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://meetingmind-frontend.railway.app';

// Security and middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"]
    }
  }
}));

app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/web-app/dist')));

// Initialize revolutionary AI services
let intelligenceHub;
let tripleAI;
let contextualAnalysis;
let meetingMemory;
let opportunityDetection;
let aiCoaching;
let knowledgeBase;
let securityFramework;
let performanceEngine;
let monitoringDashboard;

async function initializeServices() {
  try {
    console.log('🚀 Initializing MeetingMind Revolutionary AI Platform...');
    
    // Initialize core AI services
    tripleAI = new TripleAIClient();
    await tripleAI.initialize();
    console.log('✅ Triple-AI Collaboration initialized');
    
    contextualAnalysis = new ContextualAnalysisService(tripleAI);
    await contextualAnalysis.initialize();
    console.log('✅ Contextual Analysis Service initialized');
    
    meetingMemory = new MeetingMemoryService();
    await meetingMemory.initialize();
    console.log('✅ Meeting Memory Service initialized');
    
    opportunityDetection = new OpportunityDetectionEngine(tripleAI);
    await opportunityDetection.initialize();
    console.log('✅ Opportunity Detection Engine initialized');
    
    aiCoaching = new AICoachingEngine(tripleAI);
    await aiCoaching.initialize();
    console.log('✅ AI Coaching Engine initialized');
    
    knowledgeBase = new KnowledgeBaseService();
    await knowledgeBase.initialize();
    console.log('✅ Knowledge Base Service initialized');
    
    // Initialize enterprise services
    securityFramework = new EnterpriseSecurityFramework();
    await securityFramework.initialize();
    console.log('✅ Enterprise Security Framework initialized');
    
    performanceEngine = new PerformanceOptimizationEngine();
    await performanceEngine.initialize();
    console.log('✅ Performance Optimization Engine initialized');
    
    monitoringDashboard = new RealTimeMonitoringDashboard();
    await monitoringDashboard.initialize();
    console.log('✅ Real-Time Monitoring Dashboard initialized');
    
    // Initialize master intelligence hub
    intelligenceHub = new UnifiedIntelligenceHub({
      tripleAI,
      contextualAnalysis,
      meetingMemory,
      opportunityDetection,
      aiCoaching,
      knowledgeBase,
      securityFramework,
      performanceEngine,
      monitoringDashboard
    });
    await intelligenceHub.initialize();
    console.log('✅ Unified Intelligence Hub initialized');
    
    console.log('🎉 MeetingMind Platform fully operational!');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV,
    services: {
      intelligenceHub: intelligenceHub?.isHealthy() || false,
      tripleAI: tripleAI?.isHealthy() || false,
      contextualAnalysis: contextualAnalysis?.isHealthy() || false,
      meetingMemory: meetingMemory?.isHealthy() || false,
      opportunityDetection: opportunityDetection?.isHealthy() || false,
      aiCoaching: aiCoaching?.isHealthy() || false,
      knowledgeBase: knowledgeBase?.isHealthy() || false,
      securityFramework: securityFramework?.isHealthy() || false,
      performanceEngine: performanceEngine?.isHealthy() || false,
      monitoringDashboard: monitoringDashboard?.isHealthy() || false
    }
  });
});

app.get('/api/status', async (req, res) => {
  try {
    const status = await intelligenceHub.getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Triple-AI Intelligence API
app.post('/api/intelligence/analyze', async (req, res) => {
  try {
    const { content, context, options } = req.body;
    const analysis = await intelligenceHub.analyzeContent(content, context, options);
    res.json(analysis);
  } catch (error) {
    console.error('Intelligence analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Predictive Intelligence API
app.post('/api/intelligence/predict', async (req, res) => {
  try {
    const { meetingData, context } = req.body;
    const prediction = await intelligenceHub.predictOutcomes(meetingData, context);
    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// Meeting Memory API
app.get('/api/memory/context/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const context = await meetingMemory.getContext(meetingId);
    res.json(context);
  } catch (error) {
    console.error('Memory retrieval error:', error);
    res.status(500).json({ error: 'Context retrieval failed' });
  }
});

// Opportunity Detection API
app.post('/api/opportunities/detect', async (req, res) => {
  try {
    const { transcript, context } = req.body;
    const opportunities = await opportunityDetection.detectOpportunities(transcript, context);
    res.json(opportunities);
  } catch (error) {
    console.error('Opportunity detection error:', error);
    res.status(500).json({ error: 'Opportunity detection failed' });
  }
});

// AI Coaching API
app.post('/api/coaching/analyze', async (req, res) => {
  try {
    const { meetingData, participantId } = req.body;
    const coaching = await aiCoaching.analyzePerformance(meetingData, participantId);
    res.json(coaching);
  } catch (error) {
    console.error('Coaching analysis error:', error);
    res.status(500).json({ error: 'Coaching analysis failed' });
  }
});

// Knowledge Base API
app.post('/api/knowledge/search', async (req, res) => {
  try {
    const { query, context } = req.body;
    const results = await knowledgeBase.search(query, context);
    res.json(results);
  } catch (error) {
    console.error('Knowledge search error:', error);
    res.status(500).json({ error: 'Knowledge search failed' });
  }
});

// Performance Monitoring API
app.get('/api/monitoring/metrics', async (req, res) => {
  try {
    const metrics = await monitoringDashboard.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({ error: 'Metrics retrieval failed' });
  }
});

// WebSocket for real-time intelligence
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection established');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'intelligence_request':
          const intelligence = await intelligenceHub.processRealTimeIntelligence(data.payload);
          ws.send(JSON.stringify({
            type: 'intelligence_response',
            data: intelligence
          }));
          break;
          
        case 'meeting_start':
          await intelligenceHub.startMeetingSession(data.payload);
          ws.send(JSON.stringify({
            type: 'session_started',
            sessionId: data.payload.sessionId
          }));
          break;
          
        case 'meeting_end':
          const summary = await intelligenceHub.endMeetingSession(data.payload);
          ws.send(JSON.stringify({
            type: 'session_ended',
            summary
          }));
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Message processing failed'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/web-app/dist/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  if (intelligenceHub) {
    await intelligenceHub.shutdown();
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  if (intelligenceHub) {
    await intelligenceHub.shutdown();
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 MeetingMind Platform running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🎯 Ready for revolutionary AI meeting intelligence!`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
