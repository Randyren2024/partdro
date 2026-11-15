/**
 * 新闻文章内嵌的产品演示视频。
 *
 * 为什么不写进 Supabase 的 post.content：文章正文由 CATEGORY 编辑在后台维护，
 * 视频属于「文章 ↔ 产品」的结构化关联，放在仓库里才能跟着代码一起评审、回滚，
 * 也才能在构建期参与 VideoObject 结构化数据生成。新增文章时在这里加一条即可。
 */
export interface ArticleDemoVideo {
  /** 关联产品（用于内链和产品页跳转） */
  productSlug: string
  /** youtube = 第三方播放器嵌入；file = 仓库内同源 MP4 */
  provider: 'youtube' | 'file'
  /** 播放源：youtube 为 embed URL，file 为 mp4 直链 */
  src: string
  /** YouTube 观看页（provider === 'youtube' 时用于 VideoObject.url） */
  watchUrl?: string
  /** 视频封面，建议 16:9（youtube 用 i.ytimg.com 缩略图，file 用本地 webp） */
  poster: string
  /** 视频标题（用于 iframe title / <video aria-label> 与 VideoObject.name） */
  title: string
  /** 视频说明（用于 figcaption 与 VideoObject.description） */
  caption: string
  /** 时长，ISO 8601 格式，用于 VideoObject.duration；无法确证时留空而不是猜 */
  duration?: string
  /** 上传/发布日期，用于 VideoObject.uploadDate */
  uploadDate: string
}

const YOUTUBE_ID = 'baisrhXAe2o'

export const ARTICLE_DEMO_VIDEOS: Record<string, ArticleDemoVideo> = {
  'chinese-uav-showcase-cargo-surveying-vtol-wuhu-tianxun': {
    productSlug: 'vf50p-long-endurance-vtol-uav',
    provider: 'youtube',
    src: `https://www.youtube.com/embed/${YOUTUBE_ID}`,
    watchUrl: `https://www.youtube.com/watch?v=${YOUTUBE_ID}`,
    poster: `https://i.ytimg.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`,
    title: 'VF50P long-endurance VTOL UAV — demo flight',
    caption:
      'Full demo flight of the Partdro VF50P: vertical take-off, fixed-wing cruise and autonomous landing. The same long-endurance VTOL platform referenced in the Wuhu cargo showcase.',
    uploadDate: '2026-11-15',
  },
}

export function getArticleDemoVideo(slug: string): ArticleDemoVideo | null {
  return ARTICLE_DEMO_VIDEOS[slug] ?? null
}
