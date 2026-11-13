/**
 * Stub: old Vite project used Netlify Functions for admin saves.
 * Nuxt migration: admin save goes through /api/admin/* Nitro routes (TBD).
 * For now, callFunction is a no-op so client build passes.
 */
export async function callFunction(name: string, payload: unknown): Promise<unknown> {
  console.warn('[callFunction] stubbed:', name, '(admin save not migrated to Nitro yet)')
  return null
}
