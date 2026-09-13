import { useEffect } from 'react'
import { modKey } from '../shell/chrome.js'
import { useTabsStore } from '../store/tabs.js'
import { useUiStore } from '../store/ui.js'
import { activeTab } from '../../shared/tab-model.js'

export function useKeybindings(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!modKey(e)) return
      const ui = useUiStore.getState()
      const tabs = useTabsStore.getState()
      const key = e.key.toLowerCase()
      if (key === 'b' && !e.shiftKey) { e.preventDefault(); ui.setSidebarOpen(!ui.sidebarOpen) }
      else if (key === 'l' && !e.shiftKey) { e.preventDefault(); ui.setRightPanelOpen(!ui.rightPanelOpen) }
      else if (key === 'w' && !e.shiftKey) { const t = activeTab(tabs.state); if (t) { e.preventDefault(); tabs.close(t.id) } }
      else if (e.shiftKey && (e.key === ']' || e.key === '[')) {
        const s = tabs.state; const g = s.activeGroupId ? s.groups[s.activeGroupId] : null
        if (!g || !g.activeTabId) return
        const i = g.tabOrder.indexOf(g.activeTabId)
        const next = g.tabOrder[(i + (e.key === ']' ? 1 : g.tabOrder.length - 1)) % g.tabOrder.length]
        e.preventDefault(); tabs.activate(next)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
}
