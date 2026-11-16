import { computed } from 'vue'
import supplierSource from '~/data/suppliers.json'
import { SUPPLIER_PROFILES } from '~/data/supplier-profiles'
import type { SupplierRecord } from '~/data/supplier-directory'
import type { SupplierProfile } from '~/data/supplier-profiles'

interface SupplierDirectoryPayload {
  suppliers: SupplierRecord[]
  profiles: SupplierProfile[]
  updated: string
  source?: 'supabase' | 'static'
}

const staticFallback: SupplierDirectoryPayload = {
  suppliers: supplierSource.suppliers as SupplierRecord[],
  profiles: SUPPLIER_PROFILES,
  updated: supplierSource.updated || '2026-11-16',
  source: 'static',
}

/**
 * SSR/prerender-friendly data loader.
 * Static JSON remains the deterministic fallback if Supabase is unavailable
 * during build or at runtime. Successful reads are embedded in Nuxt payloads.
 */
export async function useSupplierDirectory() {
  const { data, error } = await useAsyncData<SupplierDirectoryPayload>(
    'supplier-directory',
    async () => {
      try {
        return await $fetch<SupplierDirectoryPayload>('/api/supplier-directory')
      } catch {
        return staticFallback
      }
    },
    {
      server: true,
      lazy: false,
      default: () => staticFallback,
    },
  )

  if (error.value) {
    console.warn('[supplier-directory] Using static JSON fallback')
  }

  return {
    suppliers: computed(() => data.value?.suppliers?.length ? data.value.suppliers : staticFallback.suppliers),
    profiles: computed(() => data.value?.profiles ?? staticFallback.profiles),
    updated: computed(() => data.value?.updated ?? staticFallback.updated),
    source: computed(() => data.value?.source ?? 'static'),
  }
}
