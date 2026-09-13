// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { useTabsStore } from './tabs.js'
import { useUiStore } from './ui.js'
import { startPersistence } from './persist.js'

describe('stores', () => {
  it('opens and activates tabs through the reducer', () => {
    useTabsStore.getState().open({ id: 'web:a', kind: 'web', title: 'a', url: 'https://a.dev/' })
    useTabsStore.getState().open({ id: 'web:b', kind: 'web', title: 'b', url: 'https://a.dev/b' })
    useTabsStore.getState().activate('web:a')
    const s = useTabsStore.getState().state
    expect(s.groups[s.activeGroupId!].activeTabId).toBe('web:a')
  })
  it('persists a debounced diff of ui and tabs', async () => {
    vi.useFakeTimers()
    const set = vi.fn(async () => {})
    ;(window as any).keel = { ui: { set, get: async () => ({}) }, app: { id: 't', name: 't', platform: 'darwin' } }
    const stop = startPersistence()
    useUiStore.getState().setSidebarWidth(300)
    useUiStore.getState().setSidebarWidth(310)
    useTabsStore.getState().close('web:b')
    await vi.advanceTimersByTimeAsync(200)
    expect(set).toHaveBeenCalledTimes(1)
    expect(set.mock.calls[0][0]).toMatchObject({ sidebarWidth: 310 })
    expect(set.mock.calls[0][0].tabs.tabs['web:b']).toBeUndefined()
    stop(); vi.useRealTimers()
  })
})
