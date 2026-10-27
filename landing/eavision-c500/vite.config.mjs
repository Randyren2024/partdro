import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(() => ({
  root,
  // The main dev server proxies this path to the standalone landing dev server,
  // so dev and production share the same absolute base for scripts and media.
  base: '/products/c500-partdro-eavision/',
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  // Keep the main SPA and landing dependency caches separate when both dev
  // servers run; sharing node_modules/.vite makes them invalidate each other.
  cacheDir: fileURLToPath(new URL('../../node_modules/.vite-c500', import.meta.url)),
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
