import { useEffect, useState, useRef } from 'react'
import { useFamily } from '../context/FamilyContext'
import { useAuth } from '../context/AuthContext'
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
  const { user } = useAuth()
  const me = members.find(m => m.user_id === user?.id) || null
  const [prefs, setPrefs] = useState(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const loadedForRef = useRef(null) // evita overwrite de edições em andamento

  useEffect(() => {
    if (!isSupabaseConfigured || !me?.id) return
    if (loadedForRef.current === me.id) return
    loadedForRef.current = me.id
    loadPrefs(me.id)
  }, [me?.id])

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

      <PrivacyPanel me={me} />
    </div>
  )
}

function PrivacyPanel({ me }) {
  const [exporting, setExporting] = useState(false)
  const [msg, setMsg] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  async function exportData() {
    setMsg('')
    setExporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-family-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      if (!res.ok) throw new Error((await res.json()).error || 'Falha na exportação')
      // Baixa como arquivo
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compasso-dados-${new Date().toISOString().slice(0,10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMsg('Dados baixados com sucesso.')
    } catch (e) {
      setMsg('Erro: ' + (e.message || e))
    } finally {
      setExporting(false)
    }
  }

  const isSysadmin = me?.access_role === 'sysadmin'

  return (
    <>
      <div className="mt-10 pt-8 border-t border-linha">
        <h2 className="page-title" style={{ fontSize: '22px' }}>Seus dados</h2>
        <p className="corpo mt-2">
          Você tem direito à cópia dos seus dados e a solicitar sua exclusão a qualquer momento (LGPD, Art. 18).
        </p>

        <div className="card mt-5" style={{ padding: '18px 22px' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-ink">Baixar meus dados</p>
              <p className="apoio mt-1">
                Gera um arquivo JSON com tudo relacionado à sua família (agenda, saúde, despesas, documentos, decisões, notificações).
              </p>
            </div>
            <button onClick={exportData} disabled={exporting} className="btn-secundario">
              {exporting ? 'Preparando…' : 'Baixar JSON'}
            </button>
          </div>
        </div>

        {isSysadmin && (
          <div className="card mt-3" style={{ padding: '18px 22px', borderColor: '#FEE4E5' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-alerta">Excluir família e todos os dados</p>
                <p className="apoio mt-1">
                  Apaga permanentemente a família, todos os membros, criança(s), histórico de saúde, documentos, despesas, decisões e arquivos. <strong>Não tem volta.</strong> Só quem é sysadmin da família pode fazer isso.
                </p>
              </div>
              <button onClick={() => setShowDelete(true)} className="btn-secundario" style={{ borderColor: '#FEE4E5', color: '#B91C1C' }}>
                Excluir tudo
              </button>
            </div>
          </div>
        )}

        {msg && <p className="mt-3 text-sm text-ink-mute">{msg}</p>}
      </div>

      {showDelete && <DeleteFamilyModal onClose={() => setShowDelete(false)} />}
    </>
  )
}

function DeleteFamilyModal({ onClose }) {
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function doDelete() {
    setError('')
    setBusy(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-family`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ confirm: 'EXCLUIR TUDO' }),
        }
      )
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Falha na exclusão')
      }
      // Sai da sessão e volta pro login
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (e) {
      setError(e.message || String(e))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-ink text-[18px]">Excluir família e todos os dados</h3>
        <p className="corpo mt-3">
          Isso apaga permanentemente todos os dados desta família — inclusive documentos, comprovantes, fotos e histórico. <strong>Não pode ser desfeito.</strong>
        </p>
        <p className="text-sm text-ink mt-4">
          Pra confirmar, digite <strong>EXCLUIR TUDO</strong> no campo abaixo:
        </p>
        <input
          type="text"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="EXCLUIR TUDO"
          className="input mt-2"
          autoFocus
        />
        {error && <p className="text-alerta text-sm mt-3">{error}</p>}
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-secundario flex-1" disabled={busy}>Cancelar</button>
          <button
            onClick={doDelete}
            disabled={confirm !== 'EXCLUIR TUDO' || busy}
            className="btn-primario flex-1 disabled:opacity-40"
            style={{ background: '#B91C1C' }}
          >
            {busy ? 'Excluindo…' : 'Confirmar exclusão'}
          </button>
        </div>
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
