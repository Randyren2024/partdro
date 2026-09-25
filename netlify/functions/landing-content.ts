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

interface SaveBody {
  namespace: string
  lang: string
  content: Record<string, unknown>
}

const LANGS = new Set(['en', 'es', 'de', 'fr'])
const MAX_NS = 64

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  try {
    const guard = methodGuard(event, 'POST')
    if (guard) return guard

    await verifyAdmin(event)

    const body = parseBody<SaveBody>(event)
    if (!body.namespace || typeof body.namespace !== 'string' || body.namespace.length > MAX_NS) {
      throw new BadRequest('Invalid namespace')
    }
    if (!body.lang || !LANGS.has(body.lang)) {
      throw new BadRequest('Invalid lang')
    }
    if (body.content === null || typeof body.content !== 'object' || Array.isArray(body.content)) {
      throw new BadRequest('Invalid content')
    }

    const supabase = serviceRoleClient()
    const { error } = await supabase.from('landing_content').upsert(
      { namespace: body.namespace, lang: body.lang, content: body.content },
      { onConflict: 'namespace,lang' },
    )
    if (error) throw new Error(`Upsert failed: ${error.message}`)

    return json(200, { ok: true })
  } catch (e) {
    return errorResponse(e)
  }
}
