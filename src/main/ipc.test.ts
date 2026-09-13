import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { IPC } from '../shared/ipc.js'
import { clampBoundsToDisplays } from './window.js'

describe('ipc channel parity', () => {
  it('preload duplicates every IPC channel string verbatim', () => {
    const preload = readFileSync(new URL('../preload/index.cts', import.meta.url), 'utf8')
    for (const channel of Object.values(IPC)) expect(preload).toContain(`'${channel}'`)
  })
})

describe('clampBoundsToDisplays', () => {
  const displays = [{ x: 0, y: 0, width: 1440, height: 900 }]
  it('keeps bounds that intersect a display', () => {
    expect(clampBoundsToDisplays({ x: 100, y: 100, width: 800, height: 600 }, displays)).toEqual({ x: 100, y: 100, width: 800, height: 600 })
  })
  it('returns null when bounds are fully off-screen', () => {
    expect(clampBoundsToDisplays({ x: 5000, y: 5000, width: 800, height: 600 }, displays)).toBeNull()
  })
})
