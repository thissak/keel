import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('preload bundle', () => {
  it('is a single CommonJS file that requires only electron', () => {
    const src = readFileSync(join(process.cwd(), 'dist/preload/index.cjs'), 'utf8')
    const requires = [...src.matchAll(/require\((['"])([^'"]+)\1\)/g)].map(m => m[2])
    expect(requires).toEqual(['electron'])
    expect(src).not.toMatch(/\bimport\s/)
    expect(src).toMatch(/exposeInMainWorld\("keel"/)
  })
})
