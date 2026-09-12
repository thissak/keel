// Adapted from stablyai/orca (MIT) src/main/window/main-window-webview-security.ts @ cf7ce058 (강화 목록)
export const WEB_PARTITION = (appId: string): string => `persist:${appId}`

function parse(url: string): URL | null {
  try { return new URL(url) } catch { return null }
}

export function isTrustedUrl(url: string, origins: string[]): boolean {
  const u = parse(url)
  return !!u && !u.username && !u.password && origins.includes(u.origin)
}

export function isExternalUrl(url: string): boolean {
  const u = parse(url)
  return !!u && (u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password
}

export function decideNavigation(url: string, origins: string[]): 'allow' | 'external' | 'block' {
  if (isTrustedUrl(url, origins)) return 'allow'
  return isExternalUrl(url) ? 'external' : 'block'
}

export interface PermissionQuery { permission: string; requestingUrl: string; pageUrl: string }
export function decidePermission(q: PermissionQuery, policy: { origins: string[]; permissions?: string[] }): boolean {
  return (policy.permissions ?? []).includes(q.permission)
    && isTrustedUrl(q.requestingUrl, policy.origins)
    && isTrustedUrl(q.pageUrl, policy.origins)
}

export interface GuestHardeningContext { appId: string; origins: string[]; guestPreload?: string }

/** will-attach-webview용. 허용이면 prefs를 제자리에서 강화하고 allowed=true. */
export function hardenGuestWebPreferences(
  prefs: Record<string, unknown>,
  params: { src?: unknown },
  ctx: GuestHardeningContext
): { allowed: boolean } {
  const src = typeof params.src === 'string' ? params.src : ''
  if (prefs.partition !== WEB_PARTITION(ctx.appId) || !isTrustedUrl(src, ctx.origins)) return { allowed: false }
  delete prefs.preload
  delete prefs.preloadURL
  delete prefs.additionalArguments
  if (ctx.guestPreload) prefs.preload = ctx.guestPreload
  Object.assign(prefs, {
    nodeIntegration: false,
    nodeIntegrationInSubFrames: false,
    enableBlinkFeatures: '',
    disableBlinkFeatures: '',
    webSecurity: true,
    allowRunningInsecureContent: false,
    contextIsolation: true,
    sandbox: true,
    partition: WEB_PARTITION(ctx.appId)
  })
  return { allowed: true }
}
