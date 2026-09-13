import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSidebarResize } from '../hooks/use-sidebar-resize.js'
import { useUiStore } from '../store/ui.js'
import { RIGHT_PANEL_MIN } from '../../shared/ui-state.js'
import { cn } from '../lib/utils.js'

export interface Activity { id: string; title: string; icon: LucideIcon; panel: ReactNode }

export function RightPanel({ activities }: { activities: Activity[] }) {
  const { rightPanelOpen, rightPanelWidth, rightPanelTab, setRightPanelWidth, setRightPanelTab } = useUiStore()
  const maxWidth = Math.max(RIGHT_PANEL_MIN, window.innerWidth - 320)
  const { containerRef, onResizeStart } = useSidebarResize<HTMLDivElement>({ isOpen: rightPanelOpen, width: rightPanelWidth, minWidth: RIGHT_PANEL_MIN, maxWidth, deltaSign: -1, setWidth: setRightPanelWidth })
  const current = activities.find(a => a.id === rightPanelTab) ?? activities[0]
  return (
    <div ref={containerRef} className="relative flex min-h-0 shrink-0 flex-col overflow-hidden border-l border-sidebar-border bg-sidebar" style={{ width: rightPanelOpen ? rightPanelWidth : 0 }}>
      <div className="flex h-9 items-center gap-1 border-b border-sidebar-border px-2">
        {activities.map(a => (
          <button key={a.id} role="tab" aria-selected={current?.id === a.id} title={a.title} onClick={() => setRightPanelTab(a.id)}
            className={cn('rounded p-1.5 text-muted-foreground hover:bg-sidebar-accent', current?.id === a.id && 'bg-sidebar-accent text-foreground')}>
            <a.icon size={15} />
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{current?.panel}</div>
      <div onMouseDown={onResizeStart} className="absolute top-0 -left-1 z-10 h-full w-2 cursor-col-resize" aria-hidden />
    </div>
  )
}
