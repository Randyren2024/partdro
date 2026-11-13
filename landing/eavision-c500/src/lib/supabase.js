export async function insertInquiry(payload) {
  const response = await fetch('/api/inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.ok) {
    throw new Error(`inquiry_submit_failed_${response.status || 0}`)
  }
  return result
}
