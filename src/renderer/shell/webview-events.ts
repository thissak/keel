export function titleFor(url: string, title: string): string {
  if (title.trim()) return title.trim()
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').filter(Boolean).pop()
    return last ?? u.host
  } catch { return url }
}
