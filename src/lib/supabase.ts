import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Public client (anon key) — for client-safe operations
let supabaseClient: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('Supabase environment variables not configured. Image upload will not work.')
}

// Admin client (service role key) — bypasses RLS, server-side only
let supabaseAdminClient: SupabaseClient | null = null

if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
}

export const supabase = supabaseClient as SupabaseClient
export const isSupabaseConfigured = !!supabaseClient

// Use supabaseAdmin for storage uploads (bypasses RLS). Falls back to anon client.
export const supabaseAdmin = supabaseAdminClient || supabaseClient as SupabaseClient

export const STORAGE_BUCKET = 'project-images'
export const TAX_RECEIPTS_BUCKET = 'tax-receipts'
