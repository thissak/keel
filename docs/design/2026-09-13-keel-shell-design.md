# Keel 셸 설계 — 골든노트·GateLab·Deuce를 같은 방식으로 만들 수 있는가

작성 2026-09-13. 상태: 2026-09-13 감독 승인 (ADR 004·005 기록, 구현 계획 `docs/superpowers/plans/2026-09-13-keel-core-v0.1.md`).

## 1. 질문과 결론

**질문.** 성격이 다른 세 앱(골든노트 기록 사이트, GateLab 검수 도구, Deuce 채팅 앱)을 Keel 하나로,
Orca 모양의 데스크톱 앱으로 만들 수 있는가. 가능하다면 각 앱은 어떻게 진행하는가.

**결론.** 가능하다. 세 앱 모두 "화면 = URL"이라 **원격 웹을 탭에 담는 하나의 셸**로 통합되고,
앱 성격의 차이는 사이드바·우 패널을 무엇으로 채우느냐(또는 접느냐)와 설정값(신뢰 원점·권한)의
차이로 흡수된다. 인증 차이(Cloudflare Access vs Google OAuth)는 설정과 확장 지점 두 개로 처리된다.

| 앱 | 판정 | 조건 |
|---|---|---|
| 골든노트 | 가능 — 표준 경로 | 없음. Keel 1단계 기능만 필요 |
| GateLab | 가능 — 표준 경로 + 앱 패널 | 없음. 앱 React 패널 등록(우 패널 배지)을 추가로 검증 |
| Deuce | 가능 — 조건부 | Keel에 영역 접기·탭 스트립 숨김·게스트 preload·탭 webContents 접근·배지/트레이/업데이터가 있어야 하고, Keel 패키징이 다른 앱에서 검증된 뒤 이전 |

## 2. 근거 자료

세 앱의 Claude 세션이 2026-09-13에 코드·문서·실측으로 조사한 답변을 받고, Keel 세션이 GOLEM
카탈로그 경로로 세 저장소와 운영 응답 헤더를 직접 대조했다. Orca 구조는 공개 저장소
`stablyai/orca`(MIT, v1.4.197)와 설치된 Orca 1.4.200 패키지에서 확인했다.

| 항목 | 골든노트 | GateLab | Deuce |
|---|---|---|---|
| 저장소 | GOLEM `goldennote` (npm, VitePress 1.6 + Vercel Edge API) | GOLEM `etaxbook`/gate (프런트 npm: React 18.3 + Vite 5.4 + Tailwind 3.4; 백엔드 FastAPI) | GOLEM `deuce` (pnpm, 웹 React 19 + Vite 7, 데스크톱 Electron 44.2.0 + esbuild) |
| 운영 원점 | `https://notes.goldenlabs.dev` | `https://review.goldenlabs.dev` | `https://deuce.goldenlabs.dev` (빌드 시 `define`) |
| 인증 | Cloudflare Access 이메일 OTP. 앱 코드에 인증 없음. 미인증 요청은 302 → `goldenlabs.cloudflareaccess.com/cdn-cgi/access/login/…` (실측) | 동일. 세션 2160h. 신원은 `CF_Authorization` 쿠키/JWT | Google OAuth: 시스템 브라우저 + `127.0.0.1` loopback + PKCE → 서버의 데스크톱 세션 발급 API → 서버 세션 쿠키를 `persist:deuce`에 심음 |
| 로그인 페이지 프레임 | Access 로그인 페이지 `X-Frame-Options: DENY`, `frame-ancestors 'none'` (실측) → iframe 불가, 최상위 webContents 필요 | 동일 | 해당 없음 |
| 화면 단위(URL) | 노트 1편 = 경로 1개 (`/projects/<p>/articles/<slug>` 등, cleanUrls) | 책·run 화면 = 경로 (`/books/:bookId/review`, `/runs/:runId`, `/discussions/...`, "URL이 상태의 전부") | `/chat` 한 장 |
| 목록 데이터 | `/llms.txt` (전 페이지 제목·경로·요약, Access 뒤) | 책 목록 API, 대화 채널 API(안 읽음·멘션 수) | 웹이 자체 목록을 그림 |
| 권한 API | `media` — 노트 묻기 음성 | `clipboard-sanitized-write` (링크 복사) | `notifications`, `clipboard-sanitized-write` |
| 웹→데스크톱 | 없음 | 없음 | preload 브리지(`focus`, 안 읽음 수 배지) — 웹이 존재 여부로 데스크톱을 감지 |
| 셸 기능 | 없음 | 없음 | CSP 주입, 트레이, 닫기→숨김, 단일 인스턴스, electron-updater generic 피드, 오프라인 안내 |
| 데스크톱 코드 위치 규칙 | `desktop/` 독립 npm 패키지(루트 workspace 금지 — Vercel·워커가 Electron을 받게 됨). ADR 017 필요. 폴링·상시 수집 서버 금지 | `desktop/` 독립 패키지. ADR 필요. Master 규칙: 코드 복사·submodule 금지. 프런트 셸 설계가 "데스크톱이 창·탭을 가지면 그때 탭을 얹는다"고 이미 미뤄 둠 | 기존 데스크톱 패키지 교체. 빌드 설정 기록·publish URL 검증·공증 스크립트 계약 유지 |

