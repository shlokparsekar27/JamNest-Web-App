// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// The keys are now read securely from your .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)