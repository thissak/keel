import { describe, expect, it } from 'vitest'
import { activateTab, activeTab, closeTab, createEmptyTabs, openTab, repairTabs, setSplitRatio, splitGroup, updateTab } from './tab-model.js'

const web = (id: string, now = 1) => ({ id, kind: 'web' as const, title: id, url: `https://a.dev/${id}`, now })

describe('tab model', () => {
  it('opens tabs into the active group and dedupes by id', () => {
    let s = openTab(createEmptyTabs(), web('a'))
    s = openTab(s, web('b', 2))
    s = openTab(s, web('a', 3))
    const g = s.groups[s.activeGroupId!]
    expect(g.tabOrder).toEqual(['a', 'b'])
    expect(g.activeTabId).toBe('a')
    expect(s.tabs.a.lastFocusedAt).toBe(3)
  })
  it('closes the active tab and falls back to most-recently-used', () => {
    let s = openTab(createEmptyTabs(), web('a', 1))
    s = openTab(s, web('b', 2))
    s = openTab(s, web('c', 3))
    s = activateTab(s, 'a', 4)
    s = closeTab(s, 'a')
    expect(activeTab(s)?.id).toBe('c')
    expect(Object.keys(s.tabs)).toEqual(['b', 'c'])
  })
  it('splits a group, moves a tab, and collapses empty groups', () => {
    let s = openTab(createEmptyTabs(), web('a'))
    s = openTab(s, web('b', 2))
    const root = s.activeGroupId!
    s = splitGroup(s, root, 'horizontal', 'b')
    expect(s.layout).toMatchObject({ type: 'split', direction: 'horizontal', ratio: 0.5, first: { type: 'leaf', groupId: root } })
    const second = (s.layout as any).second.groupId as string
    expect(s.groups[second].tabOrder).toEqual(['b'])
    expect(s.tabs.b.groupId).toBe(second)
    s = closeTab(s, 'b')
    expect(s.layout).toEqual({ type: 'leaf', groupId: root })
    expect(s.groups[second]).toBeUndefined()
  })
  it('clamps split ratio to 0.15..0.85 by path', () => {
    let s = openTab(createEmptyTabs(), web('a'))
    s = splitGroup(s, s.activeGroupId!, 'vertical')
    s = setSplitRatio(s, [], 0.05)
    expect((s.layout as any).ratio).toBe(0.15)
  })
  it('updates title/url', () => {
    let s = openTab(createEmptyTabs(), web('a'))
    s = updateTab(s, 'a', { title: 'Hello', url: 'https://a.dev/final' })
    expect(s.tabs.a).toMatchObject({ title: 'Hello', url: 'https://a.dev/final' })
  })
  it('repairs broken persisted state', () => {
    const s = openTab(createEmptyTabs(), web('a'))
    const broken = { ...s, groups: { ...s.groups, [s.activeGroupId!]: { ...s.groups[s.activeGroupId!], tabOrder: ['a', 'ghost'], activeTabId: 'ghost' } } }
    const r = repairTabs(broken)
    expect(r.groups[r.activeGroupId!].tabOrder).toEqual(['a'])
    expect(r.groups[r.activeGroupId!].activeTabId).toBe('a')
    expect(repairTabs(null)).toEqual(createEmptyTabs())
    expect(repairTabs({ tabs: 1 })).toEqual(createEmptyTabs())
  })
})
