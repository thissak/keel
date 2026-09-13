import { create } from 'zustand'
import { DEFAULT_UI_STATE, RIGHT_PANEL_MIN, SIDEBAR_MAX, SIDEBAR_MIN, type PersistedUiState } from '../../shared/ui-state.js'

type UiFields = Pick<PersistedUiState, 'sidebarOpen' | 'sidebarWidth' | 'rightPanelOpen' | 'rightPanelWidth' | 'rightPanelTab' | 'theme'>
export interface UiStore extends UiFields {
  hydrated: boolean
  setSidebarOpen(open: boolean): void
  setSidebarWidth(width: number): void
  setRightPanelOpen(open: boolean): void
  setRightPanelWidth(width: number): void
  setRightPanelTab(tab: string | null): void
  setTheme(theme: PersistedUiState['theme']): void
  hydrate(state: PersistedUiState): void
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export const useUiStore = create<UiStore>(set => ({
  sidebarOpen: DEFAULT_UI_STATE.sidebarOpen,
  sidebarWidth: DEFAULT_UI_STATE.sidebarWidth,
  rightPanelOpen: DEFAULT_UI_STATE.rightPanelOpen,
  rightPanelWidth: DEFAULT_UI_STATE.rightPanelWidth,
  rightPanelTab: DEFAULT_UI_STATE.rightPanelTab,
  theme: DEFAULT_UI_STATE.theme,
  hydrated: false,
  setSidebarOpen: sidebarOpen => set({ sidebarOpen }),
  setSidebarWidth: w => set({ sidebarWidth: clamp(w, SIDEBAR_MIN, SIDEBAR_MAX) }),
  setRightPanelOpen: rightPanelOpen => set({ rightPanelOpen }),
  setRightPanelWidth: w => set({ rightPanelWidth: Math.max(RIGHT_PANEL_MIN, w) }),
  setRightPanelTab: rightPanelTab => set({ rightPanelTab }),
  setTheme: theme => set({ theme }),
  hydrate: s => set({ sidebarOpen: s.sidebarOpen, sidebarWidth: s.sidebarWidth, rightPanelOpen: s.rightPanelOpen, rightPanelWidth: s.rightPanelWidth, rightPanelTab: s.rightPanelTab, theme: s.theme, hydrated: true })
}))
