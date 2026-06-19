// ===== preload.js - Complete =====
const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // URL fetching
  fetchUrl: (url) => ipcRenderer.invoke('fetch-url', url),
  
  // History operations
  saveHistory: (history) => ipcRenderer.invoke('save-history', history),
  loadHistory: () => ipcRenderer.invoke('load-history'),
  
  // Export
  exportData: (data) => ipcRenderer.invoke('export-data', data),
  
  // Toast from renderer to main
  showToast: (message, type) => ipcRenderer.send('show-toast', message, type),
  
  // Event listeners from main to renderer
  onNewScan: (callback) => {
    ipcRenderer.on('new-scan', () => callback());
  },
  onExportHistory: (callback) => {
    ipcRenderer.on('export-history', () => callback());
  },
  onShowAbout: (callback) => {
    ipcRenderer.on('show-about', () => callback());
  },
  onToast: (callback) => {
    ipcRenderer.on('toast-message', (event, message, type) => callback(message, type));
  }
});