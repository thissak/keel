// Keel 셸 종단 검증. 실행 방식은 experiments/app-base-comparison/smoke.mjs를 따른다.
// shell 모드(사이드바·패널·웹 탭·분할·복원·fetchAsApp)와 web 모드(사이드바 없음 + tabStrip 'never')를 차례로 돈다.
import { _electron as electron, expect } from '@playwright/test'
import { createRequire } from 'node:module'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const cwd = dirname(fileURLToPath(import.meta.url))
const executablePath = createRequire(join(cwd, 'package.json'))('electron')

const close = app => {
  let timer
  const deadline = new Promise((_, rej) => { timer = setTimeout(() => { app.process().kill('SIGKILL'); rej(new Error('close timeout')) }, 10000) })
  return Promise.race([app.close(), deadline]).finally(() => clearTimeout(timer))
}
const guests = app => app.evaluate(({ webContents }) =>
  webContents.getAllWebContents().filter(w => w.getType() === 'webview').map(w => ({ id: w.id, url: w.getURL(), sandbox: w.getLastWebPreferences()?.sandbox, node: w.getLastWebPreferences()?.nodeIntegration })))
const guestCount = app => guests(app).then(g => g.length)
const windowCount = app => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)
const runInGuest = (app, id, code) => app.evaluate(({ webContents }, [gid, js]) => webContents.fromId(gid).executeJavaScript(js), [id, code])
// 재시작 전후 같은 원점이어야 저장된 웹 탭이 복원된다 → 빈 포트를 하나 잡아 샘플 서버에 고정한다
const freePort = () => new Promise((resolve, reject) => {
  const srv = createServer().listen(0, '127.0.0.1', () => { const { port } = srv.address(); srv.close(err => err ? reject(err) : resolve(port)) })
})

