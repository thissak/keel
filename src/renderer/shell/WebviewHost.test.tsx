// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, render } from '@testing-library/react'
import { WebviewHost } from './WebviewHost.js'
import { useTabsStore } from '../store/tabs.js'

describe('WebviewHost', () => {
  it('sets webview src once and keeps it across later url updates', () => {
    ;(window as any).keel = { app: { id: 't', name: 't', platform: 'darwin' } }
    useTabsStore.getState().open({ id: 'web:a', kind: 'web', title: 'a', url: 'https://a.dev/start' })
    const { container, rerender } = render(<WebviewHost tab={useTabsStore.getState().state.tabs['web:a']} active />)
    const webview = container.querySelector('webview')
    expect(webview?.getAttribute('src')).toBe('https://a.dev/start')
    act(() => { useTabsStore.getState().update('web:a', { url: 'https://a.dev/next' }) })
    rerender(<WebviewHost tab={useTabsStore.getState().state.tabs['web:a']} active />)
    expect(webview?.getAttribute('src')).toBe('https://a.dev/start')
  })
})
