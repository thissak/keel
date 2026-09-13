import { describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { UiStateStore } from './ui-state-store.js'
import { DEFAULT_UI_STATE } from '../shared/ui-state.js'

// 첫 writeFile 호출만 ENOSPC로 실패시키고, 그 뒤로는 실제 구현에 위임한다 (poisoned queue 회귀 검증용)
vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
  let failNext = false
  let writeFileCalls = 0
  return {
    ...actual,
    __failNextWrite: () => { failNext = true },
    __writeFileCallCount: () => writeFileCalls,
    writeFile: (...args: Parameters<typeof actual.writeFile>) => {
      writeFileCalls++
      if (failNext) { failNext = false; return Promise.reject(Object.assign(new Error('ENOSPC'), { code: 'ENOSPC' })) }
      return (actual.writeFile as (...a: typeof args) => ReturnType<typeof actual.writeFile>)(...args)
    }
  }
})
const fsMock = (await import('node:fs/promises')) as typeof import('node:fs/promises') & {
  __failNextWrite: () => void
  __writeFileCallCount: () => number
}

async function tmpFile() { return join(await mkdtemp(join(tmpdir(), 'keel-ui-')), 'keel-ui.json') }

describe('UiStateStore', () => {
  it('returns defaults when file is missing', async () => {
    const store = new UiStateStore(await tmpFile())
    expect(await store.load()).toEqual(DEFAULT_UI_STATE)
  })
  it('merges known fields, ignores unknown, repairs tabs', async () => {
    const file = await tmpFile()
    await writeFile(file, JSON.stringify({ version: 1, sidebarWidth: 333, bogus: 1, tabs: { tabs: 1 }, rightPanelTab: 'notes', theme: 'neon' }))
    const s = await new UiStateStore(file).load()
    expect(s.sidebarWidth).toBe(333)
    expect((s as any).bogus).toBeUndefined()
    expect(s.tabs).toEqual(DEFAULT_UI_STATE.tabs)
    expect(s.rightPanelTab).toBe('notes')
    expect(s.theme).toBe('system')
  })
  it('falls back to defaults on invalid JSON', async () => {
    const file = await tmpFile()
    await writeFile(file, '{not json')
    expect(await new UiStateStore(file).load()).toEqual(DEFAULT_UI_STATE)
  })
  it('debounces writes and persists the last patch atomically', async () => {
    const file = await tmpFile()
    const store = new UiStateStore(file, { debounceMs: 10 })
    await store.load()
    store.patch({ sidebarWidth: 300 })
    store.patch({ sidebarWidth: 320, rightPanelOpen: true })
    await store.flush()
    const onDisk = JSON.parse(await readFile(file, 'utf8'))
    expect(onDisk).toMatchObject({ sidebarWidth: 320, rightPanelOpen: true, version: 1 })
    expect(store.get().sidebarWidth).toBe(320)
  })
  it('recovers the write queue after a failed write instead of poisoning later writes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const file = await tmpFile()
    const store = new UiStateStore(file, { debounceMs: 10 })
    await store.load()
    const callsBefore = fsMock.__writeFileCallCount()
    fsMock.__failNextWrite()

    store.patch({ sidebarWidth: 300 })
    await store.flush().catch(() => {})
    expect(store.get().sidebarWidth).toBe(300)
    expect(warn).toHaveBeenCalled()

    store.patch({ sidebarWidth: 310 })
    await store.flush()
    const onDisk = JSON.parse(await readFile(file, 'utf8'))
    expect(onDisk.sidebarWidth).toBe(310)
    expect(fsMock.__writeFileCallCount() - callsBefore).toBeGreaterThanOrEqual(2)

    warn.mockRestore()
  })
})
