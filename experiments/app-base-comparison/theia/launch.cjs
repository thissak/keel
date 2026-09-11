const { app } = require('electron');

// Playwright adds debugger flags before the entrypoint. Keep only application
// arguments so Theia does not interpret its own entrypoint as a workspace file.
const entryIndex = process.argv.indexOf(__filename);
const args = entryIndex >= 0 ? process.argv.slice(entryIndex + 1) : [];
process.argv = [process.execPath, ...(process.defaultApp ? [__filename] : []), ...args];
app.setName('Keel Theia comparison');
if (process.env.KEEL_COMPARISON_DATA) app.setPath('userData', process.env.KEEL_COMPARISON_DATA);
require('./lib/backend/electron-main.js');
