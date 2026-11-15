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
  /** MP4 直链（同源，无需第三方播放器，Google 可直接抓取） */
  src: string
  /** 视频封面，建议 16:9 */
  poster: string
  /** 视频标题（用于 <video aria-label> 与 VideoObject.name） */
  title: string
  /** 视频说明（用于 figcaption 与 VideoObject.description） */
  caption: string
  /** 时长，ISO 8601 格式，用于 VideoObject.duration */
  duration: string
  /** 上传/发布日期，用于 VideoObject.uploadDate */
  uploadDate: string
}

const VF50P_BASE = '/products/vf50p-long-endurance-vtol-uav'

export const ARTICLE_DEMO_VIDEOS: Record<string, ArticleDemoVideo> = {
  'chinese-uav-showcase-cargo-surveying-vtol-wuhu-tianxun': {
    productSlug: 'vf50p-long-endurance-vtol-uav',
    src: `${VF50P_BASE}/video/vf50p-demo-flight.mp4`,
    poster: `${VF50P_BASE}/images/vf50p/demo-flight-poster.webp`,
    title: 'VF50P long-endurance VTOL UAV — demo flight',
    caption:
      'Full demo flight of the Partdro VF50P: vertical take-off, fixed-wing cruise and autonomous landing. The same long-endurance VTOL platform referenced in the Wuhu cargo showcase.',
    duration: 'PT42S',
    uploadDate: '2026-11-15',
  },
}

export function getArticleDemoVideo(slug: string): ArticleDemoVideo | null {
  return ARTICLE_DEMO_VIDEOS[slug] ?? null
}
