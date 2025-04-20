#!/bin/bash

npm init -y
npm install --save-dev electron-nightly electron-builder

read -p "Chcete vytvořit složky '[assets] [css] [dist] [js] [public] [src] [electron]'? (yes/no): " answer
if [[ "$answer" == "yes" ]]; then
  mkdir -p assets css dist js public src electron
  echo "Složky byly vytvořeny."
else
  echo "Složky nebyly vytvořeny."
fi

if [ -d "electron" ]; then
    createMain()
fi


createMain() {
  cat > electron/main.js << 'EOF'
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        // frame: false,
        // titleBarStyle: 'hidden',
        //trafficLightPosition: { x: 10, y: 12 },
        webPreferences: {
                contextIsolation: false,
                enableRemoteModule: true,
                webviewTag: true,
                preload: path.join(__dirname, '../electron/preload.js'),
            nodeIntegration: true
        }
    });
    mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
    mainWindow.webContents.openDevTools({ mode: 'detach' });

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    //app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
EOF
}


