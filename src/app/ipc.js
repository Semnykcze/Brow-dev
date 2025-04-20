// IPC komunikace pro store.js
const { ipcMain } = require('electron');
const store = require('../../js/store.js');

ipcMain.handle('store-get', (event, key, defaultValue) => {
    return store.getValue(key, defaultValue);
});
ipcMain.handle('store-set', (event, key, value) => {
    store.setValue(key, value);
    // Uložení store po každém nastavení hodnoty
    store.saveStore();
    return true;
});
ipcMain.handle('store-save', () => {
    store.saveStore();
    return true;
});
ipcMain.handle('store-load', () => {
    store.loadStore();
    return true;
});

ipcMain.handle('store-remove', (event, key) => {
    store.removeValue(key);
    return true;
});
ipcMain.handle('store-isexists', (event, key) => {
    return store.isExists(key);
});



