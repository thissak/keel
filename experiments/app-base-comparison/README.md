# 앱베이스 비교 실험

Theia와 Orca 기술 기반 조합에서 같은 샘플 노트 2개를 여는 데스크톱 앱을 비교한다.
실제 GoldenNote 콘텐츠·인증·API를 사용하지 않는다. 기존 앱 저장소와 운영 서비스는 변경하지 않는다.

## 후보

- `theia/`: Theia 1.75.0 공식 시작 예제의 모듈 구성 + 자체 노트 확장.
- `orca/`: Electron 42.8.1 + React 19.3.0 + electron-vite 5.0.0 + Dockview 8.3.1.
  Orca 소스를 복사한 앱이 아니다. ADR 002의 기술 방향과 3영역 화면을 적용한 비교 예제다.
  스타일은 실험용 CSS이며 Tailwind/shadcn과 Orca 세부 디자인의 재현은 이번 범위에 없다.
- `shared/notes.json`: 두 예제의 동일 입력. Theia 빌드 전에 `sync-fixture.mjs`가 확장 내부로 복사한다.

이 실험은 npm 잠금 파일로 각각 설치한다. Theia 공식 구성과 독립적인 의존성 해석을 확인하기
위한 실험 범위의 선택이며, Keel 제품의 pnpm 기준을 변경하지 않는다.

## 재현

실험 디렉터리에서 실행한다. 검증 환경은 macOS arm64, Node 26.3.1, npm 11.16.0이다.
Theia의 네이티브 모듈 빌드에는 로컬 C/C++ 빌드 도구가 필요하다.

```sh
npm ci
npm --prefix orca ci
npm --prefix orca run install:electron
PUPPETEER_SKIP_DOWNLOAD=true npm --prefix theia ci
npm --prefix orca run build
npm --prefix theia run build
npm test
```

개별 실행은 실험 디렉터리에서 `npm --prefix orca start`, `npm --prefix theia start`다.
Theia는 임의의 빈 포트를 사용하고 서버를 `127.0.0.1`에만 연다.
자동 테스트는 앱별 임시 사용자 데이터 디렉터리를 사용하고 종료 후 제거한다.

## 검증 범위

`npm test`는 두 실제 Electron 앱에서 다음을 순서대로 검증한다.

1. 첫 노트의 본문 표시.
2. 둘째 노트 열기.
3. 같은 노트를 다시 열어도 탭이 중복되지 않음.
4. 레이아웃 저장 후 앱 종료.
5. 재시작 후 두 탭 복원.
6. 복원한 첫 탭으로 전환해 본문 확인.

Orca 기반 비교 앱은 아이콘형 노트 제목·본문 검색, 검색어 지우기와 탭 바로 옆 `+` 메뉴에서 노트를 여는 동작도 검증한다.

스크린샷은 같은 1280×800 창 크기에서 캡처한다. 테마·사이드바 기능은 서로 다르다.
`evidence/smoke.json`의 시작 시간은 한 번의 로컬 관찰값이며 성능 벤치마크가 아니다.

## macOS 개발 바이너리 보정

Theia의 최초 core-only 구성에는 QuickInput·PreferenceProvider 등의 서비스가 없어 공식 시작
예제의 모듈 구성으로 전환했다. 이 결과를 Theia의 최소 가능한 구성이라고 해석하지 않는다.

네이티브 재빌드 후 `drivelist.node` 로드에서 macOS `SIGKILL (Code Signature Invalid)`를
재현했다. 새 파일로 복사해 ad-hoc 서명한 뒤 교체하면 로드가 성공했다. `prepare-mac.cjs`는
생성된 해당 모듈과 실험 폴더의 Electron 복사본만 개발용 서명한다. 배포용 서명·공증이 아니다.
빌드 로그에서는 Theia의 ffmpeg 교체도 확인했지만, drivelist 종료의 원인으로 단정하지 않는다.

`launch.cjs`는 자동화 도구가 삽입한 디버그 인자가 작업공간 파일로 해석되지 않도록 앱 인자를
정규화한다. 이 보정은 실험용 실행기에 한정하며 Theia 패키지 소스는 수정하지 않는다.

## 출처

- [Theia 앱 구성](https://theia-ide.org/docs/composing_applications/)
- [Theia 확장](https://theia-ide.org/docs/extensions/)
- [electron-vite 시작](https://electron-vite.org/guide/)
- [Dockview](https://github.com/dockview/dockview)

비교 해석과 미검증 항목은 [비교 보고서](../../docs/research/2026-09-12-app-base-comparison.md)를 참고한다.
