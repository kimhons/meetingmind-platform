const axios = require('axios');

class SharePointConnector {
  constructor(config) {
    this.tenantId = config.tenantId;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.siteUrl = config.siteUrl;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const response = await axios.post(tokenUrl, new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'https://graph.microsoft.com/.default'
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return true;
    } catch (error) {
      console.error('SharePoint authentication failed:', error.message);
      return false;
    }
  }

  async ensureAuthenticated() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      return await this.authenticate();
    }
    return true;
  }

  async searchDocuments(query, limit = 20) {
    if (!await this.ensureAuthenticated()) {
      throw new Error('Authentication failed');
    }

    try {
      const searchUrl = `https://graph.microsoft.com/v1.0/search/query`;
      
      const searchBody = {
        requests: [{
          entityTypes: ['driveItem'],
          query: {
            queryString: query
          },
          from: 0,
          size: limit
        }]
      };

      const response = await axios.post(searchUrl, searchBody, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const results = response.data.value[0]?.hitsContainers[0]?.hits || [];
      
      return results.map(hit => ({
        id: hit.resource.id,
        name: hit.resource.name,
        url: hit.resource.webUrl,
        content: hit.summary || '',
        lastModified: hit.resource.lastModifiedDateTime,
        author: hit.resource.createdBy?.user?.displayName || 'Unknown',
        type: 'sharepoint_document',
        relevanceScore: hit.rank || 0
      }));
    } catch (error) {
      console.error('SharePoint search failed:', error.message);
      return [];
    }
  }

  async getDocumentContent(documentId) {
    if (!await this.ensureAuthenticated()) {
      throw new Error('Authentication failed');
    }

    try {
      const contentUrl = `https://graph.microsoft.com/v1.0/drives/items/${documentId}/content`;
      
      const response = await axios.get(contentUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'text'
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get document content:', error.message);
      return null;
    }
  }

  async listRecentDocuments(limit = 10) {
    if (!await this.ensureAuthenticated()) {
      throw new Error('Authentication failed');
    }

    try {
      const recentUrl = `https://graph.microsoft.com/v1.0/me/drive/recent?$top=${limit}`;
      
      const response = await axios.get(recentUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data.value.map(item => ({
        id: item.id,
        name: item.name,
        url: item.webUrl,
        lastModified: item.lastModifiedDateTime,
        author: item.createdBy?.user?.displayName || 'Unknown',
        type: 'sharepoint_document'
      }));
    } catch (error) {
      console.error('Failed to get recent documents:', error.message);
      return [];
    }
  }

  async testConnection() {
    try {
      const authenticated = await this.authenticate();
      if (!authenticated) return false;

      // Test with a simple query
      const results = await this.searchDocuments('test', 1);
      return true;
    } catch (error) {
      console.error('SharePoint connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = SharePointConnector;
