import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { DEFAULT_UI_STATE, type PersistedUiState } from '../shared/ui-state.js'
import { repairTabs } from '../shared/tab-model.js'

// 저장 방식은 stablyai/orca (MIT) src/main/persistence @ cf7ce058의 디바운스·필드 병합을 따른다
type Validators = { [K in keyof Omit<PersistedUiState, 'version' | 'tabs'>]: (v: unknown) => v is PersistedUiState[K] }
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const validators: Validators = {
  windowBounds: (v): v is PersistedUiState['windowBounds'] =>
    v === null || (typeof v === 'object' && v !== null && ['x', 'y', 'width', 'height'].every(k => isNum((v as Record<string, unknown>)[k]))),
  windowMaximized: isBool,
  sidebarOpen: isBool,
  sidebarWidth: isNum,
  rightPanelOpen: isBool,
  rightPanelWidth: isNum,
  rightPanelTab: (v): v is string | null => v === null || typeof v === 'string',
  theme: (v): v is PersistedUiState['theme'] => v === 'system' || v === 'light' || v === 'dark'
}

function mergeKnown(raw: unknown): PersistedUiState {
  const out: PersistedUiState = structuredClone(DEFAULT_UI_STATE)
  if (typeof raw !== 'object' || raw === null) return out
  const r = raw as Record<string, unknown>
  for (const key of Object.keys(validators) as (keyof Validators)[]) {
    const value = r[key]
    if (key in r && validators[key](value)) (out as unknown as Record<string, unknown>)[key] = value
  }
  out.tabs = repairTabs(r.tabs)
  return out
}

export class UiStateStore {
  private state: PersistedUiState = structuredClone(DEFAULT_UI_STATE)
  private timer: NodeJS.Timeout | null = null
  private pending: Promise<void> = Promise.resolve()
  private dirty = false
  private readonly debounceMs: number

  constructor(private readonly filePath: string, opts: { debounceMs?: number } = {}) {
    this.debounceMs = opts.debounceMs ?? 150
  }

  async load(): Promise<PersistedUiState> {
    try {
      this.state = mergeKnown(JSON.parse(await readFile(this.filePath, 'utf8')))
    } catch {
      this.state = structuredClone(DEFAULT_UI_STATE)
    }
    return this.state
  }

  get(): PersistedUiState { return this.state }

  patch(p: Partial<PersistedUiState>): void {
    this.state = { ...this.state, ...p, version: 1 }
    this.dirty = true
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => { this.timer = null; this.schedule() }, this.debounceMs)
  }

  private schedule(): void {
    this.pending = this.pending.then(() => this.write()).catch(() => {})
  }

  async flush(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; this.schedule() }
    await this.pending
    // 마지막 쓰기가 실패했으면 여기서 한 번 더 시도하고 실패를 호출자에게 알린다
    if (this.dirty) await this.writeOnce()
  }

  private async write(): Promise<void> {
    try { await this.writeOnce() } catch (err) { console.warn('keel: ui 상태 저장 실패, 다음 변경 때 재시도', err) }
  }

  private async writeOnce(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    const tmp = `${this.filePath}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(this.state, null, 2))
    await rename(tmp, this.filePath)
    this.dirty = false
  }
}