## 3. Keel 모델 — 담당 구분

Keel이 **디자인·기술 스택·레이아웃·기본 기능**을 제공하고, 앱은 **안에 들어가는 내용**만 만든다.

| 구분 | Keel | 앱 |
|---|---|---|
| 디자인 | Orca와 같은 Tailwind 4 + shadcn/ui(new-york-v4, neutral) 토큰, 라이트/다크, Geist 폰트, lucide 아이콘 | 앱 이름·아이콘·강조색 설정값 |
| 기술 스택 | Electron + React 19 + TypeScript + electron-vite + pnpm 기준. 소비 앱용 `desktop/` 템플릿(electron-vite·electron-builder 설정 포함) | 템플릿을 그대로 씀 (npm 저장소도 가능) |
| 레이아웃 | 타이틀바 36px · 좌 사이드바 · 중앙 탭(분할) · 우 패널(활동 탭) · 상태 표시줄. 접기·크기·복원 | 각 영역에 넣을 React 패널, 열 탭 |
| 기본 기능 | 창·메뉴·단축키, 앱별 데이터 분리, 원격 웹 탭과 보안 정책, 로그인 유지, UI 상태 저장, (2단계) 배지·트레이·알림·단일 인스턴스·업데이터·오프라인 안내 | 신뢰 원점·권한 목록, 앱 고유 로그인 단계, 앱 IPC |
| 내용 | – | 노트 목록·검수 화면·채팅 웹·업무 로직 |

## 4. 셸 구조 — Orca에서 가져오는 것

| 요소 | Orca 구현 (파일) | Keel |
|---|---|---|
| 창 | `titleBarStyle: 'hiddenInset'`(mac)/`'hidden'`(win), Linux `frame:false`, 신호등 `{x:16,y:12}`, 배경 `#fff`/`#0a0a0a`, 최소 600×400 (`src/main/window/createMainWindow.ts`) | 동일 |
| 타이틀바 | 36px. 워크스페이스 화면에서는 사이드바 폭의 `.titlebar-left`(앱 이름·사이드바 토글·뒤로/앞으로)와 중앙 `#titlebar-tabs` 슬롯으로 나뉘어 **탭 스트립이 타이틀바 안에** 들어감. Win/Linux는 `WindowControls`를 렌더러가 그림 (`app-shell/AppWorkspaceShell.tsx`, `TitlebarLeftControls.tsx`, `TitlebarMainStrip.tsx`) | 동일 |
| 좌 사이드바 | 기본 280px(220~500), `useSidebarResize`로 직접 리사이즈, 접으면 렌더하지 않음. 상단 필터, 가상화 목록, 하단 툴바(설정·도움말) (`components/sidebar/`) | 틀은 Keel, 목록 내용은 앱 패널 |
| 우 패널 | VS Code식 활동 패널. 아이콘 탭 여러 개, 기본 350px(최소 220), 접으면 폭 0으로 마운트 유지, `Mod+L` (`components/right-sidebar/`) | 활동 탭 = 앱이 등록한 패널 |
| 중앙 탭·분할 | 커스텀 탭 바(@dnd-kit 정렬, `+` 메뉴) + 재귀 flex 분할 트리(수평/수직, 비율 0.15~0.85, 커스텀 ResizeHandle). 탭 모델 `src/shared/tab-types.ts` (`Tab`, `TabGroup`, `TabGroupLayoutNode`) (`components/tab-bar/`, `components/tab-group/`) | 동일 구조. 탭 종류 = 원격 웹 / 앱 패널 |
| 상태 저장 | localStorage 아님. 메인 프로세스 JSON `<userData>/orca-data.json`에 사이드바 폭·우 패널·창 크기·탭·분할 트리를 150ms 디바운스 필드 단위로 저장, 시작 시 복원·복구 (`src/shared/persisted-ui-state-types.ts`, `app-shell/use-persisted-ui-writer.ts`, `store/slices/tabs-hydration.ts`) | `<userData>/keel-ui.json`, 같은 방식 |
| 디자인 시스템 | Tailwind 4 CSS-first(설정 파일 없음), `main.css`의 `@theme inline` 토큰, `.dark` 클래스, `--radius 0.625rem`, 다크 배경 `#0a0a0a`·카드 `#171717`·경계 `rgb(255 255 255/.07)`, `--worktree-sidebar`(좌 패널 톤), Geist 가변 폰트 자체 호스팅, `ui/` shadcn 컴포넌트 29종 | 토큰·`main.css` 구조·`ui/` 컴포넌트·타이틀바 CSS를 MIT 고지와 함께 이식 |
| 단축키 | 단일 window 리스너 (`app-shell/use-global-keybindings.ts`): 좌 `Mod+B`, 우 `Mod+L`, 팔레트 `Mod+J`, 설정 `Mod+,`, 탭 닫기 | 같은 기본값. 앱이 추가 등록 |
| 원격 웹 | `<webview>` 태그 44곳. 메인의 `will-attach-webview`가 파티션·src를 허용 목록으로 검사하고 실패 시 차단, preload를 메인이 지정한 것으로 교체, sandbox·contextIsolation 강제, node 금지 (`src/main/window/main-window-webview-security.ts`). `WebContentsView`는 팝업 주소창 창 하나에만 사용 | 동일 방식 (§5-①) |

