// 방식은 stablyai/orca (MIT) src/renderer/src/app-shell/use-persisted-ui-writer.ts @ cf7ce058
import { useTabsStore } from './tabs.js'
import { useUiStore } from './ui.js'
import type { UiPatch } from '../../shared/ipc.js'

const UI_KEYS = ['sidebarOpen', 'sidebarWidth', 'rightPanelOpen', 'rightPanelWidth', 'rightPanelTab', 'theme'] as const

export async function hydrateFromMain(): Promise<void> {
  const state = await window.keel.ui.get()
  useUiStore.getState().hydrate(state)
  useTabsStore.getState().hydrate(state.tabs)
}

export function startPersistence(debounceMs = 150): () => void {
  let pending: UiPatch = {}
  let timer: ReturnType<typeof setTimeout> | null = null
  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { timer = null; const patch = pending; pending = {}; void window.keel.ui.set(patch) }, debounceMs)
  }
  const unUi = useUiStore.subscribe((next, prev) => {
    for (const key of UI_KEYS) if (next[key] !== prev[key]) (pending as Record<string, unknown>)[key] = next[key]
    if (Object.keys(pending).length) schedule()
  })
  const unTabs = useTabsStore.subscribe((next, prev) => {
    if (next.state !== prev.state) { pending.tabs = next.state; schedule() }
  })
  return () => { unUi(); unTabs(); if (timer) clearTimeout(timer) }
}
