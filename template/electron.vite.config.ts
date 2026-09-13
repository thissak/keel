import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Keel main은 node_modules에 두고 런타임에 import한다 → preload 경로 resolve가 안정적이다
  main: { plugins: [externalizeDepsPlugin()] },
  // preload는 Keel이 제공한다 (@goldenlabs/keel/preload). electron-vite 5는 entry 없는 preload 설정을 거부한다.
  renderer: { plugins: [react(), tailwindcss()] }
})
