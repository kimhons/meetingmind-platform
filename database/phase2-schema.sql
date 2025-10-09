-- Phase 2 Database Schema: Cross-Meeting Intelligence & Analytics
-- Enhanced schema for meeting memory, opportunity detection, coaching, and knowledge management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Meeting Sessions with comprehensive metadata
CREATE TABLE meeting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  meeting_series_id UUID, -- Links related meetings
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  meeting_type TEXT CHECK (meeting_type IN ('standup', 'planning', 'review', 'brainstorm', 'decision', 'training', 'other')),
  platform TEXT, -- zoom, teams, meet, etc.
  meeting_url TEXT,
  recording_url TEXT,
  
  -- Participants and roles
  participants JSONB NOT NULL DEFAULT '[]',
  facilitator_id UUID,
  
  -- Meeting outcomes
  objectives JSONB DEFAULT '[]',
  objectives_met BOOLEAN,
  key_decisions JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  next_steps JSONB DEFAULT '[]',
  
  -- Analysis results
  context_summary TEXT,
  sentiment_analysis JSONB,
  engagement_metrics JSONB,
  effectiveness_score DECIMAL(3,2), -- 0.0 to 1.0
  
  -- AI processing metadata
  ai_analysis_complete BOOLEAN DEFAULT FALSE,
  ai_analysis_timestamp TIMESTAMP WITH TIME ZONE,
  ai_confidence_score DECIMAL(3,2),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  -- Indexes for performance
  CONSTRAINT valid_effectiveness_score CHECK (effectiveness_score >= 0.0 AND effectiveness_score <= 1.0),
  CONSTRAINT valid_confidence_score CHECK (ai_confidence_score >= 0.0 AND ai_confidence_score <= 1.0)
);

-- Cross-meeting relationships and context
CREATE TABLE meeting_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_meeting_id UUID NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  target_meeting_id UUID NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('follow_up', 'continuation', 'related', 'prerequisite', 'outcome')),
  context_overlap DECIMAL(3,2) NOT NULL DEFAULT 0.0, -- 0.0 to 1.0
  shared_participants JSONB DEFAULT '[]',
  shared_topics JSONB DEFAULT '[]',
  shared_decisions JSONB DEFAULT '[]',
  relationship_strength DECIMAL(3,2) DEFAULT 0.5, -- AI-calculated relationship strength
  
  -- Metadata
  detected_by TEXT DEFAULT 'ai', -- 'ai' or 'manual'
  confidence DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_context_overlap CHECK (context_overlap >= 0.0 AND context_overlap <= 1.0),
  CONSTRAINT valid_relationship_strength CHECK (relationship_strength >= 0.0 AND relationship_strength <= 1.0),
  CONSTRAINT no_self_reference CHECK (source_meeting_id != target_meeting_id),
  UNIQUE(source_meeting_id, target_meeting_id, relationship_type)
);

-- Participant interaction patterns and performance
CREATE TABLE participant_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  
  -- Interaction details
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('spoke', 'questioned', 'agreed', 'disagreed', 'proposed', 'clarified', 'summarized', 'decided')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER,
  context TEXT,
  content_summary TEXT,
  
  -- Analysis metrics
  sentiment DECIMAL(3,2), -- -1.0 to 1.0
  engagement_level DECIMAL(3,2), -- 0.0 to 1.0
  contribution_quality DECIMAL(3,2), -- 0.0 to 1.0
  leadership_score DECIMAL(3,2), -- 0.0 to 1.0
  collaboration_score DECIMAL(3,2), -- 0.0 to 1.0
  
  -- AI analysis
  ai_insights JSONB,
  confidence DECIMAL(3,2) DEFAULT 0.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_sentiment CHECK (sentiment >= -1.0 AND sentiment <= 1.0),
  CONSTRAINT valid_engagement CHECK (engagement_level >= 0.0 AND engagement_level <= 1.0),
  CONSTRAINT valid_contribution CHECK (contribution_quality >= 0.0 AND contribution_quality <= 1.0),
  CONSTRAINT valid_leadership CHECK (leadership_score >= 0.0 AND leadership_score <= 1.0),
  CONSTRAINT valid_collaboration CHECK (collaboration_score >= 0.0 AND collaboration_score <= 1.0)
);

-- Meeting context embeddings for semantic search
CREATE TABLE meeting_context_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('topic', 'decision', 'action_item', 'discussion', 'outcome', 'summary')),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_relevance CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0)
);

