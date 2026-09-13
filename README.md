# Keel

여러 프로젝트에서 데스크톱 앱을 만들 때 기본으로 사용하는 공통 **앱베이스**입니다.
프로젝트를 개발하며 발견한 공통 개선을 Keel에 축적하고, 각 앱은 필요한 버전을 선택해 사용합니다.

## 기본 방향

- 좌측 사이드바, 중앙 탭, 우측 사이드바를 기본 인터페이스로 삼습니다.
- 특정 프로젝트의 업무 기능은 소비 앱이 소유합니다.
- 기존 웹 화면을 활용하는 앱과 새로 만드는 앱 모두를 위한 기반을 지향합니다.
- 공통 코어는 별도 저장소와 버전으로 관리하며, 소비 앱은 독립적으로 업데이트·빌드·배포합니다.
- 프로젝트별 장기 분기 대신 공통 개선을 Keel 본선에 반영합니다.

## 현재 상태

v0.1 코어가 있습니다. Orca 모양 셸(타이틀바·좌 사이드바·중앙 탭·분할·우 패널), 원격 웹 탭
(`<webview>` + 메인 프로세스 강화), 앱 React 패널, UI 상태 저장·복원(`<userData>/keel-ui.json`),
정책 계층(신뢰 원점·권한·탐색·새 창), `fetchAsApp`, 소비 앱 템플릿(`template/`), 예제 앱과 Electron
스모크(`examples/sample-app`)로 구성됩니다.

기술 스택은 Electron 44 + React 19 + TypeScript + Tailwind 4 + shadcn/ui, electron-vite·pnpm입니다.
설계 근거는 [셸 설계 문서](docs/design/2026-09-13-keel-shell-design.md), [ADR 003](docs/adr/003-consumer-app-location.md)
(소비 앱 코드 위치), [ADR 004](docs/adr/004-webview-tabs-and-orca-shell.md)(webview·Orca식 셸),
[ADR 005](docs/adr/005-root-package-git-tag-distribution.md)(저장소 루트 패키지·git 태그 배포)에 있습니다.

진행 상태는 [PROGRESS](docs/PROGRESS.md), 변경 이력은 [CHANGELOG](docs/CHANGELOG.md)를 참고합니다.

기술 기반을 고른 초기 비교 실험(Theia vs Orca)은 [실험 README](experiments/app-base-comparison/README.md)에 있습니다.

## 소비 앱에서 쓰기

### 설치

```json
"@goldenlabs/keel": "github:thissak/keel#v0.1.0"
```

<!-- 태그는 감독 승인 후 생성한다 -->

`desktop/package.json`의 `dependencies`에 한 줄만 추가하면 됩니다. 설치 시 Keel의 `prepare`가
빌드까지 마칩니다.

### 템플릿 복사

루트에서 `npm install`로 Keel을 받지 마세요 — 루트 `package.json`에 `@goldenlabs/keel`이 들어가면
npm ≥7이 `electron` peer까지 루트에 설치해 Vercel·CI가 Electron을 내려받습니다. 템플릿 디렉터리만
가져옵니다.

```sh
# 소비 앱 저장소 루트에서 — 템플릿 서브디렉터리만 desktop/으로 내려받는다
npx giget@latest gh:thissak/keel/template#v0.1.0 desktop   # 또는 원하는 Keel 태그
cd desktop && npm install                                   # Keel은 desktop/package.json의 github: 의존성으로 설치된다
```

giget 없이:

```sh
git clone --depth 1 -b v0.1.0 https://github.com/thissak/keel /tmp/keel && cp -r /tmp/keel/template desktop
cd desktop && npm install
```

바꿀 값은 [`template/README.md`](template/README.md)에 표로 정리되어 있습니다(`id`·`name`·
`web.origins`·`web.permissions`·`electron-builder.yml` 등).

### `createKeelApp` 예 (골든노트 값)

```ts
import { app } from 'electron'
import { createKeelApp } from '@goldenlabs/keel/main'
import { join } from 'node:path'

// ESM 메인에서 createKeelApp을 최상위 await로 기다리면 안 된다. Electron은 최상위 await가 끝나야
// 'ready'를 내고 createKeelApp은 ready를 기다리므로 교착된다(창이 뜨지 않는다).
createKeelApp({
  id: 'goldennote',
  name: 'GoldenNote',
  web: {
    origins: ['https://notes.goldenlabs.dev', 'https://goldenlabs.cloudflareaccess.com'],
    permissions: ['media']
  },
  renderer: process.env.ELECTRON_RENDERER_URL
    ? { url: process.env.ELECTRON_RENDERER_URL }
    : { file: join(import.meta.dirname, '../renderer/index.html') }
}).catch(err => { console.error(err); app.exit(1) })
```

