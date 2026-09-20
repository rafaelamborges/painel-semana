import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const storage = typeof window !== 'undefined' ? window.localStorage : undefined

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,       // guarda a sessão no localStorage
    autoRefreshToken: true,     // renova o access token antes de expirar
    detectSessionInUrl: true,   // extrai tokens do callback OAuth (#access_token=…)
    flowType: 'pkce',           // fluxo seguro para SPA
    storage,
    storageKey: 'compasso-auth',
  },
})

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
