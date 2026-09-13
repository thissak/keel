import type { PersistedTabs } from './tab-model.js'

export interface WindowBounds { x: number; y: number; width: number; height: number }

export interface PersistedUiState {
  version: 1
  windowBounds: WindowBounds | null
  windowMaximized: boolean
  sidebarOpen: boolean
  sidebarWidth: number
  rightPanelOpen: boolean
  rightPanelWidth: number
  rightPanelTab: string | null
  theme: 'system' | 'light' | 'dark'
  tabs: PersistedTabs
}

export const SIDEBAR_MIN = 220
export const SIDEBAR_MAX = 500
export const RIGHT_PANEL_MIN = 220

export const DEFAULT_UI_STATE: PersistedUiState = {
  version: 1,
  windowBounds: null,
  windowMaximized: false,
  sidebarOpen: true,
  sidebarWidth: 280,
  rightPanelOpen: false,
  rightPanelWidth: 350,
  rightPanelTab: null,
  theme: 'system',
  tabs: {
    tabs: {},
    groups: { 'g-root': { id: 'g-root', activeTabId: null, tabOrder: [], recentTabIds: [] } },
    layout: { type: 'leaf', groupId: 'g-root' },
    activeGroupId: 'g-root'
  }
}