-- Missed opportunities detection and tracking
CREATE TABLE missed_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('clarification_needed', 'definition_opportunity', 'follow_up_missing', 'decision_point', 'action_item_unclear', 'engagement_drop', 'knowledge_gap', 'time_management', 'collaboration_miss')),
  
  -- Opportunity details
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  context TEXT NOT NULL,
  description TEXT NOT NULL,
  potential_impact TEXT CHECK (potential_impact IN ('low', 'medium', 'high', 'critical')),
  
  -- Participants involved
  participants_involved JSONB DEFAULT '[]',
  missed_by UUID, -- participant who missed the opportunity
  
  -- AI analysis
  detection_confidence DECIMAL(3,2) NOT NULL,
  suggested_action TEXT,
  ai_reasoning TEXT,
  
  -- Resolution tracking
  resolved BOOLEAN DEFAULT FALSE,
  resolution_method TEXT,
  resolution_timestamp TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Learning and improvement
  feedback_provided BOOLEAN DEFAULT FALSE,
  coaching_generated BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_detection_confidence CHECK (detection_confidence >= 0.0 AND detection_confidence <= 1.0)
);

-- AI coaching profiles and performance tracking
CREATE TABLE coaching_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  organization_id UUID NOT NULL,
  
  -- Personal information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  department TEXT,
  
  -- Skill assessments (0.0 to 1.0 scale)
  communication_clarity DECIMAL(3,2) DEFAULT 0.5,
  active_listening DECIMAL(3,2) DEFAULT 0.5,
  question_quality DECIMAL(3,2) DEFAULT 0.5,
  decision_contribution DECIMAL(3,2) DEFAULT 0.5,
  time_awareness DECIMAL(3,2) DEFAULT 0.5,
  collaboration_effectiveness DECIMAL(3,2) DEFAULT 0.5,
  leadership_presence DECIMAL(3,2) DEFAULT 0.5,
  conflict_resolution DECIMAL(3,2) DEFAULT 0.5,
  
  -- Learning preferences
  learning_style JSONB DEFAULT '{}',
  coaching_preferences JSONB DEFAULT '{}',
  feedback_frequency TEXT DEFAULT 'moderate' CHECK (feedback_frequency IN ('minimal', 'moderate', 'frequent')),
  
  -- Goals and progress
  improvement_goals JSONB DEFAULT '[]',
  current_focus_areas JSONB DEFAULT '[]',
  
  -- Performance trends
  overall_trend TEXT DEFAULT 'stable' CHECK (overall_trend IN ('improving', 'stable', 'declining')),
  last_assessment_date TIMESTAMP WITH TIME ZONE,
  next_assessment_due TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints for skill scores
  CONSTRAINT valid_communication CHECK (communication_clarity >= 0.0 AND communication_clarity <= 1.0),
  CONSTRAINT valid_listening CHECK (active_listening >= 0.0 AND active_listening <= 1.0),
  CONSTRAINT valid_questions CHECK (question_quality >= 0.0 AND question_quality <= 1.0),
  CONSTRAINT valid_decisions CHECK (decision_contribution >= 0.0 AND decision_contribution <= 1.0),
  CONSTRAINT valid_time CHECK (time_awareness >= 0.0 AND time_awareness <= 1.0),
  CONSTRAINT valid_collaboration_profile CHECK (collaboration_effectiveness >= 0.0 AND collaboration_effectiveness <= 1.0),
  CONSTRAINT valid_leadership CHECK (leadership_presence >= 0.0 AND leadership_presence <= 1.0),
  CONSTRAINT valid_conflict CHECK (conflict_resolution >= 0.0 AND conflict_resolution <= 1.0)
);

