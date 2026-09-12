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