## 5. 기술 선택과 근거

**① 원격 웹 탭 = `<webview>` 태그.** DOM 요소라 분할·드래그·메뉴·다이얼로그가 그 위에 자연스럽게
뜨고 위치 동기화가 없다. Orca가 같은 방식을 운영 중이며 강화 절차가 공개돼 있다. `WebContentsView`는
Electron 공식 권장 API지만 DOM 밖에 있어 탭 위치를 매번 동기화해야 하고 메뉴·다이얼로그가 웹 뒤에
가려져 열릴 때마다 뷰를 숨겨야 한다. Electron 문서의 "webview는 구조 변경 가능성이 있어 권장하지
않음" 주의는 그대로 기록하고, 문제가 생기면 탭 호스트 한 곳만 `WebContentsView`로 바꾼다.

**② 탭·분할 = Orca식 커스텀.** 타이틀바 안의 탭 바와 분할 트리는 Dockview로는 모양을 내기 어렵다.
Orca의 탭 바·분할·리사이즈 코드를 MIT 고지와 함께 가져와 Keel 스토어에 맞게 손질한다. 실험에서
검증한 Dockview는 채택하지 않는다(ADR 002의 "Orca 기본 설정에서 달라지는 항목은 이유를 기록" 대상).

**③ 상태 저장 = 메인 프로세스 JSON.** 렌더러 origin·캐시 삭제와 무관하고 창 크기·탭·분할을 한
파일에서 복원한다. Orca와 같은 150ms 디바운스 필드 단위 저장을 따른다.

**④ 디자인 = Tailwind 4 + shadcn/ui 유지(감독 결정 2026-09-13).** Keel이 토큰·베이스 CSS·컴포넌트를
소스로 제공하고, 소비 앱 `desktop/` 템플릿에 Tailwind 4 파이프라인(`@tailwindcss/vite`, `@source`로
Keel 경로 포함)을 넣어 앱 패널도 같은 토큰·유틸리티를 쓴다.

**⑤ Electron.** Keel peer `>=44`, 개발·예제는 최신 안정(44.3.0). 42.8.1은 Theia peer 제약이었고 더
이상 이유가 없다. Deuce 44.2.0과 같은 라인.

## 6. 정책 계층 (세 앱 공통)

