/**
 * Live Insights Overlay Component
 * 
 * Real-time overlay that displays contextual suggestions, definitions,
 * and AI insights during meetings with minimal disruption.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Lightbulb, 
  MessageSquare, 
  BookOpen, 
  ArrowRight, 
  X, 
  ChevronDown,
  ChevronUp,
  Settings,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';

const LiveInsightsOverlay = ({ 
  meetingId, 
  isActive = false, 
  position = 'top-right',
  onSuggestionAccept,
  onSuggestionDismiss,
  onToggleVisibility,
  settings = {}
}) => {
  // State management
  const [insights, setInsights] = useState([]);
  const [currentSuggestion, setCurrentSuggestion] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  
  // Refs
  const wsRef = useRef(null);
  const overlayRef = useRef(null);
  const suggestionQueueRef = useRef([]);
  const lastUpdateRef = useRef(Date.now());
  
  // Configuration
  const config = {
    updateInterval: 2000,
    maxSuggestions: 5,
    autoHideDelay: 10000,
    confidenceThreshold: 0.7,
    enableAnimations: true,
    showConfidenceScores: false,
    ...settings
  };
  
  /**
   * Initialize WebSocket connection for real-time updates
   */
  useEffect(() => {
    if (!isActive || !meetingId) return;
    
    const initializeConnection = async () => {
      try {
        // WebSocket connection for real-time insights
        const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:3001'}/intelligence/${meetingId}`;
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          setConnectionStatus('connected');
          console.log('✓ Live insights WebSocket connected');
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleRealtimeUpdate(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        wsRef.current.onclose = () => {
          setConnectionStatus('disconnected');
          console.log('Live insights WebSocket disconnected');
        };
        
        wsRef.current.onerror = (error) => {
          setConnectionStatus('error');
          console.error('WebSocket error:', error);
        };
        
      } catch (error) {
        console.error('Error initializing live insights connection:', error);
        setConnectionStatus('error');
      }
    };
    
    initializeConnection();
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isActive, meetingId]);
  
  /**
   * Handle real-time updates from the intelligence service
   */
  const handleRealtimeUpdate = useCallback((data) => {
    const { type, payload } = data;
    
    switch (type) {
      case 'contextAnalyzed':
        handleContextAnalysis(payload);
        break;
      case 'periodicInsights':
        handlePeriodicInsights(payload);
        break;
      case 'performanceMetrics':
        setPerformanceMetrics(payload);
        break;
      default:
        console.log('Unknown message type:', type);
    }
    
    lastUpdateRef.current = Date.now();
  }, []);
  
  /**
   * Handle context analysis updates
   */
  const handleContextAnalysis = useCallback((payload) => {
    const { insights: newInsights } = payload;
    
    if (newInsights && newInsights.suggestions) {
      // Filter suggestions by confidence threshold
      const filteredSuggestions = newInsights.suggestions.filter(
        suggestion => suggestion.confidence >= config.confidenceThreshold
      );
      
      // Add to suggestion queue
      suggestionQueueRef.current.push(...filteredSuggestions);
      
      // Process next suggestion if none is currently displayed
      if (!currentSuggestion && suggestionQueueRef.current.length > 0) {
        processNextSuggestion();
      }
    }
    
    // Update insights state
    setInsights(prevInsights => {
      const updatedInsights = [...prevInsights];
      
      // Add new insights
      if (newInsights.suggestions) {
        updatedInsights.push(...newInsights.suggestions.map(s => ({
          ...s,
          category: 'suggestion',
          timestamp: Date.now()
        })));
      }
      
      if (newInsights.definitions) {
        updatedInsights.push(...newInsights.definitions.map(d => ({
          ...d,
          category: 'definition',
          timestamp: Date.now()
        })));
      }
      
      if (newInsights.questions) {
        updatedInsights.push(...newInsights.questions.map(q => ({
          ...q,
          category: 'question',
          timestamp: Date.now()
        })));
      }
      
      // Keep only recent insights (last 20)
      return updatedInsights.slice(-20);
    });
  }, [config.confidenceThreshold, currentSuggestion]);
  
  /**
   * Process next suggestion from queue
   */
  const processNextSuggestion = useCallback(() => {
    if (suggestionQueueRef.current.length > 0) {
      const nextSuggestion = suggestionQueueRef.current.shift();
      setCurrentSuggestion(nextSuggestion);
      
      // Auto-hide after delay if configured
      if (config.autoHideDelay > 0) {
        setTimeout(() => {
          setCurrentSuggestion(null);
          processNextSuggestion(); // Process next in queue
        }, config.autoHideDelay);
      }
    }
  }, [config.autoHideDelay]);
  
  /**
   * Handle suggestion acceptance
   */
  const handleSuggestionAccept = useCallback((suggestion) => {
    if (onSuggestionAccept) {
      onSuggestionAccept(suggestion);
    }
    
    // Track acceptance
    trackSuggestionInteraction(suggestion, 'accepted');
    
    // Clear current suggestion and process next
    setCurrentSuggestion(null);
    processNextSuggestion();
  }, [onSuggestionAccept, processNextSuggestion]);
  
  /**
   * Handle suggestion dismissal
   */
  const handleSuggestionDismiss = useCallback((suggestion) => {
    if (onSuggestionDismiss) {
      onSuggestionDismiss(suggestion);
    }
    
    // Track dismissal
    trackSuggestionInteraction(suggestion, 'dismissed');
    
    // Clear current suggestion and process next
    setCurrentSuggestion(null);
    processNextSuggestion();
  }, [onSuggestionDismiss, processNextSuggestion]);
  
  /**
   * Track suggestion interactions for analytics
   */
  const trackSuggestionInteraction = useCallback((suggestion, action) => {
    // Send analytics data
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'suggestionInteraction',
        payload: {
          suggestionId: suggestion.id,
          action,
          timestamp: Date.now(),
          meetingId
        }
      }));
    }
  }, [meetingId]);
  
  /**
   * Toggle overlay visibility
   */
  const toggleVisibility = useCallback(() => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    
    if (onToggleVisibility) {
      onToggleVisibility(newVisibility);
    }
  }, [isVisible, onToggleVisibility]);
  
  /**
   * Get icon for suggestion type
   */
  const getSuggestionIcon = (type) => {
    const iconMap = {
      definition: BookOpen,
      follow_up: MessageSquare,
      clarification: MessageSquare,
      action: ArrowRight,
      transition: ArrowRight,
      summary: Brain
    };
    
    return iconMap[type] || Lightbulb;
  };
  
  /**
   * Get color scheme for suggestion type
   */
  const getSuggestionColor = (type) => {
    const colorMap = {
      definition: 'blue',
      follow_up: 'green',
      clarification: 'yellow',
      action: 'purple',
      transition: 'orange',
      summary: 'gray'
    };
    
    return colorMap[type] || 'blue';
  };
  
  /**
   * Format confidence score
   */
  const formatConfidence = (confidence) => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Don't render if not active or not visible
  if (!isActive || !isVisible) {
    return null;
  }
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  return (
    <div 
      ref={overlayRef}
      className={`fixed ${positionClasses[position]} z-50 max-w-sm`}
      style={{ pointerEvents: 'auto' }}
    >
      <AnimatePresence>
        {/* Main overlay container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
            {/* Header */}
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm font-medium">Live Insights</CardTitle>
                  <Badge 
                    variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {connectionStatus}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-6 w-6 p-0"
                  >
                    {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleVisibility}
                    className="h-6 w-6 p-0"
                  >
                    {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* Content */}
            {!isMinimized && (
              <CardContent className="pt-0">
                {/* Current Suggestion */}
                <AnimatePresence>
                  {currentSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="mb-3"
                    >
                      <SuggestionCard
                        suggestion={currentSuggestion}
                        onAccept={() => handleSuggestionAccept(currentSuggestion)}
                        onDismiss={() => handleSuggestionDismiss(currentSuggestion)}
                        showConfidence={config.showConfidenceScores}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Suggestion Queue Indicator */}
                {suggestionQueueRef.current.length > 0 && (
                  <div className="text-xs text-gray-500 mb-2">
                    {suggestionQueueRef.current.length} more suggestion{suggestionQueueRef.current.length !== 1 ? 's' : ''} pending
                  </div>
                )}
                
                {/* Expanded Insights */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <div className="text-xs font-medium text-gray-700 mb-2">Recent Insights</div>
                    
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {insights.slice(-5).map((insight, index) => (
                        <InsightItem
                          key={insight.id || index}
                          insight={insight}
                          showConfidence={config.showConfidenceScores}
                        />
                      ))}
                    </div>
                    
                    {/* Performance Metrics */}
                    {Object.keys(performanceMetrics).length > 0 && (
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        <div>Response: {performanceMetrics.averageResponseTime || 0}ms</div>
                        <div>Confidence: {formatConfidence(performanceMetrics.averageConfidence || 0)}</div>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* No insights message */}
                {insights.length === 0 && !currentSuggestion && (
                  <div className="text-xs text-gray-500 text-center py-4">
                    Listening for meeting insights...
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/**
 * Individual Suggestion Card Component
 */
const SuggestionCard = ({ suggestion, onAccept, onDismiss, showConfidence = false }) => {
  const Icon = getSuggestionIcon(suggestion.type);
  const color = getSuggestionColor(suggestion.type);
  
  return (
    <div className={`p-3 rounded-lg border-l-4 border-l-${color}-500 bg-${color}-50`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          <Icon className={`h-4 w-4 text-${color}-600 mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {suggestion.title}
            </div>
            <div className="text-sm text-gray-700 mt-1">
              {suggestion.content}
            </div>
            {showConfidence && (
              <div className="text-xs text-gray-500 mt-1">
                Confidence: {formatConfidence(suggestion.confidence)}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAccept}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
            title="Accept suggestion"
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            title="Dismiss suggestion"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual Insight Item Component
 */
const InsightItem = ({ insight, showConfidence = false }) => {
  const Icon = getSuggestionIcon(insight.category);
  const color = getSuggestionColor(insight.category);
  
  return (
    <div className="flex items-center space-x-2 p-2 rounded bg-gray-50">
      <Icon className={`h-3 w-3 text-${color}-600 flex-shrink-0`} />
      <div className="flex-1 text-xs text-gray-700 truncate">
        {insight.content || insight.title}
      </div>
      {showConfidence && (
        <div className="text-xs text-gray-500">
          {formatConfidence(insight.confidence)}
        </div>
      )}
    </div>
  );
};

// Helper functions (moved outside component for performance)
const getSuggestionIcon = (type) => {
  const iconMap = {
    definition: BookOpen,
    follow_up: MessageSquare,
    clarification: MessageSquare,
    action: ArrowRight,
    transition: ArrowRight,
    summary: Brain
  };
  
  return iconMap[type] || Lightbulb;
};

const getSuggestionColor = (type) => {
  const colorMap = {
    definition: 'blue',
    follow_up: 'green',
    clarification: 'yellow',
    action: 'purple',
    transition: 'orange',
    summary: 'gray'
  };
  
  return colorMap[type] || 'blue';
};

const formatConfidence = (confidence) => {
  return `${Math.round(confidence * 100)}%`;
};

export default LiveInsightsOverlay;
