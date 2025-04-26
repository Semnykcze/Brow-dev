/* // preload.js (renderer-safe bridge)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('keychain', {
  getPassword: (service, account) =>
    ipcRenderer.invoke('get-credentials', service, account)
}); */