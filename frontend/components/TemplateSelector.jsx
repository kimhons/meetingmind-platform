import React, { useState, useEffect } from 'react';

const TemplateSelector = ({ onTemplateSelect, meetingType, industry }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const templateLibrary = {
    sales: [
      {
        id: 'sales_discovery',
        name: 'Sales Discovery',
        description: 'Focus on uncovering customer needs and pain points',
        prompts: {
          analysis: 'Analyze for buying signals, decision makers, and budget indicators',
          coaching: 'Provide guidance on questioning techniques and relationship building',
          followUp: 'Generate follow-up focused on value proposition and next steps'
        }
      },
      {
        id: 'sales_demo',
        name: 'Product Demo',
        description: 'Optimize product demonstrations and feature presentations',
        prompts: {
          analysis: 'Track engagement levels, feature interest, and objections',
          coaching: 'Guide demo flow and handle technical questions',
          followUp: 'Create technical follow-up with trial next steps'
        }
      },
      {
        id: 'sales_negotiation',
        name: 'Contract Negotiation',
        description: 'Navigate pricing discussions and contract terms',
        prompts: {
          analysis: 'Monitor concession patterns and leverage points',
          coaching: 'Provide negotiation tactics and closing strategies',
          followUp: 'Summarize agreed terms and implementation timeline'
        }
      }
    ],
    strategy: [
      {
        id: 'strategic_planning',
        name: 'Strategic Planning',
        description: 'Long-term planning and goal setting sessions',
        prompts: {
          analysis: 'Identify strategic opportunities and competitive threats',
          coaching: 'Guide strategic thinking and decision frameworks',
          followUp: 'Document strategic decisions and action plans'
        }
      },
      {
        id: 'market_analysis',
        name: 'Market Analysis',
        description: 'Competitive landscape and market opportunity discussions',
        prompts: {
          analysis: 'Analyze market trends and competitive positioning',
          coaching: 'Provide market intelligence and strategic insights',
          followUp: 'Create market analysis summary and recommendations'
        }
      }
    ],
    review: [
      {
        id: 'performance_review',
        name: 'Performance Review',
        description: 'Team and project performance evaluation',
        prompts: {
          analysis: 'Track performance metrics and improvement areas',
          coaching: 'Guide constructive feedback and goal setting',
          followUp: 'Document performance goals and development plans'
        }
      },
      {
        id: 'project_review',
        name: 'Project Review',
        description: 'Project status and milestone evaluation',
        prompts: {
          analysis: 'Monitor project progress and identify blockers',
          coaching: 'Provide project management guidance',
          followUp: 'Update project timeline and resource allocation'
        }
      }
    ],
    general: [
      {
        id: 'general_business',
        name: 'General Business',
        description: 'Standard business meeting optimization',
        prompts: {
          analysis: 'Provide comprehensive meeting analysis',
          coaching: 'General communication and collaboration guidance',
          followUp: 'Standard professional follow-up'
        }
      }
    ]
  };

  useEffect(() => {
    setLoading(true);
    
    // Get templates for meeting type, fallback to general
    const availableTemplates = templateLibrary[meetingType] || templateLibrary.general;
    
    // Add industry-specific variations if available
    const enhancedTemplates = availableTemplates.map(template => ({
      ...template,
      industry: industry,
      customized: industry !== 'general'
    }));
    
    setTemplates(enhancedTemplates);
    
    // Auto-select first template
    if (enhancedTemplates.length > 0) {
      setSelectedTemplate(enhancedTemplates[0]);
      onTemplateSelect(enhancedTemplates[0]);
    }
    
    setLoading(false);
  }, [meetingType, industry]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    onTemplateSelect(template);
  };

  if (loading) {
    return (
      <div className="template-selector loading">
        <div className="loading-spinner"></div>
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="template-selector">
      <div className="template-header">
        <h3>Select Meeting Template</h3>
        <p>Choose how MeetingMind should assist with this {meetingType} meeting</p>
      </div>
      
      <div className="template-grid">
        {templates.map(template => (
          <div 
            key={template.id}
            className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="template-header">
              <h4>{template.name}</h4>
              {template.customized && (
                <span className="industry-badge">{industry}</span>
              )}
            </div>
            
            <p className="template-description">{template.description}</p>
            
            <div className="template-features">
              <div className="feature">
                <strong>Analysis:</strong> {template.prompts.analysis}
              </div>
              <div className="feature">
                <strong>Coaching:</strong> {template.prompts.coaching}
              </div>
              <div className="feature">
                <strong>Follow-up:</strong> {template.prompts.followUp}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="template-actions">
        <button 
          className="btn-primary"
          onClick={() => onTemplateSelect(selectedTemplate)}
          disabled={!selectedTemplate}
        >
          Use Selected Template
        </button>
        
        <button className="btn-secondary">
          Create Custom Template
        </button>
      </div>
      
      <style jsx>{`
        .template-selector {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .template-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .template-header h3 {
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .template-card {
          border: 2px solid #e1e8ed;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }
        
        .template-card:hover {
          border-color: #3498db;
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
        }
        
        .template-card.selected {
          border-color: #3498db;
          background: #f8fbff;
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
        }
        
        .template-card .template-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .template-card h4 {
          margin: 0;
          color: #2c3e50;
        }
        
        .industry-badge {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          text-transform: uppercase;
        }
        
        .template-description {
          color: #7f8c8d;
          margin-bottom: 15px;
          font-size: 14px;
        }
        
        .template-features {
          font-size: 13px;
        }
        
        .feature {
          margin-bottom: 8px;
          color: #5a6c7d;
        }
        
        .feature strong {
          color: #2c3e50;
        }
        
        .template-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        
        .btn-primary, .btn-secondary {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background: #3498db;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #2980b9;
        }
        
        .btn-primary:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: white;
          color: #3498db;
          border: 2px solid #3498db;
        }
        
        .btn-secondary:hover {
          background: #3498db;
          color: white;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TemplateSelector;
