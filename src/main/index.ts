import { app, Menu, session, type Session, type WebContents } from 'electron'
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

  // 기본 메뉴의 File→Close(Cmd+W)가 웹 탭 포커스 상태에서 창을 닫아 버리므로 close 없는 메뉴를 직접 둔다.
  // editMenu는 macOS에서 Cmd+C/V가 동작하려면 반드시 있어야 한다.
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' as const }] : []),
    { role: 'editMenu' as const },
    { role: 'viewMenu' as const },
    { role: 'windowMenu' as const }
  ]))

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
