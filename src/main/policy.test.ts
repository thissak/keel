import { describe, expect, it } from 'vitest'
import { decideNavigation, decidePermission, hardenGuestWebPreferences, isExternalUrl, isTrustedUrl, WEB_PARTITION } from './policy.js'

const origins = ['https://notes.goldenlabs.dev', 'https://goldenlabs.cloudflareaccess.com']

describe('policy', () => {
  it('trusts exact origins only', () => {
    expect(isTrustedUrl('https://notes.goldenlabs.dev/projects/x', origins)).toBe(true)
    expect(isTrustedUrl('https://notes.goldenlabs.dev.evil.com/', origins)).toBe(false)
    expect(isTrustedUrl('https://user@notes.goldenlabs.dev/', origins)).toBe(false)
    expect(isTrustedUrl('not a url', origins)).toBe(false)
  })
  it('classifies navigation', () => {
    expect(decideNavigation('https://goldenlabs.cloudflareaccess.com/cdn-cgi/access/login/x', origins)).toBe('allow')
    expect(decideNavigation('https://example.com/', origins)).toBe('external')
    expect(decideNavigation('file:///etc/passwd', origins)).toBe('block')
    expect(decideNavigation('javascript:alert(1)', origins)).toBe('block')
  })
  it('external = http(s) without userinfo', () => {
    expect(isExternalUrl('http://a.com')).toBe(true)
    expect(isExternalUrl('https://u:p@a.com')).toBe(false)
    expect(isExternalUrl('mailto:x@y')).toBe(false)
  })
  it('permission requires listed name and trusted requester+page', () => {
    const policy = { origins, permissions: ['media'] }
    expect(decidePermission({ permission: 'media', requestingUrl: origins[0] + '/a', pageUrl: origins[0] + '/a' }, policy)).toBe(true)
    expect(decidePermission({ permission: 'geolocation', requestingUrl: origins[0], pageUrl: origins[0] }, policy)).toBe(false)
    expect(decidePermission({ permission: 'media', requestingUrl: 'https://evil.com', pageUrl: origins[0] }, policy)).toBe(false)
  })
  it('hardens guest prefs and rejects wrong partition/src/preload', () => {
    const ok = { partition: WEB_PARTITION('goldennote'), preload: '/renderer-supplied.js', nodeIntegration: true } as Record<string, unknown>
    const r = hardenGuestWebPreferences(ok, { src: 'https://notes.goldenlabs.dev/' }, { appId: 'goldennote', origins, guestPreload: '/app/guest.cjs' })
    expect(r.allowed).toBe(true)
    expect(ok).toMatchObject({ preload: '/app/guest.cjs', nodeIntegration: false, nodeIntegrationInSubFrames: false, contextIsolation: true, sandbox: true, webSecurity: true, allowRunningInsecureContent: false, enableBlinkFeatures: '', partition: 'persist:goldennote' })
    expect('preloadURL' in ok).toBe(false)
    expect(hardenGuestWebPreferences({ partition: 'persist:other' }, { src: origins[0] }, { appId: 'goldennote', origins }).allowed).toBe(false)
    expect(hardenGuestWebPreferences({ partition: 'persist:goldennote' }, { src: 'https://evil.com' }, { appId: 'goldennote', origins }).allowed).toBe(false)
    const noPreload = { partition: 'persist:goldennote', preload: '/x.js' } as Record<string, unknown>
    hardenGuestWebPreferences(noPreload, { src: origins[0] }, { appId: 'goldennote', origins })
    expect('preload' in noPreload).toBe(false)
  })
})
