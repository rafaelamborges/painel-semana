import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const SHIFTS = [
  { id: 'manha',    label: 'Manhã' },
  { id: 'tarde',    label: 'Tarde' },
  { id: 'integral', label: 'Integral' },
  { id: 'noite',    label: 'Noite' },
]

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function Perfil() {
  const { child, permissions, sensitiveProfile, reload } = useFamily()
  const [profile, setProfile] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Ao trocar de criança (ou primeira montagem), sincroniza estado local
  // e sai do modo de edição pra não escrever no perfil errado.
  useEffect(() => {
    if (!isSupabaseConfigured || !child) { setLoading(false); return }
    setProfile(sensitiveProfile || {})
    setEditing(false)
    setError('')
    setLoading(false)
  }, [child?.id, sensitiveProfile])

  async function save() {
    if (!child) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('children_profile')
      .upsert({ child_id: child.id, data: profile, updated_at: new Date().toISOString() })
    if (err) { setError(err.message); setSaving(false); return }
    // Recarrega o context pra atualizar sensitiveProfile e os atalhos
    await reload()
    setSaving(false)
    setEditing(false)
  }

  function set(key, value) {
    setProfile(p => ({ ...p, [key]: value }))
  }

  const canEdit = permissions?.canEdit || permissions?.canAdd
  // sensitiveProfile null significa que RLS bloqueou a leitura (usuário
  // não tem role editor+ na família) — mostra estado de acesso restrito
  const noAccess = sensitiveProfile === null

  if (loading) return <div className="max-w-3xl mx-auto"><div className="esqueleto h-40" /></div>
  if (!child) return (
    <div className="max-w-3xl mx-auto">
      <p className="corpo">Cadastre a criança no onboarding antes de preencher o perfil.</p>
    </div>
  )
  if (noAccess) return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="rotulo mb-2">Cartão da criança</p>
        <h1 className="page-title">Perfil de {child.name}</h1>
      </div>
      <div className="card py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-nevoa mx-auto mb-4 flex items-center justify-center">
          <svg className="w-6 h-6 text-ink-mute" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="font-display leading-[1.1]" style={{ fontSize: '22px', fontWeight: 300 }}>
          Dados sensíveis <em className="italic font-semibold">restritos</em>.
        </p>
        <p className="corpo mt-3">
          O cartão da criança (CPF, RG, plano de saúde, contato de emergência) fica visível apenas para membros da família com permissão de <strong>edição</strong> ou superior.
        </p>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="rotulo mb-2">Cartão da criança</p>
          <h1 className="page-title">Perfil de {child.name}</h1>
        </div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="btn-primario">Editar</button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button onClick={() => { setProfile(child.profile || {}); setEditing(false) }} className="btn-secundario">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primario">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-alerta/10 border border-alerta/30 rounded-xl p-3">
          <p className="text-sm text-alerta">{error}</p>
        </div>
      )}

      {/* IDENTIDADE */}
      <Section title="Identidade">
        <Field label="Nome completo" value={profile.full_name} placeholder={child.name}
          editing={editing} onChange={v => set('full_name', v)} />
        <Field label="Data de nascimento"
          value={child.birth_date ? format(parseISO(child.birth_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : null}
          editing={false} hint="Configurado no onboarding" />
        <Field label="CPF" value={profile.cpf} editing={editing} onChange={v => set('cpf', v)} placeholder="000.000.000-00" />
        <Field label="RG" value={profile.rg} editing={editing} onChange={v => set('rg', v)} placeholder="00.000.000-0" />
      </Section>

      {/* ESCOLA */}
      <Section title="Escola">
        <Field label="Escola" value={child.school} editing={false} hint="Configurado no onboarding" />
        <Field label="Série / Turma" value={child.grade} editing={false} hint="Configurado no onboarding" />
        <Field label="Turno" value={profile.school_shift} editing={editing}
          options={SHIFTS} onChange={v => set('school_shift', v)} />
        <Field label="Telefone da secretaria" value={profile.school_phone} editing={editing}
          onChange={v => set('school_phone', v)} placeholder="(00) 0000-0000" type="tel" />
      </Section>

      {/* SAÚDE */}
      <Section title="Saúde" accent="alerta"
        subtitle="Informações vitais em caso de emergência">
        <Field label="Tipo sanguíneo" value={profile.blood_type} editing={editing}
          options={BLOOD_TYPES.map(b => ({ id: b, label: b }))}
          onChange={v => set('blood_type', v)} highlight />
        <Field label="Hospital de referência" value={profile.emergency_hospital} editing={editing}
          onChange={v => set('emergency_hospital', v)} placeholder="Ex: Hospital das Clínicas" />
        <Field label="Alergias conhecidas" value={profile.known_allergies} editing={editing}
          onChange={v => set('known_allergies', v)}
          placeholder="Ex: dipirona, amendoim, látex" multiline />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Plano de saúde" value={profile.health_plan_operator} editing={editing}
            onChange={v => set('health_plan_operator', v)} placeholder="Operadora" />
          <Field label="Nº da carteirinha" value={profile.health_plan_number} editing={editing}
            onChange={v => set('health_plan_number', v)} placeholder="0000000000" />
        </div>
      </Section>

      {/* CONTATO DE EMERGÊNCIA */}
      <Section title="Contato de emergência"
        subtitle="Quem a escola pode ligar se os guardiões estiverem indisponíveis">
        <Field label="Nome" value={profile.emergency_contact_name} editing={editing}
          onChange={v => set('emergency_contact_name', v)} placeholder="Ex: Maria Silva" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Telefone" value={profile.emergency_contact_phone} editing={editing}
            onChange={v => set('emergency_contact_phone', v)} placeholder="(00) 90000-0000" type="tel" />
          <Field label="Parentesco" value={profile.emergency_contact_relation} editing={editing}
            onChange={v => set('emergency_contact_relation', v)} placeholder="Ex: avó materna" />
        </div>
      </Section>

      <p className="text-xs text-ink-mute text-center mt-8">
        <Link to="/saude" className="text-bussola hover:underline">Precisa registrar vacinas, consultas ou medicações?</Link>
      </p>
    </div>
  )
}

