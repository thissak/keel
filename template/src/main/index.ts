import { app } from 'electron'
import { createKeelApp } from '@goldenlabs/keel/main'
import { join } from 'node:path'

// ESM 메인에서 createKeelApp을 최상위 await로 기다리면 안 된다. Electron은 최상위 await가 끝나야 'ready'를 내고
// createKeelApp은 ready를 기다리므로 교착된다. 결과(KeelApp)가 필요하면 .then()으로 받는다.
createKeelApp({
  id: 'keel-app',                       // 소문자·숫자·하이픈. userData와 파티션 이름
  name: 'Keel App',
  web: { origins: ['https://example.com'], permissions: [] },
  renderer: process.env.ELECTRON_RENDERER_URL
    ? { url: process.env.ELECTRON_RENDERER_URL }
    : { file: join(import.meta.dirname, '../renderer/index.html') },
  userData: process.env.KEEL_USER_DATA
}).catch(err => { console.error(err); app.exit(1) })
