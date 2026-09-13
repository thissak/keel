# Keel 코어 v0.1

## 완료된 작업

- 코어 패키지(`@goldenlabs/keel`): 앱 설정 검증(`src/shared/config.ts`), 정책 계층(신뢰 원점·권한·탐색·새 창 판정, `src/main/policy.ts`), 창·webview 강화(`src/main/webview-security.ts`), `keel:*` IPC(발신자 검사), `fetchAsApp`(`net.request` 기반, 앱 세션 쿠키로 메인이 대신 fetch), UI 상태 JSON 저장·복원(`<userData>/keel-ui.json`).
- 렌더러 셸: Orca 토큰(Tailwind 4 + shadcn/ui new-york-v4, MIT 고지 보존)과 타이틀바·좌 사이드바·중앙 탭(분할 트리)·우 패널·상태 표시줄 컴포넌트, 탭·분할 Zustand 스토어, webview 호스트, `KeelShell`·`useKeel()` 공개 API(`src/renderer/index.ts`).
- 소비 앱 템플릿(`template/`) — electron-vite·electron-builder 설정 포함, 루트 workspace에 넣지 않는 복사 절차.
- 예제 앱(`examples/sample-app`)과 Electron 스모크(`smoke.mjs`) — shell 모드(패널·웹 탭·분할·재시작 복원·`fetchAsApp`)와 web 모드(사이드바 없는 웹 한 장) 모두 검증.
- vitest 36개(정책·스토어·컴포넌트 단위 테스트).

## 다음 작업

1. 태그 `v0.1.0` 생성 (감독 승인 후) — `git tag v0.1.0 && git push origin main v0.1.0`. 태그 전 `npm pack --dry-run`으로 `files`에 `dist/`·`styles/`·`template/`만 들어가는지 확인한다.
2. 골든노트 세션에 태그를 알린다.
3. 골든노트 저장소에 `desktop/` 연결 — [셸 설계 문서](../design/2026-09-13-keel-shell-design.md) §9 "골든노트" 절 그대로. `id: goldennote`, origins `notes.goldenlabs.dev` + `goldenlabs.cloudflareaccess.com`, permissions `media`.

## 알려진 이슈

- webview에 포커스가 있을 때는 셸 단축키(`Mod+B/L/W`, `Mod+Shift+]/[`)가 동작하지 않는다.
- 원격 웹 자체 내비게이션과 셸 사이드바가 겹치는 이중 크롬 현상이 있다(설계 §13에 기록된 세 앱 공통 현상. 1단계는 허용, 앱별 `insertCSS`로 완화 가능).
- 그룹을 분할하면 그 안의 webview가 재마운트되어 페이지가 다시 로드된다.
- 복원한 탭의 URL 원점이 신뢰 목록 밖이면 빈 화면으로 뜬다.
- 여러 웹 탭이 동시에 만료되면 각 탭에 로그인 화면이 뜨고, 한 탭에서 로그인해도 나머지는 새로고침 전까지 로그인 화면이 남는다(설계 §13, 2단계에서 `cookies.changed` 일괄 새로고침 검토 대상).
- Windows/Linux, 코드 서명, 자동 업데이트는 아직 검증하지 않았다.
- 리뷰에서 보류(deferred)로 남긴 사소한 항목: `package.json`의 pnpm 서식 정규화(기능 변화 없음, 되돌려도 다음 `pnpm add`에서 재발), `keel.d.ts`의 `React.JSX` webview 타입 증강이 무효(React 타입이 이미 webview를 선언), `RightPanel`의 탭 버튼 컨테이너에 `tablist` 역할과 키보드 활성화(방향키)가 없음, `KeelShell`에 OS 테마 변경 리스너가 없음(시작 시 테마만 반영), `ResizeHandle`이 언마운트 중 드래그 리스너를 해제하지 않음, `window-all-closed`가 항상 `quit`(단일 창 셸 의도로 유지, 트레이·닫기→숨김은 2단계).

## 핵심 결정 사항

- [ADR 003](../adr/003-consumer-app-location.md): 소비 앱 코드는 소비 앱 저장소에 둔다. Keel 저장소에는 소비 앱을 두지 않는다.
- [ADR 004](../adr/004-webview-tabs-and-orca-shell.md): 원격 웹 탭은 `<webview>`로 담고 셸은 Orca식 커스텀(탭 바·분할·리사이즈)으로 만든다. Dockview는 채택하지 않는다.
- [ADR 005](../adr/005-root-package-git-tag-distribution.md): 저장소 루트를 패키지로 두고 git 태그로 배포한다(`github:thissak/keel#vX.Y.Z`). npm 레지스트리 게시는 별도 결정.

## 검증 명령

```sh
pnpm install
pnpm build
pnpm test                              # vitest 36개, 빌드를 선행한다
pnpm example:build && pnpm example:test  # Electron 스모크(shell·web 모드), 창이 잠깐 떴다 닫힌다
```
