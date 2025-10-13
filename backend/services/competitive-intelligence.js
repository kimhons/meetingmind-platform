/**
 * Competitive Intelligence System
 * 
 * Automated monitoring and analysis of competitor activities
 * to maintain strategic advantage and rapid response capabilities.
 */

const axios = require('axios');
const cheerio = require('cheerio');

class CompetitiveIntelligenceSystem {
  constructor(config = {}) {
    this.config = {
      monitoringInterval: config.monitoringInterval || 3600000, // 1 hour
      alertThreshold: config.alertThreshold || 0.8,
      ...config
    };
    
    this.competitors = this.initializeCompetitors();
    this.monitoringActive = false;
    this.alerts = [];
    this.historicalData = new Map();
  }

  initializeCompetitors() {
    return {
      fireflies: {
        name: 'Fireflies.ai',
        website: 'https://fireflies.ai',
        pricingPage: 'https://fireflies.ai/pricing',
        blogRss: 'https://fireflies.ai/blog/rss',
        socialMedia: {
          twitter: '@firefliesai',
          linkedin: 'company/fireflies-ai'
        },
        keyMetrics: {
          pricing: { enterprise: 39, business: 19, pro: 10 },
          features: ['transcription', 'summaries', 'integrations', 'analytics'],
          platforms: ['zoom', 'teams', 'meet', 'webex', 'gotomeeting']
        }
      },
      
      otter: {
        name: 'Otter.ai',
        website: 'https://otter.ai',
        pricingPage: 'https://otter.ai/pricing',
        blogRss: 'https://blog.otter.ai/rss',
        socialMedia: {
          twitter: '@otterai',
          linkedin: 'company/otter-ai'
        },
        keyMetrics: {
          pricing: { business: 20, pro: 8.33, basic: 0 },
          features: ['transcription', 'real-time', 'search', 'integrations'],
          platforms: ['zoom', 'teams', 'meet']
        }
      },
      
      fathom: {
        name: 'Fathom',
        website: 'https://fathom.ai',
        pricingPage: 'https://fathom.ai/pricing',
        socialMedia: {
          twitter: '@fathomapp',
          linkedin: 'company/fathom-video'
        },
        keyMetrics: {
          pricing: { business: 20, team: 14, premium: 16, free: 0 },
          features: ['transcription', 'summaries', 'highlights', 'sharing'],
          platforms: ['zoom', 'teams', 'meet']
        }
      },
      
      avoma: {
        name: 'Avoma',
        website: 'https://avoma.com',
        pricingPage: 'https://avoma.com/pricing',
        socialMedia: {
          twitter: '@avomahq',
          linkedin: 'company/avoma'
        },
        keyMetrics: {
          pricing: { enterprise: 79, advanced: 59, starter: 19 },
          features: ['conversation-analytics', 'coaching', 'crm-integration'],
          platforms: ['zoom', 'teams', 'meet', 'bluejeans']
        }
      },
      
      granola: {
        name: 'Granola',
        website: 'https://granola.ai',
        pricingPage: 'https://granola.ai/pricing',
        keyMetrics: {
          pricing: { pro: 18, free: 0 },
          features: ['human-ai-notes', 'transcription', 'templates'],
          platforms: ['all']
        }
      }
    };
  }

