/**
 * Meeting Memory Service
 * 
 * Provides cross-meeting intelligence by storing, analyzing, and retrieving
 * contextual information across multiple meeting sessions.
 */

const EventEmitter = require('events');
const { createClient } = require('@supabase/supabase-js');

class MeetingMemoryService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      retentionDays: 365, // How long to keep meeting data
      maxRelatedMeetings: 10, // Maximum related meetings to return
      contextSimilarityThreshold: 0.7, // Minimum similarity for context matching
      relationshipStrengthThreshold: 0.5, // Minimum strength for relationship detection
      ...options
    };
    
    // Database client
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Service components
    this.contextStore = new ContextStore(this.supabase);
    this.relationshipMapper = new RelationshipMapper(this.supabase, this.options);
    this.participantTracker = new ParticipantTracker(this.supabase);
    this.topicAnalyzer = new TopicAnalyzer(this.supabase);
    this.embeddingService = new EmbeddingService();
    
    // Performance metrics
    this.metrics = {
      contextsStored: 0,
      relationshipsDetected: 0,
      retrievalRequests: 0,
      averageRetrievalTime: 0,
      cacheHitRate: 0
    };
    
    // Context cache for performance
    this.contextCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    this.initialized = false;
  }
  
  /**
   * Initialize the meeting memory service
   */
  async initialize() {
    try {
      console.log('Initializing Meeting Memory Service...');
      
      // Initialize components
      await this.contextStore.initialize();
      await this.relationshipMapper.initialize();
      await this.participantTracker.initialize();
      await this.topicAnalyzer.initialize();
      await this.embeddingService.initialize();
      
      // Start background processes
      this.startMaintenanceRoutines();
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log('✓ Meeting Memory Service initialized successfully');
      
    } catch (error) {
      console.error('✗ Failed to initialize Meeting Memory Service:', error);
      throw error;
    }
  }
  
  /**
   * Store comprehensive meeting context for future retrieval
   */
  async storeMeetingContext(meetingId, meetingData, analysisResults) {
    const startTime = Date.now();
    
    try {
      console.log(`Storing context for meeting ${meetingId}...`);
      
      // Validate input
      if (!meetingId || !meetingData) {
        throw new Error('Meeting ID and data are required');
      }
      
      // Store core meeting session data
      const sessionData = await this.storeSessionData(meetingId, meetingData, analysisResults);
      
      // Store participant interactions
      if (meetingData.participantInteractions) {
        await this.participantTracker.storeInteractions(meetingId, meetingData.participantInteractions);
      }
      
      // Generate and store context embeddings
      await this.generateContextEmbeddings(meetingId, meetingData, analysisResults);
      
      // Detect and store relationships with previous meetings
      const relationships = await this.relationshipMapper.detectRelationships(
        meetingId, 
        sessionData, 
        meetingData
      );
      
      // Analyze topics and themes
      await this.topicAnalyzer.analyzeTopics(meetingId, meetingData, analysisResults);
      
      // Update metrics
      this.metrics.contextsStored++;
      this.metrics.relationshipsDetected += relationships.length;
      
      // Clear relevant cache entries
      this.invalidateCache(meetingData.organizationId);
      
      // Emit success event
      this.emit('contextStored', {
        meetingId,
        relationshipsDetected: relationships.length,
        processingTime: Date.now() - startTime
      });
      
      console.log(`✓ Context stored for meeting ${meetingId} (${relationships.length} relationships detected)`);
      
      return {
        success: true,
        meetingId,
        relationshipsDetected: relationships.length,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`Error storing context for meeting ${meetingId}:`, error);
      
      this.emit('contextStorageError', {
        meetingId,
        error: error.message,
        processingTime: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  /**
   * Retrieve relevant context for current meeting
   */
  async retrieveRelevantContext(currentContext, organizationId, options = {}) {
    const startTime = Date.now();
    
    try {
      const cacheKey = this.generateCacheKey('context', organizationId, currentContext);
      
      // Check cache first
      if (this.contextCache.has(cacheKey)) {
        this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2;
        return this.contextCache.get(cacheKey);
      }
      
      console.log(`Retrieving relevant context for organization ${organizationId}...`);
      
      const retrievalOptions = {
        maxResults: this.options.maxRelatedMeetings,
        similarityThreshold: this.options.contextSimilarityThreshold,
        includeDecisions: true,
        includeActionItems: true,
        includeParticipantHistory: true,
        ...options
      };
      
      // Find semantically similar meetings
      const similarMeetings = await this.findSimilarMeetings(
        currentContext, 
        organizationId, 
        retrievalOptions
      );
      
      // Get related meetings through explicit relationships
      const relatedMeetings = await this.getRelatedMeetings(
        currentContext.participants || [],
        currentContext.topics || [],
        organizationId,
        retrievalOptions
      );
      
      // Retrieve unresolved items from previous meetings
      const unresolvedItems = await this.getUnresolvedItems(
        organizationId,
        currentContext.participants || []
      );
      
      // Get participant interaction history
      const participantHistory = await this.participantTracker.getParticipantHistory(
        currentContext.participants || [],
        organizationId
      );
      
      // Analyze topic evolution
      const topicEvolution = await this.topicAnalyzer.getTopicEvolution(
        currentContext.topics || [],
        organizationId
      );
      
      // Synthesize contextual insights
      const contextualInsights = await this.synthesizeContextualInsights({
        similarMeetings,
        relatedMeetings,
        unresolvedItems,
        participantHistory,
        topicEvolution,
        currentContext
      });
      
      const result = {
        similarMeetings,
        relatedMeetings,
        unresolvedItems,
        participantHistory,
        topicEvolution,
        contextualInsights,
        retrievalTime: Date.now() - startTime,
        confidence: this.calculateContextConfidence(contextualInsights)
      };
      
      // Cache the result
      this.contextCache.set(cacheKey, result);
      setTimeout(() => this.contextCache.delete(cacheKey), this.cacheTimeout);
      
      // Update metrics
      this.metrics.retrievalRequests++;
      this.metrics.averageRetrievalTime = 
        (this.metrics.averageRetrievalTime + (Date.now() - startTime)) / 2;
      
      console.log(`✓ Retrieved context (${result.contextualInsights.length} insights)`);
      
      return result;
      
    } catch (error) {
      console.error('Error retrieving relevant context:', error);
      throw error;
    }
  }
  
  /**
   * Store core meeting session data
   */
  async storeSessionData(meetingId, meetingData, analysisResults) {
    const sessionData = {
      id: meetingId,
      organization_id: meetingData.organizationId,
      meeting_series_id: meetingData.seriesId || null,
      title: meetingData.title || 'Untitled Meeting',
      description: meetingData.description || null,
      start_time: meetingData.startTime,
      end_time: meetingData.endTime || null,
      duration_minutes: meetingData.durationMinutes || null,
      meeting_type: meetingData.type || 'other',
      platform: meetingData.platform || null,
      meeting_url: meetingData.meetingUrl || null,
      recording_url: meetingData.recordingUrl || null,
      participants: meetingData.participants || [],
      facilitator_id: meetingData.facilitatorId || null,
      objectives: meetingData.objectives || [],
      objectives_met: meetingData.objectivesMet || null,
      key_decisions: analysisResults?.decisions || [],
      action_items: analysisResults?.actionItems || [],
      next_steps: analysisResults?.nextSteps || [],
      context_summary: analysisResults?.summary || null,
      sentiment_analysis: analysisResults?.sentiment || null,
      engagement_metrics: analysisResults?.engagement || null,
      effectiveness_score: analysisResults?.effectivenessScore || null,
      ai_analysis_complete: true,
      ai_analysis_timestamp: new Date().toISOString(),
      ai_confidence_score: analysisResults?.confidence || 0.8,
      created_by: meetingData.createdBy || null
    };
    
    const { data, error } = await this.supabase
      .from('meeting_sessions')
      .upsert(sessionData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to store session data: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Generate context embeddings for semantic search
   */
  async generateContextEmbeddings(meetingId, meetingData, analysisResults) {
    const embeddingTasks = [];
    
    // Generate embeddings for different context types
    const contextTypes = [
      { type: 'summary', content: analysisResults?.summary || meetingData.title },
      { type: 'topic', content: (meetingData.topics || []).join(' ') },
      { type: 'decision', content: (analysisResults?.decisions || []).map(d => d.description || d).join(' ') },
      { type: 'action_item', content: (analysisResults?.actionItems || []).map(a => a.description || a).join(' ') },
      { type: 'discussion', content: meetingData.transcript || meetingData.notes || '' }
    ].filter(item => item.content && item.content.trim().length > 0);
    
    for (const contextItem of contextTypes) {
      if (contextItem.content.length > 10) { // Only process meaningful content
        embeddingTasks.push(
          this.storeContextEmbedding(meetingId, contextItem.type, contextItem.content)
        );
      }
    }
    
    await Promise.all(embeddingTasks);
  }
  
  /**
   * Store individual context embedding
   */
  async storeContextEmbedding(meetingId, contextType, content) {
    try {
      const embedding = await this.embeddingService.generateEmbedding(content);
      
      const { error } = await this.supabase
        .from('meeting_context_embeddings')
        .insert({
          meeting_id: meetingId,
          context_type: contextType,
          content: content.substring(0, 2000), // Limit content length
          embedding: embedding,
          relevance_score: 1.0
        });
      
      if (error) {
        console.error(`Failed to store ${contextType} embedding:`, error);
      }
      
    } catch (error) {
      console.error(`Error generating embedding for ${contextType}:`, error);
    }
  }
  
  /**
   * Find semantically similar meetings
   */
  async findSimilarMeetings(currentContext, organizationId, options) {
    try {
      // Generate embedding for current context
      const contextText = [
        currentContext.title || '',
        (currentContext.topics || []).join(' '),
        currentContext.description || '',
        currentContext.objectives || ''
      ].filter(text => text.trim().length > 0).join(' ');
      
      if (!contextText.trim()) {
        return [];
      }
      
      const queryEmbedding = await this.embeddingService.generateEmbedding(contextText);
      
      // Search for similar meetings using vector similarity
      const { data, error } = await this.supabase.rpc('find_similar_meetings', {
        query_embedding: queryEmbedding,
        org_id: organizationId,
        similarity_threshold: options.similarityThreshold,
        max_results: options.maxResults
      });
      
      if (error) {
        console.error('Error finding similar meetings:', error);
        return [];
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Error in findSimilarMeetings:', error);
      return [];
    }
  }
  
  /**
   * Get related meetings through explicit relationships
   */
  async getRelatedMeetings(participants, topics, organizationId, options) {
    try {
      const { data, error } = await this.supabase
        .from('meeting_sessions')
        .select(`
          *,
          meeting_relationships!meeting_relationships_target_meeting_id_fkey(
            relationship_type,
            relationship_strength,
            context_overlap
          )
        `)
        .eq('organization_id', organizationId)
        .overlaps('participants', participants)
        .order('start_time', { ascending: false })
        .limit(options.maxResults);
      
      if (error) {
        console.error('Error getting related meetings:', error);
        return [];
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Error in getRelatedMeetings:', error);
      return [];
    }
  }
  
  /**
   * Get unresolved items from previous meetings
   */
  async getUnresolvedItems(organizationId, participants) {
    try {
      const { data, error } = await this.supabase
        .from('meeting_sessions')
        .select('id, title, start_time, action_items, key_decisions')
        .eq('organization_id', organizationId)
        .overlaps('participants', participants)
        .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('start_time', { ascending: false });
      
      if (error) {
        console.error('Error getting unresolved items:', error);
        return [];
      }
      
      // Filter for items that appear unresolved
      const unresolvedItems = [];
      
      for (const meeting of data || []) {
        const actionItems = meeting.action_items || [];
        const decisions = meeting.key_decisions || [];
        
        // Check for action items without completion status
        actionItems.forEach(item => {
          if (!item.completed && !item.status) {
            unresolvedItems.push({
              type: 'action_item',
              meetingId: meeting.id,
              meetingTitle: meeting.title,
              meetingDate: meeting.start_time,
              description: item.description || item,
              assignee: item.assignee,
              dueDate: item.dueDate
            });
          }
        });
        
        // Check for decisions that might need follow-up
        decisions.forEach(decision => {
          if (!decision.implemented && !decision.status) {
            unresolvedItems.push({
              type: 'decision',
              meetingId: meeting.id,
              meetingTitle: meeting.title,
              meetingDate: meeting.start_time,
              description: decision.description || decision,
              owner: decision.owner,
              implementationDate: decision.implementationDate
            });
          }
        });
      }
      
      return unresolvedItems;
      
    } catch (error) {
      console.error('Error in getUnresolvedItems:', error);
      return [];
    }
  }
  
  /**
   * Synthesize contextual insights from retrieved data
   */
  async synthesizeContextualInsights(data) {
    const insights = [];
    
    // Insights from similar meetings
    if (data.similarMeetings && data.similarMeetings.length > 0) {
      insights.push({
        type: 'similar_context',
        title: 'Related Previous Discussions',
        description: `Found ${data.similarMeetings.length} meetings with similar context`,
        details: data.similarMeetings.slice(0, 3).map(meeting => ({
          title: meeting.title,
          date: meeting.start_time,
          similarity: meeting.similarity_score,
          keyOutcomes: meeting.key_decisions?.slice(0, 2) || []
        })),
        confidence: 0.8,
        priority: 'medium'
      });
    }
    
    // Insights from unresolved items
    if (data.unresolvedItems && data.unresolvedItems.length > 0) {
      insights.push({
        type: 'unresolved_items',
        title: 'Outstanding Items',
        description: `${data.unresolvedItems.length} unresolved items from previous meetings`,
        details: data.unresolvedItems.slice(0, 5).map(item => ({
          type: item.type,
          description: item.description,
          meetingTitle: item.meetingTitle,
          meetingDate: item.meetingDate,
          assignee: item.assignee || item.owner
        })),
        confidence: 0.9,
        priority: 'high'
      });
    }
    
    // Insights from participant history
    if (data.participantHistory && data.participantHistory.length > 0) {
      const engagementPatterns = this.analyzeEngagementPatterns(data.participantHistory);
      if (engagementPatterns.length > 0) {
        insights.push({
          type: 'participant_patterns',
          title: 'Participant Engagement Patterns',
          description: 'Historical engagement and collaboration patterns',
          details: engagementPatterns,
          confidence: 0.7,
          priority: 'low'
        });
      }
    }
    
    // Insights from topic evolution
    if (data.topicEvolution && data.topicEvolution.length > 0) {
      insights.push({
        type: 'topic_evolution',
        title: 'Topic Development',
        description: 'How these topics have evolved in previous discussions',
        details: data.topicEvolution.slice(0, 3),
        confidence: 0.75,
        priority: 'medium'
      });
    }
    
    return insights;
  }
  
  /**
   * Analyze engagement patterns from participant history
   */
  analyzeEngagementPatterns(participantHistory) {
    const patterns = [];
    
    // Group by participant
    const participantGroups = participantHistory.reduce((groups, interaction) => {
      const key = interaction.participant_id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(interaction);
      return groups;
    }, {});
    
    // Analyze each participant's patterns
    Object.entries(participantGroups).forEach(([participantId, interactions]) => {
      if (interactions.length >= 3) { // Need sufficient data
        const avgEngagement = interactions.reduce((sum, i) => sum + (i.engagement_level || 0), 0) / interactions.length;
        const avgContribution = interactions.reduce((sum, i) => sum + (i.contribution_quality || 0), 0) / interactions.length;
        
        if (avgEngagement > 0.8 || avgContribution > 0.8) {
          patterns.push({
            participantId,
            participantName: interactions[0].participant_name,
            pattern: 'high_engagement',
            avgEngagement: Math.round(avgEngagement * 100),
            avgContribution: Math.round(avgContribution * 100),
            meetingCount: interactions.length
          });
        }
      }
    });
    
    return patterns;
  }
  
  /**
   * Calculate confidence score for contextual insights
   */
  calculateContextConfidence(insights) {
    if (!insights || insights.length === 0) {
      return 0.0;
    }
    
    const totalConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0);
    const avgConfidence = totalConfidence / insights.length;
    
    // Boost confidence based on number of insights
    const countBonus = Math.min(insights.length * 0.05, 0.2);
    
    return Math.min(1.0, avgConfidence + countBonus);
  }
  
  /**
   * Start maintenance routines
   */
  startMaintenanceRoutines() {
    // Clean up old cache entries every 10 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 10 * 60 * 1000);
    
    // Update relationship strengths daily
    setInterval(() => {
      this.updateRelationshipStrengths();
    }, 24 * 60 * 60 * 1000);
  }
  
  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.contextCache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.contextCache.delete(key);
      }
    }
  }
  
  /**
   * Update relationship strengths based on usage patterns
   */
  async updateRelationshipStrengths() {
    try {
      // This would analyze how often related meetings are accessed together
      // and update relationship strengths accordingly
      console.log('Updating relationship strengths...');
      
      // Implementation would go here
      
    } catch (error) {
      console.error('Error updating relationship strengths:', error);
    }
  }
  
  /**
   * Generate cache key
   */
  generateCacheKey(type, organizationId, context) {
    const contextHash = JSON.stringify(context).substring(0, 100);
    return `${type}_${organizationId}_${contextHash}`;
  }
  
  /**
   * Invalidate cache for organization
   */
  invalidateCache(organizationId) {
    for (const key of this.contextCache.keys()) {
      if (key.includes(organizationId)) {
        this.contextCache.delete(key);
      }
    }
  }
  
  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.contextCache.size,
      initialized: this.initialized
    };
  }
  
  /**
   * Shutdown service gracefully
   */
  async shutdown() {
    console.log('Shutting down Meeting Memory Service...');
    
    // Clear cache
    this.contextCache.clear();
    
    // Shutdown components
    if (this.contextStore.shutdown) await this.contextStore.shutdown();
    if (this.relationshipMapper.shutdown) await this.relationshipMapper.shutdown();
    if (this.participantTracker.shutdown) await this.participantTracker.shutdown();
    if (this.topicAnalyzer.shutdown) await this.topicAnalyzer.shutdown();
    if (this.embeddingService.shutdown) await this.embeddingService.shutdown();
    
    this.emit('shutdown');
    console.log('✓ Meeting Memory Service shutdown complete');
  }
}

/**
 * Context Store for managing meeting context data
 */
class ContextStore {
  constructor(supabase) {
    this.supabase = supabase;
  }
  
  async initialize() {
    console.log('✓ Context Store initialized');
  }
}

/**
 * Relationship Mapper for detecting meeting relationships
 */
class RelationshipMapper {
  constructor(supabase, options) {
    this.supabase = supabase;
    this.options = options;
  }
  
  async initialize() {
    console.log('✓ Relationship Mapper initialized');
  }
  
  async detectRelationships(meetingId, sessionData, meetingData) {
    try {
      const relationships = [];
      
      // Find meetings with overlapping participants
      const participantOverlapMeetings = await this.findParticipantOverlapMeetings(
        sessionData.organization_id,
        sessionData.participants,
        meetingId
      );
      
      // Find meetings with similar topics
      const topicSimilarMeetings = await this.findTopicSimilarMeetings(
        sessionData.organization_id,
        meetingData.topics || [],
        meetingId
      );
      
      // Create relationships
      for (const meeting of participantOverlapMeetings) {
        const relationship = await this.createRelationship(
          meetingId,
          meeting.id,
          'related',
          this.calculateParticipantOverlap(sessionData.participants, meeting.participants)
        );
        relationships.push(relationship);
      }
      
      for (const meeting of topicSimilarMeetings) {
        const relationship = await this.createRelationship(
          meetingId,
          meeting.id,
          'related',
          this.calculateTopicSimilarity(meetingData.topics || [], meeting.topics || [])
        );
        relationships.push(relationship);
      }
      
      return relationships;
      
    } catch (error) {
      console.error('Error detecting relationships:', error);
      return [];
    }
  }
  
  async findParticipantOverlapMeetings(organizationId, participants, excludeMeetingId) {
    const { data, error } = await this.supabase
      .from('meeting_sessions')
      .select('id, participants, title, start_time')
      .eq('organization_id', organizationId)
      .neq('id', excludeMeetingId)
      .gte('start_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
      .order('start_time', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error finding participant overlap meetings:', error);
      return [];
    }
    
    return (data || []).filter(meeting => {
      const overlap = this.calculateParticipantOverlap(participants, meeting.participants);
      return overlap >= this.options.relationshipStrengthThreshold;
    });
  }
  
  async findTopicSimilarMeetings(organizationId, topics, excludeMeetingId) {
    // This would use more sophisticated topic matching
    // For now, return empty array
    return [];
  }
  
  async createRelationship(sourceMeetingId, targetMeetingId, type, strength) {
    const relationship = {
      source_meeting_id: sourceMeetingId,
      target_meeting_id: targetMeetingId,
      relationship_type: type,
      relationship_strength: strength,
      detected_by: 'ai',
      confidence: strength
    };
    
    const { data, error } = await this.supabase
      .from('meeting_relationships')
      .insert(relationship)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating relationship:', error);
      return null;
    }
    
    return data;
  }
  
  calculateParticipantOverlap(participants1, participants2) {
    const set1 = new Set(participants1.map(p => p.id || p.email || p));
    const set2 = new Set(participants2.map(p => p.id || p.email || p));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  calculateTopicSimilarity(topics1, topics2) {
    // Simple topic similarity calculation
    const set1 = new Set(topics1.map(t => t.toLowerCase()));
    const set2 = new Set(topics2.map(t => t.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

/**
 * Participant Tracker for monitoring participant interactions
 */
class ParticipantTracker {
  constructor(supabase) {
    this.supabase = supabase;
  }
  
  async initialize() {
    console.log('✓ Participant Tracker initialized');
  }
  
  async storeInteractions(meetingId, interactions) {
    try {
      const interactionRecords = interactions.map(interaction => ({
        meeting_id: meetingId,
        participant_id: interaction.participantId,
        participant_name: interaction.participantName,
        participant_email: interaction.participantEmail,
        interaction_type: interaction.type,
        timestamp: interaction.timestamp,
        duration_seconds: interaction.duration,
        context: interaction.context,
        content_summary: interaction.summary,
        sentiment: interaction.sentiment,
        engagement_level: interaction.engagement,
        contribution_quality: interaction.contributionQuality,
        leadership_score: interaction.leadership,
        collaboration_score: interaction.collaboration,
        ai_insights: interaction.insights,
        confidence: interaction.confidence || 0.8
      }));
      
      const { error } = await this.supabase
        .from('participant_interactions')
        .insert(interactionRecords);
      
      if (error) {
        console.error('Error storing participant interactions:', error);
      }
      
    } catch (error) {
      console.error('Error in storeInteractions:', error);
    }
  }
  
  async getParticipantHistory(participants, organizationId) {
    try {
      const participantIds = participants.map(p => p.id || p.email || p);
      
      const { data, error } = await this.supabase
        .from('participant_interactions')
        .select(`
          *,
          meeting_sessions!inner(organization_id, title, start_time)
        `)
        .in('participant_id', participantIds)
        .eq('meeting_sessions.organization_id', organizationId)
        .gte('timestamp', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()) // Last 60 days
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('Error getting participant history:', error);
        return [];
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Error in getParticipantHistory:', error);
      return [];
    }
  }
}

/**
 * Topic Analyzer for tracking topic evolution
 */
class TopicAnalyzer {
  constructor(supabase) {
    this.supabase = supabase;
  }
  
  async initialize() {
    console.log('✓ Topic Analyzer initialized');
  }
  
  async analyzeTopics(meetingId, meetingData, analysisResults) {
    // Topic analysis implementation would go here
    console.log(`Analyzing topics for meeting ${meetingId}`);
  }
  
  async getTopicEvolution(topics, organizationId) {
    // Topic evolution analysis would go here
    return [];
  }
}

/**
 * Embedding Service for generating vector embeddings
 */
class EmbeddingService {
  constructor() {
    this.openai = null;
  }
  
  async initialize() {
    const { OpenAI } = require('openai');
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✓ Embedding Service initialized');
  }
  
  async generateEmbedding(text) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }
      
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000) // Limit input length
      });
      
      return response.data[0].embedding;
      
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return a zero vector as fallback
      return new Array(1536).fill(0);
    }
  }
}

module.exports = MeetingMemoryService;
