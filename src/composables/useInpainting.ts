// IOPaint 服务地址（WSL2 中运行，Windows 浏览器通过 localhost 访问）
export const IOPAINT_URL = (import.meta.env.VITE_IOPAINT_URL as string) || 'http://localhost:8080'

// ====== Agnes 云端图生图（指令式整图编辑，与 IOPaint 的 mask 精确重绘互补） ======
// 官方文档: https://wiki.agnes-ai.com/zh-Hans/docs/agnes-image-21-flash
// 要点: endpoint 为 apihub 子域名；图生图 image 数组必须放 extra_body.image；
//       response_format 也要放 extra_body 内（顶层放会报错）；勿传 tags
export const AGNES_MODEL = 'agnes-image-2.1-flash'
const AGNES_URL = 'https://apihub.agnes-ai.com/v1/images/generations'

function agnesKey(): string {
  return ((import.meta.env.VITE_AGNES_API_KEY as string) || '').trim()
}

/** 按图片宽高比从 Agnes 支持的档位中选最近 ratio */
export function pickAgnesRatio(w: number, h: number): string {
  const r = w / h
  const table: Array<[string, number]> = [
    ['1:1', 1], ['3:4', 3 / 4], ['4:3', 4 / 3], ['16:9', 16 / 9],
    ['9:16', 9 / 16], ['2:3', 2 / 3], ['3:2', 3 / 2], ['21:9', 21 / 9],
  ]
  let best = '1:1'
  let diff = Infinity
  for (const [name, v] of table) {
    const d = Math.abs(Math.log(r / v))
    if (d < diff) {
      diff = d
      best = name
    }
  }
  return best
}

/**
 * Agnes 图生图：整图 + 编辑指令 → 新图
 * 按官方要求：image 数组与 response_format 均放 extra_body；
 * image 支持公共 URL 或 Data URI Base64（画布 dataURL 直传）
 */
export async function runAgnesEdit(
  imageDataUrl: string,
  promptText: string,
  opts?: { ratio?: string; size?: string },
): Promise<Blob> {
  const key = agnesKey()
  if (!key) {
    throw new Error('未配置 VITE_AGNES_API_KEY：请在 .env.local 中填入 Agnes API Key 并重启 dev server')
  }
  const res = await fetch(AGNES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: AGNES_MODEL,
      prompt: promptText,
      size: opts?.size || '2K',
      ...(opts?.ratio ? { ratio: opts.ratio } : {}),
      extra_body: {
        image: [imageDataUrl],
        response_format: 'b64_json',
      },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Agnes error ${res.status}: ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  const item = json?.data?.[0]
  if (item?.b64_json) {
    const bin = atob(item.b64_json)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new Blob([bytes], { type: 'image/png' })
  }
  if (item?.url) {
    const r = await fetch(item.url)
    if (!r.ok) throw new Error(`Agnes result download error ${r.status}`)
    return await r.blob()
  }
  throw new Error('Agnes 响应中没有图像数据')
}

/**
 * 调用 IOPaint inpainting API
 * 端点: POST /api/v1/inpaint  (application/json, InpaintRequest)
 * 其余参数（hd_strategy 等）由服务端默认值兜底
 * @param imageBase64 原图 base64（含 data: 前缀，会自动去掉）
 * @param maskBase64  mask 图 base64（白色区域=需要重绘，与原图同尺寸）
 * @param opts 扩散模型参数：AnyText 等需要 prompt；sd_steps 降低可在 CPU 提速
 * @returns 处理结果 Blob
 */
export async function runInpainting(
  imageBase64: string,
  maskBase64: string,
  opts?: { prompt?: string; sd_steps?: number },
): Promise<Blob> {
  // IOPaint 接收纯 base64 字符串（去掉 data:image/...;base64, 前缀）
  const cleanImage = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const cleanMask = maskBase64.replace(/^data:image\/\w+;base64,/, '')

  const res = await fetch(`${IOPAINT_URL}/api/v1/inpaint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: cleanImage,
      mask: cleanMask,
      ...opts,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`IOPaint error ${res.status}: ${text.slice(0, 200)}`)
  }
  return await res.blob()
}

/** 探活 IOPaint 服务（GET /api/v1/server-config，3s 超时） */
export async function probeServer(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3000)
    const res = await fetch(`${IOPAINT_URL}/api/v1/server-config`, { signal: ctrl.signal })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

/** 服务端可用模型列表（GET /api/v1/server-config → modelInfos，含 need_prompt 标记） */
export interface ServerModelInfo {
  name: string
  need_prompt: boolean
}

export async function listServerModels(): Promise<ServerModelInfo[]> {
  const res = await fetch(`${IOPAINT_URL}/api/v1/server-config`)
  if (!res.ok) throw new Error(`IOPaint error ${res.status}`)
  const cfg = await res.json()
  return (cfg.modelInfos || []).map((m: { name: string; need_prompt?: boolean }) => ({
    name: m.name,
    need_prompt: !!m.need_prompt,
  }))
}

/** 当前加载的模型名（GET /api/v1/model） */
export async function getCurrentModel(): Promise<string> {
  const res = await fetch(`${IOPAINT_URL}/api/v1/model`)
  if (!res.ok) throw new Error(`IOPaint error ${res.status}`)
  const info = await res.json()
  return info.name
}

/** 运行时切换模型（POST /api/v1/model，服务端会按需自动下载权重） */
export async function switchModel(name: string): Promise<void> {
  const res = await fetch(`${IOPAINT_URL}/api/v1/model`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`IOPaint error ${res.status}: ${text.slice(0, 200)}`)
  }
}

/**
 * 保存图片到 IOPaint 服务端 output 目录
 * 端点: POST /api/v1/save_image (multipart/form-data)
 * 服务端需以 --output-dir 启动（本项目: /home/user1102/partdro/public/d15r/images）
 */
export async function saveImage(blob: Blob, filename: string): Promise<void> {
  const fd = new FormData()
  fd.append('file', blob, filename)
  const res = await fetch(`${IOPAINT_URL}/api/v1/save_image`, { method: 'POST', body: fd })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`save_image error ${res.status}: ${text.slice(0, 200)}`)
  }
}

/** 把任意 URL 转 base64 dataURL，用于发给 IOPaint */
export async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return blobToBase64(blob)
}

/** Blob → base64 dataURL */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
