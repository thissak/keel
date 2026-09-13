// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { cn } from './utils.js'
describe('cn', () => {
  it('merges tailwind classes with later wins', () => {
    expect(cn('p-2', 'p-4', undefined, { hidden: false })).toBe('p-4')
  })
})
