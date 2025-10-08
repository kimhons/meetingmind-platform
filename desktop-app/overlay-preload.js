const { contextBridge, ipcRenderer } = require('electron');

/**
 * Overlay Preload Script
 * 
 * Provides secure communication between the invisible overlay UI
 * and the main Electron process for collaborative AI functionality.
 */

// Expose secure API to the overlay renderer process
contextBridge.exposeInMainWorld('overlayAPI', {
  // Overlay control
  toggleVisibility: () => ipcRenderer.invoke('overlay-toggle-visibility'),
  getStatus: () => ipcRenderer.invoke('overlay-get-status'),
  
  // AI model control
  toggleAIModel: (model) => ipcRenderer.invoke('overlay-toggle-ai-model', model),
  
  // Response handling
  copyResponse: (responseText) => ipcRenderer.invoke('overlay-copy-response', responseText),
  
  // Event listeners
  onAIStatusUpdate: (callback) => {
    ipcRenderer.on('ai-status-update', (event, data) => callback(data));
  },
  
  onShowProcessing: (callback) => {
    ipcRenderer.on('show-processing', (event, data) => callback(data));
  },
  
  onHideProcessing: (callback) => {
    ipcRenderer.on('hide-processing', (event, data) => callback(data));
  },
  
  onUpdateInsights: (callback) => {
    ipcRenderer.on('update-insights', (event, data) => callback(data));
  },
  
  onUpdateResponses: (callback) => {
    ipcRenderer.on('update-responses', (event, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

console.log('🔒 Overlay preload script loaded - secure IPC bridge established');
