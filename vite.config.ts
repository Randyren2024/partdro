import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { spawn, type ChildProcess } from 'node:child_process'
import { createConnection } from 'node:net'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const C500_LANDING_PORT = 5174
const U15_LANDING_PORT = 5175
const VF50P_LANDING_PORT = 5176

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
 * Standalone product landings (landing/eavision-c500, landing/u15) are separate
 * Vite apps. Start their dev servers alongside the main one so localhost:5173
 * serves the real landing instead of the removed SPA fallback.
 */
function landingDevServer(name: string, port: number, config: string): Plugin {
  let child: ChildProcess | undefined
  const stop = () => {
    if (child && !child.killed) child.kill()
  }
  return {
    name,
    apply: 'serve',
    async configureServer(server) {
      if (await isPortListening(port)) return
      child = spawn(
        process.execPath,
        [
          join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'),
          '--config',
          join(projectRoot, config),
          '--port',
          String(port),
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
  plugins: [
    vue(),
    landingDevServer('c500-landing-dev-server', C500_LANDING_PORT, 'landing/eavision-c500/vite.config.mjs'),
    landingDevServer('u15-landing-dev-server', U15_LANDING_PORT, 'landing/u15/vite.config.mjs'),
    landingDevServer('vf50p-landing-dev-server', VF50P_LANDING_PORT, 'landing/vf50p/vite.config.mjs')
  ],
  // Only scan the main SPA entry. The default **/*.html scan also walks the
  // standalone landing's index.html, whose /src/main.js resolves to C:/src.
  optimizeDeps: {
    entries: ['index.html']
  },
  server: {
    port: 5173,
    // Standalone landings. In dev, serve them from their own servers so the
    // product URLs behave exactly like the deployed pages.
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
      },
      '^/products/u15-multi-mission-drone/?$': {
        target: `http://localhost:${U15_LANDING_PORT}`,
        rewrite: () => '/products/u15-multi-mission-drone/',
        ws: true
      },
      '^/products/u15-multi-mission-drone/': {
        target: `http://localhost:${U15_LANDING_PORT}`,
        ws: true
      },
      '^/products/vf50p-long-endurance-vtol-uav/?$': {
        target: `http://localhost:${VF50P_LANDING_PORT}`,
        rewrite: () => '/products/vf50p-long-endurance-vtol-uav/',
        ws: true
      },
      '^/products/vf50p-long-endurance-vtol-uav/': {
        target: `http://localhost:${VF50P_LANDING_PORT}`,
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
