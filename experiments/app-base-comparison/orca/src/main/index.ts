import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';

app.setName('Keel Orca comparison');
if (process.env.KEEL_COMPARISON_DATA) {
  app.setPath('userData', process.env.KEEL_COMPARISON_DATA);
}

function openWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  openWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openWindow();
  });
});
app.on('window-all-closed', () => app.quit());