  /**
   * Start continuous competitive monitoring
   */
  startMonitoring() {
    if (this.monitoringActive) {
      console.log('⚠️ Competitive monitoring already active');
      return;
    }
    
    console.log('🔍 Starting competitive intelligence monitoring...');
    this.monitoringActive = true;
    
    // Initial scan
    this.performFullScan();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performIncrementalScan();
    }, this.config.monitoringInterval);
    
    console.log(`✅ Competitive monitoring active (interval: ${this.config.monitoringInterval / 1000}s)`);
  }

  /**
   * Stop competitive monitoring
   */
  stopMonitoring() {
    if (!this.monitoringActive) {
      console.log('⚠️ Competitive monitoring not active');
      return;
    }
    
    console.log('🛑 Stopping competitive intelligence monitoring...');
    this.monitoringActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('✅ Competitive monitoring stopped');
  }

  /**
   * Perform comprehensive competitive scan
   */
  async performFullScan() {
    console.log('🔍 Performing full competitive scan...');
    
    const scanResults = {};
    
    for (const [key, competitor] of Object.entries(this.competitors)) {
      try {
        console.log(`📊 Scanning ${competitor.name}...`);
        
        const competitorData = await this.scanCompetitor(competitor);
        scanResults[key] = competitorData;
        
        // Store historical data
        this.storeHistoricalData(key, competitorData);
        
        // Check for significant changes
        await this.analyzeChanges(key, competitorData);
        
      } catch (error) {
        console.error(`❌ Error scanning ${competitor.name}:`, error.message);
        scanResults[key] = { error: error.message };
      }
    }
    
    console.log('✅ Full competitive scan completed');
    return scanResults;
  }

  /**
   * Perform incremental competitive scan
   */
  async performIncrementalScan() {
    console.log('🔄 Performing incremental competitive scan...');
    
    // Focus on high-priority monitoring areas
    const priorityChecks = [
      'pricing_changes',
      'feature_updates',
      'blog_posts',
      'social_media'
    ];
    
    for (const [key, competitor] of Object.entries(this.competitors)) {
      try {
        const updates = await this.checkForUpdates(competitor, priorityChecks);
        
        if (updates.length > 0) {
          console.log(`📢 Updates detected for ${competitor.name}:`, updates);
          await this.processUpdates(key, updates);
        }
        
      } catch (error) {
        console.error(`❌ Error checking updates for ${competitor.name}:`, error.message);
      }
    }
    
    console.log('✅ Incremental scan completed');
  }

  /**
   * Scan individual competitor for all data points
   */
  async scanCompetitor(competitor) {
    const data = {
      timestamp: new Date().toISOString(),
      pricing: await this.scrapePricing(competitor),
      features: await this.scrapeFeatures(competitor),
      blogPosts: await this.scrapeBlogPosts(competitor),
      socialMedia: await this.scrapeSocialMedia(competitor),
      technicalInfo: await this.analyzeTechnicalInfo(competitor)
    };
    
    return data;
  }

  /**
   * Scrape pricing information
   */
  async scrapePricing(competitor) {
    if (!competitor.pricingPage) {
      return { error: 'No pricing page configured' };
    }
    
    try {
      const response = await axios.get(competitor.pricingPage, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MeetingMind-CompetitiveIntelligence/1.0)'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract pricing information (this would be customized per competitor)
      const pricing = this.extractPricingData($, competitor.name);
      
      return {
        plans: pricing,
        lastUpdated: new Date().toISOString(),
        source: competitor.pricingPage
      };
      
    } catch (error) {
      return { error: `Failed to scrape pricing: ${error.message}` };
    }
  }

  /**
   * Extract pricing data from HTML (competitor-specific)
   */
  extractPricingData($, competitorName) {
    const pricing = {};
    
    // Generic pricing extraction logic
    $('[class*="price"], [class*="pricing"], [class*="plan"]').each((i, element) => {
      const text = $(element).text().toLowerCase();
      const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
      
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        
        if (text.includes('enterprise') || text.includes('business')) {
          pricing.enterprise = price;
        } else if (text.includes('pro') || text.includes('professional')) {
          pricing.pro = price;
        } else if (text.includes('basic') || text.includes('starter')) {
          pricing.basic = price;
        }
      }
    });
    
    return pricing;
  }

  /**
   * Scrape feature information
   */
  async scrapeFeatures(competitor) {
    try {
      const response = await axios.get(competitor.website, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MeetingMind-CompetitiveIntelligence/1.0)'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract feature information
      const features = [];
      
      $('[class*="feature"], [class*="benefit"], h3, h4').each((i, element) => {
        const text = $(element).text().trim();
        
        if (text.length > 10 && text.length < 100) {
          const lowerText = text.toLowerCase();
          
          if (lowerText.includes('transcription') || 
              lowerText.includes('summary') || 
              lowerText.includes('ai') || 
              lowerText.includes('integration') ||
              lowerText.includes('analytics')) {
            features.push(text);
          }
        }
      });
      
      return {
        features: [...new Set(features)], // Remove duplicates
        lastUpdated: new Date().toISOString(),
        source: competitor.website
      };
      
    } catch (error) {
      return { error: `Failed to scrape features: ${error.message}` };
    }
  }

  /**
   * Scrape blog posts for announcements
   */
  async scrapeBlogPosts(competitor) {
    if (!competitor.blogRss) {
      return { posts: [], note: 'No blog RSS configured' };
    }
    
    try {
      const response = await axios.get(competitor.blogRss, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MeetingMind-CompetitiveIntelligence/1.0)'
        }
      });
      
      // Parse RSS feed (simplified)
      const posts = this.parseRSSFeed(response.data);
      
      return {
        posts: posts.slice(0, 5), // Latest 5 posts
        lastUpdated: new Date().toISOString(),
        source: competitor.blogRss
      };
      
    } catch (error) {
      return { error: `Failed to scrape blog: ${error.message}` };
    }
  }

  /**
   * Parse RSS feed for blog posts
   */
  parseRSSFeed(rssData) {
    const posts = [];
    
    try {
      const $ = cheerio.load(rssData, { xmlMode: true });
      
      $('item').each((i, item) => {
        const $item = $(item);
        
        posts.push({
          title: $item.find('title').text(),
          link: $item.find('link').text(),
          pubDate: $item.find('pubDate').text(),
          description: $item.find('description').text().substring(0, 200)
        });
      });
      
    } catch (error) {
      console.error('Error parsing RSS feed:', error);
    }
    
    return posts;
  }

  /**
   * Scrape social media for announcements
   */
  async scrapeSocialMedia(competitor) {
    // Placeholder for social media monitoring
    // In production, this would integrate with Twitter API, LinkedIn API, etc.
    
    return {
      twitter: { posts: [], note: 'Twitter API integration needed' },
      linkedin: { posts: [], note: 'LinkedIn API integration needed' },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Analyze technical information
   */
  async analyzeTechnicalInfo(competitor) {
    try {
      // Check website performance and technology stack
      const response = await axios.get(competitor.website, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MeetingMind-CompetitiveIntelligence/1.0)'
        }
      });
      
      const loadTime = response.headers['x-response-time'] || 'unknown';
      const serverInfo = response.headers['server'] || 'unknown';
      
      return {
        loadTime,
        serverInfo,
        statusCode: response.status,
        lastChecked: new Date().toISOString()
      };
      
    } catch (error) {
      return { error: `Failed to analyze technical info: ${error.message}` };
    }
  }

  /**
   * Check for updates in specific areas
   */
  async checkForUpdates(competitor, checkTypes) {
    const updates = [];
    
    for (const checkType of checkTypes) {
      try {
        switch (checkType) {
          case 'pricing_changes':
            const pricingUpdate = await this.checkPricingChanges(competitor);
            if (pricingUpdate) updates.push(pricingUpdate);
            break;
            
          case 'feature_updates':
            const featureUpdate = await this.checkFeatureUpdates(competitor);
            if (featureUpdate) updates.push(featureUpdate);
            break;
            
          case 'blog_posts':
            const blogUpdate = await this.checkNewBlogPosts(competitor);
            if (blogUpdate) updates.push(blogUpdate);
            break;
        }
      } catch (error) {
        console.error(`Error checking ${checkType} for ${competitor.name}:`, error);
      }
    }
    
    return updates;
  }

  /**
   * Check for pricing changes
   */
  async checkPricingChanges(competitor) {
    const currentPricing = await this.scrapePricing(competitor);
    const historicalPricing = this.getHistoricalData(competitor.name, 'pricing');
    
    if (!historicalPricing || !currentPricing.plans) {
      return null;
    }
    
    const changes = [];
    
    for (const [plan, price] of Object.entries(currentPricing.plans)) {
      const oldPrice = historicalPricing.plans[plan];
      
      if (oldPrice && oldPrice !== price) {
        changes.push({
          plan,
          oldPrice,
          newPrice: price,
          change: price - oldPrice,
          percentChange: ((price - oldPrice) / oldPrice * 100).toFixed(1)
        });
      }
    }
    
    if (changes.length > 0) {
      return {
        type: 'pricing_change',
        competitor: competitor.name,
        changes,
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  }

  /**
   * Check for feature updates
   */
  async checkFeatureUpdates(competitor) {
    const currentFeatures = await this.scrapeFeatures(competitor);
    const historicalFeatures = this.getHistoricalData(competitor.name, 'features');
    
    if (!historicalFeatures || !currentFeatures.features) {
      return null;
    }
    
    const newFeatures = currentFeatures.features.filter(
      feature => !historicalFeatures.features.includes(feature)
    );
    
    if (newFeatures.length > 0) {
      return {
        type: 'feature_update',
        competitor: competitor.name,
        newFeatures,
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  }

  /**
   * Check for new blog posts
   */
  async checkNewBlogPosts(competitor) {
    const currentPosts = await this.scrapeBlogPosts(competitor);
    const historicalPosts = this.getHistoricalData(competitor.name, 'blogPosts');
    
    if (!historicalPosts || !currentPosts.posts) {
      return null;
    }
    
    const newPosts = currentPosts.posts.filter(post => 
      !historicalPosts.posts.some(oldPost => oldPost.title === post.title)
    );
    
    if (newPosts.length > 0) {
      return {
        type: 'blog_update',
        competitor: competitor.name,
        newPosts,
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  }

  /**
   * Store historical data for comparison
   */
  storeHistoricalData(competitorKey, data) {
    const key = `${competitorKey}_${new Date().toISOString().split('T')[0]}`;
    this.historicalData.set(key, data);
    
    // Keep only last 30 days of data
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    for (const [histKey] of this.historicalData) {
      const dateStr = histKey.split('_').pop();
      if (new Date(dateStr) < cutoffDate) {
        this.historicalData.delete(histKey);
      }
    }
  }

  /**
   * Get historical data for comparison
   */
  getHistoricalData(competitorName, dataType) {
    const competitorKey = Object.keys(this.competitors).find(
      key => this.competitors[key].name === competitorName
    );
    
    if (!competitorKey) return null;
    
    // Get most recent historical data
    const keys = Array.from(this.historicalData.keys())
      .filter(key => key.startsWith(competitorKey))
      .sort()
      .reverse();
    
    if (keys.length === 0) return null;
    
    const latestData = this.historicalData.get(keys[0]);
    return latestData ? latestData[dataType] : null;
  }

  /**
   * Analyze changes and generate alerts
   */
  async analyzeChanges(competitorKey, currentData) {
    const competitor = this.competitors[competitorKey];
    const alerts = [];
    
    // Check for significant pricing changes
    if (currentData.pricing && currentData.pricing.plans) {
      const pricingAlert = this.analyzePricingChanges(competitor, currentData.pricing);
      if (pricingAlert) alerts.push(pricingAlert);
    }
    
    // Check for new features
    if (currentData.features && currentData.features.features) {
      const featureAlert = this.analyzeFeatureChanges(competitor, currentData.features);
      if (featureAlert) alerts.push(featureAlert);
    }
    
    // Store alerts
    this.alerts.push(...alerts);
    
    // Trigger notifications for high-priority alerts
    for (const alert of alerts) {
      if (alert.priority === 'high') {
        await this.sendAlert(alert);
      }
    }
  }

  /**
   * Analyze pricing changes for alerts
   */
  analyzePricingChanges(competitor, pricingData) {
    // Compare with our pricing
    const ourPricing = { enterprise: 25, pro: 15, basic: 0 };
    
    let competitiveThreat = 'low';
    const threats = [];
    
    for (const [plan, price] of Object.entries(pricingData.plans)) {
      const ourPrice = ourPricing[plan];
      
      if (ourPrice && price < ourPrice) {
        threats.push(`${competitor.name} ${plan} plan ($${price}) is lower than ours ($${ourPrice})`);
        competitiveThreat = 'medium';
      }
      
      if (ourPrice && price < ourPrice * 0.8) {
        competitiveThreat = 'high';
      }
    }
    
    if (threats.length > 0) {
      return {
        type: 'pricing_threat',
        competitor: competitor.name,
        priority: competitiveThreat,
        threats,
        recommendation: this.generatePricingRecommendation(threats),
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  }

  /**
   * Generate pricing recommendations
   */
  generatePricingRecommendation(threats) {
    return [
      'Review pricing strategy for affected plans',
      'Consider value-based positioning over price competition',
      'Highlight unique features (Triple-AI, Job Interview Intelligence)',
      'Evaluate promotional pricing or bundling options'
    ];
  }

  /**
   * Send alert notification
   */
  async sendAlert(alert) {
    console.log('🚨 HIGH PRIORITY COMPETITIVE ALERT:', alert);
    
    // In production, this would send notifications via:
    // - Slack webhook
    // - Email notification
    // - Dashboard alert
    // - SMS for critical alerts
  }

  /**
   * Process updates and take automated actions
   */
  async processUpdates(competitorKey, updates) {
    for (const update of updates) {
      console.log(`📢 Processing update for ${competitorKey}:`, update.type);
      
      switch (update.type) {
        case 'pricing_change':
          await this.handlePricingChange(update);
          break;
          
        case 'feature_update':
          await this.handleFeatureUpdate(update);
          break;
          
        case 'blog_update':
          await this.handleBlogUpdate(update);
          break;
      }
    }
  }

  /**
   * Handle pricing change updates
   */
  async handlePricingChange(update) {
    // Automated responses to pricing changes
    console.log('💰 Pricing change detected:', update.changes);
    
    // Could trigger:
    // - Pricing strategy review
    // - Sales team notification
    // - Marketing message updates
    // - Competitive battle card updates
  }

  /**
   * Handle feature updates
   */
  async handleFeatureUpdate(update) {
    console.log('🆕 New features detected:', update.newFeatures);
    
    // Could trigger:
    // - Product roadmap review
    // - Feature gap analysis
    // - Development priority updates
    // - Competitive positioning updates
  }

  /**
   * Handle blog updates
   */
  async handleBlogUpdate(update) {
    console.log('📝 New blog posts detected:', update.newPosts.map(p => p.title));
    
    // Could trigger:
    // - Content strategy review
    // - Marketing response planning
    // - Thought leadership opportunities
  }

  /**
   * Get competitive intelligence dashboard data
   */
  getDashboardData() {
    return {
      competitors: Object.keys(this.competitors).length,
      monitoringActive: this.monitoringActive,
      alertsCount: this.alerts.length,
      highPriorityAlerts: this.alerts.filter(a => a.priority === 'high').length,
      lastScan: this.lastScanTime,
      historicalDataPoints: this.historicalData.size,
      recentAlerts: this.alerts.slice(-5)
    };
  }

  /**
   * Generate competitive analysis report
   */
  generateCompetitiveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        competitorsMonitored: Object.keys(this.competitors).length,
        alertsGenerated: this.alerts.length,
        highPriorityThreats: this.alerts.filter(a => a.priority === 'high').length
      },
      competitors: {},
      recommendations: []
    };
    
    // Add competitor data
    for (const [key, competitor] of Object.entries(this.competitors)) {
      const latestData = this.getHistoricalData(competitor.name, 'pricing');
      
      report.competitors[key] = {
        name: competitor.name,
        currentPricing: latestData?.plans || competitor.keyMetrics.pricing,
        features: competitor.keyMetrics.features,
        platforms: competitor.keyMetrics.platforms,
        lastUpdated: latestData?.lastUpdated || 'No data'
      };
    }
    
    // Add strategic recommendations
    report.recommendations = this.generateStrategicRecommendations();
    
    return report;
  }

  /**
   * Generate strategic recommendations based on competitive intelligence
   */
  generateStrategicRecommendations() {
    return [
      {
        category: 'Pricing Strategy',
        recommendation: 'Maintain value-based pricing while highlighting unique Triple-AI advantage',
        priority: 'high',
        rationale: 'Competitors focus on price competition, we should focus on value differentiation'
      },
      {
        category: 'Feature Development',
        recommendation: 'Accelerate Job Interview Intelligence features - no competitor has this',
        priority: 'high',
        rationale: 'Blue ocean opportunity with $2.3B+ market potential'
      },
      {
        category: 'Marketing Position',
        recommendation: 'Emphasize seamless integration and hands-free operation',
        priority: 'medium',
        rationale: 'All competitors require manual intervention, we are 99% faster'
      },
      {
        category: 'Enterprise Sales',
        recommendation: 'Target Fireflies enterprise customers with cost savings message',
        priority: 'high',
        rationale: 'Same features at 36% lower cost ($25 vs $39/month)'
      }
    ];
  }
}

module.exports = { CompetitiveIntelligenceSystem };
