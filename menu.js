// ===== menu.js - Native Electron Menu =====
const { Menu, shell } = require('electron');

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Scan',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Reset the app
            const win = BrowserWindow.getFocusedWindow();
            win.webContents.executeJavaScript(`
              file1Content = '';
              file2Content = '';
              document.getElementById('file1-name').textContent = '';
              document.getElementById('file1-size').textContent = '';
              document.getElementById('file2-name').textContent = '';
              document.getElementById('file2-size').textContent = '';
              document.getElementById('drop1').classList.remove('has-content');
              document.getElementById('drop2').classList.remove('has-content');
              document.getElementById('compareBtn').disabled = true;
              document.getElementById('resultSection').classList.remove('visible');
              showToast('New scan ready', 'success');
            `);
          }
        },
        {
          label: 'Export Results',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            win.webContents.executeJavaScript(`exportHistory()`);
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('https://github.com/yourusername/plagiscan');
          }
        },
        {
          label: 'About PlagiScan',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            win.webContents.executeJavaScript(`
              showToast('PlagiScan v1.0 - Plagiarism Detection Tool', 'info', 5000);
            `);
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createMenu };