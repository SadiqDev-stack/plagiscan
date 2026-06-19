// ===== main.js - Main Process =====
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { createMenu } = require('./menu');

let mainWindow = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'logo.png'),
    show: false
  });

  // Add CSP via session
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "connect-src 'self' https:; " +
          "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data:;"
        ]
      }
    });
  });

  mainWindow.loadFile('index.html');
  mainWindow.setTitle('PlagiScan - Plagiarism Checker');
  mainWindow.setMenuBarVisibility(false);
  mainWindow.maximize();
  
  // Create native menu
  createMenu();

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ===== IPC Handlers =====

// Fetch URL content (Node.js fetch - no CORS restrictions!)
ipcMain.handle('fetch-url', async (event, url) => {
  try {
    console.log('Fetching URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
});

// Read file from filesystem
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

// Save history to user data
ipcMain.handle('save-history', async (event, history) => {
  try {
    const userDataPath = app.getPath('userData');
    const historyPath = path.join(userDataPath, 'plagiscan_history.json');
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to save history: ${error.message}`);
  }
});

// Load history from user data
ipcMain.handle('load-history', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const historyPath = path.join(userDataPath, 'plagiscan_history.json');
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
});

// Export data
ipcMain.handle('export-data', async (event, data) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export History',
      defaultPath: `plagiscan_history_${new Date().toISOString().slice(0,10)}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });
    
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { success: true, path: filePath };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    throw new Error(`Failed to export: ${error.message}`);
  }
});

// Toast notification from renderer
ipcMain.on('show-toast', (event, message, type) => {
  if (mainWindow) {
    mainWindow.webContents.send('toast-message', message, type);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});