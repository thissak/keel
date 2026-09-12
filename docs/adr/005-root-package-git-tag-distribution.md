# ADR 005: 저장소 루트를 패키지로 두고 git 태그로 배포한다

## Status

Accepted — 2026-09-13 감독 결정 ([설계 문서](../design/2026-09-13-keel-shell-design.md) §10 승인)

## Context

ADR 001은 소비 앱이 Keel 버전을 선택한다고 정했지만 배포 방식은 미정이었다. 라이선스와 npm 게시는
아직 결정하지 않았다. npm의 git 의존성은 저장소 하위 디렉터리를 지원하지 않는다.

## Decision

- Keel 저장소 루트가 `@goldenlabs/keel` 패키지다(이름은 잠정, 게시 전까지 `private: true`).
  `src/`, `styles/`, `template/`가 패키지에 들어가고 `examples/`, `experiments/`, `docs/`는
  `files` 목록으로 제외한다.
- 소비 앱은 git 태그로 버전을 고정한다: `"@goldenlabs/keel": "github:thissak/keel#v0.1.0"`.
  설치 시 `prepare`가 빌드한다.
- 진입점은 `./main`(ESM), `./renderer`(ESM), `./preload`(단일 CJS, 메인이 경로를 자동 지정),
  `./main.css`(Tailwind 4 소스 CSS)다.
- npm 레지스트리 게시는 라이선스 확정 후 별도로 결정한다. 게시하더라도 git 태그 소비는 유지한다.

## Consequences

- 인프라 없이 소비 앱이 버전을 선택하고 독립적으로 갱신할 수 있다.
- `prepare` 빌드가 소비 앱 설치 시간에 들어간다. 빌드 의존성(tsc·Tailwind CLI)은 devDependencies로
  둔다.
- Keel 저장소는 pnpm으로 개발하지만 소비 앱은 npm·pnpm 어느 쪽도 가능해야 하므로 빌드 스크립트에
  pnpm 전용 기능을 쓰지 않는다.
