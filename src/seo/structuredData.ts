// 结构化数据（JSON-LD）：给产品页补 Product + BreadcrumbList，站点级补 Organization。
// 背景：实测线上产品页与首页 `application/ld+json` 出现次数为 0 —— Google 只能靠正文猜实体。
// 说明：本站为询盘制、无公开价格，故 Product 不带 offers（schema.org 要求 Offer 必须含 price，
//       缺失价格时的富媒体结果本就不适用）；仍可提升实体识别与品牌关联。
// 注意：预渲染脚本 stripRuntimePixels 只按广告 host 过滤 script，本内联 ld+json 会被保留进静态 HTML。

export interface ProductLdInput {
  name: string
  url: string
  description?: string
  images?: string[]
  sku?: string
  category?: string
}

/** 构造 Product 结构化数据（不含 offers / price）。 */
export function buildProductLd(input: ProductLdInput): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    url: input.url,
    brand: { '@type': 'Brand', name: 'Partdro' },
    manufacturer: { '@type': 'Organization', name: 'Partdro' },
  }
  if (input.description) ld.description = input.description
  if (input.images && input.images.length) ld.image = input.images.slice(0, 4)
  if (input.sku) ld.sku = input.sku
  if (input.category) ld.category = input.category
  return ld
}

export interface OrganizationLdInput {
  siteUrl: string
  logo?: string
  email?: string
}

/** 构造 Organization 结构化数据（站点级，随每页预渲染写入静态 HTML）。 */
export function buildOrganizationLd(input: OrganizationLdInput): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Partdro',
    url: input.siteUrl,
  }
  if (input.logo) ld.logo = input.logo
  if (input.email) ld.email = input.email
  return ld
}

export interface Crumb {
  name: string
  url: string
}

/** 构造 BreadcrumbList 结构化数据。 */
export function buildBreadcrumbLd(items: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

/** 把 JSON-LD 写进 <head>：同 id 则原地更新，避免重复注入。 */
export function injectJsonLd(id: string, data: unknown): void {
  if (typeof document === 'undefined') return
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}
