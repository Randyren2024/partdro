export type ParsedVideo =
  | { type: 'file'; url: string }
  | { type: 'youtube'; id: string; url: string }
  | { type: 'bilibili'; id: string; url: string }
  | null

const YT_EMBED = (id: string) => `https://www.youtube.com/embed/${id}`
const BILI_EMBED = (id: string) =>
  `https://player.bilibili.com/player.html?bvid=${id}&autoplay=0&high_quality=1`

/**
 * 解析视频 URL：支持 mp4/webm/ogg 直链、YouTube（watch / youtu.be / /embed/ / /shorts/）、
 * Bilibili（BV 号）。空串或无法识别返回 null。
 */
export function parseVideoUrl(raw: string | undefined | null): ParsedVideo {
  const url = (raw ?? '').trim()
  if (!url) return null

  // 直链视频文件
  if (/^https?:\/\/\S+\.(mp4|webm|ogg)(\?\S*)?$/i.test(url)) {
    return { type: 'file', url }
  }

  // YouTube
  let m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  )
  if (m) return { type: 'youtube', id: m[1], url: YT_EMBED(m[1]) }

  // Bilibili（b23.tv 短链需跳转，v1 不解析）
  m = url.match(/bilibili\.com\/video\/(BV[A-Za-z0-9]+)/)
  if (m) return { type: 'bilibili', id: m[1], url: BILI_EMBED(m[1]) }

  return null
}
