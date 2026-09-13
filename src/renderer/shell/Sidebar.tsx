import type { ReactNode } from 'react'
import { useSidebarResize } from '../hooks/use-sidebar-resize.js'
import { useUiStore } from '../store/ui.js'
import { SIDEBAR_MAX, SIDEBAR_MIN } from '../../shared/ui-state.js'
import { cn } from '../lib/utils.js'

export function Sidebar({ children, header }: { children: ReactNode; header: ReactNode }) {
  const { sidebarOpen, sidebarWidth, setSidebarWidth } = useUiStore()
  const { containerRef, isResizing, onResizeStart } = useSidebarResize<HTMLDivElement>({ isOpen: sidebarOpen, width: sidebarWidth, minWidth: SIDEBAR_MIN, maxWidth: SIDEBAR_MAX, deltaSign: 1, setWidth: setSidebarWidth })
  if (!sidebarOpen) return <div className="w-0 overflow-visible">{header}</div>
  return (
    <div ref={containerRef} className="relative flex min-h-0 shrink-0 flex-col bg-left-sidebar text-left-sidebar-foreground" style={{ width: sidebarWidth }}>
      {header}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      <div onMouseDown={onResizeStart} className={cn('absolute top-0 -right-1.5 z-10 h-full w-3 cursor-col-resize', isResizing && 'bg-ring/40')} aria-hidden>
        <div className="mx-auto h-full w-px bg-left-sidebar-border" />
      </div>
    </div>
  )
}
