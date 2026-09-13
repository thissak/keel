import { useEffect, useRef, useState, type ReactNode } from 'react'
import { KeelProvider, createKeelApi, type KeelApi } from './keel-context.js'
import { KeelShellLayout } from './shell/KeelShell.js'
import type { Activity } from './shell/RightPanel.js'
import { GroupContent, type PanelRegistry } from './shell/TabContent.js'
import { webviewRegistry } from './shell/WebviewHost.js'
import { hydrateFromMain, startPersistence } from './store/persist.js'
import { useTabsStore } from './store/tabs.js'
import { activeTab } from '../shared/tab-model.js'

export interface KeelShellProps {
  sidebar?: ReactNode
  activities?: Activity[]
  panels?: PanelRegistry
  layout?: { tabStrip?: 'auto' | 'always' | 'never' }
  tabMenu?: ReactNode
  onReady?(keel: KeelApi, restored: boolean): void
}

export function KeelShell({ sidebar, activities, panels = {}, layout, tabMenu, onReady }: KeelShellProps) {
  const [ready, setReady] = useState(false)
  const apiRef = useRef<KeelApi | null>(null)
  useEffect(() => {
    let cancelled = false
    let stop = () => {}
    void hydrateFromMain().then(() => {
      if (cancelled) return
      stop = startPersistence()
      apiRef.current = createKeelApi()
      const restored = Object.keys(useTabsStore.getState().state.tabs).length > 0
      setReady(true)
      onReady?.(apiRef.current, restored)
    })
    const offGuest = window.keel.guest.onOpenRequest(url => apiRef.current?.openWeb({ url }))
    return () => { cancelled = true; stop(); offGuest() }
  }, [])
  const tabs = useTabsStore(s => s.state)
  const current = activeTab(tabs)
  // 렌더 중 레지스트리를 읽지만 did-navigate가 store.update()를 부르므로 그때 재렌더되어 back/forward 상태가 갱신된다
  const wv = current?.kind === 'web' ? webviewRegistry.get(current.id) : undefined
  if (!ready) return null
  const canBack = typeof wv?.canGoBack === 'function' && wv.canGoBack()
  const canForward = typeof wv?.canGoForward === 'function' && wv.canGoForward()
  return (
    <KeelProvider>
      <KeelShellLayout
        appName={window.keel.app.name}
        sidebar={sidebar}
        activities={activities}
        tabStrip={layout?.tabStrip}
        tabMenu={tabMenu}
        renderTab={tab => <GroupContent groupId={tab.groupId} panels={panels} />}
        onBack={canBack ? () => wv!.goBack() : undefined}
        onForward={canForward ? () => wv!.goForward() : undefined}
      />
    </KeelProvider>
  )
}
