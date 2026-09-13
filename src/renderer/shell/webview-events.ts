export function titleFor(url: string, title: string): string {
  if (title.trim()) return title.trim()
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').filter(Boolean).pop()
    return last ?? u.host
  } catch { return url }
}

/** Electron 44: 붙어 있는 <webview>를 DOM에서 떼면 게스트가 먼저 파괴된 뒤 disconnectedCallback이 detach를 시도해
 *  'Invalid guestInstanceId: N'을 보고한다 (순수 element.remove()도 동일). 동작에는 영향 없는 소음이라 error 이벤트에서 거른다. */
export function isWebviewDetachNoise(message: string): boolean {
  return /\bInvalid guestInstanceId: -?\d+/.test(message)
}
