import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { electron: new URL('./src/test/electron-stub.ts', import.meta.url).pathname } },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx']
  }
})
