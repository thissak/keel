# ADR 002: Orca를 기본 설정의 기준으로 사용

## Status

Accepted — 2026-09-12 감독 결정

## Context

ADR 001은 기술 스택과 세부 설정을 후속 결정으로 남겼다. 감독은 Keel의 기본 설정이 Orca를 기준으로 한다고 명확히 했다. 따라서 Orca를 외형 참고 사례로만 취급하지 않고 기본 기술 구성과 인터페이스의 출발점으로 삼는다.

## Decision

- 데스크톱 런타임은 Electron, 화면은 React·TypeScript(TSX), 스타일은 Tailwind CSS·shadcn/ui 구성을 기준으로 한다.
- Vite 기반 화면 빌드와 pnpm 패키지 관리를 기준으로 한다. 데스크톱 빌드 도구의 세부 설정과 의존성 버전은 원본 개발 설정을 확인한 뒤 정한다.
- 좌측 사이드바·중앙 탭·우측 사이드바의 공통 앱 틀을 우선 구현한다.
- Orca의 기본 설정에서 달라져야 하는 항목은 이유를 기록한다. 에이전트·터미널·Git 작업공간 등 업무 기능의 의존성은 공통 코어에 자동 포함하지 않는다.
- Orca 소스를 도입하는 경우 출처와 저작권·라이선스 고지를 보존한다. Keel 자체 라이선스와 패키지 배포 방식은 별도 결정한다.

## 확인 근거

설치된 Orca 1.4.200의 앱 패키지에서 다음 파일을 확인했다. 원본 개발 저장소 전체를 확인한 것은 아니다.

| 파일 | 확인 내용 |
|------|-----------|
| `package.json` | Electron toolkit preload/utils, electron-updater, main 진입점 |
| `vite.web.config.ts` | Vite, React 플러그인, Tailwind CSS 플러그인, renderer 경로 별칭 |
| `components.json` | shadcn/ui `new-york-v4`, `neutral`, CSS variables, TSX |
| `pnpm-workspace.yaml` | pnpm 설정과 네이티브 의존성 빌드 허용 목록 |
| `LICENSE` | MIT 고지, Copyright (c) 2026 Lovecast Inc. |

웹 화면용 Vite 설정만으로 데스크톱 전체의 빌드 구성을 확정하지 않는다. 현재 Keel에 복사한 Orca 소스는 없다.

## Consequences

- 기술 스택을 처음부터 다시 선정하지 않고 Orca를 기준으로 첫 실행 예제를 만들 수 있다.
- Orca의 앱 전용 의존성과 공통 프레임워크 설정을 구분해야 한다.
- 원본 개발 설정과 잠금 파일을 확보하기 전까지 동일 버전·동일 빌드 재현을 보장하지 않는다.
