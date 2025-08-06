const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  loadFile: () => ipcRenderer.invoke('load-file'),
  
  onMenuNewSubject: (callback) => ipcRenderer.on('menu-new-subject', callback),
  onMenuNewNote: (callback) => ipcRenderer.on('menu-new-note', callback),
  onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
  onMenuImport: (callback) => ipcRenderer.on('menu-import', callback),
  
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});