| 정책 | 내용 |
|---|---|
| 앱 식별 | `id`(소문자·숫자·하이픈) → `userData = <appData>/<id>`, 웹 세션 파티션 `persist:<id>` |
| 셸 창 | `sandbox: true, contextIsolation: true, nodeIntegration: false, webviewTag: true`, Keel preload(단일 CJS) |
| 신뢰 원점 | `web.origins[]`. 탭 탐색(`will-navigate`·`will-redirect`)이 목록 밖이면 차단하고 http(s)면 외부 브라우저로 |
| 새 창 | 게스트 `setWindowOpenHandler` → 신뢰 원점이면 새 탭, 아니면 외부 브라우저, 항상 `deny` |
| 권한 | 파티션 세션에 `setPermissionRequestHandler`·`setPermissionCheckHandler`. `web.permissions[]`에 있고 요청 원점이 신뢰 원점일 때만 허용 |
| webview 강화 | `will-attach-webview`: 파티션이 `persist:<id>`이고 src가 신뢰 원점이 아니면 차단. preload는 메인이 `web.guestPreload`로 지정한 파일만, sandbox·contextIsolation 강제, node·Blink 기능 금지 |
| IPC | 모든 `keel:*` 채널은 `event.sender === 셸 webContents`(또는 등록된 게스트)와 프레임 URL을 검사 |
| 쿠키 | 파티션에 자동 유지. Access 앱은 `cloudflareaccess.com`을 신뢰 원점에 넣으면 302→OTP→콜백이 탭 안에서 끝남 |

## 7. 앱 계약

메인 (`@goldenlabs/keel/main`):

```
createKeelApp({
  id, name, icon,
  web: { origins: string[], permissions?: string[], guestPreload?: string },
  window?: { minWidth?, minHeight? },
  renderer: { url? | file?, query? }  // 템플릿이 번들한 셸 renderer 진입점. query는 렌더러 시작 값 전달 통로
}) → { window, webSession, tabs: { onGuestCreated(cb) }, badge? (2단계) }
```

렌더러 (`@goldenlabs/keel/renderer`):

```
<KeelShell
  sidebar={<앱 패널/>}                       // 좌. 생략 시 사이드바 없음
  activities={[{ id, icon, title, panel }]}   // 우 패널 활동 탭. 생략 시 우 패널 없음
  panels={{ kind: Component }}                // 중앙 탭용 앱 React 패널
  layout={{ tabStrip: 'auto' | 'always' | 'never' }}
  onReady={(keel, restored) => …} />
useKeel() → { openWeb({url, title?, id?}), openPanel({kind, id, title, params}), close(id),
              split(id, direction), fetchAsApp(url) }   // fetchAsApp: 앱 세션 쿠키로 메인이 대신 fetch
```

`fetchAsApp`는 네이티브 목록(골든노트 `/llms.txt`, GateLab 책 목록 API)을 로그인 쿠키로 받기 위한
공통 기능이다. 302가 오면 "로그인 필요"를 반환하고 앱은 웹 탭을 열어 로그인시킨다.

## 8. 확장 지점 (앱이 붙이는 것)

| 지점 | 용도 | 사용 앱 |
|---|---|---|
| `sidebar` / `activities` / `panels` | 네이티브 화면 | 골든노트(노트 목록·요약), GateLab(책 목록·대화 배지) |
| `tabs.onGuestCreated(webContents)` | 탭 탐색 가로채기 등 앱 고유 리스너 (웹 로그인 경로 → 데스크톱 로그인) | Deuce |
| `webSession` | 쿠키 심기(`cookies.set`), CSP 주입(`webRequest.onHeadersReceived`) | Deuce |
| `web.guestPreload` | 원격 웹에 노출할 브리지(Deuce의 focus·배지). 메인이 경로를 고정 | Deuce (2단계에 Keel 공통 `focus`·`setBadge`로 대체 가능) |
| 앱 IPC | 앱 채널은 앱이 `ipcMain`에 직접 등록하고 발신자 검증 | Deuce 배지 |
| `layout.tabStrip: 'never'` + 사이드바 생략 | 웹 한 장 전체 창 | Deuce |

## 9. 앱별 적용 설계

### 골든노트
- 위치: `GoldenNote/desktop/` 독립 npm 패키지(루트 workspace에 넣지 않음). ADR 017.
- 설정: `id: goldennote`, origins `notes.goldenlabs.dev` + `goldenlabs.cloudflareaccess.com`, permissions `media`.
- 좌 사이드바: `fetchAsApp('/llms.txt')`를 파싱한 노트 목록 + 검색. 클릭 → `openWeb(경로)`. 탭 id는
  최종 URL(301 슬러그 리다이렉트 대비).
- 우 패널: llms.txt 요약(선택). 없어도 완료 기준에 영향 없음.
- 로그인: 첫 탭이 302→OTP 화면을 보여줌. 쿠키가 `persist:goldennote`에 남아 재시작 후 유지. 만료 시
  탭에 OTP 화면이 다시 뜸(요구 "다시 로그인" 충족). llms.txt가 302면 로그인 탭을 연다.
