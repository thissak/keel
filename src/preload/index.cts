// 단일 CJS 파일. sandbox preload는 ESM import와 다른 모듈 require를 지원하지 않는다 (Electron ESM 문서).
import { contextBridge, ipcRenderer } from 'electron'
import type { FetchAsAppRequest, FetchAsAppResponse, KeelBridge, UiPatch } from '../shared/ipc.js'
import type { PersistedUiState } from '../shared/ui-state.js'

// 채널 문자열을 shared에서 import하면 CJS 단일 파일 제약을 깨므로 여기서 복제하고 Task 6 테스트가 동일성을 검사한다
const IPC = {
  uiGet: 'keel:ui:get',
  uiSet: 'keel:ui:set',
  fetchAsApp: 'keel:fetch-as-app',
  windowMinimize: 'keel:window:minimize',
  windowMaximize: 'keel:window:maximize',
  windowClose: 'keel:window:close',
  windowMaximized: 'keel:window:maximized',
  guestOpenRequest: 'keel:guest:open-request'
} as const

function arg(name: string): string {
  const prefix = `--${name}=`
  return process.argv.find(a => a.startsWith(prefix))?.slice(prefix.length) ?? ''
}

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const handler = (_e: Electron.IpcRendererEvent, payload: T) => listener(payload)
  ipcRenderer.on(channel, handler)
  return () => { ipcRenderer.off(channel, handler) }
}

const bridge: KeelBridge = {
  app: { id: arg('keel-app-id'), name: arg('keel-app-name'), platform: process.platform },
  ui: {
    get: () => ipcRenderer.invoke(IPC.uiGet) as Promise<PersistedUiState>,
    set: (patch: UiPatch) => ipcRenderer.invoke(IPC.uiSet, patch) as Promise<void>
  },
  fetchAsApp: (request: FetchAsAppRequest) => ipcRenderer.invoke(IPC.fetchAsApp, request) as Promise<FetchAsAppResponse>,
  window: {
    minimize: () => ipcRenderer.send(IPC.windowMinimize),
    maximize: () => ipcRenderer.send(IPC.windowMaximize),
    close: () => ipcRenderer.send(IPC.windowClose),
    onMaximizedChange: listener => subscribe<boolean>(IPC.windowMaximized, listener)
  },
  guest: { onOpenRequest: listener => subscribe<{ url: string }>(IPC.guestOpenRequest, p => listener(p.url)) }
}

contextBridge.exposeInMainWorld("keel", bridge)
