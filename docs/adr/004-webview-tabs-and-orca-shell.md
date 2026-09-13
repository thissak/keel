# ADR 004: 원격 웹 탭은 `<webview>`로 담고 셸은 Orca식 커스텀으로 만든다

## Status

Accepted — 2026-09-13 감독 결정 ([설계 문서](../design/2026-09-13-keel-shell-design.md) 승인)

## Context

골든노트·GateLab·Deuce 세 앱 모두 화면이 URL 단위이고, Cloudflare Access 로그인 페이지는
`X-Frame-Options: DENY`라 iframe으로 담을 수 없다. 원격 웹을 탭에 넣는 방법은 `<webview>` 태그와
`WebContentsView` 두 가지다. 탭·분할 구현은 실험에서 검증한 Dockview와 Orca식 커스텀 중 골라야 했다.
감독은 모양의 기준을 Orca로 정했다.

## Decision

- 원격 웹 탭은 `<webview>` 태그로 담는다. 메인 프로세스가 `will-attach-webview`에서 파티션
  `persist:<appId>`와 신뢰 원점 밖의 접근을 차단하고, preload는 앱 설정으로 고정한 파일만 허용하며,
  sandbox·contextIsolation을 강제하고 Node·Blink 기능을 금지한다. Orca
  `src/main/window/main-window-webview-security.ts`와 같은 방식이다.
- 탭 바·분할 트리·사이드바 리사이즈는 Orca 코드(MIT)를 가져와 Keel 스토어에 맞게 손질한다.
  탭 스트립은 타이틀바 안에 둔다. Dockview는 채택하지 않는다.
- UI 상태(창 크기·사이드바 폭·우 패널·탭·분할)는 메인 프로세스 JSON `<userData>/keel-ui.json`에
  디바운스 저장하고 시작 시 복원한다. localStorage를 쓰지 않는다.
- Orca 소스를 가져온 파일에는 출처와 MIT 저작권 고지를 남긴다.

## Consequences

- 메뉴·다이얼로그·분할이 웹 위에 자연스럽게 뜨고 위치 동기화 코드가 없다.
- Electron 문서의 "webview 비권장" 주의를 안고 간다. 탭 호스트 한 곳에 격리해 필요 시
  `WebContentsView`로 교체할 수 있게 둔다.
- 실험의 Dockview 코드는 `experiments/`에 참고용으로 남고 제품 코드에 들어가지 않는다.
- 탭·분할 코드를 직접 유지해야 한다. Orca 본선 변경을 참고해 개선을 받을 수 있다.
