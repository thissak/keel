# Keel 앱베이스 비교 실험 — 2026-09-12

## 판단

이번 노트 읽기 실험에서는 **Orca 기술 구성을 유지하고 기존 화면 라이브러리를 조합하는 방향**을
Keel의 우선 후보로 권한다. Theia도 실제 데스크톱 실행과 탭 복원을 구현할 수 있었으나,
공식 시작 구성의 작업공간·편집기 기능 및 서비스 등록 체계를 함께 다뤄야 했다.
이는 실험 결과에 따른 제안이며, 새 기술 선택을 확정하는 ADR은 아니다.

## 실험 범위와 조건

- 두 후보 모두 Electron 42.8.1, TypeScript 5.9.3, macOS arm64에서 검증했다.
- Theia 1.75.0은 공식 시작 문서의 core/editor/filesystem/markers/messages/monaco/navigator/
  preferences/process/terminal/workspace 구성에 노트 확장을 추가했다.
- Orca 방향은 React 19.3.0, electron-vite 5.0.0, Vite 7.3.1, Dockview 8.3.1을 조합했다.
  Orca 원본 소스나 전체 개발 설정을 재현한 것은 아니다. 디자인은 실험용 CSS다.
- 동일한 샘플 노트 2개를 사용했다. 실제 골든노트 콘텐츠·로그인·음성·서버 API는 연결하지 않았다.
- Theia의 최초 core-only 시도에는 필수 서비스가 빠져 공식 예제 구성으로 전환했다.
  현재 구성의 의존성이 Theia를 사용하는 데 필요한 최소치라는 의미는 아니다.

## 확인 결과

| 항목 | Theia | Orca 기술 기반 조합 |
|------|-------|--------------------|
| TypeScript 및 production 빌드 | 통과 | 통과 |
| 실제 Electron 창에서 노트 표시 | 통과 | 통과 |
| 두 노트를 별도 탭으로 열기 | 통과 | 통과 |
| 같은 노트 중복 탭 방지 | WidgetManager의 같은 factory/options 재사용 | Dockview의 같은 panel ID 조회 |
| 저장 후 종료·재시작 시 두 탭 복원 | 통과 — ShellLayoutRestorer 사용 | 통과 — Dockview JSON + localStorage 사용 |
| 복원한 탭 전환·본문 표시 | 통과 | 통과 |
| 좌측 목록·중앙 탭·우측 정보 | ApplicationShell의 영역에 widget 등록 | React 레이아웃에 Dockview 배치 |
| 탭 `+`와 노트 검색 | 비교 범위에 없음 | 통과 — 탭 인접 노트 메뉴, 아이콘형 제목·본문 필터, 검색어 지우기 |
| 명령 등록 | CommandContribution + 메뉴 연결 | 샘플 버튼 핸들러, 공통 명령 레지스트리는 미구현 |
| 기본 상태 | OS에 따른 테마, 탐색기·Outline·설정 등 추가 UI | 고정 다크 테마, 노트 화면만 |

자동 검증 결과: [smoke.json](../../experiments/app-base-comparison/evidence/smoke.json).
스크린샷: [Theia](../../experiments/app-base-comparison/evidence/theia.png),
[Orca 기술 기반 조합](../../experiments/app-base-comparison/evidence/orca.png).

## 화면과 명령을 추가하는 차이

Theia에는 WidgetFactory, WidgetManager, ApplicationShell, CommandContribution,
MenuContribution, FrontendApplicationContribution을 연결했다. 명령·메뉴·화면 생명주기가
기존 구조에 들어가므로 제품이 복잡해질수록 재사용할 기반이 많다. 대신 서비스 등록과
확장 구조를 이해해야 한다. 이번 모듈 코드에서 Theia 내부 경로를 직접 import하므로
업그레이드 때 해당 API의 변경도 확인해야 한다.

