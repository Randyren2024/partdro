import {
  BadRequest,
  errorResponse,
  json,
  methodGuard,
  parseBody,
  requireEnv,
  verifyAdmin,
  type NetlifyEvent,
  type NetlifyResponse,
} from '../shared/verifyAdmin'

const AGNES_URL = 'https://apihub.agnes-ai.com/v1/images/generations'
const AGNES_MODEL = 'agnes-image-2.1-flash'

interface AgnesBody {
  prompt: string
  image: string
  ratio?: string
  size?: string
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  try {
    const guard = methodGuard(event, 'POST')
    if (guard) return guard

    await verifyAdmin(event)

    const body = parseBody<AgnesBody>(event)
    if (!body.prompt || typeof body.prompt !== 'string') {
      throw new BadRequest('prompt is required')
    }
    if (!body.image || typeof body.image !== 'string') {
      throw new BadRequest('image is required')
    }
    if (body.image.length > 25_000_000) {
      throw new BadRequest('image too large')
    }

    const key = requireEnv('AGNES_API_KEY')
    const size = body.size || '2K'
    const ratio = body.ratio

    const res = await fetch(AGNES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: AGNES_MODEL,
        prompt: body.prompt,
        size,
        ...(ratio ? { ratio } : {}),
        extra_body: {
          image: [body.image],
          response_format: 'b64_json',
        },
      }),
    })

    const text = await res.text()
    let jsonBody: unknown
    try {
      jsonBody = JSON.parse(text)
    } catch {
      jsonBody = { error: text.slice(0, 500) }
    }

    if (!res.ok) {
      return json(res.status >= 400 && res.status < 600 ? res.status : 502, {
        error: `Agnes error ${res.status}: ${text.slice(0, 300)}`,
        detail: jsonBody,
      })
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: typeof jsonBody === 'string' ? jsonBody : JSON.stringify(jsonBody),
    }
  } catch (e) {
    return errorResponse(e)
  }
}
