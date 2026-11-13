import { supabase } from '../supabase/client'

/** Expose the shared Supabase client to Nuxt components that use useNuxtApp(). */
export default defineNuxtPlugin(() => ({
  provide: {
    supabase,
  },
}))
