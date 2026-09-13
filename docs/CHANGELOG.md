# Changelog

### 2026-09-13

- [docs] 골든노트·GateLab·Deuce 세 앱을 같은 방식으로 만들 수 있는지 각 저장소·운영 응답·Orca 공개 소스로 확인하고, Orca 셸 이식 범위·`<webview>` 탭·정책 계층·앱 계약·확장 지점·앱별 적용·배포 제안·검증 기준을 담은 설계 문서를 작성했다(감독 승인 대기).
- [docs] 감독 결정에 따라 골든노트 데스크톱 앱을 골든노트 저장소 안에 두고 Keel을 의존성으로 소비하도록 소비 앱 코드 위치를 ADR 003에 기록했다. Keel 저장소에는 소비 앱을 두지 않는다.
- [feat] 코어 패키지(`@goldenlabs/keel`)를 구현했다: 정책 계층(신뢰 원점·권한·탐색·새 창 판정), 창·webview 강화(`will-attach-webview` 파티션·src 검사, preload 고정, sandbox·contextIsolation 강제), `keel:*` IPC(발신자 검사), `fetchAsApp`(앱 세션 쿠키로 메인이 대신 fetch). 인프라 없이 소비 앱이 Keel 버전을 고르는 ADR 001·005 원칙을 실제 코드로 채우기 위함.
- [feat] 렌더러 셸을 구현했다: Orca 토큰(Tailwind 4 + shadcn/ui new-york-v4, MIT 고지 보존), 탭·분할 스토어(Zustand), 타이틀바·사이드바·우 패널·탭 바·분할 컴포넌트, webview 호스트, `KeelShell`·`useKeel` 공개 API. Orca와 같은 모양·상태 저장 방식(ADR 004)을 소비 앱 코드 없이 재현하기 위함.
- [feat] 소비 앱 템플릿(`template/`)·예제 앱(`examples/sample-app`)·Electron 스모크(shell/web 두 모드)를 추가했다. 소비 앱이 `desktop/`를 복사해 바로 시작할 수 있게 하고, 설계 §12 검증 기준을 실제로 확인하기 위함.
- [fix] pnpm-workspace.yaml의 `minimumReleaseAgeExclude` 우회를 제거했다. release-age 게이트를 개별 패키지 예외로 뚫지 않기 위함.
- [fix] `mergeKnown`이 `rightPanelTab: string | null`을 `typeof` 비교로 버리던 병합 버그를 고쳤다. 저장된 우 패널 활성 탭이 복원되지 않는 문제였다.
- [fix] `fetchAsApp`을 `session.fetch`(리다이렉트가 opaqueredirect로 뭉개짐, electron/electron#43715)에서 `net.request` 기반으로 바꿔 302/301의 상태 코드·헤더를 그대로 읽게 했다. `loginRequired` 판정이 실제로 동작하게 하기 위함.
- [fix] 탭 순환 단축키(`Mod+Shift+]`/`[`)가 `e.key`(Shift 조합 시 매칭 실패)가 아니라 `e.code`를 비교하도록 고쳤다.
- [fix] `<webview>`에 `allowpopups`를 추가하고 `setWindowOpenHandler`는 항상 `deny`를 반환하도록 유지했다. `allowpopups` 없이는 `target=_blank`가 새 창 정책에 도달하지 못해 골든노트류 새 탭 링크가 죽는 문제였다.
- [fix] `KeelShell` 마운트 해제 시 하이드레이션 완료 전 콜백을 취소하도록 고쳐, 언마운트 후 상태 갱신 경고·경쟁 상태를 없앴다.

### 2026-09-12

- [feat] Orca 기반 비교 앱의 탭 바로 옆에 아이콘 `+` 메뉴를 배치하고, 아이콘형 간결 검색·검색어 지우기·노트 아이콘을 적용해 탐색 화면을 정돈했다.
- [docs] 앱베이스 용어와 실험 완료·미검증 범위를 맞추고, 다음 구현을 이어갈 수 있도록 최소 공통 패키지·골든노트 첫 연결의 제안 범위와 완료 기준을 정리했다.
- [feat] Theia와 Orca 기술 기반 조합을 선택할 근거를 마련하기 위해 동일 샘플 노트의 Electron 비교 예제와 재시작 복원 테스트를 추가했다.
- [docs] 비교 결과·공식 출처·재현 명령·macOS 개발 바이너리 보정과 실제 소비 앱 연결의 미검증 범위를 기록했다.
- [docs] 감독 결정에 따라 Orca를 기본 설정 기준으로 확정하고, 설치 패키지에서 확인한 기술 구성과 미확인 범위를 ADR 002에 기록했다.
- [chore] GOLEM init 계약으로 Keel 프로젝트 문서를 생성했다.
- [chore] 로컬 main과 공개 GitHub `thissak/keel`을 생성하고 GOLEM 카탈로그에 등록했다.
- [docs] 여러 앱의 공통 기반을 지속적으로 발전시키기 위해 독립 프레임워크와 소비 앱별 버전 선택 원칙을 기록했다.
- [docs] 좌측 사이드바·중앙 탭·우측 사이드바를 기본 인터페이스 방향으로 정하고, 특정 업무 기능은 소비 앱에 남겼다.
