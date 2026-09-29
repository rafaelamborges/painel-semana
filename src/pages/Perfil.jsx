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
  const { child, permissions } = useFamily()
  const [profile, setProfile] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured || !child) { setLoading(false); return }
    setProfile(child.profile || {})
    setLoading(false)
  }, [child])

  async function save() {
    if (!child) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('children')
      .update({ profile })
      .eq('id', child.id)
    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    setEditing(false)
  }

  function set(key, value) {
    setProfile(p => ({ ...p, [key]: value }))
  }

  const canEdit = permissions?.canEdit || permissions?.canAdd

  if (loading) return <div className="max-w-3xl mx-auto"><div className="esqueleto h-40" /></div>
  if (!child) return (
    <div className="max-w-3xl mx-auto">
      <p className="corpo">Cadastre a criança no onboarding antes de preencher o perfil.</p>
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
          <p className={`text-[15px] ${highlight ? 'font-semibold text-alerta text-[18px]' : 'text-ink'}`}>
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

// Card compacto de atalho — usado em Home e Documentos
export function PerfilAtalhoCard({ child, profile }) {
  const p = profile || child?.profile || {}
  const filled = [
    p.full_name, p.cpf, p.blood_type, p.emergency_hospital,
    p.health_plan_operator, p.emergency_contact_name,
  ].filter(Boolean).length
  const total = 6

  return (
    <Link
      to="/perfil"
      className="card block hover:border-bussola/40 transition-colors"
      style={{ padding: '18px 20px' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-bussola-wash flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-bussola" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-ink">Perfil de {child?.name}</p>
          <p className="apoio mt-0.5">
            {filled === total
              ? 'Cartão completo — pronto pra emergência'
              : filled === 0
                ? 'Ainda não preenchido'
                : `${filled} de ${total} dados essenciais preenchidos`}
          </p>
          {p.blood_type && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-alerta/10 text-alerta text-[11px] font-semibold">
              Tipo sanguíneo {p.blood_type}
            </span>
          )}
        </div>
        <svg className="w-4 h-4 text-ink-mute flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
