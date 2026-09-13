import { ipcMain, type BrowserWindow, type IpcMainEvent, type IpcMainInvokeEvent, type Session } from 'electron'
import type { KeelAppConfig } from '../shared/config.js'
import { IPC, type FetchAsAppRequest, type FetchAsAppResponse, type UiPatch } from '../shared/ipc.js'
import { isTrustedUrl } from './policy.js'
import type { UiStateStore } from './ui-state-store.js'

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
  handle<FetchAsAppResponse>(IPC.fetchAsApp, async (_e, request: FetchAsAppRequest) => {
    if (!isTrustedUrl(request.url, config.web.origins)) throw new Error('keel: fetchAsApp url must be a trusted origin')
    const res = await webSession.fetch(request.url, { method: request.init?.method ?? 'GET', headers: request.init?.headers, body: request.init?.body, redirect: 'manual' })
    const location = res.headers.get('location') ?? ''
    const loginRequired = res.status >= 300 && res.status < 400 && !isTrustedUrl(location, [new URL(request.url).origin])
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => { headers[k] = v })
    return { status: res.status, loginRequired, headers, text: loginRequired ? '' : await res.text() }
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