async function runShellMode(data) {
  const env = { ...process.env, KEEL_USER_DATA: data, KEEL_SAMPLE_MODE: 'shell', KEEL_SAMPLE_PORT: String(await freePort()) }
  delete env.ELECTRON_RUN_AS_NODE
  const launch = () => electron.launch({ executablePath, args: ['.'], cwd, env, timeout: 60000 })
  let app = await launch()
  try {
    const page = await app.firstWindow()
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await expect(page.getByRole('heading', { name: '앱베이스란' })).toBeVisible({ timeout: 60000 })
    const noteList = page.getByRole('navigation', { name: '노트 목록' })

    // 1. 패널 탭 2개 + 중복 방지
    await noteList.getByRole('button', { name: '공통 개선 적용' }).click()
    await noteList.getByRole('button', { name: '공통 개선 적용' }).click()
    await expect(page.getByRole('tab', { name: '공통 개선 적용' })).toHaveCount(1)
    await expect(page.getByRole('tab', { name: '앱베이스란' })).toHaveCount(1)

    // 2. 웹 탭: 게스트가 붙고 제목이 반영된다
    await noteList.getByRole('button', { name: '샘플 웹' }).click()
    await expect(page.getByRole('tab', { name: /샘플 웹 \// })).toBeVisible({ timeout: 20000 })
    const guestInfo = await guests(app)
    expect(guestInfo).toHaveLength(1)
    expect(guestInfo[0]).toMatchObject({ sandbox: true, node: false })
    expect(guestInfo[0].url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/)
    const origin = new URL(guestInfo[0].url).origin
    const gid = guestInfo[0].id

    // 3. 신뢰 원점 안 링크는 새 탭, 밖 링크는 외부(새 게스트 없음). 실제 브라우저가 열리지 않게 openExternal을 막는다.
    await runInGuest(app, gid, "document.getElementById('inside').click()")
    await expect(page.getByRole('tab', { name: /샘플 웹 \/second/ })).toBeVisible({ timeout: 20000 })
    await expect.poll(() => guestCount(app), { timeout: 10000 }).toBe(2)
    expect(await windowCount(app)).toBe(1) // allowpopups가 실제 창을 열면 안 된다
    const stubbed = await app.evaluate(({ shell }) => {
      try { Object.defineProperty(shell, 'openExternal', { value: async () => {}, configurable: true }); return true } catch { return false }
    })
    if (stubbed) {
      await runInGuest(app, gid, "document.getElementById('outside').click()")
      await page.waitForTimeout(500)
      expect(await guestCount(app)).toBe(2)
      expect(await windowCount(app)).toBe(1)
      await expect(page.getByRole('tab', { name: /example/i })).toHaveCount(0)
    } else {
      console.log('skip: cannot stub shell.openExternal')
    }

    // 4. 권한 목록 밖 요청 거부
    await runInGuest(app, gid, "document.getElementById('perm').click()")
    await expect.poll(() => app.evaluate(({ webContents }, id) => webContents.fromId(id).getTitle(), gid), { timeout: 10000 }).toBe('denied')

    // 5. will-attach-webview: 신뢰 원점 밖 src·다른 파티션은 붙지 않는다
    await page.evaluate(rogues => {
      for (const [src, partition] of rogues) {
        const wv = document.createElement('webview')
        wv.setAttribute('partition', partition)
        wv.setAttribute('src', src)
        wv.setAttribute('data-smoke', 'rogue')
        document.body.appendChild(wv)
      }
    }, [['https://example.com/', 'persist:keel-sample'], [`${origin}/`, 'persist:other']])
    await page.waitForTimeout(700)
    expect(await guestCount(app)).toBe(2)
    await page.evaluate(() => document.querySelectorAll('webview[data-smoke]').forEach(el => el.remove()))

    // 6. fetchAsApp: 타 원점 302는 loginRequired, 같은 원점 301은 따라간다
    await noteList.getByRole('button', { name: '보호 fetch' }).click()
    await expect(page.locator('#fetch-result')).toContainText('loginRequired:true', { timeout: 10000 })
    await expect(page.locator('#fetch-result')).toContainText('status:302')

    // 6-1. 쿠키 발급 후에는 fetchAsApp이 세션 쿠키를 실어 보내 보호 fetch가 통과한다
    await noteList.getByRole('button', { name: '쿠키 발급' }).click()
    await expect(page.getByRole('tab', { name: /쿠키 발급/ })).toBeVisible({ timeout: 20000 })
    await noteList.getByRole('button', { name: '보호 fetch' }).click()
    await expect(page.locator('#fetch-result')).toContainText('loginRequired:false status:200', { timeout: 10000 })

    await noteList.getByRole('button', { name: '이동 fetch' }).click()
    await expect(page.locator('#fetch-result')).toContainText('loginRequired:false', { timeout: 10000 })
    await expect(page.locator('#fetch-result')).toContainText('status:200')
    await expect(page.locator('#fetch-result')).toContainText('샘플 웹 /second')

    // 7. 분할 후 종료 → 재시작 복원
    await noteList.getByRole('button', { name: '분할' }).click()
    await expect(page.locator('[data-split-handle]')).toHaveCount(1)
    await page.waitForTimeout(400) // 디바운스 저장
    expect(errors).toEqual([])
    await close(app)

    app = await launch()
    const restored = await app.firstWindow()
    const restoredErrors = []
    restored.on('pageerror', e => restoredErrors.push(e.message))
    await expect(restored.getByRole('tab', { name: '앱베이스란' })).toHaveCount(1, { timeout: 60000 })
    await expect(restored.getByRole('tab', { name: '공통 개선 적용' })).toHaveCount(1)
    await expect(restored.getByRole('tab', { name: /샘플 웹 \/second/ })).toHaveCount(1, { timeout: 20000 })
    await expect(restored.getByRole('tab', { name: /샘플 웹 \// })).toHaveCount(2, { timeout: 20000 })
    await expect(restored.getByRole('tab', { name: /쿠키 발급/ })).toHaveCount(1, { timeout: 20000 })
    await expect(restored.locator('[data-split-handle]')).toHaveCount(1)
    await expect.poll(() => guests(app).then(g => g.map(x => x.url).sort()), { timeout: 20000 }).toEqual([`${origin}/`, `${origin}/login-cookie`, `${origin}/second`])
    expect(restoredErrors).toEqual([])
    console.log('sample-app smoke (shell): passed')
  } finally {
    await close(app).catch(() => {})
  }
}

async function runWebMode(data) {
  const env = { ...process.env, KEEL_USER_DATA: data, KEEL_SAMPLE_MODE: 'web' }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath, args: ['.'], cwd, env, timeout: 60000 })
  try {
    const page = await app.firstWindow()
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await expect.poll(() => guestCount(app), { timeout: 60000 }).toBe(1)
    await expect.poll(() => guests(app).then(g => g[0].url), { timeout: 20000 }).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/)
    await expect(page.locator('webview')).toHaveCount(1)
    await expect(page.getByRole('tab')).toHaveCount(0)
    await expect(page.getByRole('navigation')).toHaveCount(0)
    expect(errors).toEqual([])
    console.log('sample-app smoke (web): passed')
  } finally {
    await close(app).catch(() => {})
  }
}

// 모드마다 새 userData로 시작한다 (복원은 shell 모드 안에서 재시작으로 검증)
for (const run of [runShellMode, runWebMode]) {
  const data = await mkdtemp(join(tmpdir(), 'keel-sample-'))
  try { await run(data) } finally { await rm(data, { recursive: true, force: true }) }
}
console.log('sample-app smoke: passed')
