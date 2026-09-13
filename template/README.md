# Keel 소비 앱 템플릿

이 디렉터리를 복사해 소비 앱의 `desktop/`를 만든다. Keel 패키지 자체는 수정하지 않고,
아래 값만 바꿔 앱 하나를 완성한다.

## 복사 절차

```sh
# 소비 앱 저장소 루트에서
npm install github:thissak/keel#v0.1.0        # 또는 원하는 Keel 태그
cp -r node_modules/@goldenlabs/keel/template desktop
cd desktop && npm install
```

## 바꿀 값

| 파일 | 항목 | 설명 |
|------|------|------|
| `package.json` | `name`, `productName`, `description` | 앱 패키지 이름·표시 이름 |
| `package.json` | `dependencies["@goldenlabs/keel"]` | 사용할 Keel 태그 (`github:thissak/keel#vX.Y.Z`) |
| `src/main/index.ts` | `id` | 소문자·숫자·하이픈. userData 디렉터리와 `persist:<id>` 파티션 이름 |
| `src/main/index.ts` | `name` | 창 제목·앱 이름 |
| `src/main/index.ts` | `web.origins` | 탭 안에서 탐색을 허용할 원점(https, 로컬 http://127.0.0.1·localhost 예외). 밖 링크는 외부 브라우저로 넘어간다 |
| `src/main/index.ts` | `web.permissions` | 허용할 Electron permission 이름 목록. 기본 `[]` (전부 거부) |
| `electron-builder.yml` | `appId`, `productName`, `icon` | 패키징 식별자·표시 이름·아이콘 |
| `src/renderer/index.html` | `<title>` | 셸 페이지 제목 |

렌더러(`src/renderer/main.tsx`)의 사이드바·패널·활동은 앱이 자유롭게 바꾼다.
`useKeel()`은 `<KeelShell>` 안에서만 쓸 수 있다.

## 명령

| 명령 | 동작 |
|------|------|
| `npm run dev` | electron-vite 개발 서버 + Electron 실행 (HMR) |
| `npm run build` | 타입 검사 후 `out/`에 main·renderer 번들 생성 |
| `npm start` | `out/`로 Electron 실행 (배포 전 확인) |
| `npm run package:mac` / `package:win` | electron-builder로 `release/`에 설치 파일 생성 (서명·공증은 별도) |

`KEEL_USER_DATA=<경로>`를 주면 userData 위치를 바꿀 수 있다 (테스트용).

## 주의

- **`createKeelApp()`을 최상위 `await`로 기다리지 말 것.** Electron은 ESM 메인의 최상위 await가 끝나야
  `ready`를 내고, `createKeelApp`은 `ready`를 기다리므로 교착된다(창이 뜨지 않음). 템플릿처럼 `.catch()`로 끝내고,
  `KeelApp` 핸들이 필요하면 `.then(keel => …)`으로 받는다. 다른 준비(로컬 서버 listen 등)의 최상위 await는 괜찮다.
- **`desktop/`는 루트 workspace에 넣지 말 것.** 루트 `package.json`의 workspaces에 포함되면
  Vercel·CI가 의존성 설치 시 Electron 바이너리를 내려받는다. `desktop/`는 독립 패키지로 두고
  그 안에서만 `npm install`한다.
- `src/renderer/main.css`의 `@source '../../node_modules/@goldenlabs/keel/dist'`는 Keel 셸의
  Tailwind 클래스를 생성하기 위한 것이다. 지우면 셸 스타일이 빠진다.
- `electron.vite.config.ts`의 `externalizeDepsPlugin()`은 `@goldenlabs/keel/main`을 번들에 넣지 않고
  `node_modules`에서 import한다. Keel의 preload 경로 해석이 여기에 의존하므로 제거하지 않는다.