### `KeelShell` 예

```tsx
import { createRoot } from 'react-dom/client'
import { KeelShell, useKeel } from '@goldenlabs/keel/renderer'
import './main.css'

function Sidebar() {
  const keel = useKeel()
  return (
    <nav className="p-2 text-sm">
      <button onClick={() => keel.openWeb({ url: 'https://notes.goldenlabs.dev/' })}>노트</button>
    </nav>
  )
}

// 웹 한 장 모드(사이드바·탭 스트립 없이 원격 웹이 창 전체를 채움)를 쓰려면
// sidebar를 생략하고 layout.tabStrip을 'never'로 둔다.
createRoot(document.getElementById('root')!).render(
  <KeelShell sidebar={<Sidebar />} onReady={(keel, restored) => { if (!restored) keel.openWeb({ url: 'https://notes.goldenlabs.dev/' }) }} />
)
```

### `useKeel()` API

| 메서드 | 설명 |
|---|---|
| `openWeb({ url, title?, id? })` | 원격 웹 탭을 연다. `id` 생략 시 `web:<url>`로 중복 탭을 막는다 |
| `openPanel({ kind, id, title, params? })` | `panels`에 등록한 앱 React 패널을 탭으로 연다 |
| `close(id)` | 탭을 닫는다 |
| `split(direction)` | 활성 탭 그룹을 `'horizontal' \| 'vertical'`로 분할한다 |
| `fetchAsApp(url, init?)` | 앱 세션 쿠키로 메인이 대신 fetch한다. 다른 원점으로 리다이렉트(302 등)되면 `{ loginRequired: true }` |
| `app` | `{ id, name }` |

### 보안 정책 요약 (설계 §6)

| 정책 | 내용 |
|---|---|
| 앱 식별 | `id` → `userData = <appData>/<id>`, 웹 세션 파티션 `persist:<id>` |
| 신뢰 원점 | `web.origins[]`. 탭 안 탐색(`will-navigate`·`will-redirect`)이 목록 밖이면 차단, http(s)면 외부 브라우저로 |
| 새 창 | 게스트 `setWindowOpenHandler` → 신뢰 원점이면 새 탭, 아니면 외부 브라우저, 항상 `deny` |
| 권한 | `web.permissions[]`에 있고 요청 원점·페이지 원점이 모두 신뢰 원점일 때만 허용 |
| webview 강화 | `will-attach-webview`: 파티션이 `persist:<id>`이고 src가 신뢰 원점이 아니면 차단. preload는 `web.guestPreload`로 지정한 파일만, sandbox·contextIsolation 강제, node 금지 |
| IPC | `keel:*` 채널은 발신자(`event.sender`)를 검사한다 |

### 단축키

| 단축키 | 동작 |
|---|---|
| `Mod+B` | 좌 사이드바 토글 |
| `Mod+L` | 우 패널 토글 |
| `Mod+W` | 활성 탭 닫기 |
| `Mod+Shift+]` / `Mod+Shift+[` | 다음/이전 탭 |

### 알려진 제한

- webview에 포커스가 있을 때는 셸 단축키(위 표)가 동작하지 않는다.
- 원격 웹 자체 내비게이션과 셸 사이드바가 겹치는 이중 크롬 현상이 있다(1단계는 허용, 앱별 `insertCSS`로 완화 가능).
- 그룹을 분할하면 그 안의 webview가 재마운트되어 페이지가 다시 로드된다.
- 복원한 탭의 URL 원점이 신뢰 목록 밖이면 빈 화면으로 뜬다(설정 변경 후 재시작 시 등).
- 여러 웹 탭이 동시에 만료되면 각 탭에 로그인 화면이 뜨고, 한 탭에서 로그인해도 나머지는 새로고침 전까지 로그인 화면이 남는다.
- Windows/Linux, 코드 서명, 자동 업데이트는 아직 검증하지 않았다(2단계 대상).

### 검증 명령

```sh
pnpm install
pnpm build
pnpm test                              # vitest, 빌드를 선행한다
pnpm example:build && pnpm example:test  # Electron 스모크. 창이 잠깐 떴다 닫힌다
```
