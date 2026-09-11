import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const sides = process.argv.slice(2).length ? process.argv.slice(2) : ['orca', 'theia'];
const results = [];
await mkdir(join(root, 'evidence'), { recursive: true });

async function closeApp(app) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => { app.process().kill('SIGKILL'); reject(new Error('Electron did not close within 10 seconds')); }, 10000);
  });
  try { await Promise.race([app.close(), deadline]); } finally { clearTimeout(timer); }
}

for (const side of sides) {
  if (!['orca', 'theia'].includes(side)) throw new Error(`Unknown candidate: ${side}`);
  const data = await mkdtemp(join(tmpdir(), `keel-${side}-`));
  const cwd = join(root, side);
  const require = createRequire(join(cwd, 'package.json'));
  const executablePath = require('electron');
  const env = { ...process.env, KEEL_COMPARISON_DATA: data, THEIA_CONFIG_DIR: join(data, 'theia') };
  delete env.ELECTRON_RUN_AS_NODE;
  const args = side === 'orca' ? ['.'] : [join(cwd, 'launch.cjs'), '--hostname', '127.0.0.1', '--port', '0', '--electronUserData', data];
  const tab = (page, id, name) => side === 'theia'
    ? page.locator(`[id="shell-tab-keel-note:${id}"]`)
    : page.getByRole('tab', { name, exact: true });
  let app;
  try {
    const started = performance.now();
    app = await electron.launch({ executablePath, args, cwd, env, timeout: 60000 });
    const page = await app.firstWindow();
    await app.evaluate(({ BrowserWindow }) => {
      for (const window of BrowserWindow.getAllWindows()) window.setSize(1280, 800);
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await expect(page.getByRole('heading', { name: '앱베이스란', exact: true })).toBeVisible({ timeout: 60000 });
    const readyMs = Math.round(performance.now() - started);
    if (side === 'orca') {
      const search = page.getByRole('searchbox', { name: '노트 검색' });
      await search.fill('버전');
      await expect(page.getByRole('navigation', { name: '노트 목록' }).getByRole('button', { name: '공통 개선 적용' })).toBeVisible();
      await expect(page.getByRole('navigation', { name: '노트 목록' }).getByRole('button', { name: '앱베이스란' })).toHaveCount(0);
      await page.getByRole('button', { name: '검색어 지우기' }).click();
      await expect(page.getByRole('navigation', { name: '노트 목록' }).getByRole('button', { name: '앱베이스란' })).toBeVisible();
      await page.getByRole('button', { name: '새 탭 메뉴' }).click();
      const addMenu = page.getByRole('menu', { name: '열 노트 선택' });
      await expect(addMenu).toBeVisible();
      await page.screenshot({ path: join(root, 'evidence', 'orca-menu.png') });
      await addMenu.getByRole('menuitem', { name: '공통 개선 적용', exact: true }).click();
    } else {
      await page.getByRole('button', { name: '공통 개선 적용', exact: true }).click();
    }
    await expect(page.getByRole('heading', { name: '공통 개선 적용', exact: true })).toBeVisible();
    if (side === 'orca') {
      await page.getByRole('navigation', { name: '노트 목록' }).getByRole('button', { name: '공통 개선 적용', exact: true }).click();
    } else {
      await page.getByRole('button', { name: '공통 개선 적용', exact: true }).click();
    }
    await expect(tab(page, 'versioning', '공통 개선 적용')).toHaveCount(1);
    await expect(tab(page, 'app-base', '앱베이스란')).toHaveCount(1);
    await page.getByRole('button', { name: '레이아웃 저장', exact: true }).click();
    await page.screenshot({ path: join(root, 'evidence', `${side}.png`) });
    await closeApp(app);
    app = await electron.launch({ executablePath, args, cwd, env, timeout: 60000 });
    const restored = await app.firstWindow();
    await expect(tab(restored, 'versioning', '공통 개선 적용')).toHaveCount(1, { timeout: 60000 });
    await expect(tab(restored, 'app-base', '앱베이스란')).toHaveCount(1);
    await tab(restored, 'app-base', '앱베이스란').click();
    await expect(restored.getByRole('heading', { name: '앱베이스란', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    const checks = ['launch', 'open second note', 'no duplicate tab', 'save layout', 'restart restores two tabs', 'switch restored tab'];
    if (side === 'orca') checks.splice(1, 0, 'filter note list', 'open note from plus menu');
    results.push({ candidate: side, electron: require('electron/package.json').version, readyMs, checks, result: 'passed' });
    console.log(`${side}: passed`);
  } catch (error) {
    if (app) {
      const windows = app.windows();
      if (windows[0]) {
        await windows[0].screenshot({ path: join(root, 'evidence', `${side}-failure.png`) }).catch(() => {});
        await writeFile(join(root, 'evidence', `${side}-failure.log`), await windows[0].content()).catch(() => {});
      }
    }
    throw error;
  } finally {
    if (app) await closeApp(app).catch(() => {});
    await rm(data, { recursive: true, force: true });
  }
}
await writeFile(join(root, 'evidence', sides.length === 2 ? 'smoke.json' : `${sides[0]}-smoke.json`), JSON.stringify({ measuredAt: new Date().toISOString(), note: 'Single local run; readyMs is a smoke observation, not a benchmark. Synthetic notes; no production authentication or content.', results }, null, 2) + '\n');
