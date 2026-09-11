# AGENTS.md — Keel Codex mediator

운영 규칙의 SSOT는 `CLAUDE.md`다. 이 파일에 규칙이나 상태를 복제하지 않는다.

1. 글로벌 `~/.claude/CLAUDE.md`를 세션당 한 번 끝까지 읽는다.
2. 프로젝트 `CLAUDE.md`를 읽는다.
3. 현재 작업과 관련된 `docs/PROGRESS.md`, `docs/CHANGELOG.md`, `docs/adr/`를 확인한다.
4. Git 상태를 확인하고 사용자 WIP를 보존한다.

사용자의 최신 요청과 상위 Codex 정책을 우선한다. Claude 전용 도구 설정은 현재 실행 환경에 맞춰 해석한다.
