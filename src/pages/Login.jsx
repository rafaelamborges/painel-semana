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
    <div className="min-h-screen bg-marca flex items-center justify-center p-4 relative">
      {/* Logo ancorado no canto */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full border-2 border-bussola flex items-center justify-center">
          <div className="w-[10px] h-[10px] bg-bussola" style={{ transform: 'rotate(45deg)' }} />
        </div>
        <span className="font-medium text-[17px] tracking-[-0.01em] text-ink">Compasso</span>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="rotulo mb-4">Bem-vindo</p>
          <h1 className="font-display leading-[1.06] tracking-[-0.035em] text-ink" style={{ fontSize: 'clamp(30px,4.6vw,44px)', fontWeight: 200 }}>
            Duas casas.<br />
            <em className="italic font-semibold">Uma só criança.</em>
          </h1>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 bg-white border border-linha rounded-card p-4 text-[13px] text-ink-body">
            Configure <code className="font-mono text-[12px] text-bussola">VITE_SUPABASE_URL</code> e <code className="font-mono text-[12px] text-bussola">VITE_SUPABASE_ANON_KEY</code> no Vercel e faça redeploy.
          </div>
        )}

        <div className="bg-white rounded-card border border-linha p-7">
          <h2 className="section-title mb-5">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h2>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="btn-secundario w-full mb-3 gap-3"
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
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-linha" /></div>
            <div className="relative flex justify-center rotulo"><span className="bg-white px-3">ou com email</span></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="input"
            />

            {error && <p className="text-alerta text-[13px]">{error}</p>}
            {message && <p className="text-bussola text-[13px]">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primario w-full disabled:opacity-50"
            >
              {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center apoio mt-5">
            {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-bussola font-normal hover:underline">
              {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </div>

        <p className="text-center apoio mt-6">
          Ao entrar, você concorda com os nossos{' '}
          <a href="/termos" className="text-bussola hover:underline">Termos de Uso</a>
          {' '}e com a{' '}
          <a href="/privacidade" className="text-bussola hover:underline">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  )
}

