// IOPaint 服务地址（WSL2 中运行，Windows 浏览器通过 localhost 访问）
export const IOPAINT_URL = (import.meta.env.VITE_IOPAINT_URL as string) || 'http://localhost:8080'

// ====== 本地 Flux / wanx 局部重绘（mask 驱动，iopaint/ 目录下的 Flask 服务） ======
// 服务端: partdro\iopaint\app.py（Flask:5000，已放开 CORS）；启动: python iopaint\app.py
// 浏览器直连，不经 Netlify Function（服务只在本机可达）
export const FLUX_EDIT_URL = (import.meta.env.VITE_FLUX_EDIT_URL as string) || 'http://localhost:5000'
export const FLUX_MODEL = 'flux'
export const WANX_MODEL = 'wanx'

/** 探活本地编辑服务（GET /，3s 超时） */
export async function probeFluxServer(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3000)
    const res = await fetch(`${FLUX_EDIT_URL}/`, { signal: ctrl.signal })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

/** 结果图归一化为 PNG（FLUX Space 可能返回 webp，而保存文件名固定 .png） */
async function normalizeToPng(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") return blob;
  try {
    const bmp = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    c.getContext("2d")!.drawImage(bmp, 0, 0);
    bmp.close();
    return await new Promise<Blob>((resolve, reject) =>
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
    );
  } catch {
    return blob; // 解码失败时原样返回，画布仍可渲染
  }
}

/**
 * 本地局部重绘：原图 + mask + 提示词 → 新图
 * POST {FLUX_EDIT_URL}/api/edit，body: {original_image, mask, prompt, model}
 * - flux：HF Space FLUX.1-Fill-dev（免费，走队列可能较慢）
 * - wanx：通义 wanx2.1-imageedit（按量计费，服务端限 512–4096px / prompt≤800字符）
 * @param opts.image   原图 dataURI（带 data: 前缀）
 * @param opts.mask    mask dataURI（白=重绘区，与原图同尺寸）
 * @param opts.prompt  描述涂抹区域要改成的内容
 * @param opts.model   'flux' | 'wanx'
 */
export async function runLocalEdit(opts: {
  image: string
  mask: string
  prompt: string
  model: string
}): Promise<Blob> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 300_000) // flux HF 队列高峰可能排队数分钟
  try {
    const res = await fetch(`${FLUX_EDIT_URL}/api/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_image: opts.image,
        mask: opts.mask,
        prompt: opts.prompt,
        model: opts.model,
      }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`Flux edit HTTP ${res.status}`)
    const json = await res.json().catch(() => null)
    if (!json?.success || !json.image) {
      throw new Error(json?.error || '本地编辑服务返回失败')
    }
    return await normalizeToPng(await (await fetch(json.image)).blob())
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('本地编辑超时（5 分钟），请稍后重试')
    throw e
  } finally {
    clearTimeout(timer)
  }
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
