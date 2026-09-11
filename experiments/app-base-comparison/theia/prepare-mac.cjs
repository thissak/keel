// Local experiment only: no Developer ID, notarization or production signing.
if (process.platform === 'darwin') {
  const { copyFileSync, renameSync } = require('node:fs');
  const { execFileSync } = require('node:child_process');
  const { join } = require('node:path');
  const addon = join(__dirname, 'lib/backend/native/drivelist.node');
  const fresh = `${addon}.fresh`;
  // A fresh inode avoids the invalid-page failure observed after native rebuild.
  copyFileSync(addon, fresh);
  execFileSync('codesign', ['--force', '--sign', '-', fresh]);
  renameSync(fresh, addon);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', join(__dirname, 'node_modules/electron/dist/Electron.app')]);
}
