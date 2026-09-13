// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { KeelShell, useKeel } from './index.js'
import { DEFAULT_UI_STATE } from '../shared/ui-state.js'
import { useTabsStore } from './store/tabs.js'
import { useUiStore } from './store/ui.js'

describe('KeelShell + useKeel', () => {
  it('opens a web tab with a url-derived id and dedupes', async () => {
    ;(window as any).keel = { app: { id: 't', name: 'T', platform: 'darwin' }, ui: { get: async () => ({ ...(await import('../shared/ui-state.js')).DEFAULT_UI_STATE }), set: async () => {} }, window: { onMaximizedChange: () => () => {} }, guest: { onOpenRequest: () => () => {} }, fetchAsApp: async () => ({ status: 200, loginRequired: false, headers: {}, text: '' }) }
    // jsdom엔 matchMedia가 없다 — KeelShellLayout의 시스템 테마 감지용으로 테스트에서만 스텁한다
    window.matchMedia = window.matchMedia ?? ((query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false, onchange: null }) as unknown as MediaQueryList)
    function Probe() { const keel = useKeel(); useEffect(() => { keel.openWeb({ url: 'https://a.dev/x' }); keel.openWeb({ url: 'https://a.dev/x' }) }, [keel]); return null }
    let unmount: () => void = () => {}
    await act(async () => { ({ unmount } = render(<KeelShell sidebar={<Probe />} />)) })
    await waitFor(() => {
      expect(Object.keys(useTabsStore.getState().state.tabs)).toEqual(['web:https://a.dev/x'])
    })
    // 다음 테스트의 구독과 섞이지 않도록 이 인스턴스의 persistence 구독을 정리한다
    act(() => { unmount() })
  })

  it('does not persist or fire onReady when unmounted before hydration resolves', async () => {
    let resolveUiGet!: (v: typeof DEFAULT_UI_STATE) => void
    const uiGetPromise = new Promise<typeof DEFAULT_UI_STATE>(resolve => { resolveUiGet = resolve })
    const setSpy = vi.fn(async () => {})
    const onReady = vi.fn()
    ;(window as any).keel = { app: { id: 't', name: 'T', platform: 'darwin' }, ui: { get: () => uiGetPromise, set: setSpy }, window: { onMaximizedChange: () => () => {} }, guest: { onOpenRequest: () => () => {} }, fetchAsApp: async () => ({ status: 200, loginRequired: false, headers: {}, text: '' }) }
    // jsdom엔 matchMedia가 없다 — KeelShellLayout의 시스템 테마 감지용으로 테스트에서만 스텁한다
    window.matchMedia = window.matchMedia ?? ((query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false, onchange: null }) as unknown as MediaQueryList)
    let unmount: () => void = () => {}
    await act(async () => { ({ unmount } = render(<KeelShell onReady={onReady} />)) })
    // hydrateFromMain()이 아직 안 끝난 상태에서 즉시 unmount — cancelled 플래그가 이후 이어지는 setReady/onReady/startPersistence를 막아야 한다
    act(() => { unmount() })
    await act(async () => { resolveUiGet(DEFAULT_UI_STATE); await Promise.resolve(); await Promise.resolve() })
    useUiStore.getState().setSidebarWidth(300)
    await new Promise(r => setTimeout(r, 200))
    expect(setSpy).not.toHaveBeenCalled()
    expect(onReady).not.toHaveBeenCalled()
  })

  it('splitting a single-tab group keeps the tab in place and routes new tabs to the new group', async () => {
    ;(window as any).keel = { app: { id: 't', name: 'T', platform: 'darwin' }, ui: { get: async () => ({ ...(await import('../shared/ui-state.js')).DEFAULT_UI_STATE }), set: async () => {} }, window: { onMaximizedChange: () => () => {} }, guest: { onOpenRequest: () => () => {} }, fetchAsApp: async () => ({ status: 200, loginRequired: false, headers: {}, text: '' }) }
    // jsdom엔 matchMedia가 없다 — KeelShellLayout의 시스템 테마 감지용으로 테스트에서만 스텁한다
    window.matchMedia = window.matchMedia ?? ((query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false, onchange: null }) as unknown as MediaQueryList)
    let keel: ReturnType<typeof useKeel> | null = null
    function Probe() { const api = useKeel(); useEffect(() => { keel = api }, [api]); return null }
    let unmount: () => void = () => {}
    await act(async () => { ({ unmount } = render(<KeelShell sidebar={<Probe />} />)) })
    await waitFor(() => expect(keel).not.toBeNull())

    act(() => { keel!.openWeb({ url: 'https://split.dev/one' }) })
    const rootId = useTabsStore.getState().state.activeGroupId!

    act(() => { keel!.split('horizontal') })
    const afterSplit = useTabsStore.getState().state
    expect(afterSplit.groups[rootId].tabOrder).toEqual(['web:https://split.dev/one'])
    expect(afterSplit.layout?.type).toBe('split')
    const newGroupId = afterSplit.activeGroupId!
    expect(newGroupId).not.toBe(rootId)
    expect(afterSplit.groups[newGroupId].tabOrder).toEqual([])

    act(() => { keel!.openWeb({ url: 'https://split.dev/two' }) })
    expect(useTabsStore.getState().state.groups[newGroupId].tabOrder).toEqual(['web:https://split.dev/two'])

    act(() => { unmount() })
  })
})
