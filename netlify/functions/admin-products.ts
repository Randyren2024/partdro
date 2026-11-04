import {
  BadRequest,
  errorResponse,
  json,
  methodGuard,
  parseBody,
  serviceRoleClient,
  verifyAdmin,
  type NetlifyEvent,
  type NetlifyResponse,
} from '../shared/verifyAdmin'

type Action = 'list' | 'create' | 'update' | 'delete'

interface ListBody {
  action: 'list'
}

interface CreateBody {
  action: 'create'
  slug: string
  category: string
  sort_order: number
  published: boolean
  langs: Array<{ lang: string; name: string; short_desc: string; description: string }>
}

interface UpdateBody {
  action: 'update'
  id: string
  published: boolean
}

interface DeleteBody {
  action: 'delete'
  id: string
}

type AdminProductsBody = ListBody | CreateBody | UpdateBody | DeleteBody

const CATEGORIES = new Set(['agricultural', 'cargo', 'cleaning', 'EVTOL'])
const LANGS = new Set(['en', 'es', 'de', 'fr'])

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  try {
    const guard = methodGuard(event, 'POST')
    if (guard) return guard

    await verifyAdmin(event)
    const body = parseBody<AdminProductsBody>(event)
    const supabase = serviceRoleClient()

    switch (body.action) {
      case 'list': {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_langs(lang, name, short_desc)')
          .order('sort_order', { ascending: true })
        if (error) throw new Error(error.message)
        return json(200, { rows: data ?? [] })
      }

      case 'create': {
        const slug = (body.slug || '').trim()
        if (!/^[a-z0-9-]+$/.test(slug)) {
          throw new BadRequest('Slug may only contain lowercase letters, digits and hyphens')
        }
        if (!body.category || !CATEGORIES.has(body.category)) {
          throw new BadRequest('Invalid category')
        }
        if (!Array.isArray(body.langs) || body.langs.length === 0) {
          throw new BadRequest('langs is required')
        }
        const en = body.langs.find((l) => l.lang === 'en')
        if (!en?.name?.trim()) throw new BadRequest('English name is required')

        const { data: product, error: perr } = await supabase
          .from('products')
          .insert({
            slug,
            category: body.category,
            sort_order: Number(body.sort_order) || 0,
            published: !!body.published,
            image_url: '/images/placeholder.svg',
            gallery: [],
            specs: {},
            features: [],
          })
          .select('id')
          .single()
        if (perr) throw new Error(perr.message)

        const langRows = body.langs
          .filter((l) => LANGS.has(l.lang))
          .map((l) => ({
            product_id: product.id,
            lang: l.lang,
            name: (l.name || '').trim() || en.name.trim(),
            short_desc: (l.short_desc || '').trim(),
            description: (l.description || '').trim() || (l.short_desc || '').trim(),
          }))
        if (langRows.length > 0) {
          const { error: lerr } = await supabase.from('product_langs').insert(langRows)
          if (lerr) throw new Error(lerr.message)
        }
        return json(200, { id: product.id, slug })
      }

      case 'update': {
        if (!body.id) throw new BadRequest('id is required')
        const { error } = await supabase
          .from('products')
          .update({ published: !!body.published })
          .eq('id', body.id)
        if (error) throw new Error(error.message)
        return json(200, { ok: true })
      }

      case 'delete': {
        if (!body.id) throw new BadRequest('id is required')
        const { error } = await supabase.rpc('admin_delete_product', { product_id: body.id })
        if (error) {
          throw new Error(
            `Delete failed: ${error.message}` +
              (error.message.includes('admin_delete_product')
                ? ' — run scripts/admin-functions.sql in Supabase Dashboard first'
                : ''),
          )
        }
        return json(200, { ok: true })
      }

      default:
        throw new BadRequest('Unknown action')
    }
  } catch (e) {
    return errorResponse(e)
  }
}
