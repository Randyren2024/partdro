import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { spawn, type ChildProcess } from 'node:child_process'
import { createConnection } from 'node:net'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const C500_LANDING_PORT = 5174

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' })
    const finish = (listening: boolean) => {
      socket.destroy()
      resolve(listening)
    }
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(500, () => finish(false))
  })
}

/**
 * C500 is a standalone Vite app (landing/eavision-c500). Start its dev server
 * alongside the main one so localhost:5173 serves the real landing instead of
 * the removed SPA fallback.
 */
function c500LandingDevServer(): Plugin {
  let child: ChildProcess | undefined
  const stop = () => {
    if (child && !child.killed) child.kill()
  }
  return {
    name: 'c500-landing-dev-server',
    apply: 'serve',
    async configureServer(server) {
      if (await isPortListening(C500_LANDING_PORT)) return
      child = spawn(
        process.execPath,
        [
          join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'),
          '--config',
          join(projectRoot, 'landing', 'eavision-c500', 'vite.config.mjs'),
          '--port',
          String(C500_LANDING_PORT),
          '--strictPort',
          '--clearScreen',
          'false'
        ],
        { cwd: projectRoot, stdio: 'inherit' }
      )
      child.once('exit', () => {
        child = undefined
      })
      process.once('exit', stop)
      server.httpServer?.once('close', stop)
    }
  }
}

export default defineConfig({
  plugins: [vue(), c500LandingDevServer()],
  // Only scan the main SPA entry. The default **/*.html scan also walks the
  // standalone landing's index.html, whose /src/main.js resolves to C:/src.
  optimizeDeps: {
    entries: ['index.html']
  },
  server: {
    port: 5173,
    // C500 is a standalone Vite app. In dev, serve it from its own server so
    // /products/c500-partdro-eavision behaves exactly like the deployed page.
    proxy: {
      // Localized/English document paths -> the landing dev entry.
      '^/(?:(?:es|de|fr)/)?products/c500-partdro-eavision/?$': {
        target: `http://localhost:${C500_LANDING_PORT}`,
        rewrite: () => '/products/c500-partdro-eavision/',
        ws: true
      },
      // Landing assets, images and packages all live under the absolute base.
      '^/products/c500-partdro-eavision/': {
        target: `http://localhost:${C500_LANDING_PORT}`,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          antd: ['ant-design-vue', '@ant-design/icons-vue']
        }
      }
    }
  }
})