- 이중 크롬: 노트 페이지 안의 VitePress 내비가 셸 사이드바와 겹침. 1단계는 그대로 두고, 필요하면
  게스트 `insertCSS`로 숨기는 옵션을 앱이 켠다.
- 골든노트 규칙 준수: 폴링·수집 서버 없음(목록은 사용자 동작으로만 갱신).

### GateLab
- 위치: `EtaxbookGateLab/desktop/` 독립 패키지. ADR 신규. Master 규칙(복사·submodule 금지) 위반 없음.
- 설정: `id: gatelab`, origins `review.goldenlabs.dev` + `goldenlabs.cloudflareaccess.com`,
  permissions `clipboard-sanitized-write`.
- 좌 사이드바: `fetchAsApp`로 받은 책 목록 → `openWeb(책 검수 화면 URL)`. 분할로 두 책 비교
  (프런트 셸 설계가 미뤄둔 항목을 Keel이 채움).
- 우 패널: 대화 배지 패널 — 대화 채널 API의 안 읽음·멘션 수를 포커스
  시 재조회. 앱 React 패널 등록의 검증 대상.
- 로그인: 골든노트와 동일. 개발 서버(`localhost:5174`)는 Access 없이 자체 로그인 폼.
- 미확인: 인증 후 Cloudflare 응답 헤더. 자체 iframe(뷰어)을 쓰므로 프레임 차단은 없을 것으로 봄.

### Deuce
- 위치: 기존 데스크톱 패키지를 Keel 셸로 교체. esbuild → electron-vite 전환은 가능하나(Deuce 세션 판단
  낮음~중간) 빌드 설정 기록 파일·출력 파일 경로·`electron-updater` external 계약을 템플릿에서
  보존해야 한다.
- 설정: `id: deuce`, origins `deuce.goldenlabs.dev`, permissions `notifications`·`clipboard-sanitized-write`,
  `guestPreload`로 기존 preload 브리지 유지, 사이드바 생략, `tabStrip: 'never'`.
- 로그인: `tabs.onGuestCreated`에서 `will-navigate`/`will-redirect`로 웹 로그인 경로를 가로채 기존
  데스크톱 로그인 실행 → `webSession.cookies.set` → 탭에 앱 화면 로드. Keel 변경 없음.
- CSP: `webSession.webRequest.onHeadersReceived`를 앱이 그대로 등록.
- 배지·트레이·닫기→숨김·단일 인스턴스·업데이터·오프라인 안내: Keel 2단계가 제공할 때까지 앱 코드
  유지. 2단계 이후 Keel 공통으로 교체.
- 전제: Keel 패키징(서명·공증·업데이트 피드)이 골든노트/GateLab 설치 파일로 검증된 뒤 이전한다.
  Deuce는 운영 릴리스라 미검증 영역이 바로 사용자에게 닿는다.

## 10. 패키지 구조·배포 제안

| 항목 | 제안 | 이유 |
|---|---|---|
| 패키지 이름 | `@goldenlabs/keel` (잠정, `private: true`) | 라이선스·게시 결정 전 우발적 게시 방지 |
| 저장소 배치 | **저장소 루트가 패키지**. `src/{main,preload,renderer,shared}`, `styles/`, `template/`(소비 앱 `desktop/` 템플릿), `examples/`, `experiments/`, `docs/` | git 의존성은 하위 디렉터리를 지원하지 않으므로 루트여야 `github:thissak/keel#v0.1.0`로 소비 가능 |
| 배포 | git 태그(`v0.1.0`) 의존성. npm이 설치 시 `prepare`로 빌드 | 인프라 없이 "소비 앱이 버전을 선택"하는 ADR 001 원칙 충족. npm 게시는 라이선스 확정 후 선택 |
| 진입점 | `./main`(ESM), `./renderer`(ESM+JSX), `./preload`(단일 CJS, 메인이 경로 자동 지정), `./main.css`(Tailwind 4 소스 CSS) | sandbox preload는 ESM import 불가(Electron 문서) |
| 소비 앱 관리자 | 골든노트·GateLab npm(독립 `desktop/`), Deuce pnpm | Keel은 npm 호환 형식만 요구 |

## 11. 기본 기능 목록과 단계

