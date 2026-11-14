/**
 * Default empty template for new product landing pages registered at runtime.
 * Admin /admin/products creates a new product namespace via registerProductNamespace(),
 * which needs this function to seed i18n messages.
 */
export function defaultLandingTemplate(): Record<string, unknown> {
  return {}
}
