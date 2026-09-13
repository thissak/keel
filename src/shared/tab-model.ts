export type SplitDirection = 'horizontal' | 'vertical'
export type LayoutNode =
  | { type: 'leaf'; groupId: string }
  | { type: 'split'; direction: SplitDirection; first: LayoutNode; second: LayoutNode; ratio: number }
export type TabKind = 'web' | 'panel'
export interface Tab {
  id: string
  kind: TabKind
  groupId: string
  title: string
  /** kind='web': 현재 URL. 복원 시 이 URL을 연다 */
  url?: string
  /** kind='panel': 앱이 등록한 패널 종류와 파라미터 */
  panel?: { kind: string; params?: Record<string, unknown> }
  createdAt: number
  lastFocusedAt: number
}
export interface TabGroup { id: string; activeTabId: string | null; tabOrder: string[]; recentTabIds: string[] }
export interface PersistedTabs { tabs: Record<string, Tab>; groups: Record<string, TabGroup>; layout: LayoutNode | null; activeGroupId: string | null }

// 모양은 stablyai/orca (MIT) src/shared/tab-types.ts @ cf7ce058를 따르되 worktree·contentType 제거
export const ROOT_GROUP_ID = 'g-root'
export const MIN_RATIO = 0.15
export const MAX_RATIO = 0.85

export function createEmptyTabs(): PersistedTabs {
  return {
    tabs: {},
    groups: { [ROOT_GROUP_ID]: { id: ROOT_GROUP_ID, activeTabId: null, tabOrder: [], recentTabIds: [] } },
    layout: { type: 'leaf', groupId: ROOT_GROUP_ID },
    activeGroupId: ROOT_GROUP_ID
  }
}

export function activeTab(state: PersistedTabs): Tab | null {
  const g = state.activeGroupId ? state.groups[state.activeGroupId] : null
  return g?.activeTabId ? state.tabs[g.activeTabId] ?? null : null
}

function touchRecent(group: TabGroup, tabId: string): TabGroup {
  return { ...group, activeTabId: tabId, recentTabIds: [...group.recentTabIds.filter(id => id !== tabId), tabId] }
}

export interface OpenTabInput { id: string; kind: TabKind; title: string; url?: string; panel?: Tab['panel']; groupId?: string; now: number }

export function openTab(state: PersistedTabs, input: OpenTabInput): PersistedTabs {
  if (state.tabs[input.id]) return activateTab(state, input.id, input.now)
  const groupId = input.groupId && state.groups[input.groupId] ? input.groupId : state.activeGroupId ?? ROOT_GROUP_ID
  const group = state.groups[groupId]
  const tab: Tab = { id: input.id, kind: input.kind, groupId, title: input.title, url: input.url, panel: input.panel, createdAt: input.now, lastFocusedAt: input.now }
  return {
    ...state,
    tabs: { ...state.tabs, [tab.id]: tab },
    groups: { ...state.groups, [groupId]: touchRecent({ ...group, tabOrder: [...group.tabOrder, tab.id] }, tab.id) },
    activeGroupId: groupId
  }
}

export function activateTab(state: PersistedTabs, tabId: string, now: number): PersistedTabs {
  const tab = state.tabs[tabId]
  if (!tab) return state
  return {
    ...state,
    tabs: { ...state.tabs, [tabId]: { ...tab, lastFocusedAt: now } },
    groups: { ...state.groups, [tab.groupId]: touchRecent(state.groups[tab.groupId], tabId) },
    activeGroupId: tab.groupId
  }
}

export function updateTab(state: PersistedTabs, tabId: string, patch: Partial<Pick<Tab, 'title' | 'url'>>): PersistedTabs {
  const tab = state.tabs[tabId]
  return tab ? { ...state, tabs: { ...state.tabs, [tabId]: { ...tab, ...patch } } } : state
}

function removeLeaf(node: LayoutNode, groupId: string): LayoutNode | null {
  if (node.type === 'leaf') return node.groupId === groupId ? null : node
  const first = removeLeaf(node.first, groupId)
  const second = removeLeaf(node.second, groupId)
  if (!first) return second
  if (!second) return first
  return { ...node, first, second }
}

export function closeTab(state: PersistedTabs, tabId: string): PersistedTabs {
  const tab = state.tabs[tabId]
  if (!tab) return state
  const { [tabId]: _removed, ...tabs } = state.tabs
  const group = state.groups[tab.groupId]
  const recent = group.recentTabIds.filter(id => id !== tabId)
  const tabOrder = group.tabOrder.filter(id => id !== tabId)
  const nextActive = group.activeTabId === tabId ? recent[recent.length - 1] ?? tabOrder[tabOrder.length - 1] ?? null : group.activeTabId
  const groups = { ...state.groups, [tab.groupId]: { ...group, tabOrder, recentTabIds: recent, activeTabId: nextActive } }
  if (tabOrder.length === 0 && tab.groupId !== ROOT_GROUP_ID) {
    delete groups[tab.groupId]
    const layout = state.layout ? removeLeaf(state.layout, tab.groupId) : null
    const activeGroupId = state.activeGroupId === tab.groupId ? ROOT_GROUP_ID : state.activeGroupId
    return { tabs, groups, layout, activeGroupId }
  }
  return { ...state, tabs, groups }
}

function replaceLeaf(node: LayoutNode, groupId: string, replacement: LayoutNode): LayoutNode {
  if (node.type === 'leaf') return node.groupId === groupId ? replacement : node
  return { ...node, first: replaceLeaf(node.first, groupId, replacement), second: replaceLeaf(node.second, groupId, replacement) }
}