-- Coaching interactions and feedback
CREATE TABLE coaching_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES coaching_profiles(user_id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  
  -- Coaching details
  coaching_type TEXT NOT NULL CHECK (coaching_type IN ('real_time', 'post_meeting', 'periodic_review', 'goal_setting')),
  focus_area TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  reasoning TEXT,
  
  -- User interaction
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_response TEXT CHECK (user_response IN ('accepted', 'dismissed', 'deferred', 'no_response')),
  response_timestamp TIMESTAMP WITH TIME ZONE,
  user_feedback TEXT,
  
  -- Effectiveness tracking
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  improvement_observed BOOLEAN,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  
  -- AI metadata
  confidence DECIMAL(3,2) NOT NULL,
  ai_model_used TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_coaching_confidence CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

-- Knowledge base documents and content
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  -- Document metadata
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT CHECK (document_type IN ('policy', 'procedure', 'guideline', 'template', 'reference', 'training', 'other')),
  source_url TEXT,
  file_path TEXT,
  file_size_bytes BIGINT,
  file_format TEXT,
  
  -- Content and processing
  content_text TEXT,
  content_summary TEXT,
  key_topics JSONB DEFAULT '[]',
  entities JSONB DEFAULT '[]',
  
  -- Access and permissions
  access_level TEXT DEFAULT 'organization' CHECK (access_level IN ('public', 'organization', 'department', 'restricted')),
  departments JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  
  -- Versioning and updates
  version TEXT DEFAULT '1.0',
  last_updated TIMESTAMP WITH TIME ZONE,
  update_frequency TEXT CHECK (update_frequency IN ('static', 'monthly', 'quarterly', 'yearly', 'as_needed')),
  
  -- Usage analytics
  view_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  
  -- AI processing
  processed BOOLEAN DEFAULT FALSE,
  processing_timestamp TIMESTAMP WITH TIME ZONE,
  processing_version TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Knowledge embeddings for semantic search
CREATE TABLE knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  
  -- Content chunk information
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  
  -- Embedding data
  embedding vector(1536), -- OpenAI embedding dimension
  
  -- Metadata for search optimization
  content_type TEXT CHECK (content_type IN ('title', 'heading', 'paragraph', 'list', 'table', 'summary')),
  importance_score DECIMAL(3,2) DEFAULT 0.5,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_importance CHECK (importance_score >= 0.0 AND importance_score <= 1.0),
  CONSTRAINT positive_chunk_index CHECK (chunk_index >= 0),
  CONSTRAINT positive_chunk_size CHECK (chunk_size > 0)
);

-- Analytics aggregations and metrics
CREATE TABLE analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  -- Metric identification
  metric_type TEXT NOT NULL CHECK (metric_type IN ('meeting_effectiveness', 'participant_performance', 'opportunity_trends', 'coaching_impact', 'knowledge_usage', 'ai_utilization')),
  metric_name TEXT NOT NULL,
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  granularity TEXT NOT NULL CHECK (granularity IN ('hourly', 'daily', 'weekly', 'monthly', 'quarterly')),
  
  -- Metric values
  value DECIMAL(10,4) NOT NULL,
  previous_value DECIMAL(10,4),
  change_percentage DECIMAL(5,2),
  
  -- Dimensions and filters
  dimensions JSONB DEFAULT '{}', -- department, team, user, etc.
  filters JSONB DEFAULT '{}',
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_method TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  
  CONSTRAINT valid_analytics_confidence CHECK (confidence >= 0.0 AND confidence <= 1.0),
  CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- Performance indexes for optimal query speed
CREATE INDEX idx_meeting_sessions_org_time ON meeting_sessions(organization_id, start_time DESC);
CREATE INDEX idx_meeting_sessions_series ON meeting_sessions(meeting_series_id) WHERE meeting_series_id IS NOT NULL;
CREATE INDEX idx_meeting_sessions_type ON meeting_sessions(meeting_type);
CREATE INDEX idx_meeting_sessions_effectiveness ON meeting_sessions(effectiveness_score DESC) WHERE effectiveness_score IS NOT NULL;

CREATE INDEX idx_meeting_relationships_source ON meeting_relationships(source_meeting_id);
CREATE INDEX idx_meeting_relationships_target ON meeting_relationships(target_meeting_id);
CREATE INDEX idx_meeting_relationships_type ON meeting_relationships(relationship_type);
CREATE INDEX idx_meeting_relationships_strength ON meeting_relationships(relationship_strength DESC);

CREATE INDEX idx_participant_interactions_meeting ON participant_interactions(meeting_id);
CREATE INDEX idx_participant_interactions_participant ON participant_interactions(participant_id);
CREATE INDEX idx_participant_interactions_time ON participant_interactions(timestamp);
CREATE INDEX idx_participant_interactions_type ON participant_interactions(interaction_type);

