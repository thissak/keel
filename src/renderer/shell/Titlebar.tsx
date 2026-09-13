import { ArrowLeft, ArrowRight, PanelLeft, PanelRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../components/ui/button.js'
import { useUiStore } from '../store/ui.js'
import { isMac, hasCustomTitleBar } from './chrome.js'

interface Props { appName: string; showSidebar: boolean; tabStrip: ReactNode; showRightToggle: boolean; onBack?(): void; onForward?(): void }

export function TitlebarLeft({ appName, showSidebar, onBack, onForward }: Pick<Props, 'appName' | 'showSidebar' | 'onBack' | 'onForward'>) {
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  return (
    <div className={sidebarOpen && showSidebar ? 'titlebar-left' : 'titlebar-left titlebar-left-floating'}>
      {isMac ? <div className="titlebar-traffic-light-pad" /> : <span className="px-3 text-xs font-medium text-muted-foreground">{appName}</span>}
      {showSidebar ? (
        <Button variant="ghost" size="icon" className="size-7" aria-label="사이드바 토글" onClick={() => setSidebarOpen(!sidebarOpen)}><PanelLeft size={15} /></Button>
      ) : null}
      <Button variant="ghost" size="icon" className="size-7" aria-label="뒤로" disabled={!onBack} onClick={onBack}><ArrowLeft size={15} /></Button>
      <Button variant="ghost" size="icon" className="size-7" aria-label="앞으로" disabled={!onForward} onClick={onForward}><ArrowRight size={15} /></Button>
    </div>
  )
}

export function TitlebarMain({ tabStrip, showRightToggle }: Pick<Props, 'tabStrip' | 'showRightToggle'>) {
  const { rightPanelOpen, setRightPanelOpen } = useUiStore()
  return (
    <div className="titlebar min-w-0 flex-1">
      <div id="keel-titlebar-tabs" className="flex min-w-0 flex-1 items-end self-end">{tabStrip}</div>
      {showRightToggle ? (
        <Button variant="ghost" size="icon" className="mx-1 size-7" aria-label="우측 패널 토글" onClick={() => setRightPanelOpen(!rightPanelOpen)}><PanelRight size={15} /></Button>
      ) : null}
      {hasCustomTitleBar ? <div className="window-controls-titlebar-spacer" /> : null}
    </div>
  )
}