let groupSeq = 0
export function splitGroup(state: PersistedTabs, groupId: string, direction: SplitDirection, tabId?: string): PersistedTabs {
  if (!state.groups[groupId] || !state.layout) return state
  const newId = `g-${Date.now().toString(36)}-${(groupSeq++).toString(36)}`
  let groups: Record<string, TabGroup> = { ...state.groups, [newId]: { id: newId, activeTabId: null, tabOrder: [], recentTabIds: [] } }
  let tabs = state.tabs
  if (tabId && state.tabs[tabId]?.groupId === groupId) {
    const src = groups[groupId]
    const order = src.tabOrder.filter(id => id !== tabId)
    const recent = src.recentTabIds.filter(id => id !== tabId)
    groups[groupId] = { ...src, tabOrder: order, recentTabIds: recent, activeTabId: src.activeTabId === tabId ? recent[recent.length - 1] ?? order[order.length - 1] ?? null : src.activeTabId }
    groups[newId] = { id: newId, activeTabId: tabId, tabOrder: [tabId], recentTabIds: [tabId] }
    tabs = { ...tabs, [tabId]: { ...tabs[tabId], groupId: newId } }
  }
  const layout = replaceLeaf(state.layout, groupId, { type: 'split', direction, ratio: 0.5, first: { type: 'leaf', groupId }, second: { type: 'leaf', groupId: newId } })
  return { tabs, groups, layout, activeGroupId: newId }
}

export function setSplitRatio(state: PersistedTabs, path: number[], ratio: number): PersistedTabs {
  const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio))
  const walk = (node: LayoutNode, depth: number): LayoutNode => {
    if (node.type !== 'split') return node
    if (depth === path.length) return { ...node, ratio: clamped }
    return path[depth] === 0 ? { ...node, first: walk(node.first, depth + 1) } : { ...node, second: walk(node.second, depth + 1) }
  }
  return state.layout ? { ...state, layout: walk(state.layout, 0) } : state
}

function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null && !Array.isArray(v) }

export function repairTabs(raw: unknown): PersistedTabs {
  if (!isRecord(raw) || !isRecord(raw.tabs) || !isRecord(raw.groups)) return createEmptyTabs()
  const tabs: Record<string, Tab> = {}
  for (const [id, t] of Object.entries(raw.tabs)) {
    if (!isRecord(t) || typeof t.groupId !== 'string' || (t.kind !== 'web' && t.kind !== 'panel')) continue
    if (t.kind === 'web' && typeof t.url !== 'string') continue
    if (t.kind === 'panel' && !isRecord(t.panel)) continue
    if (!isRecord(raw.groups[t.groupId])) continue
    tabs[id] = { id, kind: t.kind, groupId: t.groupId, title: typeof t.title === 'string' ? t.title : id, url: t.url as string | undefined, panel: t.panel as Tab['panel'], createdAt: Number(t.createdAt) || 0, lastFocusedAt: Number(t.lastFocusedAt) || 0 }
  }
  const groups: Record<string, TabGroup> = {}
  for (const [id, g] of Object.entries(raw.groups)) {
    if (!isRecord(g) || !Array.isArray(g.tabOrder)) continue
    const tabOrder = g.tabOrder.filter((t): t is string => typeof t === 'string' && tabs[t]?.groupId === id)
    const recent = Array.isArray(g.recentTabIds) ? g.recentTabIds.filter((t): t is string => typeof t === 'string' && tabOrder.includes(t)) : []
    const activeTabId = typeof g.activeTabId === 'string' && tabOrder.includes(g.activeTabId) ? g.activeTabId : recent[recent.length - 1] ?? tabOrder[0] ?? null
    groups[id] = { id, activeTabId, tabOrder, recentTabIds: recent }
  }
  if (!groups[ROOT_GROUP_ID]) groups[ROOT_GROUP_ID] = { id: ROOT_GROUP_ID, activeTabId: null, tabOrder: [], recentTabIds: [] }
  const prune = (node: unknown): LayoutNode | null => {
    if (!isRecord(node)) return null
    if (node.type === 'leaf') return typeof node.groupId === 'string' && groups[node.groupId] ? { type: 'leaf', groupId: node.groupId } : null
    if (node.type !== 'split') return null
    const first = prune(node.first); const second = prune(node.second)
    if (!first) return second
    if (!second) return first
    const ratio = typeof node.ratio === 'number' ? Math.min(MAX_RATIO, Math.max(MIN_RATIO, node.ratio)) : 0.5
    return { type: 'split', direction: node.direction === 'vertical' ? 'vertical' : 'horizontal', first, second, ratio }
  }
  let layout = prune(raw.layout) ?? { type: 'leaf', groupId: ROOT_GROUP_ID }
  const inLayout = new Set<string>()
  const collect = (n: LayoutNode) => { if (n.type === 'leaf') inLayout.add(n.groupId); else { collect(n.first); collect(n.second) } }
  collect(layout)
  for (const id of Object.keys(groups)) {
    if (!inLayout.has(id)) {
      if (groups[id].tabOrder.length === 0) { delete groups[id]; continue }
      layout = { type: 'split', direction: 'horizontal', ratio: 0.5, first: layout, second: { type: 'leaf', groupId: id } }
    }
  }
  const activeGroupId = typeof raw.activeGroupId === 'string' && groups[raw.activeGroupId] ? raw.activeGroupId : ROOT_GROUP_ID
  return { tabs, groups, layout, activeGroupId }
}
