// IOPaint 服务地址（WSL2 中运行，Windows 浏览器通过 localhost 访问）
export const IOPAINT_URL = (import.meta.env.VITE_IOPAINT_URL as string) || 'http://localhost:8080'

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
