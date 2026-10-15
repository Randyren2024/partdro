// 验证 Claude Code 云沙箱模板（claude-code-gsc）+ 百炼 qwen3.7-max 中转链路
// 用法（在仓库根目录）：
//   $env:E2B_API_KEY="<香港key>"; $env:BAILIAN_API_KEY="<百炼 sk-key>"; node fc/deep-analysis/test-template.mjs
// 凭据只从环境变量读取，不落代码仓库。
import { Sandbox } from 'e2b'

const API_KEY = process.env.E2B_API_KEY
const API_URL = process.env.E2B_API_URL || 'https://api.cn-hongkong.e2b.fc.aliyuncs.com'
const DOMAIN = process.env.E2B_DOMAIN || 'cn-hongkong.e2b.fc.aliyuncs.com'
const TEMPLATE = process.env.E2B_TEMPLATE || 'claude-code-gsc'
const BAILIAN_KEY = process.env.BAILIAN_API_KEY
const BAILIAN_BASE = process.env.ANTHROPIC_BASE_URL || 'https://dashscope.aliyuncs.com/apps/anthropic'
const MODEL = process.env.ANTHROPIC_MODEL || 'qwen3.7-max'

if (!API_KEY || !BAILIAN_KEY) throw new Error('缺少 E2B_API_KEY 或 BAILIAN_API_KEY')

const envs = {
  ANTHROPIC_AUTH_TOKEN: BAILIAN_KEY,
  ANTHROPIC_BASE_URL: BAILIAN_BASE,
  ANTHROPIC_MODEL: MODEL,
  ANTHROPIC_DEFAULT_HAIKU_MODEL: MODEL,
  ANTHROPIC_DEFAULT_SONNET_MODEL: MODEL,
  ANTHROPIC_DEFAULT_OPUS_MODEL: MODEL,
}

console.log('[test] 创建沙箱', TEMPLATE, '...')
const sbx = await Sandbox.create(TEMPLATE, {
  apiKey: API_KEY,
  apiUrl: API_URL,
  domain: DOMAIN,
  timeoutMs: 900_000,
  envs,
})
console.log('[test] sandboxId =', sbx.sandboxId)
try {
  await sbx.commands.run("echo '{}' > /home/user/.claude.json")
  const probe = await sbx.commands.run(
    'echo "=== whoami ==="; whoami; echo "=== os ==="; head -2 /etc/os-release 2>/dev/null; ' +
    'echo "=== python ==="; (which python3 && python3 -V) 2>&1; ' +
    'echo "=== node ==="; node -v 2>&1; echo "=== claude ==="; which claude 2>&1; ' +
    'echo "=== home ==="; ls -la /home/user | head -20',
  )
  console.log('[test] 环境探测:\n' + probe.stdout + (probe.stderr || ''))
  console.log('[test] 运行 claude -p "用一句话自我介绍"...')
  const r = await sbx.commands.run(
    'claude --dangerously-skip-permissions < /dev/null -p "只回答一句话：你好，我是谁？"',
    { timeoutMs: 600_000 },
  )
  console.log('[test] exitCode =', r.exitCode)
  console.log('----- stdout -----')
  console.log(r.stdout)
  console.log('----- stderr -----')
  console.log(r.stderr)
} finally {
  await sbx.kill().catch(() => {})
  console.log('[test] 沙箱已销毁')
}
