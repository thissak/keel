export interface KeelWebPolicy {
  /** 탭 안에서 탐색을 허용하는 원점. Cloudflare Access 앱은 로그인 원점도 넣는다. */
  origins: string[]
  /** setPermissionRequestHandler에서 허용할 Electron permission 이름. 기본 [] */
  permissions?: string[]
  /** 원격 웹 게스트에 넣을 preload 절대 경로. 메인이 이 값만 허용한다. */
  guestPreload?: string
}

export interface KeelAppConfig {
  id: string
  name: string
  icon?: string
  web: KeelWebPolicy
  window?: { minWidth?: number; minHeight?: number }
  /** query는 셸 페이지 URL에 붙는다. 앱이 렌더러에 시작 값을 넘기는 통로 */
  renderer: { url?: string; file?: string; query?: Record<string, string> }
  /** 테스트용 userData 재지정. 기본 <appData>/<id> */
  userData?: string
}

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/

export function normalizeOrigin(value: string): string {
  const url = new URL(value)
  const local = url.hostname === '127.0.0.1' || url.hostname === 'localhost'
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw new Error(`web.origins: https 원점만 허용합니다 (로컬 http://127.0.0.1·localhost 예외): ${value}`)
  }
  if (url.username || url.password) throw new Error(`web.origins: userinfo 금지: ${value}`)
  return url.origin
}

export function validateAppConfig(input: KeelAppConfig): KeelAppConfig {
  if (!ID_PATTERN.test(input.id)) throw new Error(`id는 ${ID_PATTERN} 형식이어야 합니다: ${input.id}`)
  if (!input.name.trim()) throw new Error('name은 비울 수 없습니다')
  if (!input.renderer.url && !input.renderer.file) throw new Error('renderer.url 또는 renderer.file이 필요합니다')
  const origins = [...new Set(input.web.origins.map(normalizeOrigin))]
  if (origins.length === 0) throw new Error('web.origins는 하나 이상 필요합니다')
  return {
    ...input,
    web: { origins, permissions: input.web.permissions ?? [], guestPreload: input.web.guestPreload },
    window: { minWidth: input.window?.minWidth ?? 600, minHeight: input.window?.minHeight ?? 400 }
  }
}
