const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées à l'interface web
contextBridge.exposeInMainWorld('electronAPI', {
  // Détection d'Electron
  isElectron: true,
  
  // APIs Base de données - Crypto
  getCryptoFavorites: () => ipcRenderer.invoke('db:get-crypto-favorites'),
  addCryptoFavorite: (crypto) => ipcRenderer.invoke('db:add-crypto-favorite', crypto),
  removeCryptoFavorite: (id) => ipcRenderer.invoke('db:remove-crypto-favorite', id),
  
  // APIs Base de données - Calendrier
  getCalendarEvents: (timeMin, timeMax) => ipcRenderer.invoke('db:get-calendar-events', timeMin, timeMax),
  addCalendarEvent: (eventData) => ipcRenderer.invoke('db:add-calendar-event', eventData),
  updateCalendarEvent: (id, eventData) => ipcRenderer.invoke('db:update-calendar-event', id, eventData),
  deleteCalendarEvent: (id) => ipcRenderer.invoke('db:delete-calendar-event', id),
  syncGoogleEvents: (googleEvents) => ipcRenderer.invoke('db:sync-google-events', googleEvents),
  
  // APIs Base de données - Navbar Preferences
  getNavbarPreferences: () => ipcRenderer.invoke('db:get-navbar-preferences'),
  saveNavbarPreferences: (preferences) => ipcRenderer.invoke('db:save-navbar-preferences', preferences),
  getNavbarOrder: () => ipcRenderer.invoke('db:get-navbar-order'),
  saveNavbarOrder: (order) => ipcRenderer.invoke('db:save-navbar-order', order),
  
  // APIs système
  platform: process.platform,
  version: process.versions.electron
});

// Protection contre l'injection de scripts
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});