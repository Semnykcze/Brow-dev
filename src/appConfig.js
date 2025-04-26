const path = require('path');
const pkg = require(path.join(__dirname, '../package.json'));



const appConfig = {
    name: "Brow",
    version: '0.0.1', // přímo hodnota, aby ji updateVersion.js našel
    description: "Brow is a modern, lightweight web browser built on the latest Electron Nightly for macOS. It delivers a native-like experience, fast startup, and a clean, minimal interface.",
    author: "Semnykcze",
    license: "MIT",
    updateUrl: "https://example.com/updates",
    isDev: process.env.NODE_ENV !== "production",
    window: {
        width: 1280,
        height: 800,
        resizable: true
    },
    userData: "brow/data" // vlastní složka pro data
};

module.exports = appConfig;