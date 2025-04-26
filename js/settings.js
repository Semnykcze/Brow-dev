

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');
let settings = {};



const DEFAULT_SETTINGS = {
    theme: 'light',
    language: 'en',
    notifications: true,
    allowRestore: true
};

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            settings = JSON.parse(data);
            console.log('Settings loaded:', settings);
        }
    }   catch (e) { 
        console.error('Error loading settings:', e);
        settings = {};
    }
}

function saveSettings() {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

function setSetting(key, value) {
    // Load current settings before saving to avoid overwriting other values
    loadSettings();
    settings[key] = value;
    saveSettings();
}
function getSetting(key, defaultValue = null) {
    return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
}


module.exports = {
    setSetting,
    getSetting,
    saveSettings,
    loadSettings,
};