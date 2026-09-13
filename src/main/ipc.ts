import { ipcMain, net, type BrowserWindow, type IpcMainEvent, type IpcMainInvokeEvent, type Session } from 'electron'
import type { KeelAppConfig } from '../shared/config.js'
import { IPC, type FetchAsAppRequest, type FetchAsAppResponse, type UiPatch } from '../shared/ipc.js'
import { isTrustedUrl } from './policy.js'
import type { UiStateStore } from './ui-state-store.js'

// Access 같은 인증 프록시는 미인증 요청을 다른 원점으로 302시킨다. session.fetch의 redirect:'manual'은
// opaqueredirect(status 0, 헤더 없음)라 판별이 불가능해 net.request의 redirect 이벤트로 직접 판단한다.
function fetchAsApp(webSession: Session, request: FetchAsAppRequest): Promise<FetchAsAppResponse> {
  const requestOrigin = new URL(request.url).origin
  return new Promise((resolve, reject) => {
    const req = net.request({ url: request.url, method: request.init?.method ?? 'GET', session: webSession, redirect: 'manual' })
    for (const [k, v] of Object.entries(request.init?.headers ?? {})) req.setHeader(k, v)
    let currentUrl = request.url
    req.on('redirect', (statusCode, _method, redirectUrl) => {
      const target = new URL(redirectUrl, currentUrl)
      if (target.origin === requestOrigin) { currentUrl = target.toString(); req.followRedirect(); return }
      resolve({ status: statusCode, loginRequired: true, headers: {}, text: '' })
      req.abort()
    })
    req.on('response', response => {
      const headers: Record<string, string> = {}
      for (const [k, v] of Object.entries(response.headers)) headers[k] = Array.isArray(v) ? v.join(', ') : String(v)
      const chunks: Buffer[] = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve({ status: response.statusCode, loginRequired: false, headers, text: Buffer.concat(chunks).toString('utf8') }))
      response.on('error', reject)
    })
    req.on('error', reject)
    if (request.init?.body !== undefined) req.write(request.init.body)
    req.end()
  })
}

export function registerIpc(win: BrowserWindow, config: KeelAppConfig, ui: UiStateStore, webSession: Session): () => void {
  const fromShell = (event: IpcMainEvent | IpcMainInvokeEvent) => event.sender === win.webContents
  const handle = <T>(channel: string, fn: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<T> | T) => {
    ipcMain.handle(channel, (event, ...args) => { if (!fromShell(event)) throw new Error('keel: untrusted sender'); return fn(event, ...args) })
  }
  const on = (channel: string, fn: (event: IpcMainEvent) => void) => {
    const listener = (event: IpcMainEvent) => { if (fromShell(event)) fn(event) }
    ipcMain.on(channel, listener)
    return () => ipcMain.off(channel, listener)
  }

  handle(IPC.uiGet, () => ui.get())
  handle(IPC.uiSet, (_e, patch: UiPatch) => { ui.patch(patch) })
  handle<FetchAsAppResponse>(IPC.fetchAsApp, (_e, request: FetchAsAppRequest) => {
    if (!isTrustedUrl(request.url, config.web.origins)) throw new Error('keel: fetchAsApp url must be a trusted origin')
    return fetchAsApp(webSession, request)
  })
  const offs = [
    on(IPC.windowMinimize, () => win.minimize()),
    on(IPC.windowMaximize, () => (win.isMaximized() ? win.unmaximize() : win.maximize())),
    on(IPC.windowClose, () => win.close())
  ]
  const sendMaximized = () => win.webContents.send(IPC.windowMaximized, win.isMaximized())
  win.on('maximize', sendMaximized)
  win.on('unmaximize', sendMaximized)
  return () => {
    offs.forEach(off => off())
    for (const ch of [IPC.uiGet, IPC.uiSet, IPC.fetchAsApp]) ipcMain.removeHandler(ch)
  }
}
