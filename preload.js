const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Stealth status
  getStealthStatus: () => ipcRenderer.invoke('get-stealth-status'),
  onStealthStatus: (callback) => ipcRenderer.on('stealth-status', (event, data) => callback(data)),
  onClickthroughChanged: (callback) => ipcRenderer.on('clickthrough-changed', (event, val) => callback(val)),

  // Window control
  setOpacity: (value) => ipcRenderer.send('set-opacity', value),
  setAlwaysOnTop: (value) => ipcRenderer.send('set-always-on-top', value),
  hideWindow: () => ipcRenderer.send('hide-window'),
  toggleClickthrough: () => ipcRenderer.send('toggle-clickthrough'),

  // Window dragging
  dragWindow: (deltaX, deltaY) => ipcRenderer.send('drag-window', { deltaX, deltaY }),
  resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),

  // Screen capture
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  onTriggerScan: (callback) => ipcRenderer.on('trigger-scan', () => callback()),

  // Desktop audio sources for voice capture
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
});
