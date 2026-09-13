// Adapted from stablyai/orca (MIT) src/renderer/src/app-shell/app-window-chrome.ts @ cf7ce058
export const isMac = navigator.userAgent.includes('Mac')
export const hasCustomTitleBar = !isMac
export const WINDOW_CONTROLS_WIDTH = hasCustomTitleBar ? '138px' : '0px'
export const MAC_TRAFFIC_LIGHTS_WIDTH = isMac ? '80px' : '0px'
export const modKey = (e: KeyboardEvent) => (isMac ? e.metaKey : e.ctrlKey)
