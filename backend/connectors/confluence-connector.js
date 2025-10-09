const axios = require('axios');

class ConfluenceConnector {
  constructor(config) {
    this.baseUrl = config.baseUrl; // e.g., https://company.atlassian.net
    this.username = config.username;
    this.apiToken = config.apiToken;
    this.auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
  }

  async searchContent(query, limit = 20) {
    try {
      const searchUrl = `${this.baseUrl}/wiki/rest/api/content/search`;
      
      const response = await axios.get(searchUrl, {
        params: {
          cql: `text ~ "${query}"`,
          limit: limit,
          expand: 'body.storage,version,space'
        },
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      });

      return response.data.results.map(item => ({
        id: item.id,
        title: item.title,
        url: `${this.baseUrl}/wiki${item._links.webui}`,
        content: this.extractTextFromStorage(item.body?.storage?.value || ''),
        lastModified: item.version.when,
        author: item.version.by?.displayName || 'Unknown',
        space: item.space?.name || 'Unknown',
        type: 'confluence_page'
      }));
    } catch (error) {
      console.error('Confluence search failed:', error.message);
      return [];
    }
  }

  async getPageContent(pageId) {
    try {
      const pageUrl = `${this.baseUrl}/wiki/rest/api/content/${pageId}`;
      
      const response = await axios.get(pageUrl, {
        params: {
          expand: 'body.storage,version,space'
        },
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      });

      const page = response.data;
      return {
        id: page.id,
        title: page.title,
        content: this.extractTextFromStorage(page.body?.storage?.value || ''),
        lastModified: page.version.when,
        author: page.version.by?.displayName || 'Unknown',
        space: page.space?.name || 'Unknown',
        url: `${this.baseUrl}/wiki${page._links.webui}`
      };
    } catch (error) {
      console.error('Failed to get page content:', error.message);
      return null;
    }
  }

  async getRecentContent(limit = 10) {
    try {
      const recentUrl = `${this.baseUrl}/wiki/rest/api/content`;
      
      const response = await axios.get(recentUrl, {
        params: {
          orderby: 'lastmodified',
          limit: limit,
          expand: 'version,space'
        },
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      });

      return response.data.results.map(item => ({
        id: item.id,
        title: item.title,
        url: `${this.baseUrl}/wiki${item._links.webui}`,
        lastModified: item.version.when,
        author: item.version.by?.displayName || 'Unknown',
        space: item.space?.name || 'Unknown',
        type: 'confluence_page'
      }));
    } catch (error) {
      console.error('Failed to get recent content:', error.message);
      return [];
    }
  }

  async getSpaces() {
    try {
      const spacesUrl = `${this.baseUrl}/wiki/rest/api/space`;
      
      const response = await axios.get(spacesUrl, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      });

      return response.data.results.map(space => ({
        id: space.id,
        key: space.key,
        name: space.name,
        type: space.type,
        url: `${this.baseUrl}/wiki${space._links.webui}`
      }));
    } catch (error) {
      console.error('Failed to get spaces:', error.message);
      return [];
    }
  }

  extractTextFromStorage(storageValue) {
    if (!storageValue) return '';
    
    // Simple HTML tag removal - basic but effective
    return storageValue
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000); // Limit to first 1000 chars
  }

  async testConnection() {
    try {
      const spacesUrl = `${this.baseUrl}/wiki/rest/api/space`;
      
      const response = await axios.get(spacesUrl, {
        params: { limit: 1 },
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('Confluence connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = ConfluenceConnector;
