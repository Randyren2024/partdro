import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ command }) => ({
  root,
  // Dev keeps the root base so /es/... /de/... /fr/... can be opened locally.
  // Production uses the absolute landing path so all four locale pages share assets.
  base: command === 'build' ? '/products/c500-partdro-eavision/' : '/',
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [vue()],
  build: {
    outDir: fileURLToPath(
      new URL('../../dist-landing/c500/site/products/c500-partdro-eavision', import.meta.url)
    ),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    host: true,
  },
}))
