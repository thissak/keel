import { createContext, useContext, useMemo } from 'react'
import type { FetchAsAppRequest, FetchAsAppResponse } from '../shared/ipc.js'
import type { SplitDirection } from '../shared/tab-model.js'
import { activeTab } from '../shared/tab-model.js'
import { useTabsStore } from './store/tabs.js'

export interface KeelApi {
  openWeb(input: { url: string; title?: string; id?: string }): void
  openPanel(input: { kind: string; id: string; title: string; params?: Record<string, unknown> }): void
  close(id: string): void
  split(direction: SplitDirection): void
  fetchAsApp(url: string, init?: FetchAsAppRequest['init']): Promise<FetchAsAppResponse>
  app: { id: string; name: string }
}

const KeelContext = createContext<KeelApi | null>(null)

export function createKeelApi(): KeelApi {
  const tabs = () => useTabsStore.getState()
  return {
    app: { id: window.keel.app.id, name: window.keel.app.name },
    openWeb: ({ url, title, id }) => tabs().open({ id: id ?? `web:${url}`, kind: 'web', title: title ?? url, url }),
    openPanel: ({ kind, id, title, params }) => tabs().open({ id, kind: 'panel', title, panel: { kind, params } }),
    close: id => tabs().close(id),
    split: direction => {
      const s = tabs().state
      if (!s.activeGroupId) return
      const group = s.groups[s.activeGroupId]
      const t = activeTab(s)
      tabs().split(s.activeGroupId, direction, group.tabOrder.length > 1 ? t?.id : undefined)
    },
    fetchAsApp: (url, init) => window.keel.fetchAsApp({ url, init })
  }
}

export function KeelProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo(createKeelApi, [])
  return <KeelContext.Provider value={api}>{children}</KeelContext.Provider>
}

export function useKeel(): KeelApi {
  const api = useContext(KeelContext)
  if (!api) throw new Error('useKeel()은 <KeelShell> 안에서만 쓸 수 있습니다')
  return api
}
