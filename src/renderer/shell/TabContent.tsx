import type { ComponentType } from 'react'
import type { Tab } from '../../shared/tab-model.js'
import { useTabsStore } from '../store/tabs.js'
import { WebviewHost } from './WebviewHost.js'

export type PanelProps<P = Record<string, unknown>> = { tabId: string; params: P }
export type PanelRegistry = Record<string, ComponentType<PanelProps<any>>>

/** 그룹 안의 모든 탭을 마운트한 채 활성 탭만 보여 webview 세션·스크롤을 유지한다 */
export function GroupContent({ groupId, panels }: { groupId: string; panels: PanelRegistry }) {
  const state = useTabsStore(s => s.state)
  const group = state.groups[groupId]
  if (!group) return null
  return (
    <>
      {group.tabOrder.map(id => {
        const tab = state.tabs[id]
        const active = group.activeTabId === id
        if (tab.kind === 'web') return <WebviewHost key={id} tab={tab} active={active} />
        const Panel = tab.panel ? panels[tab.panel.kind] : undefined
        return (
          <div key={id} className="flex min-h-0 flex-1 overflow-auto" style={{ display: active ? 'flex' : 'none' }}>
            {Panel ? <Panel tabId={id} params={tab.panel?.params ?? {}} /> : <p className="p-4 text-sm text-muted-foreground">등록되지 않은 패널: {tab.panel?.kind}</p>}
          </div>
        )
      })}
    </>
  )
}

export function TabContent({ tab, panels }: { tab: Tab; panels: PanelRegistry }) {
  return <GroupContent groupId={tab.groupId} panels={panels} />
}
