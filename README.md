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

Theia와 Orca 기술 기반 조합의 실행 가능한 비교 예제를 마련했습니다. 소비 앱에서 사용하는 공통 패키지는 아직 없습니다.
기본 설정은 Orca를 기준으로 하며 Electron·React·TypeScript·Tailwind CSS·shadcn/ui와 Vite·pnpm 구성을 출발점으로 삼습니다.
세부 버전과 데스크톱 빌드 설정, 패키지 배포 방식, 라이선스는 후속 결정 대상입니다.
확인 근거와 적용 경계는 [ADR 002](docs/adr/002-orca-defaults.md)에 기록했습니다. 현재 가져온 Orca 소스는 없습니다.

진행 상태는 [PROGRESS](docs/PROGRESS.md), 변경 이력은 [CHANGELOG](docs/CHANGELOG.md)를 참고합니다.

비교 결과는 [앱베이스 실험 보고서](docs/research/2026-09-12-app-base-comparison.md), 실행 방법은 [실험 README](experiments/app-base-comparison/README.md)에 있습니다.

다음 작업 제안과 완료 기준은 [진행 상태](docs/PROGRESS.md#다음-작업-제안)에 정리했습니다.