| 단계 | 기능 | 검증 앱 |
|---|---|---|
| 1 코어 | Orca 셸(타이틀바·사이드바·탭·분할·우 패널·상태 표시줄), 원격 웹 탭(webview 강화), 앱 패널, UI 상태 저장·복원, 정책 계층, `fetchAsApp`, 단축키, 라이트/다크, `desktop/` 템플릿 | 골든노트 → GateLab |
| 2 라이프사이클 | 배지(dock·Windows 오버레이), 트레이·닫기→숨김, 단일 인스턴스, electron-updater 연결, 오프라인 안내, 공통 게스트 브리지(`focus`·`setBadge`), 패키징·서명·공증 절차 | 골든노트/GateLab 설치 파일 → Deuce 이전 |
| 앱 소유 | IdP별 로그인 단계(Google loopback), CSP 정책 내용, 업무 화면·데이터 | 각 앱 |

## 12. 검증 기준

Keel 자체 (`examples/sample-app` + Playwright Electron 스모크):
- [ ] 로컬 HTTP 페이지를 웹 탭으로 열고, 신뢰 원점 밖 링크는 외부 브라우저로 넘어가며 탭 안에서 열리지 않는다.
- [ ] 앱 패널 탭과 웹 탭을 각각 열고 분할한 뒤 재시작하면 탭·분할·사이드바 폭이 복원된다.
- [ ] `will-attach-webview`가 허용 목록 밖 파티션·src·preload를 차단한다(테스트로 강제).
- [ ] 권한 목록 밖 permission 요청이 거부된다.
- [ ] 사이드바 생략 + `tabStrip: 'never'` 구성이 웹 한 장 전체 창으로 렌더된다.

골든노트 (PROGRESS 완료 기준 그대로): 이름·식별자로 실행 → 실제 로그인 후 노트 읽기 → 두 노트 별도 탭
→ 재시작 복원 → 만료 시 재로그인 → 공통 패키지 소스 수정 없이 앱 설정·화면 등록 변경.

GateLab: 위와 동일 + 두 책 분할 비교 + 우 패널 배지 패널 + Keel 버전 갱신을 두 앱에 적용.

Deuce: 2단계 후 기존 셸 동작(로그인·배지·트레이·업데이트·단일 인스턴스) 동등성.

## 13. 미확인·위험

- `<webview>`에 대한 Electron의 비권장 주의. 완화: 탭 호스트 한 곳에 격리해 교체 가능하게 둔다.
- Access `session_duration`(골든노트) 미확인. 만료 처리 흐름 자체는 값과 무관.
- 인증 후 Cloudflare 엣지 응답 헤더(골든노트·GateLab) 미확인.
- 이중 크롬(웹 자체 내비 + 셸 사이드바)은 세 앱 공통 현상. 1단계는 허용, 앱별 `insertCSS` 옵션으로 완화.
- 여러 탭이 동시에 만료되면 각 탭에 OTP 화면이 뜨고 한 탭에서 로그인해도 다른 탭은 새로고침 전까지
  로그인 화면이 남는다. 2단계에서 `cookies.changed`로 일괄 새로고침 검토.
- Keel 패키징(서명·공증·업데이트·Windows) 미검증 — Deuce 이전의 선행 조건.
- 라이선스·패키지 이름·npm 게시 여부는 별도 결정.

## 14. 후속 결정 기록 대상 (승인 후 ADR)

- ADR 004: 원격 웹 탭을 `<webview>`로 담고 Orca식 커스텀 탭·분할을 쓴다 (Dockview 미채택 이유 포함).
- ADR 005: 저장소 루트를 패키지로 두고 git 태그로 배포한다.
- 골든노트 ADR 017, GateLab ADR 신규: `desktop/` 소비 경로 추가 (각 저장소 세션이 작성).

## 15. 출처

- Orca: `stablyai/orca` `src/renderer/src/app-shell/AppWorkspaceShell.tsx`, `components/tab-bar/`, `components/tab-group/`, `components/sidebar/`, `components/right-sidebar/`, `hooks/useSidebarResize.ts`, `src/shared/tab-types.ts`, `src/shared/persisted-ui-state-types.ts`, `src/renderer/src/assets/main.css`, `src/main/window/createMainWindow.ts`, `src/main/window/main-window-webview-security.ts`, `components.json`, `package.json` (MIT, Copyright (c) 2026 Lovecast Inc.)
- Electron: [Web Embeds](https://www.electronjs.org/docs/latest/tutorial/web-embeds), [Security](https://www.electronjs.org/docs/latest/tutorial/security), [ESM](https://www.electronjs.org/docs/latest/tutorial/esm), [Process Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox)
- 세 앱 조사: 2026-09-13 골든노트·Deuce·GateLab Claude 세션 회신 및 Keel 세션 직접 대조(§2)
