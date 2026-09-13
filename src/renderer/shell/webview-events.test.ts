// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { isWebviewDetachNoise, titleFor } from './webview-events.js'
describe('titleFor', () => {
  it('prefers page title, falls back to last path segment, then host', () => {
    expect(titleFor('https://a.dev/projects/x/articles/slug', 'My Note')).toBe('My Note')
    expect(titleFor('https://a.dev/projects/x/articles/slug', '')).toBe('slug')
    expect(titleFor('https://a.dev/', '')).toBe('a.dev')
  })
})

describe('isWebviewDetachNoise', () => {
  it('matches only electron guest-detach errors', () => {
    expect(isWebviewDetachNoise('Uncaught Error: Invalid guestInstanceId: 3')).toBe(true)
    expect(isWebviewDetachNoise('Invalid guestInstanceId: -1')).toBe(true)
    expect(isWebviewDetachNoise('Access denied to guestInstanceId: 3')).toBe(false)
    expect(isWebviewDetachNoise('TypeError: x is undefined')).toBe(false)
  })
})
