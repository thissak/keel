import { app, session, type Session, type WebContents } from 'electron'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { validateAppConfig, type KeelAppConfig } from '../shared/config.js'
import { WEB_PARTITION, decidePermission } from './policy.js'
import { UiStateStore } from './ui-state-store.js'
import { createShellWindow } from './window.js'
import { installWebviewSecurity } from './webview-security.js'
import { registerIpc } from './ipc.js'

export type { KeelAppConfig, KeelWebPolicy } from '../shared/config.js'
export { UiStateStore } from './ui-state-store.js'

export interface KeelApp {
  window: Electron.BrowserWindow
  webSession: Session
  ui: UiStateStore
  tabs: { onGuestCreated(cb: (contents: WebContents) => void): () => void }
}

function resolvePreload(): string {
  return createRequire(import.meta.url).resolve('@goldenlabs/keel/preload')
}

export async function createKeelApp(input: KeelAppConfig): Promise<KeelApp> {
  const config = validateAppConfig(input)
  app.setName(config.name)
  app.setPath('userData', config.userData ?? join(app.getPath('appData'), config.id))
  await app.whenReady()

  const webSession = session.fromPartition(WEB_PARTITION(config.id))
  webSession.setPermissionRequestHandler((contents, permission, callback, details) =>
    callback(decidePermission({ permission, requestingUrl: details.requestingUrl, pageUrl: contents.getURL() }, config.web)))
  webSession.setPermissionCheckHandler((contents, permission, origin) =>
    !!contents && decidePermission({ permission, requestingUrl: origin, pageUrl: contents.getURL() }, config.web))

  const ui = new UiStateStore(join(app.getPath('userData'), 'keel-ui.json'))
  await ui.load()

  const guestListeners = new Set<(contents: WebContents) => void>()
  const win = createShellWindow(config, ui, resolvePreload(), session.defaultSession)
  installWebviewSecurity(win, config, guest => guestListeners.forEach(cb => cb(guest)))
  const unregister = registerIpc(win, config, ui, webSession)
  win.on('closed', () => { unregister(); void ui.flush() })

  const query = config.renderer.query ?? {}
  if (config.renderer.url) {
    const url = new URL(config.renderer.url)
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
    void win.loadURL(url.toString())
  } else {
    void win.loadFile(config.renderer.file!, { query })
  }

  app.on('window-all-closed', () => { void ui.flush().then(() => app.quit()) })

  return {
    window: win,
    webSession,
    ui,
    tabs: { onGuestCreated: cb => { guestListeners.add(cb); return () => guestListeners.delete(cb) } }
  }
}
