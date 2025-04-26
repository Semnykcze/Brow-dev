const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(app.getPath('userData'), 'appdata.json');
let store = {};


let SEARCH_ENGINES = {
    google: "https://www.google.com/search?q=%s",
    duckduckgo: "https://duckduckgo.com/?q=%s",
    bing: "https://www.bing.com/search?q=%s",
}


let DEFAULT_STORE = {
    theme: 'light',
    lang: "en",
    homepage: "https://www.google.com",
    searchEngine: SEARCH_ENGINES.google,
    windowSize: {
        width: 800,
        height: 600
    },
    allowRestore: true,
};



function initStore() {
    console.log('Initializing store...');
    // Inicializace store s výchozími hodnotami
    if (!fs.existsSync(STORE_FILE)) {
        fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
        console.log('Store initialized with default values:', DEFAULT_STORE);
    } else {
        console.log('Store already exists, no need to initialize.');
    }
    // Načti aktuální store
    for (const key in DEFAULT_STORE) {
        if (!store.hasOwnProperty(key)) {
            store[key] = DEFAULT_STORE[key];
        }
    }
}


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
    STORE_FILE,
    initStore
};


