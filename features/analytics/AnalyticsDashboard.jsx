/**
 * Analytics Dashboard Component
 * 
 * Comprehensive meeting analytics dashboard showcasing advanced intelligence
 * capabilities including opportunity detection, performance scoring, and ROI analysis.
 */

import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ meetingId, analysisData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('last_30_days');
  const [selectedMetric, setSelectedMetric] = useState('effectiveness');

  // Mock data for demonstration (would come from analysis engine)
  const mockAnalysisData = analysisData || {
    performanceScores: {
      overallEffectiveness: 78,
      grade: 'B',
      componentScores: {
        opportunity: 72,
        engagement: 85,
        decision: 68,
        communication: 82,
        timeUtilization: 75
      },
      strengths: ['High participant engagement', 'Clear communication'],
      improvementAreas: ['Decision clarity and implementation', 'Opportunity recognition']
    },
    opportunityAnalysis: {
      totalOpportunities: 23,
      categories: {
        clarification: { count: 8, opportunities: [] },
        engagement: { count: 7, opportunities: [] },
        decision: { count: 6, opportunities: [] },
        other: { count: 2, opportunities: [] }
      },
      highImpactOpportunities: 12,
      realTimeActionableOpportunities: 18,
      opportunityDensity: 3.8
    },
    engagementAnalysis: {
      overallEngagement: 0.85,
      silentParticipants: 2,
      dominantParticipants: 1,
      averageSpeakingTime: 4.2,
      participationBalance: { balanced: false }
    },
    decisionAnalysis: {
      decisionCount: 4,
      unclearDecisions: 2,
      implementationGaps: 1,
      decisionQuality: 0.68
    },
    roiAnalysis: {
      meetingCost: 1250,
      totalPotentialSavings: 387,
      roi: 31,
      valueCreated: true
    },
    recommendations: [
      {
        priority: 'high',
        category: 'decision_making',
        title: 'Improve Decision Clarity and Implementation',
        description: '2 decisions need clearer outcomes and implementation plans.',
        impact: 'high',
        effort: 'medium',
        timeframe: 'immediate'
      },
      {
        priority: 'high',
        category: 'engagement',
        title: 'Address Silent Participants',
        description: '2 participants had minimal participation.',
        impact: 'high',
        effort: 'medium',
        timeframe: 'next_meeting'
      },
      {
        priority: 'medium',
        category: 'opportunity_management',
        title: 'Enable Real-Time Opportunity Alerts',
        description: '23 opportunities detected - enable real-time alerts.',
        impact: 'medium',
        effort: 'low',
        timeframe: 'immediate'
      }
    ],
    summary: {
      overallGrade: 'B',
      effectivenessScore: 78,
      keyMetrics: {
        opportunitiesIdentified: 23,
        highPriorityRecommendations: 2,
        estimatedROI: 31
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'opportunities', label: 'Opportunities', icon: '🎯' },
    { id: 'engagement', label: 'Engagement', icon: '👥' },
    { id: 'decisions', label: 'Decisions', icon: '⚡' },
    { id: 'roi', label: 'ROI Analysis', icon: '💰' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' }
  ];

  const renderOverviewTab = () => (
    <div className="overview-tab">
      {/* Executive Summary Card */}
      <div className="summary-card">
        <div className="summary-header">
          <h2>Meeting Effectiveness Summary</h2>
          <div className="grade-badge grade-b">{mockAnalysisData.summary.overallGrade}</div>
        </div>
        
        <div className="summary-metrics">
          <div className="metric-item">
            <span className="metric-value">{mockAnalysisData.summary.effectivenessScore}</span>
            <span className="metric-label">Effectiveness Score</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{mockAnalysisData.summary.keyMetrics.opportunitiesIdentified}</span>
            <span className="metric-label">Opportunities Found</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{mockAnalysisData.summary.keyMetrics.estimatedROI}%</span>
            <span className="metric-label">Estimated ROI</span>
          </div>
        </div>
      </div>

      {/* Performance Scores */}
      <div className="performance-scores-card">
        <h3>Performance Breakdown</h3>
        <div className="score-grid">
          {Object.entries(mockAnalysisData.performanceScores.componentScores).map(([category, score]) => (
            <div key={category} className="score-item">
              <div className="score-header">
                <span className="score-category">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                <span className="score-value">{score}</span>
              </div>
              <div className="score-bar">
                <div 
                  className={`score-fill score-${getScoreColor(score)}`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="insights-grid">
        <div className="insight-card strengths">
          <h4>💪 Strengths</h4>
          <ul>
            {mockAnalysisData.performanceScores.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
        
        <div className="insight-card improvements">
          <h4>🎯 Areas for Improvement</h4>
          <ul>
            {mockAnalysisData.performanceScores.improvementAreas.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Trend Chart Placeholder */}
      <div className="trend-chart-card">
        <h3>Effectiveness Trend</h3>
        <div className="chart-placeholder">
          <div className="trend-line">
            <div className="trend-points">
              {[65, 72, 68, 75, 78].map((value, index) => (
                <div 
                  key={index}
                  className="trend-point"
                  style={{ 
                    left: `${(index / 4) * 100}%`,
                    bottom: `${value}%`
                  }}
                  title={`Meeting ${index + 1}: ${value}%`}
                ></div>
              ))}
            </div>
          </div>
          <div className="chart-labels">
            <span>5 meetings ago</span>
            <span>Current</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOpportunitiesTab = () => (
    <div className="opportunities-tab">
      {/* Opportunity Summary */}
      <div className="opportunity-summary">
        <div className="summary-stats">
          <div className="stat-card">
            <span className="stat-number">{mockAnalysisData.opportunityAnalysis.totalOpportunities}</span>
            <span className="stat-label">Total Opportunities</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{mockAnalysisData.opportunityAnalysis.highImpactOpportunities}</span>
            <span className="stat-label">High Impact</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{mockAnalysisData.opportunityAnalysis.realTimeActionableOpportunities}</span>
            <span className="stat-label">Real-Time Actionable</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{mockAnalysisData.opportunityAnalysis.opportunityDensity}</span>
            <span className="stat-label">Per Minute</span>
          </div>
        </div>
      </div>

      {/* Opportunity Categories */}
      <div className="opportunity-categories">
        <h3>Opportunity Breakdown</h3>
        <div className="category-grid">
          {Object.entries(mockAnalysisData.opportunityAnalysis.categories).map(([category, data]) => (
            <div key={category} className={`category-card category-${category}`}>
              <div className="category-header">
                <span className="category-icon">{getCategoryIcon(category)}</span>
                <span className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </div>
              <div className="category-count">{data.count}</div>
              <div className="category-description">{getCategoryDescription(category)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunity Timeline */}
      <div className="opportunity-timeline">
        <h3>Opportunity Timeline</h3>
        <div className="timeline-container">
          {generateMockOpportunityTimeline().map((opportunity, index) => (
            <div key={index} className={`timeline-item ${opportunity.type.toLowerCase()}`}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-time">{opportunity.time}</div>
                <div className="timeline-title">{opportunity.title}</div>
                <div className="timeline-description">{opportunity.description}</div>
                <div className={`timeline-confidence confidence-${getConfidenceLevel(opportunity.confidence)}`}>
                  {Math.round(opportunity.confidence * 100)}% confidence
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missed Opportunities Alert */}
      <div className="missed-opportunities-alert">
        <div className="alert-header">
          <span className="alert-icon">⚠️</span>
          <span className="alert-title">High-Impact Missed Opportunities</span>
        </div>
        <div className="alert-content">
          <p>12 high-confidence opportunities were identified that could have significantly improved meeting outcomes.</p>
          <button className="alert-action">Enable Real-Time Alerts</button>
        </div>
      </div>
    </div>
  );

  const renderEngagementTab = () => (
    <div className="engagement-tab">
      {/* Engagement Overview */}
      <div className="engagement-overview">
        <div className="engagement-score-card">
          <div className="score-circle">
            <div className="score-inner">
              <span className="score-percentage">{Math.round(mockAnalysisData.engagementAnalysis.overallEngagement * 100)}%</span>
              <span className="score-subtitle">Overall Engagement</span>
            </div>
          </div>
        </div>
        
        <div className="engagement-metrics">
          <div className="metric-row">
            <span className="metric-label">Silent Participants</span>
            <span className="metric-value warning">{mockAnalysisData.engagementAnalysis.silentParticipants}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Dominant Participants</span>
            <span className="metric-value warning">{mockAnalysisData.engagementAnalysis.dominantParticipants}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Avg Speaking Time</span>
            <span className="metric-value">{mockAnalysisData.engagementAnalysis.averageSpeakingTime} min</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Participation Balance</span>
            <span className={`metric-value ${mockAnalysisData.engagementAnalysis.participationBalance.balanced ? 'success' : 'warning'}`}>
              {mockAnalysisData.engagementAnalysis.participationBalance.balanced ? 'Balanced' : 'Unbalanced'}
            </span>
          </div>
        </div>
      </div>

      {/* Participant Analysis */}
      <div className="participant-analysis">
        <h3>Individual Participant Analysis</h3>
        <div className="participant-grid">
          {generateMockParticipantData().map((participant, index) => (
            <div key={index} className="participant-card">
              <div className="participant-header">
                <div className="participant-avatar">{participant.initials}</div>
                <div className="participant-info">
                  <span className="participant-name">{participant.name}</span>
                  <span className="participant-role">{participant.role}</span>
                </div>
              </div>
              
              <div className="participant-metrics">
                <div className="metric-item">
                  <span className="metric-label">Speaking Time</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ width: `${participant.speakingPercentage}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">{participant.speakingPercentage}%</span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Engagement Level</span>
                  <div className={`engagement-indicator ${participant.engagementLevel}`}>
                    {participant.engagementLevel.charAt(0).toUpperCase() + participant.engagementLevel.slice(1)}
                  </div>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Contributions</span>
                  <span className="metric-value">{participant.contributions}</span>
                </div>
              </div>
              
              {participant.insights && (
                <div className="participant-insights">
                  <span className="insight-label">💡 Insight:</span>
                  <span className="insight-text">{participant.insights}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Timeline */}
      <div className="engagement-timeline">
        <h3>Engagement Flow</h3>
        <div className="timeline-chart">
          <div className="timeline-axis">
            {[0, 15, 30, 45, 60].map(minute => (
              <div key={minute} className="axis-marker">
                <span className="axis-label">{minute}m</span>
              </div>
            ))}
          </div>
          <div className="engagement-curve">
            {generateEngagementCurve().map((point, index) => (
              <div 
                key={index}
                className="curve-point"
                style={{ 
                  left: `${(index / 12) * 100}%`,
                  bottom: `${point.engagement * 100}%`
                }}
                title={`${point.time}: ${Math.round(point.engagement * 100)}% engagement`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDecisionsTab = () => (
    <div className="decisions-tab">
      {/* Decision Summary */}
      <div className="decision-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <span className="card-number">{mockAnalysisData.decisionAnalysis.decisionCount}</span>
            <span className="card-label">Decisions Made</span>
          </div>
          <div className="summary-card warning">
            <span className="card-number">{mockAnalysisData.decisionAnalysis.unclearDecisions}</span>
            <span className="card-label">Unclear Outcomes</span>
          </div>
          <div className="summary-card error">
            <span className="card-number">{mockAnalysisData.decisionAnalysis.implementationGaps}</span>
            <span className="card-label">Implementation Gaps</span>
          </div>
          <div className="summary-card">
            <span className="card-number">{Math.round(mockAnalysisData.decisionAnalysis.decisionQuality * 100)}%</span>
            <span className="card-label">Quality Score</span>
          </div>
        </div>
      </div>

      {/* Decision Details */}
      <div className="decision-details">
        <h3>Decision Analysis</h3>
        <div className="decision-list">
          {generateMockDecisions().map((decision, index) => (
            <div key={index} className={`decision-item ${decision.status}`}>
              <div className="decision-header">
                <span className="decision-title">{decision.title}</span>
                <span className={`decision-status status-${decision.status}`}>
                  {decision.status.charAt(0).toUpperCase() + decision.status.slice(1)}
                </span>
              </div>
              
              <div className="decision-content">
                <p className="decision-description">{decision.description}</p>
                
                <div className="decision-metrics">
                  <div className="metric-group">
                    <span className="metric-label">Clarity Score</span>
                    <div className="score-bar">
                      <div 
                        className={`score-fill ${getScoreColor(decision.clarity * 100)}`}
                        style={{ width: `${decision.clarity * 100}%` }}
                      ></div>
                    </div>
                    <span className="score-text">{Math.round(decision.clarity * 100)}%</span>
                  </div>
                </div>
                
                <div className="decision-implementation">
                  <div className="implementation-item">
                    <span className="impl-label">Owner:</span>
                    <span className={`impl-value ${decision.owner ? 'assigned' : 'missing'}`}>
                      {decision.owner || 'Not assigned'}
                    </span>
                  </div>
                  <div className="implementation-item">
                    <span className="impl-label">Deadline:</span>
                    <span className={`impl-value ${decision.deadline ? 'set' : 'missing'}`}>
                      {decision.deadline || 'Not set'}
                    </span>
                  </div>
                  <div className="implementation-item">
                    <span className="impl-label">Action Items:</span>
                    <span className={`impl-value ${decision.actionItems > 0 ? 'defined' : 'missing'}`}>
                      {decision.actionItems > 0 ? `${decision.actionItems} items` : 'None defined'}
                    </span>
                  </div>
                </div>
                
                {decision.recommendations && (
                  <div className="decision-recommendations">
                    <span className="rec-label">💡 Recommendations:</span>
                    <ul>
                      {decision.recommendations.map((rec, recIndex) => (
                        <li key={recIndex}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Quality Matrix */}
      <div className="decision-quality-matrix">
        <h3>Decision Quality Assessment</h3>
        <div className="quality-grid">
          <div className="quality-header">
            <span></span>
            <span>Information</span>
            <span>Stakeholder Input</span>
            <span>Alternatives</span>
            <span>Implementation</span>
          </div>
          {generateMockDecisions().map((decision, index) => (
            <div key={index} className="quality-row">
              <span className="decision-name">{decision.title}</span>
              <div className={`quality-cell ${decision.hasInformation ? 'good' : 'poor'}`}>
                {decision.hasInformation ? '✓' : '✗'}
              </div>
              <div className={`quality-cell ${decision.hasStakeholderInput ? 'good' : 'poor'}`}>
                {decision.hasStakeholderInput ? '✓' : '✗'}
              </div>
              <div className={`quality-cell ${decision.hasAlternatives ? 'good' : 'poor'}`}>
                {decision.hasAlternatives ? '✓' : '✗'}
              </div>
              <div className={`quality-cell ${decision.hasImplementation ? 'good' : 'poor'}`}>
                {decision.hasImplementation ? '✓' : '✗'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderROITab = () => (
    <div className="roi-tab">
      {/* ROI Summary */}
      <div className="roi-summary">
        <div className="roi-header">
          <h2>Meeting ROI Analysis</h2>
          <div className={`roi-indicator ${mockAnalysisData.roiAnalysis.valueCreated ? 'positive' : 'negative'}`}>
            {mockAnalysisData.roiAnalysis.roi > 0 ? '+' : ''}{mockAnalysisData.roiAnalysis.roi}% ROI
          </div>
        </div>
        
        <div className="roi-breakdown">
          <div className="cost-analysis">
            <h3>Cost Analysis</h3>
            <div className="cost-item">
              <span className="cost-label">Meeting Cost</span>
              <span className="cost-value">${mockAnalysisData.roiAnalysis.meetingCost.toLocaleString()}</span>
            </div>
            <div className="cost-item">
              <span className="cost-label">Potential Savings</span>
              <span className="cost-value positive">${mockAnalysisData.roiAnalysis.totalPotentialSavings.toLocaleString()}</span>
            </div>
            <div className="cost-item total">
              <span className="cost-label">Net Value</span>
              <span className={`cost-value ${mockAnalysisData.roiAnalysis.valueCreated ? 'positive' : 'negative'}`}>
                ${(mockAnalysisData.roiAnalysis.totalPotentialSavings - mockAnalysisData.roiAnalysis.meetingCost).toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="savings-breakdown">
            <h3>Potential Savings Breakdown</h3>
            <div className="savings-chart">
              {generateSavingsBreakdown().map((item, index) => (
                <div key={index} className="savings-item">
                  <div className="savings-bar">
                    <div 
                      className="savings-fill"
                      style={{ width: `${(item.amount / mockAnalysisData.roiAnalysis.totalPotentialSavings) * 100}%` }}
                    ></div>
                  </div>
                  <div className="savings-details">
                    <span className="savings-category">{item.category}</span>
                    <span className="savings-amount">${item.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Value Creation Metrics */}
      <div className="value-metrics">
        <h3>Value Creation Opportunities</h3>
        <div className="value-grid">
          <div className="value-card">
            <div className="value-icon">⏱️</div>
            <div className="value-content">
              <span className="value-title">Time Efficiency</span>
              <span className="value-description">15 minutes saved through better agenda management</span>
              <span className="value-amount">$156 value</span>
            </div>
          </div>
          
          <div className="value-card">
            <div className="value-icon">🎯</div>
            <div className="value-content">
              <span className="value-title">Decision Quality</span>
              <span className="value-description">Improved decision-making process and clarity</span>
              <span className="value-amount">$125 value</span>
            </div>
          </div>
          
          <div className="value-card">
            <div className="value-icon">👥</div>
            <div className="value-content">
              <span className="value-title">Engagement Boost</span>
              <span className="value-description">Higher participation leads to better outcomes</span>
              <span className="value-amount">$106 value</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Projection */}
      <div className="roi-projection">
        <h3>ROI Projection Over Time</h3>
        <div className="projection-chart">
          <div className="chart-container">
            {generateROIProjection().map((point, index) => (
              <div 
                key={index}
                className="projection-bar"
                style={{ height: `${Math.max(10, point.value)}%` }}
                title={`Month ${index + 1}: ${point.value}% ROI`}
              >
                <span className="bar-label">M{index + 1}</span>
              </div>
            ))}
          </div>
          <div className="projection-summary">
            <p>Projected cumulative ROI improvement through consistent application of recommendations.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecommendationsTab = () => (
    <div className="recommendations-tab">
      {/* Priority Overview */}
      <div className="priority-overview">
        <div className="priority-stats">
          <div className="priority-card high">
            <span className="priority-count">{mockAnalysisData.recommendations.filter(r => r.priority === 'high').length}</span>
            <span className="priority-label">High Priority</span>
          </div>
          <div className="priority-card medium">
            <span className="priority-count">{mockAnalysisData.recommendations.filter(r => r.priority === 'medium').length}</span>
            <span className="priority-label">Medium Priority</span>
          </div>
          <div className="priority-card low">
            <span className="priority-count">{mockAnalysisData.recommendations.filter(r => r.priority === 'low').length}</span>
            <span className="priority-label">Low Priority</span>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="recommendations-list">
        <h3>Actionable Recommendations</h3>
        {mockAnalysisData.recommendations.map((recommendation, index) => (
          <div key={index} className={`recommendation-card priority-${recommendation.priority}`}>
            <div className="recommendation-header">
              <div className="rec-title-section">
                <span className={`priority-badge ${recommendation.priority}`}>
                  {recommendation.priority.toUpperCase()}
                </span>
                <h4 className="rec-title">{recommendation.title}</h4>
              </div>
              <div className="rec-meta">
                <span className={`impact-badge ${recommendation.impact}`}>
                  {recommendation.impact} impact
                </span>
                <span className={`effort-badge ${recommendation.effort}`}>
                  {recommendation.effort} effort
                </span>
              </div>
            </div>
            
            <div className="recommendation-content">
              <p className="rec-description">{recommendation.description}</p>
              
              <div className="rec-details">
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{recommendation.category.replace('_', ' ')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Timeframe:</span>
                  <span className="detail-value">{recommendation.timeframe.replace('_', ' ')}</span>
                </div>
              </div>
              
              {recommendation.specificActions && (
                <div className="specific-actions">
                  <span className="actions-label">Specific Actions:</span>
                  <ul className="actions-list">
                    {recommendation.specificActions.map((action, actionIndex) => (
                      <li key={actionIndex}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="recommendation-actions">
              <button className="action-btn primary">Implement Now</button>
              <button className="action-btn secondary">Schedule</button>
              <button className="action-btn tertiary">Learn More</button>
            </div>
          </div>
        ))}
      </div>

      {/* Implementation Roadmap */}
      <div className="implementation-roadmap">
        <h3>Implementation Roadmap</h3>
        <div className="roadmap-timeline">
          <div className="timeline-track">
            <div className="timeline-phase immediate">
              <div className="phase-header">
                <span className="phase-title">Immediate (Today)</span>
                <span className="phase-count">2 actions</span>
              </div>
              <div className="phase-items">
                <div className="roadmap-item">Enable real-time opportunity alerts</div>
                <div className="roadmap-item">Document unclear decisions with owners</div>
              </div>
            </div>
            
            <div className="timeline-phase next-meeting">
              <div className="phase-header">
                <span className="phase-title">Next Meeting</span>
                <span className="phase-count">1 action</span>
              </div>
              <div className="phase-items">
                <div className="roadmap-item">Implement engagement strategies for silent participants</div>
              </div>
            </div>
            
            <div className="timeline-phase ongoing">
              <div className="phase-header">
                <span className="phase-title">Ongoing</span>
                <span className="phase-count">3 actions</span>
              </div>
              <div className="phase-items">
                <div className="roadmap-item">Monitor decision implementation progress</div>
                <div className="roadmap-item">Track engagement improvements</div>
                <div className="roadmap-item">Measure ROI impact</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper functions for generating mock data and styling
  const getScoreColor = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      clarification: '❓',
      engagement: '👥',
      decision: '⚡',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      clarification: 'Moments needing clarification or explanation',
      engagement: 'Participation and involvement opportunities',
      decision: 'Decision-making and consensus opportunities',
      other: 'Additional improvement opportunities'
    };
    return descriptions[category] || 'Other opportunities';
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const generateMockOpportunityTimeline = () => [
    {
      time: '10:15 AM',
      type: 'CLARIFICATION',
      title: 'Technical Term Clarification',
      description: 'API terminology used without explanation',
      confidence: 0.85
    },
    {
      time: '10:23 AM',
      type: 'ENGAGEMENT',
      title: 'Silent Participant',
      description: 'Sarah has not contributed for 8 minutes',
      confidence: 0.92
    },
    {
      time: '10:31 AM',
      type: 'DECISION',
      title: 'Decision Point Identified',
      description: 'Budget allocation discussion needs resolution',
      confidence: 0.78
    },
    {
      time: '10:45 AM',
      type: 'CLARIFICATION',
      title: 'Confusion Signal',
      description: 'Multiple "I don\'t understand" expressions detected',
      confidence: 0.95
    }
  ];

  const generateMockParticipantData = () => [
    {
      name: 'Alex Johnson',
      role: 'Project Manager',
      initials: 'AJ',
      speakingPercentage: 35,
      engagementLevel: 'high',
      contributions: 12,
      insights: 'Dominating conversation - consider facilitating others'
    },
    {
      name: 'Sarah Chen',
      role: 'Developer',
      initials: 'SC',
      speakingPercentage: 8,
      engagementLevel: 'low',
      contributions: 2,
      insights: 'Has relevant expertise but minimal participation'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Designer',
      initials: 'MR',
      speakingPercentage: 22,
      engagementLevel: 'medium',
      contributions: 7,
      insights: 'Good balance of listening and contributing'
    },
    {
      name: 'Emma Wilson',
      role: 'Product Owner',
      initials: 'EW',
      speakingPercentage: 28,
      engagementLevel: 'high',
      contributions: 9,
      insights: 'Effective facilitation and decision-making'
    }
  ];

  const generateEngagementCurve = () => [
    { time: '0m', engagement: 0.8 },
    { time: '5m', engagement: 0.85 },
    { time: '10m', engagement: 0.9 },
    { time: '15m', engagement: 0.75 },
    { time: '20m', engagement: 0.7 },
    { time: '25m', engagement: 0.65 },
    { time: '30m', engagement: 0.8 },
    { time: '35m', engagement: 0.85 },
    { time: '40m', engagement: 0.9 },
    { time: '45m', engagement: 0.88 },
    { time: '50m', engagement: 0.82 },
    { time: '55m', engagement: 0.85 },
    { time: '60m', engagement: 0.9 }
  ];

  const generateMockDecisions = () => [
    {
      title: 'Budget Allocation for Q4',
      description: 'Discussed budget distribution across teams for the final quarter',
      status: 'unclear',
      clarity: 0.4,
      owner: null,
      deadline: null,
      actionItems: 0,
      hasInformation: true,
      hasStakeholderInput: false,
      hasAlternatives: true,
      hasImplementation: false,
      recommendations: [
        'Assign clear budget owner',
        'Set specific allocation deadline',
        'Define approval process'
      ]
    },
    {
      title: 'New Feature Prioritization',
      description: 'Agreed to prioritize user authentication improvements',
      status: 'clear',
      clarity: 0.9,
      owner: 'Sarah Chen',
      deadline: 'Nov 15, 2024',
      actionItems: 3,
      hasInformation: true,
      hasStakeholderInput: true,
      hasAlternatives: true,
      hasImplementation: true,
      recommendations: null
    },
    {
      title: 'Meeting Schedule Change',
      description: 'Discussed moving weekly standup to different time',
      status: 'pending',
      clarity: 0.6,
      owner: 'Alex Johnson',
      deadline: 'This week',
      actionItems: 1,
      hasInformation: false,
      hasStakeholderInput: true,
      hasAlternatives: false,
      hasImplementation: false,
      recommendations: [
        'Survey all team members for availability',
        'Consider timezone constraints'
      ]
    }
  ];

  const generateSavingsBreakdown = () => [
    { category: 'Time Efficiency', amount: 156 },
    { category: 'Decision Quality', amount: 125 },
    { category: 'Engagement Value', amount: 106 }
  ];

  const generateROIProjection = () => [
    { value: 31 },
    { value: 45 },
    { value: 52 },
    { value: 58 },
    { value: 63 },
    { value: 67 }
  ];

  return (
    <div className="analytics-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Meeting Analytics Dashboard</h1>
          <div className="header-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-selector"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <button className="export-btn">📊 Export Report</button>
            <button className="settings-btn">⚙️ Settings</button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'opportunities' && renderOpportunitiesTab()}
        {activeTab === 'engagement' && renderEngagementTab()}
        {activeTab === 'decisions' && renderDecisionsTab()}
        {activeTab === 'roi' && renderROITab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
