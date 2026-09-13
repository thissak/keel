// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { KeelShell, useKeel } from './index.js'
import { useTabsStore } from './store/tabs.js'

describe('KeelShell + useKeel', () => {
  it('opens a web tab with a url-derived id and dedupes', async () => {
    ;(window as any).keel = { app: { id: 't', name: 'T', platform: 'darwin' }, ui: { get: async () => ({ ...(await import('../shared/ui-state.js')).DEFAULT_UI_STATE }), set: async () => {} }, window: { onMaximizedChange: () => () => {} }, guest: { onOpenRequest: () => () => {} }, fetchAsApp: async () => ({ status: 200, loginRequired: false, headers: {}, text: '' }) }
    // jsdom엔 matchMedia가 없다 — KeelShellLayout의 시스템 테마 감지용으로 테스트에서만 스텁한다
    window.matchMedia = window.matchMedia ?? ((query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false, onchange: null }) as unknown as MediaQueryList)
    function Probe() { const keel = useKeel(); useEffect(() => { keel.openWeb({ url: 'https://a.dev/x' }); keel.openWeb({ url: 'https://a.dev/x' }) }, [keel]); return null }
    await act(async () => { render(<KeelShell sidebar={<Probe />} />) })
    await waitFor(() => {
      expect(Object.keys(useTabsStore.getState().state.tabs)).toEqual(['web:https://a.dev/x'])
    })
  })
})
