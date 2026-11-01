function config() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('supabase_not_configured')
  return { url: String(url).replace(/\/$/, ''), key }
}

export async function insertInquiry(payload) {
  const { url, key } = config()
  const response = await fetch(`${url}/rest/v1/inquiries`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    // Never log the payload: it contains the lead's personal data.
    throw new Error(`inquiry_insert_failed_${response.status}`)
  }
}
