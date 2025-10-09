const { google } = require('googleapis');

class GoogleDriveConnector {
  constructor(config) {
    this.credentials = config.credentials; // Service account JSON
    this.auth = new google.auth.GoogleAuth({
      credentials: this.credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async searchFiles(query, limit = 20) {
    try {
      const response = await this.drive.files.list({
        q: `fullText contains "${query}" and trashed=false`,
        pageSize: limit,
        fields: 'files(id,name,mimeType,modifiedTime,owners,webViewLink,size)',
        orderBy: 'modifiedTime desc'
      });

      const files = response.data.files || [];
      
      return files.map(file => ({
        id: file.id,
        name: file.name,
        url: file.webViewLink,
        mimeType: file.mimeType,
        lastModified: file.modifiedTime,
        author: file.owners?.[0]?.displayName || 'Unknown',
        size: file.size || 0,
        type: 'google_drive_file'
      }));
    } catch (error) {
      console.error('Google Drive search failed:', error.message);
      return [];
    }
  }

  async getFileContent(fileId) {
    try {
      // Get file metadata first
      const fileResponse = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType'
      });

      const file = fileResponse.data;
      
      // Handle different file types
      if (file.mimeType.includes('google-apps')) {
        // Export Google Docs/Sheets/Slides as text
        const exportMimeType = this.getExportMimeType(file.mimeType);
        if (exportMimeType) {
          const contentResponse = await this.drive.files.export({
            fileId: fileId,
            mimeType: exportMimeType
          });
          return contentResponse.data;
        }
      } else {
        // Download regular files
        const contentResponse = await this.drive.files.get({
          fileId: fileId,
          alt: 'media'
        });
        return contentResponse.data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get file content:', error.message);
      return null;
    }
  }

  async getRecentFiles(limit = 10) {
    try {
      const response = await this.drive.files.list({
        q: 'trashed=false',
        pageSize: limit,
        fields: 'files(id,name,mimeType,modifiedTime,owners,webViewLink)',
        orderBy: 'modifiedTime desc'
      });

      const files = response.data.files || [];
      
      return files.map(file => ({
        id: file.id,
        name: file.name,
        url: file.webViewLink,
        mimeType: file.mimeType,
        lastModified: file.modifiedTime,
        author: file.owners?.[0]?.displayName || 'Unknown',
        type: 'google_drive_file'
      }));
    } catch (error) {
      console.error('Failed to get recent files:', error.message);
      return [];
    }
  }

  async searchInFolder(folderId, query, limit = 20) {
    try {
      const response = await this.drive.files.list({
        q: `"${folderId}" in parents and fullText contains "${query}" and trashed=false`,
        pageSize: limit,
        fields: 'files(id,name,mimeType,modifiedTime,owners,webViewLink)',
        orderBy: 'modifiedTime desc'
      });

      const files = response.data.files || [];
      
      return files.map(file => ({
        id: file.id,
        name: file.name,
        url: file.webViewLink,
        mimeType: file.mimeType,
        lastModified: file.modifiedTime,
        author: file.owners?.[0]?.displayName || 'Unknown',
        type: 'google_drive_file'
      }));
    } catch (error) {
      console.error('Failed to search in folder:', error.message);
      return [];
    }
  }

  getExportMimeType(googleMimeType) {
    const mimeTypeMap = {
      'application/vnd.google-apps.document': 'text/plain',
      'application/vnd.google-apps.spreadsheet': 'text/csv',
      'application/vnd.google-apps.presentation': 'text/plain'
    };
    
    return mimeTypeMap[googleMimeType] || null;
  }

  async testConnection() {
    try {
      const response = await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id,name)'
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Google Drive connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = GoogleDriveConnector;
