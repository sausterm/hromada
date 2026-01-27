import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Image upload will not work.')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

export const STORAGE_BUCKET = 'project-images'
