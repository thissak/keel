// src/test/electron-stub.ts — vitest 전용. 메인 모듈이 top-level에서 쓰는 이름만 빈 값으로 둔다
export const app = { getPath: () => '', setPath: () => {}, setName: () => {}, whenReady: () => Promise.resolve(), on: () => {}, quit: () => {} }
export const BrowserWindow = class {}
export const screen = { getAllDisplays: () => [] }
export const nativeTheme = { shouldUseDarkColors: false }
export const session = { fromPartition: () => ({}) }
export const ipcMain = { handle: () => {}, on: () => {} }
export const shell = { openExternal: async () => {} }
export const net = { fetch: async () => new Response('') }
export const Menu = { setApplicationMenu: () => {}, buildFromTemplate: (t: unknown) => t }
