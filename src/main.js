const { app, BrowserWindow } = require('electron');
const path = require('path');
const utils_path = require('../js/utils.js');
const store = require('../js/store.js');
const appConfig = require('./appConfig.js');
const { ipcMain } = require('electron');

require('./app/ipc.js');

let mainWindow;



function createWindow() {
  // Načti poslední velikost okna, pokud existuje
  const lastSize = store.getValue('windowSize', { width: appConfig.window.width, height: appConfig.window.height });
  mainWindow = new BrowserWindow({
    width: lastSize.width,
    height: lastSize.height,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 12 },
    webPreferences: {
        contextIsolation: false,
        enableRemoteModule: true,
        webviewTag: true,
        preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  });
  mainWindow.loadFile(utils_path.PUBLIC_PATH() + 'index.html');

  mainWindow.webContents.openDevTools({ mode: 'detach' });

store.initStore();

  // Ulož velikost okna při změně
  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize();
    store.setValue('windowSize', { width, height });
  });

  // Při zavření okna můžeš uložit další parametry (např. poslední taby, homepage)
  mainWindow.on('close', () => {
    // Příklad: uložení homepage a tabů (získat je musíš přes IPC z renderer procesu)
    // store.setValue('homepage', homepageUrl);
    // store.setValue('lastTabs', tabsArray);
    store.saveStore();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
