// IPC komunikace pro store.js
const { app } = require('electron');
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

ipcMain.handle('store-init', () => {
    // Inicializace store
    store.initStore();
    return true;
});

ipcMain.handle('store-remove', (event, key) => {
    store.removeValue(key);
    return true;
});
ipcMain.handle('store-isexists', (event, key) => {
    return store.isExists(key);
});

ipcMain.handle('restore-confirm', async () => {
    // Zde můžete provést akci po potvrzení obnovení
    // Například zavolat funkci restoreTabs()
    return await webBrowser.restoreTabs();
});


// ---- IPC pro keytar ----

ipcMain.handle('get-credentials', async (event, service, account) => {
  const pwd = await keytar.getPassword(service, account);
  return pwd; // null, pokud neexistuje
});



