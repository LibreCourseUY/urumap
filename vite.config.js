import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/',
  plugins: [vue()],
  server: { host: true },
  preview: { host: true },
  build: { sourcemap: false }
})
