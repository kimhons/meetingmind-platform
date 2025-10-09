import React, { useState, useEffect } from 'react';

const InterviewPreparation = () => {
  const [step, setStep] = useState(1);
  const [interviewData, setInterviewData] = useState({
    companyId: '',
    companyName: '',
    role: '',
    interviewType: 'behavioral',
    duration: 60,
    focusAreas: []
  });
  const [preparation, setPreparation] = useState(null);
  const [loading, setLoading] = useState(false);

  const companies = [
    { id: 'google', name: 'Google', logo: '🔍' },
    { id: 'amazon', name: 'Amazon', logo: '📦' },
    { id: 'microsoft', name: 'Microsoft', logo: '💻' },
    { id: 'apple', name: 'Apple', logo: '🍎' },
    { id: 'startup', name: 'Startup', logo: '🚀' },
    { id: 'custom', name: 'Other Company', logo: '🏢' }
  ];

  const interviewTypes = [
    { id: 'behavioral', name: 'Behavioral Interview', icon: '🗣️', description: 'Past experiences and soft skills' },
    { id: 'technical', name: 'Technical Interview', icon: '💻', description: 'Coding and technical problem solving' },
    { id: 'case_study', name: 'Case Study', icon: '📊', description: 'Business problem solving' },
    { id: 'panel', name: 'Panel Interview', icon: '👥', description: 'Multiple interviewers' },
    { id: 'executive', name: 'Executive Interview', icon: '👔', description: 'Senior leadership assessment' }
  ];

  const focusAreaOptions = {
    behavioral: ['leadership', 'teamwork', 'conflict_resolution', 'adaptability', 'communication'],
    technical: ['coding', 'algorithms', 'system_design', 'debugging', 'architecture'],
    case_study: ['analytical_thinking', 'business_acumen', 'presentation_skills', 'market_analysis'],
    panel: ['multi_stakeholder_communication', 'pressure_handling', 'versatility'],
    executive: ['strategic_vision', 'leadership_philosophy', 'industry_knowledge', 'change_management']
  };

  const handleInputChange = (field, value) => {
    setInterviewData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFocusAreaToggle = (area) => {
    setInterviewData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const generatePreparation = async () => {
    setLoading(true);
    try {
      // Simulate API call to generate interview preparation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPreparation = {
        sessionId: 'interview_' + Date.now(),
        companyProfile: {
          name: interviewData.companyName || companies.find(c => c.id === interviewData.companyId)?.name,
          culture: ['innovation', 'collaboration', 'excellence'],
          values: ['Customer Focus', 'Think Big', 'Deliver Results']
        },
        preparationGuide: {
          overview: `Preparing for a ${interviewTypes.find(t => t.id === interviewData.interviewType)?.name} at ${interviewData.companyName}. This ${interviewData.duration}-minute interview will assess your fit for the ${interviewData.role} position.`,
          keyFocusAreas: interviewData.focusAreas.map(area => ({
            area: area.replace('_', ' '),
            importance: 'high',
            preparationTips: [`Practice ${area} scenarios`, `Prepare specific examples`, `Review best practices`]
          })),
          preparationSteps: [
            { step: 'Research the company', details: 'Study products, culture, and recent news', timeRequired: '2-3 hours' },
            { step: 'Practice relevant questions', details: 'Focus on high-priority questions', timeRequired: '3-4 hours' },
            { step: 'Prepare STAR stories', details: 'Develop compelling examples', timeRequired: '2 hours' },
            { step: 'Mock interview practice', details: 'Practice with AI simulation', timeRequired: '1-2 hours' }
          ]
        },
        relevantQuestions: [
          { question: 'Tell me about yourself', category: 'general', difficulty: 'easy' },
          { question: 'Why do you want to work here?', category: 'motivation', difficulty: 'medium' },
          { question: 'Describe a challenging project you worked on', category: 'behavioral', difficulty: 'medium' },
          { question: 'Where do you see yourself in 5 years?', category: 'career', difficulty: 'easy' },
          { question: 'What are your greatest strengths?', category: 'self_assessment', difficulty: 'easy' }
        ],
        successStrategies: {
          beforeInterview: [
            'Research the company thoroughly',
            'Practice your elevator pitch',
            'Prepare thoughtful questions',
            'Review your resume'
          ],
          duringInterview: [
            'Listen carefully and ask clarifying questions',
            'Use the STAR method for behavioral questions',
            'Show enthusiasm and genuine interest',
            'Connect your experience to their needs'
          ],
          afterInterview: [
            'Send thank-you email within 24 hours',
            'Reiterate your interest',
            'Address any concerns',
            'Follow up appropriately'
          ]
        }
      };
      
      setPreparation(mockPreparation);
      setStep(3);
    } catch (error) {
      console.error('Failed to generate preparation:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Interview Details</h2>
      <p>Tell us about your upcoming interview</p>
      
      <div className="form-group">
        <label>Company</label>
        <div className="company-grid">
          {companies.map(company => (
            <div
              key={company.id}
              className={`company-card ${interviewData.companyId === company.id ? 'selected' : ''}`}
              onClick={() => handleInputChange('companyId', company.id)}
            >
              <span className="company-logo">{company.logo}</span>
              <span className="company-name">{company.name}</span>
            </div>
          ))}
        </div>
        
        {interviewData.companyId === 'custom' && (
          <input
            type="text"
            placeholder="Enter company name"
            value={interviewData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="custom-company-input"
          />
        )}
      </div>

      <div className="form-group">
        <label>Role/Position</label>
        <input
          type="text"
          placeholder="e.g., Software Engineer, Product Manager"
          value={interviewData.role}
          onChange={(e) => handleInputChange('role', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Interview Type</label>
          <select
            value={interviewData.interviewType}
            onChange={(e) => handleInputChange('interviewType', e.target.value)}
          >
            {interviewTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Duration (minutes)</label>
          <select
            value={interviewData.duration}
            onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>
      </div>

      <div className="step-actions">
        <button 
          onClick={() => setStep(2)} 
          className="btn-primary"
          disabled={!interviewData.companyId || !interviewData.role}
        >
          Next: Focus Areas
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>Focus Areas</h2>
      <p>Select the areas you want to focus on for this interview</p>
      
      <div className="interview-type-info">
        <div className="type-header">
          <span className="type-icon">{interviewTypes.find(t => t.id === interviewData.interviewType)?.icon}</span>
          <div>
            <h3>{interviewTypes.find(t => t.id === interviewData.interviewType)?.name}</h3>
            <p>{interviewTypes.find(t => t.id === interviewData.interviewType)?.description}</p>
          </div>
        </div>
      </div>

      <div className="focus-areas">
        <label>Select Focus Areas (optional)</label>
        <div className="focus-area-grid">
          {focusAreaOptions[interviewData.interviewType]?.map(area => (
            <div
              key={area}
              className={`focus-area-card ${interviewData.focusAreas.includes(area) ? 'selected' : ''}`}
              onClick={() => handleFocusAreaToggle(area)}
            >
              {area.replace('_', ' ')}
            </div>
          ))}
        </div>
      </div>

      <div className="step-actions">
        <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
        <button onClick={generatePreparation} className="btn-primary" disabled={loading}>
          {loading ? 'Generating Preparation...' : 'Generate Interview Preparation'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Your Interview Preparation</h2>
      
      <div className="preparation-overview">
        <div className="overview-card">
          <h3>Interview Overview</h3>
          <p>{preparation.preparationGuide.overview}</p>
        </div>
      </div>

      <div className="preparation-sections">
        <div className="section">
          <h3>📚 Preparation Steps</h3>
          <div className="steps-list">
            {preparation.preparationGuide.preparationSteps.map((step, index) => (
              <div key={index} className="step-item">
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <h4>{step.step}</h4>
                  <p>{step.details}</p>
                  <span className="time-required">⏱️ {step.timeRequired}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>🎯 Key Focus Areas</h3>
          <div className="focus-areas-list">
            {preparation.preparationGuide.keyFocusAreas.map((area, index) => (
              <div key={index} className="focus-area-item">
                <h4>{area.area}</h4>
                <ul>
                  {area.preparationTips.map((tip, tipIndex) => (
                    <li key={tipIndex}>{tip}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>❓ Practice Questions</h3>
          <div className="questions-list">
            {preparation.relevantQuestions.map((question, index) => (
              <div key={index} className="question-item">
                <div className="question-header">
                  <span className="question-text">{question.question}</span>
                  <span className={`difficulty ${question.difficulty}`}>{question.difficulty}</span>
                </div>
                <span className="question-category">{question.category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>🚀 Success Strategies</h3>
          <div className="strategies-grid">
            <div className="strategy-column">
              <h4>Before Interview</h4>
              <ul>
                {preparation.successStrategies.beforeInterview.map((strategy, index) => (
                  <li key={index}>{strategy}</li>
                ))}
              </ul>
            </div>
            <div className="strategy-column">
              <h4>During Interview</h4>
              <ul>
                {preparation.successStrategies.duringInterview.map((strategy, index) => (
                  <li key={index}>{strategy}</li>
                ))}
              </ul>
            </div>
            <div className="strategy-column">
              <h4>After Interview</h4>
              <ul>
                {preparation.successStrategies.afterInterview.map((strategy, index) => (
                  <li key={index}>{strategy}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-secondary" onClick={() => setStep(1)}>Start New Preparation</button>
        <button className="btn-primary">Start Mock Interview</button>
        <button className="btn-outline">Download Preparation Guide</button>
      </div>
    </div>
  );

  return (
    <div className="interview-preparation">
      <div className="progress-bar">
        <div className="progress-steps">
          {[1, 2, 3].map(stepNum => (
            <div key={stepNum} className={`progress-step ${step >= stepNum ? 'active' : ''}`}>
              <div className="step-circle">{stepNum}</div>
              <span className="step-label">
                {stepNum === 1 ? 'Details' : stepNum === 2 ? 'Focus' : 'Preparation'}
              </span>
            </div>
          ))}
        </div>
        <div className="progress-line" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <style jsx>{`
        .interview-preparation {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }

        .progress-bar {
          position: relative;
          margin-bottom: 40px;
          padding: 20px 0;
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 2;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e1e8ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .progress-step.active .step-circle {
          background: #3498db;
          color: white;
        }

        .step-label {
          font-size: 14px;
          color: #6c757d;
        }

        .progress-step.active .step-label {
          color: #3498db;
          font-weight: 600;
        }

        .progress-line {
          position: absolute;
          top: 40px;
          left: 20px;
          right: 20px;
          height: 2px;
          background: #3498db;
          transition: width 0.3s ease;
          z-index: 1;
        }

        .step-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .step-content h2 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .company-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 15px;
        }

        .company-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          border: 2px solid #e1e8ed;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .company-card:hover {
          border-color: #3498db;
        }

        .company-card.selected {
          border-color: #3498db;
          background: #e3f2fd;
        }

        .company-logo {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .company-name {
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        .custom-company-input {
          margin-top: 10px;
        }

        .interview-type-info {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .type-header {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .type-icon {
          font-size: 32px;
        }

        .focus-area-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .focus-area-card {
          padding: 12px 16px;
          border: 2px solid #e1e8ed;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          font-weight: 500;
          text-transform: capitalize;
        }

        .focus-area-card:hover {
          border-color: #3498db;
        }

        .focus-area-card.selected {
          border-color: #3498db;
          background: #e3f2fd;
          color: #1976d2;
        }

        .step-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e1e8ed;
        }

        .btn-primary, .btn-secondary, .btn-outline {
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

        .btn-outline {
          background: white;
          color: #6c757d;
          border: 1px solid #6c757d;
        }

        .preparation-overview {
          margin-bottom: 30px;
        }

        .overview-card {
          background: #e3f2fd;
          border-radius: 8px;
          padding: 20px;
        }

        .preparation-sections {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .section h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .step-item {
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }

        .step-number {
          width: 30px;
          height: 30px;
          background: #3498db;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }

        .step-content h4 {
          margin-bottom: 5px;
          color: #2c3e50;
        }

        .time-required {
          color: #6c757d;
          font-size: 12px;
        }

        .focus-areas-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .focus-area-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
        }

        .focus-area-item h4 {
          color: #2c3e50;
          margin-bottom: 10px;
          text-transform: capitalize;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .question-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .question-text {
          font-weight: 600;
          color: #2c3e50;
          flex: 1;
        }

        .difficulty {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .difficulty.easy {
          background: #d4edda;
          color: #155724;
        }

        .difficulty.medium {
          background: #fff3cd;
          color: #856404;
        }

        .difficulty.hard {
          background: #f8d7da;
          color: #721c24;
        }

        .question-category {
          color: #6c757d;
          font-size: 12px;
          text-transform: capitalize;
        }

        .strategies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .strategy-column {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
        }

        .strategy-column h4 {
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .strategy-column ul {
          list-style: none;
          padding: 0;
        }

        .strategy-column li {
          padding: 8px 0;
          border-bottom: 1px solid #e1e8ed;
          position: relative;
          padding-left: 20px;
        }

        .strategy-column li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #28a745;
          font-weight: bold;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #e1e8ed;
        }
      `}</style>
    </div>
  );
};

export default InterviewPreparation;
