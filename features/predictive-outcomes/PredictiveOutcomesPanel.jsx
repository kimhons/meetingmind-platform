import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  BarChart2, 
  TrendingUp, 
  AlertTriangle, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  ThumbsUp,
  Users,
  MessageCircle,
  AlertCircle
} from 'lucide-react';

/**
 * PredictiveOutcomesPanel Component
 * 
 * Displays real-time meeting predictions and recommendations
 * to help users optimize meeting outcomes.
 */
const PredictiveOutcomesPanel = ({ 
  meetingId, 
  isActive = true,
  onRecommendationAction = () => {},
  className = ''
}) => {
  // State
  const [predictions, setPredictions] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('predictions');
  
  // Fetch predictions and recommendations
  useEffect(() => {
    if (!isActive || !meetingId) return;
    
    const fetchPredictiveData = async () => {
      setLoading(true);
      try {
        // In a real implementation, these would be API calls
        // For demonstration, we'll simulate API responses
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Simulate predictions data
        const predictionsData = {
          timeToCompletion: 18, // minutes
          decisionLikelihood: 0.75,
          participantSentiment: {
            current: 0.65,
            projected: 0.72,
            trend: 'increasing'
          },
          keyOutcomes: [
            {
              type: 'decision',
              description: 'Approval of main proposal',
              likelihood: 0.85
            },
            {
              type: 'action',
              description: 'Assignment of follow-up tasks',
              likelihood: 0.92
            }
          ],
          nextTopics: [
            'Budget implications',
            'Timeline constraints'
          ],
          riskAreas: [
            {
              topic: 'Budget allocation',
              riskLevel: 'medium',
              participants: ['Alice', 'Bob'],
              mitigationStrategy: 'Provide additional context on financial constraints'
            }
          ],
          confidenceScore: 0.82
        };
        
        // Simulate recommendations data
        const recommendationsData = [
          {
            id: 'rec1',
            type: 'time',
            priority: 'high',
            message: 'Meeting likely to exceed scheduled time. Consider focusing on key agenda items.',
            actionable: true,
            action: 'Prioritize remaining agenda items'
          },
          {
            id: 'rec2',
            type: 'engagement',
            priority: 'medium',
            message: '2 participants showing low engagement.',
            actionable: true,
            action: 'Directly involve these participants in discussion'
          },
          {
            id: 'rec3',
            type: 'risk',
            priority: 'high',
            message: 'Potential conflict detected around: Budget allocation',
            actionable: true,
            action: 'Address concerns directly or take discussion offline'
          }
        ];
        
        setPredictions(predictionsData);
        setRecommendations(recommendationsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching predictive data:', err);
        setError('Failed to load predictions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPredictiveData();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchPredictiveData, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [meetingId, isActive]);
  
  // Handle recommendation action
  const handleRecommendationAction = (recommendation) => {
    onRecommendationAction(recommendation);
    
    // Remove the recommendation from the list
    setRecommendations(prev => 
      prev.filter(rec => rec.id !== recommendation.id)
    );
  };
  
  // Format time to completion
  const formatTimeToCompletion = (minutes) => {
    if (minutes < 1) return 'Less than a minute';
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${Math.round(value * 100)}%`;
  };
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };
  
  // Get recommendation icon
  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'time': return <Clock className="w-5 h-5" />;
      case 'decision': return <Check className="w-5 h-5" />;
      case 'engagement': return <Users className="w-5 h-5" />;
      case 'topic': return <MessageCircle className="w-5 h-5" />;
      case 'risk': return <AlertCircle className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };
  
  // If not active, don't render
  if (!isActive) return null;
  
  return (
    <div className={`bg-slate-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-slate-700 to-slate-800 p-3 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <BarChart2 className="text-teal-400" />
          <h3 className="font-semibold text-white">Predictive Meeting Outcomes</h3>
        </div>
        <div className="flex items-center space-x-2">
          {predictions && (
            <div className="bg-slate-700 rounded-full px-2 py-0.5 text-xs text-teal-300 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {formatPercentage(predictions.confidenceScore)} confidence
            </div>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>
      
      {/* Content */}
      {expanded && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-700 mb-4">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'predictions' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('predictions')}
            >
              Predictions
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'recommendations' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('recommendations')}
            >
              Recommendations
              {recommendations.length > 0 && (
                <span className="ml-2 bg-teal-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {recommendations.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-100 p-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {/* Predictions tab */}
          {!loading && !error && activeTab === 'predictions' && predictions && (
            <div className="space-y-4">
              {/* Time to completion */}
              <div className="bg-slate-700/50 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-teal-400" />
                    Time to Completion
                  </h4>
                  <span className="text-teal-300 font-semibold">
                    {formatTimeToCompletion(predictions.timeToCompletion)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div 
                    className="bg-teal-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (predictions.timeToCompletion / 60) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Decision likelihood */}
              <div className="bg-slate-700/50 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center">
                    <Check className="w-4 h-4 mr-2 text-teal-400" />
                    Decision Likelihood
                  </h4>
                  <span className="text-teal-300 font-semibold">
                    {formatPercentage(predictions.decisionLikelihood)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div 
                    className="bg-teal-500 h-2.5 rounded-full" 
                    style={{ width: `${predictions.decisionLikelihood * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Participant sentiment */}
              <div className="bg-slate-700/50 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-2 text-teal-400" />
                    Participant Sentiment
                  </h4>
                  <div className="flex items-center">
                    <span className="text-gray-400 text-xs mr-2">Current</span>
                    <span className="text-teal-300 font-semibold">
                      {formatPercentage(predictions.participantSentiment.current)}
                    </span>
                    <span className="mx-1 text-gray-500">→</span>
                    <span className="text-gray-400 text-xs mr-2">Projected</span>
                    <span className="text-teal-300 font-semibold">
                      {formatPercentage(predictions.participantSentiment.projected)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 relative">
                  <div 
                    className="bg-teal-500 h-2.5 rounded-full" 
                    style={{ width: `${predictions.participantSentiment.current * 100}%` }}
                  ></div>
                  <div 
                    className="absolute top-0 h-2.5 border-r-2 border-teal-300"
                    style={{ left: `${predictions.participantSentiment.projected * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Key outcomes */}
              <div className="bg-slate-700/50 rounded-md p-3">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Predicted Key Outcomes</h4>
                <ul className="space-y-2">
                  {predictions.keyOutcomes.map((outcome, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{outcome.description}</span>
                      <span className="text-xs bg-teal-900/50 text-teal-300 px-2 py-0.5 rounded">
                        {formatPercentage(outcome.likelihood)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Risk areas */}
              {predictions.riskAreas && predictions.riskAreas.length > 0 && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-md p-3">
                  <h4 className="text-sm font-medium text-red-300 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                    Risk Areas
                  </h4>
                  <ul className="space-y-2">
                    {predictions.riskAreas.map((risk, index) => (
                      <li key={index} className="text-sm text-red-100">
                        <div className="flex justify-between">
                          <span>{risk.topic}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            risk.riskLevel === 'high' ? 'bg-red-900/50 text-red-300' :
                            risk.riskLevel === 'medium' ? 'bg-amber-900/50 text-amber-300' :
                            'bg-blue-900/50 text-blue-300'
                          }`}>
                            {risk.riskLevel}
                          </span>
                        </div>
                        <p className="text-xs text-red-200/70 mt-1">{risk.mitigationStrategy}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Recommendations tab */}
          {!loading && !error && activeTab === 'recommendations' && (
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="text-center py-6">
                  <Check className="w-12 h-12 text-teal-500 mx-auto mb-2" />
                  <p className="text-gray-400">No recommendations at this time.</p>
                  <p className="text-xs text-gray-500 mt-1">Meeting is progressing well!</p>
                </div>
              ) : (
                recommendations.map(recommendation => (
                  <div 
                    key={recommendation.id}
                    className={`border-l-4 rounded-md p-3 bg-slate-700/30 ${
                      recommendation.priority === 'high' ? 'border-red-500' :
                      recommendation.priority === 'medium' ? 'border-amber-500' :
                      'border-blue-500'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`p-1 rounded-full mr-3 ${
                        recommendation.priority === 'high' ? 'bg-red-900/50 text-red-400' :
                        recommendation.priority === 'medium' ? 'bg-amber-900/50 text-amber-400' :
                        'bg-blue-900/50 text-blue-400'
                      }`}>
                        {getRecommendationIcon(recommendation.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-200">{recommendation.message}</p>
                        {recommendation.actionable && (
                          <button
                            className="mt-2 text-xs bg-slate-600 hover:bg-slate-500 text-white py-1 px-3 rounded flex items-center"
                            onClick={() => handleRecommendationAction(recommendation)}
                          >
                            {recommendation.action}
                          </button>
                        )}
                      </div>
                      <div className={`text-xs font-medium uppercase ${getPriorityColor(recommendation.priority)}`}>
                        {recommendation.priority}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictiveOutcomesPanel;
