import React, { useState } from 'react';

const TemplateBuilder = ({ onSave, onCancel, existingTemplate = null }) => {
  const [template, setTemplate] = useState(existingTemplate || {
    name: '',
    description: '',
    meetingType: 'general',
    industry: 'general',
    prompts: {
      analysis: '',
      coaching: '',
      followUp: ''
    },
    variables: [],
    tags: []
  });

  const [newVariable, setNewVariable] = useState({ name: '', description: '', type: 'text' });
  const [newTag, setNewTag] = useState('');

  const meetingTypes = [
    { value: 'sales', label: 'Sales Meeting' },
    { value: 'strategy', label: 'Strategy Meeting' },
    { value: 'review', label: 'Review Meeting' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'planning', label: 'Planning Meeting' },
    { value: 'general', label: 'General Meeting' }
  ];

  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'general', label: 'General' }
  ];

  const variableTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Selection' }
  ];

  const handleInputChange = (field, value) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePromptChange = (promptType, value) => {
    setTemplate(prev => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [promptType]: value
      }
    }));
  };

  const addVariable = () => {
    if (newVariable.name.trim()) {
      setTemplate(prev => ({
        ...prev,
        variables: [...prev.variables, { ...newVariable, id: Date.now() }]
      }));
      setNewVariable({ name: '', description: '', type: 'text' });
    }
  };

  const removeVariable = (id) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v.id !== id)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !template.tags.includes(newTag.trim())) {
      setTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSave = () => {
    if (template.name.trim() && template.description.trim()) {
      onSave(template);
    }
  };

  const insertVariable = (promptType, variableName) => {
    const currentPrompt = template.prompts[promptType];
    const newPrompt = currentPrompt + `{{${variableName}}}`;
    handlePromptChange(promptType, newPrompt);
  };

  return (
    <div className="template-builder">
      <div className="builder-header">
        <h2>{existingTemplate ? 'Edit Template' : 'Create Custom Template'}</h2>
        <p>Build a custom template for your specific meeting needs</p>
      </div>

      <div className="builder-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label>Template Name *</label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Customer Discovery Call"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={template.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this template is used for..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Meeting Type</label>
              <select
                value={template.meetingType}
                onChange={(e) => handleInputChange('meetingType', e.target.value)}
              >
                {meetingTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Industry</label>
              <select
                value={template.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
              >
                {industries.map(industry => (
                  <option key={industry.value} value={industry.value}>{industry.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Variables */}
        <div className="form-section">
          <h3>Template Variables</h3>
          <p>Create variables that can be customized for each meeting</p>
          
          <div className="variable-creator">
            <div className="form-row">
              <input
                type="text"
                placeholder="Variable name (e.g., company_name)"
                value={newVariable.name}
                onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Description"
                value={newVariable.description}
                onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
              />
              <select
                value={newVariable.type}
                onChange={(e) => setNewVariable(prev => ({ ...prev, type: e.target.value }))}
              >
                {variableTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <button type="button" onClick={addVariable} className="btn-add">Add</button>
            </div>
          </div>

          <div className="variables-list">
            {template.variables.map(variable => (
              <div key={variable.id} className="variable-item">
                <span className="variable-name">{{variable.name}}</span>
                <span className="variable-desc">{variable.description}</span>
                <span className="variable-type">{variable.type}</span>
                <button onClick={() => removeVariable(variable.id)} className="btn-remove">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Prompts */}
        <div className="form-section">
          <h3>AI Prompts</h3>
          
          <div className="prompt-editor">
            <div className="prompt-group">
              <label>Analysis Prompt</label>
              <div className="prompt-controls">
                <textarea
                  value={template.prompts.analysis}
                  onChange={(e) => handlePromptChange('analysis', e.target.value)}
                  placeholder="Define how AI should analyze the meeting..."
                  rows="4"
                />
                <div className="variable-buttons">
                  {template.variables.map(variable => (
                    <button
                      key={variable.id}
                      type="button"
                      onClick={() => insertVariable('analysis', variable.name)}
                      className="btn-variable"
                    >
                      {variable.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="prompt-group">
              <label>Coaching Prompt</label>
              <div className="prompt-controls">
                <textarea
                  value={template.prompts.coaching}
                  onChange={(e) => handlePromptChange('coaching', e.target.value)}
                  placeholder="Define how AI should provide coaching..."
                  rows="4"
                />
                <div className="variable-buttons">
                  {template.variables.map(variable => (
                    <button
                      key={variable.id}
                      type="button"
                      onClick={() => insertVariable('coaching', variable.name)}
                      className="btn-variable"
                    >
                      {variable.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="prompt-group">
              <label>Follow-up Prompt</label>
              <div className="prompt-controls">
                <textarea
                  value={template.prompts.followUp}
                  onChange={(e) => handlePromptChange('followUp', e.target.value)}
                  placeholder="Define how AI should generate follow-ups..."
                  rows="4"
                />
                <div className="variable-buttons">
                  {template.variables.map(variable => (
                    <button
                      key={variable.id}
                      type="button"
                      onClick={() => insertVariable('followUp', variable.name)}
                      className="btn-variable"
                    >
                      {variable.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="form-section">
          <h3>Tags</h3>
          <div className="tag-creator">
            <input
              type="text"
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <button type="button" onClick={addTag} className="btn-add">Add Tag</button>
          </div>
          
          <div className="tags-list">
            {template.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button onClick={() => removeTag(tag)} className="tag-remove">×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="builder-actions">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} className="btn-primary" disabled={!template.name.trim() || !template.description.trim()}>
          {existingTemplate ? 'Update Template' : 'Save Template'}
        </button>
      </div>

      <style jsx>{`
        .template-builder {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .builder-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f1f3f4;
        }

        .builder-header h2 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .form-section {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
        }

        .form-section h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e1e8ed;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .variable-creator .form-row {
          grid-template-columns: 2fr 3fr 1fr auto;
          align-items: end;
        }

        .variables-list {
          margin-top: 15px;
        }

        .variable-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .variable-name {
          font-family: monospace;
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .variable-desc {
          flex: 1;
          color: #6c757d;
        }

        .variable-type {
          font-size: 12px;
          color: #6c757d;
          text-transform: uppercase;
        }

        .prompt-group {
          margin-bottom: 20px;
        }

        .prompt-controls {
          position: relative;
        }

        .variable-buttons {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .btn-variable {
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #1976d2;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .btn-variable:hover {
          background: #1976d2;
          color: white;
        }

        .tag-creator {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .tag-creator input {
          flex: 1;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 16px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tag-remove {
          background: none;
          border: none;
          color: #1976d2;
          cursor: pointer;
          font-weight: bold;
        }

        .btn-add, .btn-remove {
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-remove {
          background: #dc3545;
          padding: 4px 8px;
        }

        .builder-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #f1f3f4;
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
      `}</style>
    </div>
  );
};

export default TemplateBuilder;
