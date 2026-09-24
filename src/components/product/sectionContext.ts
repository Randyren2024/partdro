import { computed, inject, type ComputedRef, type InjectionKey } from 'vue'
import type { trackEvent } from '../../composables/useTracking'

export interface LandingSectionContext {
  ns: ComputedRef<string>
  tt: (p: string) => string
  imgEdit: (name: string, key?: string) => string
  alt: (desc: string) => string
  editMode: ComputedRef<boolean>
  mailtoHref: ComputedRef<string>
  trackEvent: typeof trackEvent
  openLightbox: (name: string, alt?: string) => void
  nozzleImages: ComputedRef<string[]>
  caseImages: ComputedRef<string[]>
  scenarioImages: ComputedRef<string[]>
  videoResolved: ComputedRef<boolean>
  parsedVideo: ComputedRef<any>
  videoPoster: ComputedRef<string | undefined>
}

export const landingSectionKey: InjectionKey<LandingSectionContext> = Symbol('landingSection')

export function useLandingSection(): LandingSectionContext {
  const ctx = inject(landingSectionKey)
  if (!ctx) throw new Error('useLandingSection must be used inside a landing section provider')
  return ctx
}
