const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// Meilleure détection du mode développement
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Initialisation de la base de données
let Database;
try {
  Database = require('./database/sqlite-manager');
  console.log('✅ Base de données SQLite initialisée');
} catch (error) {
  console.error('❌ Erreur initialisation base de données:', error);
  // Fallback si la base de données ne peut pas être initialisée
  Database = {
    getCryptoFavorites: () => [],
    addCryptoFavorite: () => ({ success: false }),
    removeCryptoFavorite: () => ({ success: false }),
    getCalendarEvents: () => [],
    addCalendarEvent: () => ({ success: false }),
    updateCalendarEvent: () => ({ success: false }),
    deleteCalendarEvent: () => ({ success: false }),
    getNavbarPreferences: () => ({}),
    saveNavbarPreferences: () => ({ success: false }),
    getNavbarOrder: () => [],
    saveNavbarOrder: () => ({ success: false }),
    getDefaultNavbarPreferences: () => ({}),
    getDefaultNavbarOrder: () => []
  };
}

let mainWindow;

function createWindow() {
  // Créer la fenêtre principale
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  });

  // URL de démarrage
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`;

  console.log('🚀 Mode:', isDev ? 'Development' : 'Production');
  console.log('🌐 Loading URL:', startUrl);
  
  // Charger l'URL avec gestion d'erreur
  mainWindow.loadURL(startUrl).catch(err => {
    console.error('❌ Erreur chargement URL:', err);
    if (isDev) {
      // En mode dev, réessayer après 3 secondes si le serveur n'est pas encore prêt
      setTimeout(() => {
        console.log('🔄 Nouvelle tentative de connexion...');
        mainWindow.loadURL(startUrl);
      }, 3000);
    }
  });

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // DevTools en développement uniquement
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Gestion de la fermeture
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Événements de l'application
app.whenReady().then(() => {
  createWindow();

  // Gestion des mises à jour (pas en développement)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

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

// IPC Handlers pour la base de données
ipcMain.handle('db:get-crypto-favorites', async () => {
  try {
    return await Database.getCryptoFavorites();
  } catch (error) {
    console.error('Erreur récupération favoris crypto:', error);
    return [];
  }
});

ipcMain.handle('db:add-crypto-favorite', async (event, crypto) => {
  try {
    return await Database.addCryptoFavorite(crypto);
  } catch (error) {
    console.error('Erreur ajout favori crypto:', error);
    throw error;
  }
});

ipcMain.handle('db:remove-crypto-favorite', async (event, id) => {
  try {
    return await Database.removeCryptoFavorite(id);
  } catch (error) {
    console.error('Erreur suppression favori crypto:', error);
    throw error;
  }
});

ipcMain.handle('db:get-calendar-events', async (event, timeMin, timeMax) => {
  try {
    return await Database.getCalendarEvents(timeMin, timeMax);
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    return [];
  }
});

ipcMain.handle('db:add-calendar-event', async (event, eventData) => {
  try {
    return await Database.addCalendarEvent(eventData);
  } catch (error) {
    console.error('Erreur ajout événement:', error);
    throw error;
  }
});

ipcMain.handle('db:update-calendar-event', async (event, id, eventData) => {
  try {
    return await Database.updateCalendarEvent(id, eventData);
  } catch (error) {
    console.error('Erreur mise à jour événement:', error);
    throw error;
  }
});

ipcMain.handle('db:delete-calendar-event', async (event, id) => {
  try {
    return await Database.deleteCalendarEvent(id);
  } catch (error) {
    console.error('Erreur suppression événement:', error);
    throw error;
  }
});

ipcMain.handle('db:sync-google-events', async (event, googleEvents) => {
  try {
    return await Database.syncGoogleEvents(googleEvents);
  } catch (error) {
    console.error('Erreur synchronisation Google:', error);
    throw error;
  }
});

// IPC Handlers pour les préférences navbar
ipcMain.handle('db:get-navbar-preferences', async () => {
  try {
    if (typeof Database.getNavbarPreferences === 'function') {
      return await Database.getNavbarPreferences();
    } else {
      // Valeurs par défaut si la méthode n'existe pas
      return {
        home: true,
        crypto: true,
        message: true,
        meteo: true,
        sante: true,
        finances: true,
        calendrier: true,
        profile: true,
        parametres: true
      };
    }
  } catch (error) {
    console.error('Erreur récupération préférences navbar:', error);
    return {
      home: true,
      crypto: true,
      message: true,
      meteo: true,
      sante: true,
      finances: true,
      calendrier: true,
      profile: true,
      parametres: true
    };
  }
});

ipcMain.handle('db:save-navbar-preferences', async (event, preferences) => {
  try {
    if (typeof Database.saveNavbarPreferences === 'function') {
      return await Database.saveNavbarPreferences(preferences);
    } else {
      console.log('⚠️ saveNavbarPreferences non disponible, utilisation fallback');
      return { success: true };
    }
  } catch (error) {
    console.error('Erreur sauvegarde préférences navbar:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:get-navbar-order', async () => {
  try {
    if (typeof Database.getNavbarOrder === 'function') {
      return await Database.getNavbarOrder();
    } else {
      // Ordre par défaut si la méthode n'existe pas
      return [
        'home',
        'crypto', 
        'message',
        'meteo',
        'sante',
        'finances',
        'calendrier'
      ];
    }
  } catch (error) {
    console.error('Erreur récupération ordre navbar:', error);
    return [
      'home',
      'crypto', 
      'message',
      'meteo',
      'sante',
      'finances',
      'calendrier'
    ];
  }
});

ipcMain.handle('db:save-navbar-order', async (event, order) => {
  try {
    if (typeof Database.saveNavbarOrder === 'function') {
      return await Database.saveNavbarOrder(order);
    } else {
      console.log('⚠️ saveNavbarOrder non disponible, utilisation fallback');
      return { success: true };
    }
  } catch (error) {
    console.error('Erreur sauvegarde ordre navbar:', error);
    return { success: false, error: error.message };
  }
});

// Gestion des mises à jour
autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version est disponible. Elle sera téléchargée en arrière-plan.',
    buttons: ['OK']
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Mise à jour prête',
    message: 'La mise à jour a été téléchargée. Redémarrez l\'application pour l\'appliquer.',
    buttons: ['Redémarrer', 'Plus tard']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});