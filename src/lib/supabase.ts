import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create the client if credentials are configured
let supabaseClient: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('Supabase environment variables not configured. Image upload will not work.')
}

export const supabase = supabaseClient as SupabaseClient
export const isSupabaseConfigured = !!supabaseClient

export const STORAGE_BUCKET = 'project-images'
