const { app, BrowserWindow, globalShortcut, ipcMain, screen, desktopCapturer } = require('electron');
const path = require('path');
const stealth = require('./stealth');

// Rename process for Task Manager concealment
process.title = 'System Settings Host';

let mainWindow = null;
let isVisible = true;
let isClickThrough = false;
let nativeLoaded = false;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 480,
    height: 800,
    x: width - 500,
    y: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,          // Hide from taskbar
    resizable: true,
    movable: true,
    hasShadow: true,
    focusable: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      enableBlinkFeatures: 'GetDisplayMedia',
    },
    // Completely hide from screen capture (Win10 2004+)
    // This is the Electron built-in that calls WDA_EXCLUDEFROMCAPTURE
  });

  mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(true);
    }
  );

  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission) => {
      return true;
    }
  );

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Apply native stealth after window is shown and has an HWND
    applyStealthFeatures();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent window from appearing in screen recordings
  mainWindow.setContentProtection(true);

  // Development: open DevTools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function applyStealthFeatures() {
  if (!mainWindow) return;

  // Load ffi-napi based native Win32 module
  nativeLoaded = stealth.loadNativeModules();

  if (nativeLoaded) {
    const hwnd = mainWindow.getNativeWindowHandle();
    // Convert Buffer to int32 (Windows HWND)
    const hwndInt = hwnd.readInt32LE(0);

    // Apply WS_EX_TOOLWINDOW — hides from Alt+Tab
    stealth.applyWindowStealth(hwndInt);

    // Apply WDA_EXCLUDEFROMCAPTURE — invisible in screen share
    stealth.applyScreenCaptureProtection(hwndInt);
  } else {
    // Fallback: Electron's built-in content protection (already set above)
    console.log('[Stealth] Using Electron built-in content protection only');
  }

  // Send stealth status to renderer
  updateStealthStatus();
}

function updateStealthStatus() {
  if (!mainWindow) return;
  mainWindow.webContents.send('stealth-status', {
    screenShare: true,       // setContentProtection always enabled
    taskbar: true,           // skipTaskbar: true
    altTab: nativeLoaded,    // requires ffi-napi
    taskManager: true,       // process renamed
    cursor: true,            // software cursor in renderer
  });
}

function toggleVisibility() {
  if (!mainWindow) return;
  isVisible = !isVisible;
  if (isVisible) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    mainWindow.hide();
  }
  mainWindow.webContents.send('visibility-changed', isVisible);
}

function toggleClickThrough() {
  if (!mainWindow) return;
  isClickThrough = !isClickThrough;
  mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });
  mainWindow.webContents.send('clickthrough-changed', isClickThrough);
}

app.whenReady().then(() => {
  createWindow();

  // Global stealth hotkeys — work even when app is hidden
  globalShortcut.register('CommandOrControl+Shift+H', toggleVisibility);
  globalShortcut.register('CommandOrControl+Shift+.', toggleClickThrough);
  globalShortcut.register('CommandOrControl+Shift+L', async () => {
    if (mainWindow) {
      await mainWindow.webContents.session.clearCache();
      mainWindow.reload();
    }
  });
  globalShortcut.register('CommandOrControl+Shift+Q', async () => {
    if (mainWindow) {
      await mainWindow.webContents.session.clearStorageData();
      await mainWindow.webContents.session.clearCache();
    }
    globalShortcut.unregisterAll();
    app.quit();
  });

  // Screen scan hotkey — Ctrl+Shift+A
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (mainWindow) mainWindow.webContents.send('trigger-scan');
  });

  // Nudge window position
  globalShortcut.register('CommandOrControl+Shift+Up', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, Math.max(0, y - 50));
  });
  globalShortcut.register('CommandOrControl+Shift+Down', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y + 50);
  });
  globalShortcut.register('CommandOrControl+Shift+Left', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(Math.max(0, x - 50), y);
  });
  globalShortcut.register('CommandOrControl+Shift+Right', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + 50, y);
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle('get-stealth-status', () => ({
  screenShare: true,
  taskbar: true,
  altTab: nativeLoaded,
  taskManager: true,
  cursor: true,
}));

ipcMain.on('set-opacity', (event, value) => {
  if (mainWindow) mainWindow.setOpacity(value);
});

ipcMain.on('set-always-on-top', (event, value) => {
  if (mainWindow) mainWindow.setAlwaysOnTop(value, 'screen-saver');
});

ipcMain.on('toggle-clickthrough', () => {
  toggleClickThrough();
});

ipcMain.on('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('drag-window', (event, { deltaX, deltaY }) => {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const newX = Math.max(0, Math.min(x + deltaX, width - 100));
  const newY = Math.max(0, Math.min(y + deltaY, height - 100));
  mainWindow.setPosition(newX, newY);
});

ipcMain.on('resize-window', (event, { width, height }) => {
  if (mainWindow) mainWindow.setSize(width, height);
});

// Desktop audio sources for voice capture
ipcMain.handle('get-desktop-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
    return sources.map(s => ({ id: s.id, name: s.name }));
  } catch (e) {
    console.error('[DesktopSources]', e.message);
    return [];
  }
});

// Screen capture — temporarily disable content protection so our own desktopCapturer can capture all windows
ipcMain.handle('take-screenshot', async () => {
  try {
    // Briefly disable content protection so we don't block OTHER windows from being captured
    if (mainWindow) mainWindow.setContentProtection(false);
    await new Promise(r => setTimeout(r, 150)); // small delay for protection to lift

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    // Re-enable content protection immediately
    if (mainWindow) mainWindow.setContentProtection(true);

    if (!sources || sources.length === 0) return null;
    // Return base64 PNG (strip the data: prefix)
    const dataUrl = sources[0].thumbnail.toDataURL();
    return dataUrl.replace(/^data:image\/png;base64,/, '');
  } catch (e) {
    if (mainWindow) mainWindow.setContentProtection(true);
    console.error('[Screenshot]', e.message);
    return null;
  }
});
