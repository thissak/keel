// Adapted from stablyai/orca (MIT) src/main/window/main-window-webview-security.ts @ cf7ce058
import { shell, type BrowserWindow, type WebContents } from 'electron'
import type { KeelAppConfig } from '../shared/config.js'
import { IPC } from '../shared/ipc.js'
import { decideNavigation, hardenGuestWebPreferences, isExternalUrl } from './policy.js'

export function installWebviewSecurity(win: BrowserWindow, config: KeelAppConfig, onGuest: (contents: WebContents) => void): void {
  const ctx = { appId: config.id, origins: config.web.origins, guestPreload: config.web.guestPreload }

  win.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    const { allowed } = hardenGuestWebPreferences(webPreferences as Record<string, unknown>, params, ctx)
    if (!allowed) event.preventDefault()
  })

  win.webContents.on('did-attach-webview', (_event, guest) => {
    const guard = (event: { preventDefault(): void }, url: string) => {
      const verdict = decideNavigation(url, config.web.origins)
      if (verdict === 'allow') return
      event.preventDefault()
      if (verdict === 'external') void shell.openExternal(url)
    }
    guest.on('will-navigate', guard)
    guest.on('will-redirect', guard)
    guest.setWindowOpenHandler(({ url }) => {
      if (decideNavigation(url, config.web.origins) === 'allow') win.webContents.send(IPC.guestOpenRequest, { url })
      else if (isExternalUrl(url)) void shell.openExternal(url)
      return { action: 'deny' }
    })
    onGuest(guest)
  })
}
