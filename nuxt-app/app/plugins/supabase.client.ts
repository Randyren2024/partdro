import { supabase } from '../supabase/client'

export default defineNuxtPlugin(() => ({
  provide: {
    supabase,
  },
}))
