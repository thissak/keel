import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')

describe('build output', () => {
  it('emits main, preload (cjs) and renderer entries', () => {
    expect(existsSync(join(dist, 'main/index.js'))).toBe(true)
    expect(existsSync(join(dist, 'preload/index.cjs'))).toBe(true)
    expect(existsSync(join(dist, 'renderer/index.js'))).toBe(true)
  })
})
