const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;

function getTrayIcon() {
  const iconPaths = [
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(__dirname, 'assets', 'icon.ico'),
    path.join(__dirname, 'icon.png'),
  ];
  
  for (const iconPath of iconPaths) {
    if (fs.existsSync(iconPath)) {
      return nativeImage.createFromPath(iconPath);
    }
  }
  
  return nativeImage.createEmpty();
}

function createWindow() {
  const { width } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: 420,
    height: 800,
    x: width - 440,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
}

function createTray() {
  const icon = getTrayIcon();
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  let currentViewMode = 'feed';
  
  const updateMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Show/Hide',
        click: toggleWindow 
      },
      { type: 'separator' },
      { 
        label: 'View: Feed',
        click: () => sendToRenderer('view-mode', 'feed'),
        checked: currentViewMode === 'feed',
        type: 'checkbox'
      },
      { 
        label: 'View: Notifications',
        click: () => sendToRenderer('view-mode', 'notifications'),
        checked: currentViewMode === 'notifications',
        type: 'checkbox'
      },
      { type: 'separator' },
      { 
        label: 'Quit',
        click: () => app.quit() 
      }
    ]);
    tray.setContextMenu(contextMenu);
  };
  
  tray.setToolTip('Twitter Monitor - Click to toggle');
  updateMenu();
  tray.on('click', toggleWindow);
  
  ipcMain.on('update-view-mode', (event, mode) => {
    currentViewMode = mode;
    updateMenu();
  });
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
  }
}

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

ipcMain.on('hide-window', () => mainWindow.hide());
ipcMain.on('show-window', () => mainWindow.show());
ipcMain.on('quit-app', () => app.quit());

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(ignore, options);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
