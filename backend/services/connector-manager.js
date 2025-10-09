const SharePointConnector = require('../connectors/sharepoint-connector');
const ConfluenceConnector = require('../connectors/confluence-connector');
const GoogleDriveConnector = require('../connectors/google-drive-connector');

class ConnectorManager {
  constructor() {
    this.connectors = new Map();
    this.config = {};
  }

  async initialize(config) {
    this.config = config;
    
    // Initialize SharePoint if configured
    if (config.sharepoint) {
      try {
        const sharepoint = new SharePointConnector(config.sharepoint);
        if (await sharepoint.testConnection()) {
          this.connectors.set('sharepoint', sharepoint);
          console.log('SharePoint connector initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize SharePoint connector:', error.message);
      }
    }

    // Initialize Confluence if configured
    if (config.confluence) {
      try {
        const confluence = new ConfluenceConnector(config.confluence);
        if (await confluence.testConnection()) {
          this.connectors.set('confluence', confluence);
          console.log('Confluence connector initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Confluence connector:', error.message);
      }
    }

    // Initialize Google Drive if configured
    if (config.googleDrive) {
      try {
        const googleDrive = new GoogleDriveConnector(config.googleDrive);
        if (await googleDrive.testConnection()) {
          this.connectors.set('googleDrive', googleDrive);
          console.log('Google Drive connector initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Google Drive connector:', error.message);
      }
    }

    console.log(`Initialized ${this.connectors.size} knowledge connectors`);
  }

  async searchAllSources(query, limit = 20) {
    const results = [];
    const searchPromises = [];

    for (const [source, connector] of this.connectors) {
      const promise = this.searchSource(source, connector, query, Math.ceil(limit / this.connectors.size))
        .catch(error => {
          console.error(`Search failed for ${source}:`, error.message);
          return [];
        });
      searchPromises.push(promise);
    }

    const allResults = await Promise.all(searchPromises);
    
    // Flatten and sort by relevance/recency
    for (const sourceResults of allResults) {
      results.push(...sourceResults);
    }

    // Simple scoring: newer content gets higher score
    results.forEach(result => {
      const daysSinceModified = (Date.now() - new Date(result.lastModified)) / (1000 * 60 * 60 * 24);
      result.score = Math.max(0, 100 - daysSinceModified);
    });

    return results
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  }

  async searchSource(sourceName, connector, query, limit) {
    try {
      switch (sourceName) {
        case 'sharepoint':
          return await connector.searchDocuments(query, limit);
        case 'confluence':
          return await connector.searchContent(query, limit);
        case 'googleDrive':
          return await connector.searchFiles(query, limit);
        default:
          return [];
      }
    } catch (error) {
      console.error(`Search failed for ${sourceName}:`, error.message);
      return [];
    }
  }

  async getContent(source, contentId) {
    const connector = this.connectors.get(source);
    if (!connector) {
      throw new Error(`Connector not found: ${source}`);
    }

    try {
      switch (source) {
        case 'sharepoint':
          return await connector.getDocumentContent(contentId);
        case 'confluence':
          return await connector.getPageContent(contentId);
        case 'googleDrive':
          return await connector.getFileContent(contentId);
        default:
          throw new Error(`Unsupported source: ${source}`);
      }
    } catch (error) {
      console.error(`Failed to get content from ${source}:`, error.message);
      return null;
    }
  }

  async getRecentContent(limit = 10) {
    const results = [];
    const recentPromises = [];

    for (const [source, connector] of this.connectors) {
      const promise = this.getRecentFromSource(source, connector, Math.ceil(limit / this.connectors.size))
        .catch(error => {
          console.error(`Failed to get recent content from ${source}:`, error.message);
          return [];
        });
      recentPromises.push(promise);
    }

    const allResults = await Promise.all(recentPromises);
    
    for (const sourceResults of allResults) {
      results.push(...sourceResults);
    }

    return results
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, limit);
  }

  async getRecentFromSource(sourceName, connector, limit) {
    try {
      switch (sourceName) {
        case 'sharepoint':
          return await connector.listRecentDocuments(limit);
        case 'confluence':
          return await connector.getRecentContent(limit);
        case 'googleDrive':
          return await connector.getRecentFiles(limit);
        default:
          return [];
      }
    } catch (error) {
      console.error(`Failed to get recent content from ${sourceName}:`, error.message);
      return [];
    }
  }

  getAvailableSources() {
    return Array.from(this.connectors.keys());
  }

  async testAllConnections() {
    const results = {};
    
    for (const [source, connector] of this.connectors) {
      try {
        results[source] = await connector.testConnection();
      } catch (error) {
        results[source] = false;
        console.error(`Connection test failed for ${source}:`, error.message);
      }
    }
    
    return results;
  }
}

module.exports = ConnectorManager;
