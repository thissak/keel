import { useEffect, useRef } from 'react'
import type { Tab } from '../../shared/tab-model.js'
import { useTabsStore } from '../store/tabs.js'
import { titleFor } from './webview-events.js'

type WebviewEl = HTMLElement & { src: string; goBack(): void; goForward(): void; canGoBack(): boolean; canGoForward(): boolean; getURL(): string; getTitle(): string }
export type WebviewHandle = Pick<WebviewEl, 'goBack' | 'goForward' | 'canGoBack' | 'canGoForward'>

export const webviewRegistry = new Map<string, WebviewEl>()

export function WebviewHost({ tab, active }: { tab: Tab; active: boolean }) {
  const ref = useRef<WebviewEl>(null)
  const update = useTabsStore(s => s.update)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    webviewRegistry.set(tab.id, el)
    const onTitle = (e: Event & { title?: string }) => update(tab.id, { title: titleFor(el.getURL(), e.title ?? '') })
    const onNav = (e: Event & { url?: string }) => update(tab.id, { url: e.url ?? el.getURL(), title: titleFor(e.url ?? el.getURL(), el.getTitle()) })
    el.addEventListener('page-title-updated', onTitle)
    el.addEventListener('did-navigate', onNav)
    el.addEventListener('did-navigate-in-page', onNav)
    return () => {
      el.removeEventListener('page-title-updated', onTitle)
      el.removeEventListener('did-navigate', onNav)
      el.removeEventListener('did-navigate-in-page', onNav)
      webviewRegistry.delete(tab.id)
    }
  }, [tab.id, update])
  // src는 최초 한 번만 준다. 이후 URL 변화는 게스트 안의 탐색이며 스토어에는 did-navigate로 반영된다.
  return (
    <div className="flex min-h-0 flex-1" style={{ display: active ? 'flex' : 'none' }}>
      <webview ref={ref as never} data-tab-id={tab.id} partition={`persist:${window.keel.app.id}`} src={tab.url} />
    </div>
  )
}