-- Vector similarity search indexes
CREATE INDEX idx_meeting_embeddings_vector ON meeting_context_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_embeddings_vector ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_missed_opportunities_meeting ON missed_opportunities(meeting_id);
CREATE INDEX idx_missed_opportunities_type ON missed_opportunities(opportunity_type);
CREATE INDEX idx_missed_opportunities_impact ON missed_opportunities(potential_impact);
CREATE INDEX idx_missed_opportunities_resolved ON missed_opportunities(resolved);

CREATE INDEX idx_coaching_profiles_user ON coaching_profiles(user_id);
CREATE INDEX idx_coaching_profiles_org ON coaching_profiles(organization_id);
CREATE INDEX idx_coaching_interactions_user ON coaching_interactions(user_id);
CREATE INDEX idx_coaching_interactions_meeting ON coaching_interactions(meeting_id);

CREATE INDEX idx_knowledge_documents_org ON knowledge_documents(organization_id);
CREATE INDEX idx_knowledge_documents_type ON knowledge_documents(document_type);
CREATE INDEX idx_knowledge_documents_access ON knowledge_documents(access_level);
CREATE INDEX idx_knowledge_documents_updated ON knowledge_documents(last_updated DESC);

CREATE INDEX idx_analytics_metrics_org_type ON analytics_metrics(organization_id, metric_type);
CREATE INDEX idx_analytics_metrics_period ON analytics_metrics(period_start, period_end);

-- Full-text search indexes
CREATE INDEX idx_meeting_sessions_text ON meeting_sessions USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(context_summary, '')));
CREATE INDEX idx_knowledge_documents_text ON knowledge_documents USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(content_text, '')));

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meeting_sessions_updated_at BEFORE UPDATE ON meeting_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coaching_profiles_updated_at BEFORE UPDATE ON coaching_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_context_embeddings_updated_at BEFORE UPDATE ON meeting_context_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW meeting_effectiveness_summary AS
SELECT 
    organization_id,
    DATE_TRUNC('week', start_time) as week,
    COUNT(*) as total_meetings,
    AVG(effectiveness_score) as avg_effectiveness,
    AVG(duration_minutes) as avg_duration,
    COUNT(*) FILTER (WHERE objectives_met = true) as objectives_met_count
FROM meeting_sessions 
WHERE effectiveness_score IS NOT NULL
GROUP BY organization_id, DATE_TRUNC('week', start_time);

CREATE VIEW participant_performance_summary AS
SELECT 
    participant_id,
    participant_name,
    COUNT(DISTINCT meeting_id) as meetings_attended,
    AVG(engagement_level) as avg_engagement,
    AVG(contribution_quality) as avg_contribution,
    AVG(leadership_score) as avg_leadership,
    AVG(collaboration_score) as avg_collaboration
FROM participant_interactions 
WHERE engagement_level IS NOT NULL
GROUP BY participant_id, participant_name;

CREATE VIEW opportunity_trends AS
SELECT 
    opportunity_type,
    DATE_TRUNC('week', timestamp) as week,
    COUNT(*) as total_opportunities,
    COUNT(*) FILTER (WHERE resolved = true) as resolved_count,
    AVG(detection_confidence) as avg_confidence
FROM missed_opportunities
GROUP BY opportunity_type, DATE_TRUNC('week', timestamp);

-- Comments for documentation
COMMENT ON TABLE meeting_sessions IS 'Core meeting data with comprehensive metadata and analysis results';
COMMENT ON TABLE meeting_relationships IS 'Relationships and connections between meetings for cross-meeting intelligence';
COMMENT ON TABLE participant_interactions IS 'Individual participant interactions and performance metrics within meetings';
COMMENT ON TABLE meeting_context_embeddings IS 'Vector embeddings of meeting content for semantic search and similarity matching';
COMMENT ON TABLE missed_opportunities IS 'AI-detected missed opportunities for coaching and improvement';
COMMENT ON TABLE coaching_profiles IS 'Individual coaching profiles with skill assessments and improvement tracking';
COMMENT ON TABLE coaching_interactions IS 'Coaching suggestions delivered to users with effectiveness tracking';
COMMENT ON TABLE knowledge_documents IS 'Enterprise knowledge base documents with metadata and processing status';
COMMENT ON TABLE knowledge_embeddings IS 'Vector embeddings of knowledge content for semantic search';
COMMENT ON TABLE analytics_metrics IS 'Aggregated analytics metrics for dashboard and reporting';
