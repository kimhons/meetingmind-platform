const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File operations
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  
  // Window operations
  toggleOverlay: () => ipcRenderer.invoke('toggle-overlay'),
  
  // Event listeners
  onNewSession: (callback) => ipcRenderer.on('new-session', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // System info
  platform: process.platform,
  
  // Meeting assistance features
  startListening: () => ipcRenderer.invoke('start-listening'),
  stopListening: () => ipcRenderer.invoke('stop-listening'),
  getInsights: (text) => ipcRenderer.invoke('get-insights', text),
  searchKnowledge: (query) => ipcRenderer.invoke('search-knowledge', query),
  generateFollowUp: (meetingData) => ipcRenderer.invoke('generate-follow-up', meetingData),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // AI Settings
  getAISettings: () => ipcRenderer.invoke('get-ai-settings'),
  saveAISettings: (settings) => ipcRenderer.invoke('save-ai-settings', settings),
  getAIStatus: () => ipcRenderer.invoke('get-ai-status'),
  testAIConnection: () => ipcRenderer.invoke('test-ai-connection')
});

// Expose a limited API for the overlay window
contextBridge.exposeInMainWorld('overlayAPI', {
  minimize: () => ipcRenderer.invoke('minimize-overlay'),
  close: () => ipcRenderer.invoke('close-overlay'),
  updatePosition: (x, y) => ipcRenderer.invoke('update-overlay-position', x, y),
  sendToMain: (data) => ipcRenderer.invoke('overlay-to-main', data)
});