function Section({ title, subtitle, accent, children }) {
  return (
    <div className="card mb-4" style={{ padding: '20px 22px' }}>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className={`text-[15px] font-medium ${accent === 'alerta' ? 'text-alerta' : 'text-ink'}`}>{title}</h2>
          {subtitle && <p className="apoio mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, value, editing, onChange, placeholder, hint, options, multiline, type, highlight }) {
  if (!editing) {
    return (
      <div>
        <p className="rotulo mb-1">{label}</p>
        {value ? (
          <p className={highlight ? 'text-[20px] font-semibold text-alerta' : 'text-[15px] text-ink'}>
            {options ? (options.find(o => o.id === value)?.label || value) : value}
          </p>
        ) : (
          <p className="text-[14px] text-ink-mute italic">
            Não informado
            {hint && <span className="not-italic"> · {hint}</span>}
          </p>
        )}
      </div>
    )
  }

  if (options) {
    return (
      <div>
        <label className="rotulo mb-1 block">{label}</label>
        <select value={value || ''} onChange={e => onChange(e.target.value)} className="input">
          <option value="">— selecione —</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
    )
  }

  if (multiline) {
    return (
      <div>
        <label className="rotulo mb-1 block">{label}</label>
        <textarea value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} rows={2} className="input resize-none" />
      </div>
    )
  }

  return (
    <div>
      <label className="rotulo mb-1 block">{label}</label>
      <input type={type || 'text'} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="input" />
    </div>
  )
}

// Card compacto de atalho — usado em Home e Documentos — vive em
// src/components/PerfilAtalhoCard.jsx pra desacoplar dessas rotas.

