import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as path from 'node:path'
import vm from 'node:vm'

const source = readFileSync(new URL('./prerender.mjs', import.meta.url), 'utf8')
  .replace(/^import .* from .*\n/gm, '')
  .replace(/main\(\)\.catch\([\s\S]*$/, '')

async function renderArticle({ failed = false, hanging = false } = {}) {
  let closed = false
  let timeoutCallback
  const waits = []
  const page = {
    on() {},
    async route(pattern, handler) {
      for (const type of ['image', 'media', 'font', 'fetch', 'script']) {
        let action
        await handler({ request: () => ({ resourceType: () => type }),
          abort: () => { action = 'abort' }, continue: () => { action = 'continue' } })
        assert.equal(action, ['image', 'media', 'font'].includes(type) ? 'abort' : 'continue')
      }
    },
    async goto() {
      if (hanging) { timeoutCallback(); throw new Error('Context closed') }
    },
    async waitForFunction(predicate, arg, options) {
      assert.equal(arg, null)
      assert.equal(options.timeout, 12000)
      assert.equal(predicate(), true)
    },
    async waitForTimeout(ms) { waits.push(ms) },
    async evaluate() { return '<html><head></head><body>Article content</body></html>' },
  }
  const context = { newPage: async () => page, close: async () => { closed = true } }
  const sandbox = {
    ...path, process: { cwd: () => '/tmp', env: {} },
    console: { log() {}, warn() {} },
    chromium: { launch: async () => ({ newContext: async () => context, close: async () => {} }) },
    setTimeout(callback, ms) { assert.equal(ms, 20000); timeoutCallback = callback; return 1 },
    clearTimeout() {},
    document: { querySelector(selector) {
      if (selector === '[data-prerender-article-error]') return failed ? {} : null
      return failed ? null : { querySelector: () => ({ textContent: 'Article text' }) }
    } },
  }
  vm.createContext(sandbox)
  const rendered = await vm.runInContext(`${source}\nrenderAll([{ route: '/news/example', locale: 'en' }])`, sandbox)
  assert.equal(closed, true)
  return { rendered, waits }
}

test('renders ready articles without waiting for images or unrelated API calls', async () => {
  const { rendered, waits } = await renderArticle()
  assert.equal(rendered.length, 1)
  assert.match(rendered[0].html, /rel="canonical"/)
  assert.deepEqual(waits, [100])
})

test('does not save failed article requests as empty static articles', async () => {
  assert.equal((await renderArticle({ failed: true })).rendered.length, 0)
})

test('closes a hung route and leaves it to client rendering', async () => {
  assert.equal((await renderArticle({ hanging: true })).rendered.length, 0)
})
