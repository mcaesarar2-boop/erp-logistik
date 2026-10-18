import { createClient } from '@supabase/supabase-js'

// Fallback default kredensial proyek Supabase agar client-side tidak melempar 'Failed to fetch' karena placeholder domain
const DEFAULT_SUPABASE_URL = "https://xqoubijpuusgtrsoeqdp.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxb3ViaWpwdXVzZ3Ryc29lcWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzI4NjAsImV4cCI6MjA5NTIwODg2MH0.m5f9dvNjV_Yhl7QizvkaQiSsPq9E6SYMk-YAHF3rO8g"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)