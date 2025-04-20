const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(app.getPath('userData'), 'appdata.json');
let store = {};

function loadStore() {
    try {
        if (fs.existsSync(STORE_FILE)) {
            const data = fs.readFileSync(STORE_FILE, 'utf-8');
            store = JSON.parse(data);
            console.log('Store loaded:', store);
        }
    } catch (e) {
        console.error('Chyba při načítání store:', e);
        store = {};
    }
}

function saveStore() {
    try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (e) {
        console.error('Chyba při ukládání store:', e);
    }
}

function setValue(key, value) {
    // Před uložením vždy načti aktuální data ze souboru, aby nedošlo k přepsání ostatních hodnot
    loadStore();
    store[key] = value;
    saveStore();
}

function getValue(key, defaultValue = null) {
    return store.hasOwnProperty(key) ? store[key] : defaultValue;
}

function isExists(key) {
    return store.hasOwnProperty(key);
}


function removeValue(key) {
    // Před odstraněním vždy načti aktuální data ze souboru
    loadStore();
    if (isExists(key)) {
        delete store[key];
        saveStore();
    }
}

// Načti store při startu
loadStore();

module.exports = {
    setValue,
    getValue,
    saveStore,
    loadStore,
    removeValue,
    isExists,
    STORE_FILE
};


