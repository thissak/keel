// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { useKeybindings } from './use-keybindings.js'
import { useTabsStore } from '../store/tabs.js'
import { useUiStore } from '../store/ui.js'
import { createEmptyTabs } from '../../shared/tab-model.js'
import { DEFAULT_UI_STATE } from '../../shared/ui-state.js'

// jsdom의 기본 navigator.userAgent는 `Mozilla/5.0 (${process.platform})...` 형태로
// 'Mac' 문자열을 포함하지 않는다 → chrome.ts의 isMac은 테스트 환경(호스트 OS 무관)에서
// 항상 false이고 modKey는 ctrlKey를 확인한다. 그래서 이벤트는 ctrlKey로 결정적으로 재현한다.

function Harness() {
  useKeybindings()
  return null
}

function resetStores() {
  useTabsStore.setState({ state: createEmptyTabs() })
  useUiStore.setState({
    sidebarOpen: DEFAULT_UI_STATE.sidebarOpen,
    sidebarWidth: DEFAULT_UI_STATE.sidebarWidth,
    rightPanelOpen: DEFAULT_UI_STATE.rightPanelOpen,
    rightPanelWidth: DEFAULT_UI_STATE.rightPanelWidth,
    rightPanelTab: DEFAULT_UI_STATE.rightPanelTab,
    theme: DEFAULT_UI_STATE.theme,
    hydrated: false
  })
}

describe('useKeybindings', () => {
  beforeEach(() => {
    resetStores()
    render(<Harness />)
  })

  afterEach(() => {
    cleanup()
  })

  it('Mod+Shift+] activates the next tab via e.code, independent of shifted e.key', () => {
    useTabsStore.getState().open({ id: 'web:a', kind: 'web', title: 'a', url: 'https://a.dev/' })
    useTabsStore.getState().open({ id: 'web:b', kind: 'web', title: 'b', url: 'https://a.dev/b' })
    useTabsStore.getState().open({ id: 'web:c', kind: 'web', title: 'c', url: 'https://a.dev/c' })
    useTabsStore.getState().activate('web:a')
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '}', code: 'BracketRight', shiftKey: true, ctrlKey: true, bubbles: true }))
    })
    const s = useTabsStore.getState().state
    expect(s.groups[s.activeGroupId!].activeTabId).toBe('web:b')
  })

  it('Mod+B toggles the sidebar', () => {
    const before = useUiStore.getState().sidebarOpen
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', code: 'KeyB', ctrlKey: true, bubbles: true }))
    })
    expect(useUiStore.getState().sidebarOpen).toBe(!before)
  })

  it('Mod+W closes the active tab', () => {
    useTabsStore.getState().open({ id: 'web:a', kind: 'web', title: 'a', url: 'https://a.dev/' })
    useTabsStore.getState().activate('web:a')
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', code: 'KeyW', ctrlKey: true, bubbles: true }))
    })
    expect(useTabsStore.getState().state.tabs['web:a']).toBeUndefined()
  })
})
