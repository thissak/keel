import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { app } from 'electron'
import { createKeelApp } from '@goldenlabs/keel/main'

// 원격 웹 탭 검증용 로컬 페이지. 신뢰 원점 안 링크(/second)와 밖 링크(https://example.com)를 둔다.
// /protected는 Access 같은 인증 프록시의 타 원점 302, /moved는 같은 원점 안 상대 301을 흉내 낸다 (fetchAsApp 검증).
// /login-cookie는 세션 쿠키 발급을 흉내 낸다 — fetchAsApp이 이 쿠키를 실어 보내야 /protected가 통과한다.
const server = createServer((req, res) => {
  if (req.url === '/login-cookie') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'set-cookie': 'keel_sample=1; Path=/' })
    res.end(`<!doctype html><title>쿠키 발급</title><h1>쿠키 발급</h1>`)
    return
  }
  if (req.url === '/protected') {
    if ((req.headers.cookie ?? '').includes('keel_sample=1')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(`<!doctype html><title>보호됨</title><h1>보호됨</h1>`)
      return
    }
    res.writeHead(302, { location: 'https://login.example.com/' })
    res.end()
    return
  }
  if (req.url === '/moved') {
    res.writeHead(301, { location: '/second' })
    res.end()
    return
  }
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.end(`<!doctype html><title>샘플 웹 ${req.url}</title><h1 id="h">샘플 웹 ${req.url}</h1>
<a id="inside" href="/second" target="_blank">새 탭(신뢰)</a> <a id="outside" href="https://example.com/" target="_blank">외부</a>
<button id="perm" onclick="navigator.geolocation.getCurrentPosition(()=>document.title='granted',()=>document.title='denied')">권한</button>`)
})
// 포트가 바뀌면 저장된 웹 탭의 원점이 신뢰 목록에서 벗어나 복원 시 빈 탭이 된다. 스모크는 KEEL_SAMPLE_PORT로 고정한다.
await new Promise<void>(r => server.listen(Number(process.env.KEEL_SAMPLE_PORT ?? 0), '127.0.0.1', r))
const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

// 최상위 await 금지: Electron은 최상위 await가 끝나야 'ready'를 내므로 createKeelApp(ready 대기)과 교착된다
createKeelApp({
  id: 'keel-sample',
  name: 'Keel Sample',
  web: { origins: [origin], permissions: [] },
  renderer: {
    ...(process.env.ELECTRON_RENDERER_URL ? { url: process.env.ELECTRON_RENDERER_URL } : { file: join(import.meta.dirname, '../renderer/index.html') }),
    query: { origin, mode: process.env.KEEL_SAMPLE_MODE ?? 'shell' }
  },
  userData: process.env.KEEL_USER_DATA
}).catch(err => { console.error(err); app.exit(1) })
