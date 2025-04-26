// scripts/updateVersion.js

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const appConfigPath = path.join(__dirname, '..', 'src', 'appConfig.js');
console.log(`packageJsonPath: ${packageJsonPath}`);
console.log(`appConfigPath: ${appConfigPath}`);

// Načteme package.json
const packageJson = require(packageJsonPath);

// Načteme appConfig.js jako text a získáme verzi regulárním výrazem
const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
const versionMatch = appConfigContent.match(/version\s*:\s*['"`]([^'"`]+)['"`]/);
console.log(`appConfigContent: ${appConfigContent}`);
if (!versionMatch) {
  throw new Error('Version not found in appConfig.js');
}
const appConfigVersion = versionMatch[1];

// Přepíšeme verzi
packageJson.version = appConfigVersion;

// Zapíšeme zpět
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log(`Updated package.json version to ${appConfigVersion}`);