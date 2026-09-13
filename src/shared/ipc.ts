import type { PersistedUiState } from './ui-state.js'

export const IPC = {
  uiGet: 'keel:ui:get',
  uiSet: 'keel:ui:set',
  fetchAsApp: 'keel:fetch-as-app',
  windowMinimize: 'keel:window:minimize',
  windowMaximize: 'keel:window:maximize',
  windowClose: 'keel:window:close',
  windowMaximized: 'keel:window:maximized',   // main → renderer (boolean)
  guestOpenRequest: 'keel:guest:open-request' // main → renderer ({ url })
} as const

export type UiPatch = Partial<PersistedUiState>

export interface FetchAsAppRequest { url: string; init?: { method?: string; headers?: Record<string, string>; body?: string } }
export interface FetchAsAppResponse {
  status: number
  /** Access 302 등 로그인 원점으로 튕긴 경우 true */
  loginRequired: boolean
  headers: Record<string, string>
  text: string
}

export interface KeelBridge {
  app: { id: string; name: string; platform: NodeJS.Platform }
  ui: { get(): Promise<PersistedUiState>; set(patch: UiPatch): Promise<void> }
  fetchAsApp(request: FetchAsAppRequest): Promise<FetchAsAppResponse>
  window: {
    minimize(): void
    maximize(): void
    close(): void
    onMaximizedChange(listener: (maximized: boolean) => void): () => void
  }
  guest: { onOpenRequest(listener: (url: string) => void): () => void }
}
