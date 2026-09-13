---
lifecycle: active
---

# Keel 진행 상태

## 프로젝트 초기화

- [x] 이름 Keel과 독립 공개 저장소 운영 방향 확정
- [x] GOLEM init 문서 계약과 Claude→Codex 브리지 작성
- [x] 로컬 `main` 저장소와 공개 GitHub `thissak/keel` 생성·origin 연결
- [x] GOLEM 카탈로그 등록 및 GoldenNote 연결 활성화
- [x] 공통 프레임워크 범위·소비 앱별 버전 선택 원칙 기록
- [ ] 프레임워크 기술 스택과 확장 계약 확정
- [x] Orca를 기본 설정 기준으로 확정하고 설치 패키지의 기술 구성 확인
- [ ] Orca 원본 개발 설정·버전 확인 및 최소 앱 확장 계약 확정
- [ ] 라이선스와 패키지 배포 방식 확정
- [ ] 공통 레이아웃과 탭 기반 구현·검증
- [x] Theia와 Orca 기술 기반 조합의 샘플 노트 비교 — 빌드·Electron 실행·중복 탭 방지·재시작 복원
- [x] Orca 기반 비교 앱의 탭 인접 `+` 메뉴와 아이콘형 제목·본문 노트 검색 구현·Electron 검증
- [ ] 비교 결과를 바탕으로 제품용 공통 패키지와 앱 확장 계약 확정
- [x] 소비 앱 코드 위치를 소비 앱 저장소로 확정 — 골든노트 데스크톱 앱은 골든노트 저장소에 둔다
- [x] 골든노트·GateLab·Deuce 세 앱 공통 적용 설계 감독 승인 — [설계 문서](design/2026-09-13-keel-shell-design.md), [ADR 004](adr/004-webview-tabs-and-orca-shell.md), [ADR 005](adr/005-root-package-git-tag-distribution.md)
- [x] Keel 1단계 코어 구현 (Orca 셸·webview 탭·앱 패널·상태 저장·정책 계층·`fetchAsApp`·템플릿) 및 예제 스모크 — `feat/keel-core-v0.1` 브랜치, [구현 계획](superpowers/plans/2026-09-13-keel-core-v0.1.md), [handoff](handoff/keel-core-v0.1-handoff.md)
- [ ] v0.1.0 태그 (감독 승인 후)
- [ ] 골든노트 `desktop/` 연결 — Keel 세션과 골든노트 세션이 각자 저장소에서 진행
- [ ] 골든노트·게이트랩 실제 소비 앱 연결 및 공통 버전 갱신 검증

실행 가능한 비교 코드는 `experiments/app-base-comparison/`에 있다. 제품용 공통 코어와 배포 패키지는 아직 없다. 기본 기술 구성은 ADR 002에 따라 Orca를 따른다. 비교 실험은 Orca 기술 기반 조합을 우선 후보로 제안하며, 실제 골든노트·게이트랩 연결과 공통 패키지 버전 갱신은 후속 검증 대상이다.

## 검증된 범위

- macOS arm64에서 두 후보의 production 빌드와 실제 Electron 실행을 확인했다.
- 공통 6개 동작을 검증했다: 첫 노트 표시, 둘째 노트 열기, 중복 탭 방지, 레이아웃 저장, 재시작 후 두 탭 복원, 복원한 탭 전환.
- Orca 기반 비교 앱은 간결한 아이콘 검색·검색어 지우기와 탭 옆 `+` 메뉴에서 노트를 여는 동작을 추가로 검증했다.
- 근거: [자동 검증 결과](../experiments/app-base-comparison/evidence/smoke.json), [비교 보고서](research/2026-09-12-app-base-comparison.md).
- 샘플 노트로 검증했으며 실제 골든노트·게이트랩, 버전 업그레이드 호환성, 배포용 서명·설치 파일·자동 업데이트, Windows/Linux는 미검증이다.
- Dockview 조합은 우선 후보 제안이다. 제품 의존성 선택과 API 계약을 확정한 상태는 아니다.
- Keel v0.1 코어: macOS arm64·Electron 44.3.0에서 설계 §12 스모크 5개(로컬 웹 탭+신뢰 원점 밖 링크
  외부 브라우저 전환, 앱 패널+웹 탭 분할 후 재시작 복원, `will-attach-webview` 허용 목록 밖 차단,
  권한 목록 밖 요청 거부, 사이드바 생략+`tabStrip:'never'` 웹 한 장 모드)와 `fetchAsApp`의 타 원점
  302(`loginRequired:true`)·같은 원점 301 추종을 `examples/sample-app` Electron 스모크로 확인했다.
  vitest 36개(정책·스토어·컴포넌트)도 통과한다. 근거: `docs/handoff/keel-core-v0.1-handoff.md`.

## 다음 작업 제안

**Keel v0.1 코어는 완성됐다. 다음은 첫 소비 앱인 골든노트를 실제로 연결하는 것이다.** 범위는
[셸 설계 문서](design/2026-09-13-keel-shell-design.md) §9 "앱별 적용 설계"에 이미 정해져 있다.

### 범위 (설계 §9 — 골든노트)

1. 태그 `v0.1.0`을 만들고(감독 승인 후) 골든노트 세션에 알린다.
2. 골든노트 저장소에 `desktop/` 독립 npm 패키지를 만든다(ADR 003·017). `id: goldennote`,
   origins `notes.goldenlabs.dev` + `goldenlabs.cloudflareaccess.com`, permissions `media`.
3. 좌 사이드바에 `fetchAsApp('/llms.txt')`로 받은 노트 목록 + 검색을 붙이고, 클릭 시 `openWeb`으로 연다.
4. 실제 Cloudflare Access 로그인(302→OTP→콜백)과 재시작 후 세션 유지·만료 시 재로그인을 확인한다.

### 완료 기준

- 골든노트용 이름과 식별자로 앱이 실행된다.
- 실제 로그인 후 노트를 읽고, 두 노트를 별도 탭으로 열 수 있다.
- 재시작 후 열린 탭이 복원되고, 로그인 만료 시 다시 로그인할 수 있다.
- 앱 고유 설정·화면 등록을 바꾸는 데 Keel 코어 소스를 수정하지 않는다.
- 기존 웹 서비스와 콘텐츠 수집·게시 흐름을 변경하지 않고 동작한다.
- 검증 명령과 실행 방법을 기록한다. 독립 설치 파일은 2단계 패키징에서 검증한다.

### 후속 순서

골든노트 연결 → 게이트랩을 두 번째 독립 앱으로 연결(우 패널 배지 패널·두 책 분할 비교로 앱 React
패널 등록을 검증) → 공통 패키지 버전 갱신을 두 앱에 적용.

### 2단계 후보 (설계 §11 — 골든노트·게이트랩 설치 파일로 검증 후 Deuce 이전)

- 분할 시 webview가 재마운트되지 않는 안정 컨테이너(현재 알려진 제한, [handoff](handoff/keel-core-v0.1-handoff.md) 참고).
- 배지(dock·Windows 오버레이)·트레이·닫기→숨김·단일 인스턴스·electron-updater·오프라인 안내.
- 패키징·서명·공증 절차, Windows/Linux 검증.

골든노트 하나가 실행된 것만으로 공통 앱베이스 검증을 완료 처리하지 않는다. 두 앱의 코어 수정 없는 사용과 독립적인 버전 갱신까지 확인해야 한다.
