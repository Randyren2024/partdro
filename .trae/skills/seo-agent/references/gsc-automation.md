# GSC automation via kimi-webbridge — exact recipes

Working recipes as of 2026-09 against search.google.com/search-console (property `sc-domain:droneworld.tech`). GSC is a Wiz/Angular app: synthetic DOM events with `isTrusted=false` are ignored by many handlers; CDP-level input is trusted.

## Daemon lifecycle

- Binary: `%USERPROFILE%\.kimi-webbridge\bin\kimi-webbridge.exe` (not on PATH). `status` prints `/status` JSON; `extension_connected:true` required.
- After a reboot/daemon crash, startup fails with `Error: write pid: ... daemon.pid: The file exists`. Fix: `Get-Process -Id <pid-in-file>` to confirm dead → `Remove-Item ~\.kimi-webbridge\daemon.pid` (and `daemon.addr` if present) → `start` again. Never use `stop`/`restart`/`upgrade` unprompted.
- If `extension_connected:false` persists, the browser is closed or extension asleep — retry `list_tabs` a few times; it reconnects on first command.

## Request mechanics (Windows)

1. Write the JSON body with the file-write tool (never echo/heredoc — non-ASCII gets mangled) to a **unique** temp name, e.g. `%TEMP%\webbridge-req-<tag>.json`.
2. `curl.exe -s -m <timeout> -X POST http://127.0.0.1:10086/command -H "Content-Type: application/json" --data-binary "@<file>"`.
3. Delete temp files when done. One session per task (e.g. `gsc-seo-prep`); `group_title` on first navigate.
4. Envelope: `{"ok":true,"data":...}` or `{"ok":false,"error":...}`.

## Failure modes

| Symptom | Fix |
|---|---|
| `evaluate` times out / hangs | `navigate` the same tab to any GSC URL, wait ~8s, retry with a simpler script |
| curl exit 28 | Page slow; check `list_tabs` — tab may exist anyway |
| curl exit 7 | Daemon down → status → start procedure above |
| Stale coordinates after `Emulation.setDeviceMetricsOverride` | Re-measure rects AFTER applying the override |

## Viewport

Before coordinate clicks: `cdp` → `Emulation.setDeviceMetricsOverride` `{width:1440,height:900,deviceScaleFactor:1,mobile:false}`. Screenshot pixels then map 1:1 to CDP coordinates.

## URL inspection — the working recipe

```
1. evaluate: document.querySelector('input[aria-label="Inspect any URL in droneworld.tech"]').focus()
2. cdp Input.insertText {"text":"<full-url>"}          # value lands + trusted input events
3. click action: selector "button[aria-label=\"Search\"]"   # THE step that submits
4. wait ~16s
5. evaluate: parse document.body.innerText
```

- The `click` action (not raw `el.click()` in evaluate) works even though this is a Wiz app — verified 2026-09.
- CDP `Input.dispatchKeyEvent` Enter in any variant (keyDown, keyDown+char, keyUp) does **NOT** submit the inspect form. Don't burn time on it.
- Deep links like `/search-console/inspect?resource_id=...&id=https%3A%2F%2F...` return Google's 404 — `id` must be GSC's internal hash. Only the search-box path works.
- To inspect another URL: re-focus the input and `Input.insertText` the new URL, then click Search again. GSC selects the existing value on focus, so insertText overwrites it — verified across 3 consecutive URL changes. If a stale value survives, click `Clear search` first.

## Parsing inspection results

From `document.body.innerText` (whitespace-collapsed):

| Text | Meaning |
|---|---|
| `URL is on Google` + `Page is indexed` | Indexed |
| `URL is not on Google` + `Discovered - currently not indexed` | Queued via sitemap/discovery, not crawled |
| `URL is not on Google` + `Crawled - currently not indexed` | Crawled, deprioritized |
| `Indexing requested` | Submission accepted (only visible right after clicking) |
| `Processing data` | Report stale; check again in a day |

Useful flags: `onGoogle: /URL is on Google/.test(t)`, `notOnGoogle: /URL is not on Google/.test(t)`, reason via `/Discovered - currently not indexed|Crawled - currently not indexed|Page is indexed/`.

## REQUEST INDEXING

- Button text matches `/REQUEST INDEXING/i`; on indexed pages it reads "Request indexing / Request again". Located top-right of the inspection card (~x1254,y363 at 1440×900).
- Even CDP mousePressed/mouseReleased on it often opens the live-test dialog that then ignores further synthetic clicks, and re-running it on the same URL same-day gets rate-limited.
- Policy: **ask the user to click it manually** — 3 URLs is 30 seconds of human work and zero account risk. Agent verifies statuses before/after instead.

## Screenshots

`screenshot` action returns `{format:"jpeg", data:<base64>, dataLength}` in `data.data` (v1.9.7 — not a file path). Decode:

```js
node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('<out.json>','utf8'));fs.writeFileSync('<out>.jpg',Buffer.from(j.data.data,'base64'))"
```

with `curl ... -o <out.json>` first. Then `Read` the jpg.

## Report URLs

- Page indexing report: `https://search.google.com/search-console/index?resource_id=sc-domain%3Adroneworld.tech` — `/index/pages` 404s.
- Sitemaps: `https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Adroneworld.tech`
- Sidebar hrefs can be enumerated: `evaluate` → `[...document.querySelectorAll('a[href]')].map(a=>a.href)` filtered on `/search-console\//` — the reliable way to discover current report URLs when GSC renames routes.
