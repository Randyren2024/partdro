import { createClient } from '@supabase/supabase-js'

// The URL and publishable key are intentionally public and match the active
// droneworld.tech Supabase project. Never put the service_role key in this module.
const url = 'https://uphfcvquglafkszqqxiq.supabase.co'
const key = 'sb_publishable_gZ5lDMIYJBTn7TfhN_ASzg_1DytunFt'

export const supabase = createClient(url, key)
