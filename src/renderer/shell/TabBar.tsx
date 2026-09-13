import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/utils.js'
import { useTabsStore } from '../store/tabs.js'

export function TabBar({ groupId, menu }: { groupId: string; menu?: ReactNode }) {
  const state = useTabsStore(s => s.state)
  const { activate, close } = useTabsStore.getState()
  const group = state.groups[groupId]
  if (!group) return null
  const isActiveGroup = state.activeGroupId === groupId
  return (
    <div role="tablist" className="flex h-8 min-w-0 flex-1 items-end overflow-x-auto" data-tab-group={groupId}>
      {group.tabOrder.map(id => {
        const tab = state.tabs[id]
        const active = group.activeTabId === id
        return (
          <div key={id} role="tab" aria-selected={active && isActiveGroup} data-tab-id={id}
            onClick={() => activate(id)} onAuxClick={e => { if (e.button === 1) close(id) }}
            className={cn('group flex h-8 max-w-[220px] min-w-[96px] shrink-0 cursor-default items-center gap-2 border-r border-border px-3 text-xs select-none',
              active ? 'bg-background text-foreground' : 'text-muted-foreground hover:bg-accent/50')}>
            <span className="truncate">{tab.title}</span>
            <button aria-label={`${tab.title} 닫기`} onClick={e => { e.stopPropagation(); close(id) }}
              className="rounded p-0.5 opacity-0 hover:bg-accent group-hover:opacity-100 data-[active=true]:opacity-100" data-active={active}>
              <X size={12} />
            </button>
          </div>
        )
      })}
      {menu ? <div className="flex h-8 items-center px-1">{menu}</div> : null}
    </div>
  )
}
