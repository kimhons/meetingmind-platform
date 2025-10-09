/**
 * MeetingMind Predictive Outcomes API
 * 
 * This module provides API endpoints for the predictive outcomes feature,
 * allowing frontend components to access prediction capabilities.
 */

const express = require('express');
const PredictiveOutcomesEngine = require('./predictive-engine');

// Create router
const router = express.Router();

// Create predictive engine instance
const predictiveEngine = new PredictiveOutcomesEngine();

// Initialize the engine when the API starts
let engineInitialized = false;
const initializeEngine = async () => {
  if (!engineInitialized) {
    engineInitialized = await predictiveEngine.initialize();
  }
  return engineInitialized;
};

// Middleware to ensure engine is initialized
const ensureEngineInitialized = async (req, res, next) => {
  if (await initializeEngine()) {
    next();
  } else {
    res.status(503).json({
      error: 'Predictive engine not available',
      message: 'The predictive outcomes engine is currently initializing or failed to initialize.'
    });
  }
};

// Apply middleware to all routes
router.use(ensureEngineInitialized);

/**
 * Start a new meeting for predictions
 * POST /api/predictive/meetings
 */
router.post('/meetings', (req, res) => {
  try {
    const meetingData = req.body;
    
    // Validate required fields
    if (!meetingData.participants || !Array.isArray(meetingData.participants)) {
      return res.status(400).json({
        error: 'Invalid meeting data',
        message: 'Participants array is required'
      });
    }
    
    if (!meetingData.agenda || !Array.isArray(meetingData.agenda)) {
      return res.status(400).json({
        error: 'Invalid meeting data',
        message: 'Agenda array is required'
      });
    }
    
    // Start meeting tracking
    const result = predictiveEngine.startMeeting(meetingData);
    
    res.status(201).json({
      success: true,
      meetingId: result.meetingId,
      startTime: result.startTime,
      initialPredictions: result.initialPredictions
    });
  } catch (error) {
    console.error('Error starting meeting:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Update meeting data and get refined predictions
 * PUT /api/predictive/meetings/:meetingId
 */
router.put('/meetings/:meetingId', (req, res) => {
  try {
    const { meetingId } = req.params;
    const updateData = req.body;
    
    // Update meeting data
    const predictions = predictiveEngine.updateMeetingData(updateData);
    
    res.json({
      success: true,
      meetingId,
      predictions
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Get current predictions for a meeting
 * GET /api/predictive/meetings/:meetingId/predictions
 */
router.get('/meetings/:meetingId/predictions', (req, res) => {
  try {
    // Get current predictions
    const predictions = predictiveEngine.getCurrentPredictions();
    
    res.json({
      success: true,
      predictions
    });
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Get recommendations to improve meeting outcomes
 * GET /api/predictive/meetings/:meetingId/recommendations
 */
router.get('/meetings/:meetingId/recommendations', (req, res) => {
  try {
    // Generate recommendations
    const recommendations = predictiveEngine.generateRecommendations();
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * End a meeting and store outcomes
 * POST /api/predictive/meetings/:meetingId/end
 */
router.post('/meetings/:meetingId/end', (req, res) => {
  try {
    const { finalOutcomes } = req.body;
    
    // End the meeting
    const result = predictiveEngine.endMeeting(finalOutcomes);
    
    res.json({
      success: true,
      meetingStats: result
    });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