Orca 방향에서는 React 컴포넌트와 Dockview panel을 연결했다. 노트 화면을 바꾸는 데는
React 코드만 다루면 된다. 다만 현재 샘플에 없는 명령·단축키·공통 설정·앱별 확장 계약은
Keel이 제공해야 한다. 이 샘플이 Theia와 같은 범위의 기능을 제공하는 것은 아니다.

## 버전 갱신과 유지보수

- Theia는 확장 패키지를 앱 의존성으로 조합한다. 공식 설명에서도 자체 확장을 npm 패키지로
  제공하며 컴파일 시 포함한다고 명시한다. 공통 기반을 패키지 버전으로 소비하는 목적과 맞는다.
- Orca 방향의 공통 앱베이스 패키지는 아직 만들지 않았다. 실험 코드에서 공통 shell과
  앱별 등록 정보를 분리해 두 번째 소비 앱을 연결하는 후속 검증이 필요하다.
- 두 후보 모두 **실제 버전 업그레이드 전후의 호환성 검증은 하지 않았다**. 현재 잠금 파일로
  빌드·실행한 결과이며, 업데이트가 자동으로 안전하다는 의미가 아니다.
- Theia의 Electron peer 버전 요구를 따라 두 후보 모두 42.8.1로 맞췄다. 전 구성 요소를
  무조건 최신 버전으로 고르는 대신 지원 범위를 맞추는 작업이 필요했다.

## 로컬 실행에서 발견한 비용

Theia는 네이티브 모듈 재빌드가 필요했다. 재빌드 뒤 `drivelist.node`를 Electron에서
직접 로드하면 macOS가 `Code Signature Invalid`로 종료하는 현상을 확인했다. 생성물을
새 inode로 복사해 개발용 서명한 뒤 성공했다. 로컬 실행용 보정 스크립트에 이 처리를 남겼다.
이 현상을 다른 OS나 모든 Theia 설치에 일반화하지 않는다.

또한 Playwright가 넣는 디버그 인자 때문에 진입 파일이 작업공간으로 해석되어 실행기를
보정했다. Theia 패키지 자체는 수정하지 않았다.

Theia의 기본 데스크톱 설정은 이 버전에서 `contextIsolation: true`, `nodeIntegration: false`,
`sandbox: false`였다. 이번 실험의 로컬 노트 실행 결과를 원격 웹 콘텐츠 연결 검증으로
대신할 수 없다. 골든노트·게이트랩의 실제 웹을 담는 경우 별도 콘텐츠 경계를 설계해야 한다.

## 후속 실험의 기준

1. 골든노트 읽기용 독립 앱에서 실제 로그인과 웹 페이지 표시를 확인한다.
2. 게이트랩용 독립 앱에 같은 Keel 버전을 연결한다.
3. 공통 탭 기능을 한 번 수정하고 두 앱이 Keel 버전 갱신으로 적용하는지 확인한다.
4. 게이트랩의 한 화면을 직접 등록해 웹을 감싸는 기능 외에 자체 화면 확장도 검증한다.

설치 파일 생성, 배포용 서명·공증, 자동 업데이트, 실제 소비 앱 두 개, 메모리·성능 측정,
Windows/Linux 실행, 완전한 Orca 디자인 재현은 이번 실험의 완료 범위가 아니다.

## 공식 자료

- [Theia 앱 구성](https://theia-ide.org/docs/composing_applications/)
- [Theia 확장과 플러그인](https://theia-ide.org/docs/extensions/)
- [Theia 아키텍처](https://theia-ide.org/docs/architecture/)
- [electron-vite 시작](https://electron-vite.org/guide/)
- [Dockview 공식 저장소](https://github.com/dockview/dockview)
- [Electron 보안 설계](https://www.electronjs.org/docs/latest/tutorial/security)

재현 명령과 로컬 보정 설명은 [실험 README](../../experiments/app-base-comparison/README.md)에 있다.
