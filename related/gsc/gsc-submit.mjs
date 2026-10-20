// GSC URL Inspection 批量提交收录（通过 Kimi WebBridge 控制用户已登录的浏览器）
// 用法：node gsc-submit.mjs <url1> [url2] ...
// 前提：kimi-webbridge daemon 运行于 http://127.0.0.1:10086，浏览器已登录 GSC
const WB = 'http://127.0.0.1:10086/command'
const SESSION = 'gsc-submit'
const GSC = 'https://search.google.com/search-console?resource_id=sc-domain%3Adroneworld.tech'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function wb(action, params = {}) {
  const res = await fetch(WB, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: SESSION, action, ...params }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(`${action}: ${json.error?.message || JSON.stringify(json.error)}`)
  return json.data
}

async function evalCode(code) {
  const data = await wb('evaluate', { code })
  return data?.value !== undefined ? data.value : data
}

const FILL_INSPECT = (url) => `(() => {
  const inp = [...document.querySelectorAll('input')].find(i =>
    (i.getAttribute('aria-label') || '').toLowerCase().includes('inspect'));
  if (!inp) return 'NO_INPUT';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(inp, ${JSON.stringify(url)});
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
  return 'FILLED';
})()`

const CLICK = (re, label) => `(() => {
  const els = [...document.querySelectorAll('button, [role="button"], a, span, div')].filter(el => {
    if (!el.offsetParent) return false;
    const t = (el.textContent || '').trim();
    if (!${re}.test(t)) return false;
    // 取最小匹配元素，避免点到外层容器
    return !([...el.children].some(c => ${re}.test((c.textContent || '').trim())));
  });
  const el = els.find(e => e.tagName === 'BUTTON' || e.getAttribute('role') === 'button' || e.tagName === 'A') || els[0];
  if (!el) return 'NOT_FOUND';
  el.click();
  return 'CLICKED:${label}';
})()`

const BODYTEXT = `document.body.innerText.replace(/\\s+/g,' ').slice(0,20000)`

async function submitUrl(url) {
  console.log(`\n=== ${url}`)
  await wb('navigate', { url: GSC })
  await sleep(3000)

  // 等 Inspect 输入框出现并填入 URL + Enter
  let filled = 'NO_INPUT'
  for (let i = 0; i < 10; i++) {
    filled = await evalCode(FILL_INSPECT(url))
    if (filled === 'FILLED') break
    await sleep(2000)
  }
  if (filled !== 'FILLED') return { url, status: 'fail', detail: 'inspect input not found' }

  // 等检查结果出现（最多 40s）
  let text = ''
  for (let i = 0; i < 8; i++) {
    await sleep(5000)
    text = String(await evalCode(BODYTEXT))
    if (/url is (not )?on google|page fetch|indexing requested|crawled - currently/i.test(text)) break
  }

  if (/url is on google/i.test(text) && !/request indexing/i.test(text)) {
    console.log('  已被收录（URL is on Google），跳过提交')
    return { url, status: 'already-indexed' }
  }

  // 点击 Request indexing（兼容"确认"二段式：出现第二个按钮再点一次）
  let clicked = await evalCode(CLICK('/request\\s+indexing/i', 'request'))
  console.log('  click:', clicked)
  if (clicked === 'NOT_FOUND') return { url, status: 'fail', detail: 'request-indexing button not found' }

  let confirmClicked = false
  const t0 = Date.now()
  while (Date.now() - t0 < 150000) {
    await sleep(10000)
    text = String(await evalCode(BODYTEXT))
    if (/indexing requested/i.test(text)) {
      console.log('  ✓ Indexing requested')
      break
    }
    // 二段确认：对话框里的 REQUEST INDEXING
    if (!confirmClicked && /request indexing/i.test(text)) {
      clicked = await evalCode(CLICK('/request\\s+indexing/i', 'confirm'))
      if (String(clicked).startsWith('CLICKED')) {
        confirmClicked = true
        console.log('  confirm click:', clicked)
      }
    }
    if (/something went wrong|couldn't be tested|try again later/i.test(text)) {
      return { url, status: 'fail', detail: 'GSC error shown' }
    }
  }
  if (!/indexing requested/i.test(text)) return { url, status: 'fail', detail: 'timeout waiting indexing requested' }

  // 关闭对话框
  await sleep(2000)
  const dismissed = await evalCode(CLICK(/^(dismiss|got it|关闭|知道了)$/i, 'dismiss'))
  console.log('  dismiss:', dismissed)
  return { url, status: 'submitted' }
}

const urls = process.argv.slice(2)
if (!urls.length) {
  console.error('用法：node gsc-submit.mjs <url1> [url2] ...')
  process.exit(1)
}
const results = []
for (const u of urls) {
  try {
    results.push(await submitUrl(u))
  } catch (e) {
    console.error('  error:', e.message)
    results.push({ url: u, status: 'fail', detail: e.message })
  }
  await sleep(5000)
}
console.log('\n===== 汇总 =====')
for (const r of results) console.log(`${r.status.padEnd(16)} ${r.url} ${r.detail || ''}`)
