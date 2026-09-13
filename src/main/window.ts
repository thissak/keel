// Adapted from stablyai/orca (MIT) src/main/window/createMainWindow.ts @ cf7ce058 (창 옵션·bounds 검증)
import { BrowserWindow, nativeTheme, screen, type Session } from 'electron'
import type { KeelAppConfig } from '../shared/config.js'
import type { UiStateStore } from './ui-state-store.js'
import type { WindowBounds } from '../shared/ui-state.js'

export const TITLEBAR_HEIGHT = 36
const TRAFFIC_LIGHT_X = 16
const TRAFFIC_LIGHT_RADIUS = 6

export function clampBoundsToDisplays(bounds: WindowBounds, displays: { x: number; y: number; width: number; height: number }[]): WindowBounds | null {
  const visible = displays.some(d =>
    bounds.x < d.x + d.width && bounds.x + bounds.width > d.x && bounds.y < d.y + d.height && bounds.y + bounds.height > d.y)
  return visible ? bounds : null
}

export function createShellWindow(config: KeelAppConfig, ui: UiStateStore, preloadPath: string, shellSession: Session): BrowserWindow {
  const saved = ui.get().windowBounds
  const bounds = saved ? clampBoundsToDisplays(saved, screen.getAllDisplays().map(d => d.bounds)) : null
  const win = new BrowserWindow({
    width: bounds?.width ?? 1200,
    height: bounds?.height ?? 800,
    ...(bounds ? { x: bounds.x, y: bounds.y } : {}),
    minWidth: config.window?.minWidth,
    minHeight: config.window?.minHeight,
    title: config.name,
    show: false,
    acceptFirstMouse: true,
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : process.platform === 'win32' ? 'hidden' : undefined,
    ...(process.platform === 'linux' ? { frame: false } : {}),
    ...(process.platform === 'darwin' ? { trafficLightPosition: { x: TRAFFIC_LIGHT_X, y: TITLEBAR_HEIGHT / 2 - TRAFFIC_LIGHT_RADIUS } } : {}),
    ...(config.icon ? { icon: config.icon } : {}),
    webPreferences: {
      session: shellSession,
      preload: preloadPath,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      additionalArguments: [`--keel-app-id=${config.id}`, `--keel-app-name=${config.name}`]
    }
  })
  if (ui.get().windowMaximized) win.maximize()
  win.once('ready-to-show', () => win.show())
  const saveBounds = () => { if (!win.isMaximized()) ui.patch({ windowBounds: win.getNormalBounds(), windowMaximized: false }) }
  win.on('resize', saveBounds)
  win.on('move', saveBounds)
  win.on('maximize', () => ui.patch({ windowMaximized: true }))
  win.on('unmaximize', () => ui.patch({ windowMaximized: false, windowBounds: win.getNormalBounds() }))
  // 셸 자체는 로컬 파일/개발 서버만 연다. 셸 문서에서의 탐색·새 창은 전부 막는다.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', e => e.preventDefault())
  return win
}
