import { useEffect, useState } from 'react'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const KINDS = [
  { id: 'guard_swap_requested',  label: 'Pedido de troca de guarda',    hint: 'Alta prioridade' },
  { id: 'guard_swap_approved',   label: 'Troca de guarda aprovada' },
  { id: 'guard_swap_denied',     label: 'Troca de guarda negada' },
  { id: 'guard_switch_eve',      label: 'Véspera de troca (aviso 24h antes)', hint: 'Diário, 08h' },
  { id: 'decision_created',      label: 'Novo combinado' },
  { id: 'consultation_created',  label: 'Nova consulta médica cadastrada' },
  { id: 'consultation_upcoming', label: 'Consulta amanhã (aviso 24h antes)', hint: 'Diário, 09h' },
  { id: 'expense_created',       label: 'Nova despesa' },
  { id: 'expense_settled',       label: 'Acerto de despesa recebido' },
  { id: 'document_created',      label: 'Novo documento' },
]

export default function Preferencias() {
  const { members } = useFamily()
  const [me, setMe] = useState(null)
  const [prefs, setPrefs] = useState(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const my = members.find(m => m.user_id === (supabase.auth.getUser?.() ? undefined : null)) // fallback
    // Get current user's member
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id
      const meMember = members.find(m => m.user_id === uid)
      setMe(meMember || null)
      if (meMember) loadPrefs(meMember.id)
    })
  }, [members])

  async function loadPrefs(memberId) {
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('member_id', memberId)
      .maybeSingle()
    setPrefs(data || {
      member_id: memberId,
      email_by_kind: {},
      push_by_kind: {},
      quiet_start: '22:00',
      quiet_end: '07:00',
    })
  }

  function toggleEmail(kind) {
    setPrefs(p => ({
      ...p,
      email_by_kind: {
        ...(p.email_by_kind || {}),
        [kind]: (p.email_by_kind?.[kind] === false) ? true : false,
      },
    }))
  }

  function togglePush(kind) {
    setPrefs(p => ({
      ...p,
      push_by_kind: {
        ...(p.push_by_kind || {}),
        [kind]: (p.push_by_kind?.[kind] === false) ? true : false,
      },
    }))
  }

  async function save() {
    if (!prefs || !me) return
    setSaving(true)
    setStatus('')
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        member_id: me.id,
        email_by_kind: prefs.email_by_kind || {},
        push_by_kind: prefs.push_by_kind || {},
        quiet_start: prefs.quiet_start,
        quiet_end: prefs.quiet_end,
        updated_at: new Date().toISOString(),
      })
    setSaving(false)
    setStatus(error ? `Erro: ${error.message}` : 'Preferências salvas.')
  }

  if (!me) return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="rotulo mb-2">Notificações</p>
        <h1 className="page-title">Preferências</h1>
      </div>
      <div className="esqueleto h-40" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="rotulo mb-2">Notificações</p>
        <h1 className="page-title">Preferências</h1>
      </div>

      <div className="card mb-4" style={{ padding: '20px 22px' }}>
        <p className="text-sm text-ink-mute">
          Escolha por qual canal quer ser avisado de cada evento. Push chega quando o app instalado estiver disponível (em breve).
        </p>
      </div>

      <div className="card">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3 border-b border-linha">
          <span className="rotulo">Evento</span>
          <span className="rotulo text-center">Email</span>
          <span className="rotulo text-center">Push</span>
        </div>
        {KINDS.map(k => {
          const emailOn = prefs?.email_by_kind?.[k.id] !== false
          const pushOn  = prefs?.push_by_kind?.[k.id]  !== false
          return (
            <div key={k.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 border-b border-linha last:border-b-0">
              <div>
                <p className="text-[14px] text-ink">{k.label}</p>
                {k.hint && <p className="text-[11px] text-ink-mute mt-0.5">{k.hint}</p>}
              </div>
              <Toggle checked={emailOn} onChange={() => toggleEmail(k.id)} />
              <Toggle checked={pushOn} onChange={() => togglePush(k.id)} />
            </div>
          )
        })}
      </div>

      <div className="card mt-4" style={{ padding: '20px 22px' }}>
        <p className="rotulo mb-3">Horário silencioso</p>
        <p className="text-sm text-ink-mute mb-3">Não enviaremos push neste intervalo. Emails seguem normalmente.</p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            De
            <input type="time" value={prefs?.quiet_start || '22:00'}
              onChange={e => setPrefs(p => ({ ...p, quiet_start: e.target.value }))}
              className="input w-32" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            até
            <input type="time" value={prefs?.quiet_end || '07:00'}
              onChange={e => setPrefs(p => ({ ...p, quiet_end: e.target.value }))}
              className="input w-32" />
          </label>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm text-ink-mute">{status}</span>
        <button onClick={save} disabled={saving} className="btn-primario">
          {saving ? 'Salvando…' : 'Salvar preferências'}
        </button>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button" onClick={onChange}
      className={`w-10 h-6 rounded-full transition-colors relative flex-none ${checked ? 'bg-bussola' : 'bg-linha'}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  )
}
