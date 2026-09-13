// 골격은 stablyai/orca (MIT) src/renderer/src/app-shell/AppWorkspaceShell.tsx @ cf7ce058
import { useEffect, type ReactNode } from 'react'
import type { Tab } from '../../shared/tab-model.js'
import { useKeybindings } from '../hooks/use-keybindings.js'
import { useTabsStore } from '../store/tabs.js'
import { useUiStore } from '../store/ui.js'
import { hasCustomTitleBar, WINDOW_CONTROLS_WIDTH } from './chrome.js'
import { RightPanel, type Activity } from './RightPanel.js'
import { Sidebar } from './Sidebar.js'
import { SplitLayout } from './SplitLayout.js'
import { TabBar } from './TabBar.js'
import { TitlebarLeft, TitlebarMain } from './Titlebar.js'
import { WindowControls } from './WindowControls.js'

export interface KeelShellLayoutProps {
  appName: string
  sidebar?: ReactNode
  activities?: Activity[]
  tabStrip?: 'auto' | 'always' | 'never'
  tabMenu?: ReactNode
  renderTab(tab: Tab): ReactNode
  onBack?(): void
  onForward?(): void
}

export function KeelShellLayout({ appName, sidebar, activities = [], tabStrip = 'auto', tabMenu, renderTab, onBack, onForward }: KeelShellLayoutProps) {
  useKeybindings()
  const theme = useUiStore(s => s.theme)
  const tabs = useTabsStore(s => s.state)
  const { setRatio, activate } = useTabsStore.getState()
  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }, [theme])
  const tabCount = Object.keys(tabs.tabs).length
  const showStrip = tabStrip === 'always' || (tabStrip === 'auto' && (tabCount > 1 || !!sidebar))
  const renderGroup = (groupId: string) => {
    const group = tabs.groups[groupId]
    const active = group?.activeTabId ? tabs.tabs[group.activeTabId] : null
    return (
      <div className="flex min-w-0 min-h-0 flex-1 flex-col" onMouseDownCapture={() => { if (tabs.activeGroupId !== groupId && group?.activeTabId) activate(group.activeTabId) }}>
        {showStrip && tabs.layout?.type === 'split' ? <div className="flex h-8 border-b border-border bg-card"><TabBar groupId={groupId} menu={tabMenu} /></div> : null}
        <div className="flex min-h-0 flex-1">{active ? renderTab(active) : null}</div>
      </div>
    )
  }
  const rootStrip = showStrip && tabs.layout?.type === 'leaf' && tabs.activeGroupId ? <TabBar groupId={tabs.activeGroupId} menu={tabMenu} /> : null
  return (
    <div className="flex h-dvh w-dvw flex-col overflow-hidden" style={{ ['--window-controls-width' as string]: WINDOW_CONTROLS_WIDTH }}>
      <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex flex-row">
            <TitlebarLeft appName={appName} showSidebar={!!sidebar} onBack={onBack} onForward={onForward} />
            <TitlebarMain tabStrip={rootStrip} showRightToggle={activities.length > 0} />
          </div>
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
            {sidebar ? <Sidebar header={null}>{sidebar}</Sidebar> : null}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {tabs.layout ? <SplitLayout node={tabs.layout} path={[]} renderGroup={renderGroup} onRatio={setRatio} /> : null}
            </div>
          </div>
        </div>
        {activities.length > 0 ? <RightPanel activities={activities} /> : null}
      </div>
      {hasCustomTitleBar ? <WindowControls /> : null}
    </div>
  )
}
