export type Lang = 'en' | 'es' | 'de' | 'fr'

export interface Product {
  id: number
  slug: string
  category: 'window' | 'solar'
  image_url: string
  gallery: string[]
  specs: Record<string, string>
  features: ProductFeature[]
  sort_order: number
  published: boolean
  created_at: string
  // 多语言合并字段（由 composable 注入）
  name: string
  description: string
  short_desc: string
}

export interface ProductFeature {
  icon: string
  title: string
  description: string
}

export interface Post {
  id: number
  slug: string
  category: string
  image_url: string
  published: boolean
  published_at: string
  created_at: string
  // 多语言合并字段
  title: string
  summary: string
  content: string
}

export interface Case {
  id: number
  slug: string
  image_url: string
  product_id: number | null
  published: boolean
  created_at: string
  // 多语言合并字段
  title: string
  description: string
  location: string
}

export interface Document {
  id: number
  file_url: string | null
  file_size: number | null
  product_id: number | null
  published: boolean
  created_at: string
  // 多语言合并字段
  title: string
  description: string
}

export interface Inquiry {
  id?: number
  name: string
  email: string
  phone?: string
  company?: string
  type: 'contact' | 'booking' | 'franchise'
  product_id?: number | null
  message: string
  created_at?: string
}
