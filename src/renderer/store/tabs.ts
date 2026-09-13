import { create } from 'zustand'
import { activateTab, closeTab, createEmptyTabs, openTab, setSplitRatio, splitGroup, updateTab, type OpenTabInput, type PersistedTabs, type SplitDirection, type Tab } from '../../shared/tab-model.js'

export interface TabsStore {
  state: PersistedTabs
  open(input: Omit<OpenTabInput, 'now'>): void
  close(id: string): void
  activate(id: string): void
  update(id: string, patch: Partial<Pick<Tab, 'title' | 'url'>>): void
  split(groupId: string, direction: SplitDirection, tabId?: string): void
  setRatio(path: number[], ratio: number): void
  hydrate(tabs: PersistedTabs): void
}

export const useTabsStore = create<TabsStore>((set, get) => ({
  state: createEmptyTabs(),
  open: input => set({ state: openTab(get().state, { ...input, now: Date.now() }) }),
  close: id => set({ state: closeTab(get().state, id) }),
  activate: id => set({ state: activateTab(get().state, id, Date.now()) }),
  update: (id, patch) => set({ state: updateTab(get().state, id, patch) }),
  split: (groupId, direction, tabId) => set({ state: splitGroup(get().state, groupId, direction, tabId) }),
  setRatio: (path, ratio) => set({ state: setSplitRatio(get().state, path, ratio) }),
  hydrate: tabs => set({ state: tabs })
}))
