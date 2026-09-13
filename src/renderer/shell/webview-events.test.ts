// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { titleFor } from './webview-events.js'
describe('titleFor', () => {
  it('prefers page title, falls back to last path segment, then host', () => {
    expect(titleFor('https://a.dev/projects/x/articles/slug', 'My Note')).toBe('My Note')
    expect(titleFor('https://a.dev/projects/x/articles/slug', '')).toBe('slug')
    expect(titleFor('https://a.dev/', '')).toBe('a.dev')
  })
})
