import { createElement, useEffect, useRef, useState } from 'react'
import type { Tab } from '../../shared/tab-model.js'
import { useTabsStore } from '../store/tabs.js'
import { isWebviewDetachNoise, titleFor } from './webview-events.js'

type WebviewEl = HTMLElement & { src: string; goBack(): void; goForward(): void; canGoBack(): boolean; canGoForward(): boolean; getURL(): string; getTitle(): string }
export type WebviewHandle = Pick<WebviewEl, 'goBack' | 'goForward' | 'canGoBack' | 'canGoForward'>

export const webviewRegistry = new Map<string, WebviewEl>()

/** webview 제거 시 Electron이 보고하는 detach 소음을 셸 콘솔·pageerror에서 걸러낸다. 반환값으로 해제한다. */
export function suppressWebviewDetachNoise(): () => void {
  const onError = (e: ErrorEvent) => { if (isWebviewDetachNoise(e.message)) e.preventDefault() }
  window.addEventListener('error', onError)
  return () => window.removeEventListener('error', onError)
}

export function WebviewHost({ tab, active }: { tab: Tab; active: boolean }) {
  const ref = useRef<WebviewEl>(null)
  const update = useTabsStore(s => s.update)
  const [initialUrl] = useState(tab.url)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    webviewRegistry.set(tab.id, el)
    const onTitle = (e: Event & { title?: string }) => update(tab.id, { title: titleFor(el.getURL(), e.title ?? '') })
    // iframe(예: 뷰어) 탐색이 탭 URL을 덮어쓰지 않도록 최상위 프레임만 저장한다
    const onNav = (e: Event & { url?: string; isMainFrame?: boolean }) => {
      if (e.isMainFrame === false) return
      update(tab.id, { url: e.url ?? el.getURL(), title: titleFor(e.url ?? el.getURL(), el.getTitle()) })
    }
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
  // allowpopups가 없으면 Electron 메인이 게스트의 disablePopups로 window.open을 창 생성 전에 막아 setWindowOpenHandler에 닿지 않는다.
  // React는 알 수 없는 요소의 boolean 속성을 DOM에 쓰지 않으므로 빈 문자열(속성 존재)로 준다. @types/react는 webview.allowpopups를
  // boolean으로만 선언하고 인터페이스 병합으로는 넓힐 수 없어, 캐스트 대신 props 타입을 추론하는 createElement로 만든다.
  return (
    <div className="flex min-h-0 flex-1" style={{ display: active ? 'flex' : 'none' }}>
      {createElement('webview', { ref, 'data-tab-id': tab.id, partition: `persist:${window.keel.app.id}`, src: initialUrl, allowpopups: '' })}
    </div>
  )
}
