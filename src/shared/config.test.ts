import { describe, expect, it } from 'vitest'
import { validateAppConfig } from './config.js'

const base = { id: 'goldennote', name: 'GoldenNote', web: { origins: ['https://notes.goldenlabs.dev'] }, renderer: { file: '/x/index.html' } }

describe('validateAppConfig', () => {
  it('accepts a minimal config and fills defaults', () => {
    const c = validateAppConfig(base)
    expect(c.web.permissions).toEqual([])
    expect(c.window).toEqual({ minWidth: 600, minHeight: 400 })
  })
  it('rejects ids outside [a-z0-9-]', () => {
    expect(() => validateAppConfig({ ...base, id: 'Golden Note' })).toThrow(/id/)
  })
  it('rejects non-https origins except http://127.0.0.1 and http://localhost', () => {
    expect(() => validateAppConfig({ ...base, web: { origins: ['http://example.com'] } })).toThrow(/origin/)
    expect(validateAppConfig({ ...base, web: { origins: ['http://127.0.0.1:4321'] } }).web.origins).toEqual(['http://127.0.0.1:4321'])
  })
  it('normalizes origins (drops path, lowercases host)', () => {
    expect(validateAppConfig({ ...base, web: { origins: ['https://Notes.goldenlabs.dev/x'] } }).web.origins).toEqual(['https://notes.goldenlabs.dev'])
  })
  it('requires renderer url or file', () => {
    expect(() => validateAppConfig({ ...base, renderer: {} })).toThrow(/renderer/)
  })
})
