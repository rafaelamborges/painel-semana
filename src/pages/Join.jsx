import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ROLE_OPTIONS = [
  { value: 'mother', label: 'Mãe', emoji: '👩' },
  { value: 'father', label: 'Pai', emoji: '👨' },
  { value: 'grandparent', label: 'Avó/Avô', emoji: '👴' },
  { value: 'babysitter', label: 'Babá', emoji: '🧑' },
  { value: 'stepparent', label: 'Padrasto/Madrasta', emoji: '👨‍👩‍👧' },
]

const COLORS = ['#6d28d9', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export default function Join() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [child, setChild] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inviteError, setInviteError] = useState('')

  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [role, setRole] = useState('father')
  const [color, setColor] = useState('#3b82f6')
  const [joining, setJoining] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadInvite()
  }, [code])

  async function loadInvite() {
    const { data, error } = await supabase
      .from('family_invites')
      .select('*, families(*)')
      .eq('code', code)
      .maybeSingle()

    if (error || !data) {
      setInviteError('Convite não encontrado.')
      setLoading(false)
      return
    }
    if (data.used_at) {
      setInviteError('Este convite já foi utilizado.')
      setLoading(false)
      return
    }
    if (new Date(data.expires_at) < new Date()) {
      setInviteError('Este convite expirou.')
      setLoading(false)
      return
    }

    const { data: children } = await supabase
      .from('children')
      .select('name')
      .eq('family_id', data.family_id)
      .limit(1)

    if (children?.[0]) setChild(children[0])
    setLoading(false)
  }

  async function join(e) {
    e.preventDefault()
    setJoining(true)
    setFormError('')

    const { data, error } = await supabase.rpc('join_family_with_invite', {
      p_code: code,
      p_name: name,
      p_role: role,
      p_color: color,
    })

    if (error) {
      setFormError('Erro ao entrar na família. Tente novamente.')
      setJoining(false)
      return
    }

    const ERROR_MESSAGES = {
      invite_not_found: 'Convite não encontrado.',
      invite_expired: 'Este convite expirou.',
      invite_used: 'Este convite já foi utilizado.',
      member_limit: 'Limite de 6 membros atingido para esta família.',
    }

    if (data?.error) {
      setFormError(ERROR_MESSAGES[data.error] || 'Erro desconhecido.')
      setJoining(false)
      return
    }

    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-800 mb-2">Convite inválido</h2>
          <p className="text-sm text-gray-500 mb-6">{inviteError}</p>
          <button onClick={() => navigate('/')}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700">
            Ir para o início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Você foi convidado!</h1>
          {child && (
            <p className="text-sm text-gray-500 mt-1">
              Acesse o Compasso de <span className="font-medium text-gray-700">{child.name}</span>
            </p>
          )}
        </div>

        <form onSubmit={join} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Como você quer ser chamado(a)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Seu papel</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    role === r.value
                      ? 'bg-brand-50 border-brand-400 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Sua cor no calendário</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
          )}

          <button
            type="submit"
            disabled={joining}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {joining ? 'Entrando…' : 'Entrar na família'}
          </button>
        </form>
      </div>
    </div>
  )
}
