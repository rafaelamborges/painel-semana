import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Login() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  async function handleGoogle() {
    setError('')
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleEmailAuth(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signInWithEmail(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUpWithEmail(email, password)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Verifique seu email para confirmar o cadastro.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 mb-4">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#ede9fe" stroke="#6d28d9" strokeWidth="2"/>
              <circle cx="16" cy="16" r="2" fill="#6d28d9"/>
              <polygon points="16,4 18,16 16,14 14,16" fill="#6d28d9"/>
              <polygon points="16,28 14,16 16,18 18,16" fill="#9ca3af"/>
              <polygon points="4,16 16,14 14,16 16,18" fill="#9ca3af"/>
              <polygon points="28,16 16,18 18,16 16,14" fill="#6d28d9"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-brand-700">Compasso</h1>
          <p className="text-gray-500 mt-1 text-sm">Acompanhamento infantil para famílias</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            ⚠️ Variáveis de ambiente não encontradas. Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no Vercel e faça redeploy.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h2>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center text-xs text-gray-400"><span className="bg-white px-2">ou com email</span></div>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />

            {error && <p className="text-red-500 text-xs">{error}</p>}
            {message && <p className="text-green-600 text-xs">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-brand-600 font-medium hover:underline">
              {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function DemoMode() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 mb-4">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="#ede9fe" stroke="#6d28d9" strokeWidth="2"/>
            <circle cx="16" cy="16" r="2" fill="#6d28d9"/>
            <polygon points="16,4 18,16 16,14 14,16" fill="#6d28d9"/>
            <polygon points="16,28 14,16 16,18 18,16" fill="#9ca3af"/>
            <polygon points="4,16 16,14 14,16 16,18" fill="#9ca3af"/>
            <polygon points="28,16 16,18 18,16 16,14" fill="#6d28d9"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-brand-700 mb-2">Compasso</h1>
        <p className="text-gray-500 text-sm mb-6">Configure as variáveis de ambiente do Supabase para ativar o login.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-800 mb-6 font-mono">
          <p>VITE_SUPABASE_URL=https://…supabase.co</p>
          <p>VITE_SUPABASE_ANON_KEY=eyJ…</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Explorar em modo demo
        </button>
      </div>
    </div>
  )
}
