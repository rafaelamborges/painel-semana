import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let cancelled = false

    // 1. Lê a sessão persistida
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // 2. Se há sessão, força um refresh no boot pra resetar o inactivity
      //    timer do lado do Supabase — assim cada abertura conta como acesso
      //    e a janela de 30 dias renova.
      if (session) {
        try { await supabase.auth.refreshSession() } catch { /* offline: ignora */ }
      }
    })

    // 3. Também refresha quando a aba volta do background depois de horas
    //    (sem isso, o timer só reseta quando o access token de 1h expira)
    let lastFocusRefresh = Date.now()
    async function onFocus() {
      if (document.visibilityState !== 'visible') return
      // No máximo 1x a cada 6h — evita spam quando a aba fica trocando de foco
      if (Date.now() - lastFocusRefresh < 6 * 60 * 60 * 1000) return
      lastFocusRefresh = Date.now()
      try { await supabase.auth.refreshSession() } catch { /* ignora */ }
    }
    document.addEventListener('visibilitychange', onFocus)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onFocus)
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    return { error }
  }

  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signUpWithEmail(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
