import { useState, useEffect, useMemo } from 'react'
import { format, parseISO, isPast, isFuture, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSearchParams } from 'react-router-dom'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { generateVaccinationSchedule } from '../lib/pni'
import { EmptyState, EmptyDoctor } from '../components/illustrations'

const AREAS = [
  { id: 'vacinas',   label: 'Vacinas',   icon: IconVacinas   },
  { id: 'consultas', label: 'Consultas', icon: IconConsultas },
  { id: 'cartao',    label: 'Cartão',    icon: IconCartao    },
  { id: 'medicos',   label: 'Médicos',   icon: IconMedicos   },
  { id: 'remedios',  label: 'Remédios',  icon: IconRemedios  },
  { id: 'alergias',  label: 'Alergias',  icon: IconAlergias  },
  { id: 'exames',    label: 'Exames',    icon: IconExames    },
  { id: 'anotacoes', label: 'Anotações', icon: IconAnotacoes },
]

const NOTE_CATEGORY = {
  medicos:   { key: 'medico',  label: 'Médicos'   },
  remedios:  { key: 'remedio', label: 'Remédios'  },
  alergias:  { key: 'alergia', label: 'Alergias'  },
  exames:    { key: 'exame',   label: 'Exames'    },
  anotacoes: { key: 'geral',   label: 'Anotações' },
}

function IconVacinas({ className })   { return <div className={`${className} relative flex items-center justify-center`}><div className="absolute w-full h-[1.8px] bg-current" /><div className="absolute h-full w-[1.8px] bg-current" /></div> }
function IconConsultas({ className })  { return <div className={`${className} rounded-full border-[1.8px] border-current`} /> }
function IconCartao({ className })     { return <div className={`${className} rounded-[3px] border-[1.8px] border-current`} /> }
function IconMedicos({ className })    { return <div className={`${className} rounded-full border-[1.8px] border-current relative`}><div className="absolute inset-1 border-[1.8px] border-current rounded-full" /></div> }
function IconRemedios({ className })   { return <div className={`${className} rounded-full border-[1.8px] border-current flex items-center justify-center`}><div className="w-[45%] h-[1.8px] bg-current" /></div> }
function IconAlergias({ className })   { return <div className={`${className}`}><div className="w-full h-full border-[1.8px] border-current" style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }} /></div> }
function IconExames({ className })     { return <div className={`${className} flex flex-col justify-center gap-[3px]`}><div className="h-[1.8px] w-full bg-current" /><div className="h-[1.8px] w-[65%] bg-current" /><div className="h-[1.8px] w-[85%] bg-current" /></div> }
function IconAnotacoes({ className })  { return <div className={`${className} border-[1.8px] border-current rounded-sm relative`}><div className="absolute top-[25%] left-[20%] right-[35%] h-[1.8px] bg-current" /><div className="absolute top-[55%] left-[20%] right-[20%] h-[1.8px] bg-current" /></div> }

function buildWhatsAppUrl(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  // Se já começa com DDI (12+ dígitos), usa direto. Se tem 10-11 (BR sem +55), prepende 55.
  const withCountry = digits.length >= 12 ? digits : `55${digits}`
  return `https://wa.me/${withCountry}`
}

// Mapeia deep-links antigos (tab=…) e novos (area=…) para o id de área
function resolveInitialArea(params) {
  const raw = (params.get('area') || params.get('tab') || '').toLowerCase()
  if (!raw) return null
  if (raw === 'notas') return 'anotacoes'
  if (AREAS.some(a => a.id === raw)) return raw
  return null
}

export default function Saude() {
  const { child, family, permissions } = useFamily()
  const [searchParams, setSearchParams] = useSearchParams()
  const [area, setArea] = useState(() => resolveInitialArea(searchParams))
  const [consultations, setConsultations] = useState([])
  const [administered, setAdministered] = useState([])
  const [notesCounts, setNotesCounts] = useState({})
  const [cardPhotosCount, setCardPhotosCount] = useState(0)
  const [showConsultationForm, setShowConsultationForm] = useState(false)
  const [editingConsultation, setEditingConsultation] = useState(null)
  const [showVaccineForm, setShowVaccineForm] = useState(false)
  const [selectedVaccine, setSelectedVaccine] = useState(null)

  const vaccinationSchedule = child?.birth_date ? generateVaccinationSchedule(child.birth_date) : []

  useEffect(() => {
    if (!isSupabaseConfigured || !child) return
    loadConsultations()
    loadAdministered()
    loadNotesCounts()
    loadCardPhotosCount()
  }, [child])

  function goArea(id) {
    setArea(id)
    const next = new URLSearchParams(searchParams)
    if (id) next.set('area', id); else next.delete('area')
    next.delete('tab')
    setSearchParams(next, { replace: true })
  }

  async function loadConsultations() {
    const { data } = await supabase
      .from('health_consultations')
      .select('*')
      .eq('child_id', child.id)
      .order('date', { ascending: false })
    setConsultations(data || [])
  }

  async function loadAdministered() {
    const { data } = await supabase
      .from('health_vaccinations')
      .select('*')
      .eq('child_id', child.id)
      .eq('status', 'administered')
    setAdministered(data || [])
  }

  async function loadNotesCounts() {
    const { data } = await supabase
      .from('health_notes')
      .select('category')
      .eq('child_id', child.id)
    const counts = {}
    for (const row of (data || [])) counts[row.category] = (counts[row.category] || 0) + 1
    setNotesCounts(counts)
  }

  async function loadCardPhotosCount() {
    if (!family) return
    const folder = `${family.id}/${child.id}`
    const { data } = await supabase.storage.from('vaccination-cards').list(folder)
    setCardPhotosCount((data || []).length)
  }

  const administeredIds = new Set(administered.map(a => `${a.vaccine_id}_${a.dose_label}`))
  const administeredMap = new Map(administered.map(a => [`${a.vaccine_id}_${a.dose_label}`, a]))

  const overdueVaccines = vaccinationSchedule.filter(v => !administeredIds.has(v.id) && isPast(v.scheduledDate))
  const upcomingVaccines = vaccinationSchedule.filter(v => !administeredIds.has(v.id) && isFuture(v.scheduledDate))
    .slice(0, 6)
  const doneVaccines = vaccinationSchedule.filter(v => administeredIds.has(v.id))

  // Estados/contadores para os tiles
  const tileMeta = useMemo(() => ({
    vacinas:   overdueVaccines.length > 0
      ? { label: `${overdueVaccines.length} pendente${overdueVaccines.length > 1 ? 's' : ''}`, tone: 'alerta' }
      : upcomingVaccines.length > 0
        ? { label: `${upcomingVaccines.length} próxima${upcomingVaccines.length > 1 ? 's' : ''}`, tone: 'muted' }
        : { label: `${doneVaccines.length} em dia`, tone: 'muted' },
    consultas: { label: consultations.length ? `${consultations.length} registro${consultations.length > 1 ? 's' : ''}` : 'Nenhum registro', tone: 'muted' },
    cartao:    { label: cardPhotosCount ? `${cardPhotosCount} foto${cardPhotosCount > 1 ? 's' : ''}` : 'Nenhuma foto', tone: 'muted' },
    medicos:   { label: notesCounts.medico  ? `${notesCounts.medico} cadastrado${notesCounts.medico > 1 ? 's' : ''}`   : 'Nenhum cadastrado',  tone: 'muted' },
    remedios:  { label: notesCounts.remedio ? `${notesCounts.remedio} registro${notesCounts.remedio > 1 ? 's' : ''}`   : 'Nenhum registro',   tone: 'muted' },
    alergias:  { label: notesCounts.alergia ? `${notesCounts.alergia} registrada${notesCounts.alergia > 1 ? 's' : ''}` : 'Nenhuma registrada',tone: 'muted' },
    exames:    { label: notesCounts.exame   ? `${notesCounts.exame} registro${notesCounts.exame > 1 ? 's' : ''}`       : 'Nenhum registro',   tone: 'muted' },
    anotacoes: { label: notesCounts.geral   ? `${notesCounts.geral} nota${notesCounts.geral > 1 ? 's' : ''}`           : 'Nenhuma nota',      tone: 'muted' },
  }), [overdueVaccines.length, upcomingVaccines.length, doneVaccines.length, consultations.length, cardPhotosCount, notesCounts])

  const currentArea = AREAS.find(a => a.id === area)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabeçalho: home ou área */}
      {!area ? (
        <div className="mb-8">
          <p className="rotulo mb-2">Cuidado {child?.name ? `de ${child.name}` : ''}</p>
          <h1 className="page-title">Saúde</h1>
        </div>
      ) : (
        <div className="mb-6">
          <button onClick={() => goArea(null)} className="btn-texto text-ink-mute hover:text-ink mb-1">
            ← Saúde
          </button>
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <p className="rotulo mb-2">{tileMeta[area]?.label}</p>
              <h1 className="page-title">{currentArea?.label}</h1>
            </div>
          </div>
        </div>
      )}

      {/* HOME — grid de tiles */}
      {!area && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {AREAS.map(a => {
            const meta = tileMeta[a.id] || {}
            const Icon = a.icon
            return (
              <button
                key={a.id}
                onClick={() => goArea(a.id)}
                className="card-link text-left min-h-[124px] flex flex-col justify-between group"
              >
                <div className="w-10 h-10 rounded-full bg-bussola-wash flex items-center justify-center text-bussola group-hover:bg-bussola/15 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[17px] font-medium text-ink leading-tight">{a.label}</p>
                  <p className={`rotulo mt-1 ${meta.tone === 'alerta' ? 'text-alerta' : ''}`}>{meta.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Vacinas */}
      {area === 'vacinas' && (
        <div className="space-y-6">
          {upcomingVaccines.length > 0 && (
            <div>
              <p className="rotulo mb-3">Próximas ({upcomingVaccines.length})</p>
              <div className="card-lista">
                {upcomingVaccines.map(v => (
                  <VaccineRow key={v.id} vaccine={v} status="upcoming"
                    onAdminister={permissions.canAdd ? () => { setSelectedVaccine(v); setShowVaccineForm(true) } : undefined}
                  />
                ))}
              </div>
            </div>
          )}
          {overdueVaccines.length > 0 && (
            <div>
              <p className="rotulo mb-3 text-alerta">Pendentes ({overdueVaccines.length})</p>
              <div className="card-lista">
                {overdueVaccines.map(v => (
                  <VaccineRow key={v.id} vaccine={v} status="overdue"
                    onAdminister={permissions.canAdd ? () => { setSelectedVaccine(v); setShowVaccineForm(true) } : undefined} />
                ))}
              </div>
            </div>
          )}
          {doneVaccines.length > 0 && (
            <div>
              <p className="rotulo mb-3">Em dia ({doneVaccines.length})</p>
              <div className="card-lista">
                {doneVaccines.map(v => (
                  <VaccineRow key={v.id} vaccine={v} status="done" administeredRecord={administeredMap.get(v.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consultas */}
      {area === 'consultas' && (
        <div>
          {permissions.canAdd && (
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowConsultationForm(true)} className="btn-primario">Nova consulta</button>
            </div>
          )}
          {consultations.length === 0 ? (
            <div className="card py-10 text-center">
              <p className="font-display leading-[1.1]" style={{ fontSize: '26px', fontWeight: 200 }}>
                Nenhuma <em className="italic font-semibold">consulta</em> ainda.
              </p>
              <p className="corpo mt-2">Registre consultas, retornos e observações do médico.</p>
              {permissions.canAdd && (
                <button onClick={() => setShowConsultationForm(true)} className="btn-primario mt-5">Registrar consulta</button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map(c => (
                <ConsultationCard
                  key={c.id}
                  consultation={c}
                  canEdit={permissions.canEdit || permissions.canAdd}
                  canDelete={permissions.canDelete}
                  onEdit={() => setEditingConsultation(c)}
                  onDelete={async () => {
                    await supabase.from('health_consultations').delete().eq('id', c.id)
                    loadConsultations()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cartão */}
      {area === 'cartao' && (
        <VaccinationCardTab child={child} family={family} />
      )}

      {/* Categorias de notas: Médicos, Remédios, Alergias, Exames, Anotações */}
      {area && NOTE_CATEGORY[area] && (
        <NotesByCategoryTab
          category={NOTE_CATEGORY[area].key}
          areaLabel={NOTE_CATEGORY[area].label}
          childId={child?.id}
          familyId={family?.id}
          onChange={loadNotesCounts}
        />
      )}

      {showVaccineForm && selectedVaccine && (
        <VaccineForm
          vaccine={selectedVaccine}
          childId={child?.id}
          onClose={() => setShowVaccineForm(false)}
          onSaved={() => { setShowVaccineForm(false); loadAdministered() }}
        />
      )}

      {(showConsultationForm || editingConsultation) && (
        <ConsultationForm
          childId={child?.id}
          familyId={family?.id}
          consultation={editingConsultation}
          onClose={() => { setShowConsultationForm(false); setEditingConsultation(null) }}
          onSaved={() => { setShowConsultationForm(false); setEditingConsultation(null); loadConsultations(); loadNotesCounts() }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colorMap = {
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  }
  return (
    <div className={`rounded-2xl p-4 ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  )
}

function VaccineRow({ vaccine, status, onAdminister, administeredRecord }) {
  const pill =
    status === 'overdue'  ? { label: 'PENDENTE', cls: 'pill-urgente' } :
    status === 'upcoming' ? { label: 'PRÓXIMA',  cls: 'pill-proximo' } :
                            { label: 'EM DIA',   cls: 'pill-neutro' }
  return (
    <div className="linha-item">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-normal text-ink">{vaccine.vaccine_name}</p>
        {status === 'done' && administeredRecord?.administered_date ? (
          <p className="apoio">{vaccine.dose_label} · Aplicada em {format(parseISO(administeredRecord.administered_date), 'dd/MM/yyyy')}</p>
        ) : (
          <p className="apoio">{vaccine.dose_label} · Prevista para {format(vaccine.scheduledDate, 'dd/MM/yyyy')}</p>
        )}
      </div>
      <span className={pill.cls}>{pill.label}</span>
      {(status === 'overdue' || status === 'upcoming') && onAdminister && (
        <button onClick={onAdminister} className="btn-texto ml-3">Registrar</button>
      )}
    </div>
  )
}

function ConsultationCard({ consultation, canEdit, canDelete, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-800">{consultation.specialty || 'Consulta'}</p>
          {consultation.doctor_name && <p className="text-sm text-gray-500">Dr(a). {consultation.doctor_name}</p>}
          <p className="text-xs text-gray-400 mt-0.5">
            {format(new Date(consultation.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            {consultation.time && ` · ${consultation.time.slice(0, 5)}`}
          </p>
        </div>
        {consultation.next_return && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg flex-shrink-0">
            Retorno: {format(new Date(consultation.next_return), 'dd/MM/yyyy')}
          </span>
        )}
      </div>
      {consultation.notes && <p className="text-sm text-gray-600 mt-2 border-t border-gray-50 pt-2">{consultation.notes}</p>}
      {(canEdit || canDelete) && (
        <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-gray-50">
          {canEdit && !confirmDelete && (
            <button onClick={onEdit} className="btn-texto">Editar</button>
          )}
          {canDelete && (confirmDelete ? (
            <>
              <button onClick={() => setConfirmDelete(false)} className="btn-texto text-ink-mute">Cancelar</button>
              <button onClick={() => { setConfirmDelete(false); onDelete?.() }} className="btn-texto text-alerta">Confirmar remoção</button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="btn-texto text-ink-mute hover:text-alerta">Remover</button>
          ))}
        </div>
      )}
    </div>
  )
}

function VaccineForm({ vaccine, childId, onClose, onSaved }) {
  const [adminDate, setAdminDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('health_vaccinations').upsert({
      child_id: childId,
      vaccine_id: vaccine.vaccine_id,
      vaccine_name: vaccine.vaccine_name,
      dose_label: vaccine.dose_label,
      scheduled_date: format(vaccine.scheduledDate, 'yyyy-MM-dd'),
      administered_date: adminDate,
      status: 'administered',
      notes: notes || null,
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-4">Registrar vacina aplicada</h3>
        <p className="text-sm text-gray-600 mb-4">{vaccine.vaccine_name} – {vaccine.dose_label}</p>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Data de aplicação</label>
            <input type="date" value={adminDate} onChange={e => setAdminDate(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Observações</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Lote, unidade de saúde…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConsultationForm({ childId, familyId, consultation, onClose, onSaved }) {
  const isEdit = !!consultation
  const [date, setDate] = useState(consultation?.date || format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState(consultation?.time?.slice(0, 5) || '')
  const [doctor, setDoctor] = useState(consultation?.doctor_name || '')
  const [specialty, setSpecialty] = useState(consultation?.specialty || '')
  const [notes, setNotes] = useState(consultation?.notes || '')
  const [nextReturn, setNextReturn] = useState(consultation?.next_return || '')
  const [saving, setSaving] = useState(false)

  const [addToDoctors, setAddToDoctors] = useState(false)
  const [doctorPhone, setDoctorPhone] = useState('')
  const [doctorClinic, setDoctorClinic] = useState('')
  const [alreadyInList, setAlreadyInList] = useState(false)

  // Verifica se médico já está na lista quando nome muda
  useEffect(() => {
    const name = doctor.trim()
    if (!name || !childId) { setAlreadyInList(false); return }
    let cancelled = false
    supabase.from('health_notes')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('category', 'medico')
      .ilike('title', name)
      .then(({ count }) => { if (!cancelled) setAlreadyInList((count || 0) > 0) })
    return () => { cancelled = true }
  }, [doctor, childId])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      date,
      time: time || null,
      doctor_name: doctor || null,
      specialty: specialty || null,
      notes: notes || null,
      next_return: nextReturn || null,
    }
    if (isEdit) {
      await supabase.from('health_consultations').update(payload).eq('id', consultation.id)
    } else {
      await supabase.from('health_consultations').insert({ child_id: childId, ...payload })
    }

    // Também adiciona à lista de médicos se marcado
    if (addToDoctors && !alreadyInList && doctor.trim() && familyId) {
      await supabase.from('health_notes').insert({
        family_id: familyId,
        child_id: childId,
        category: 'medico',
        title: doctor.trim(),
        content: null,
        data: {
          specialty: specialty || '',
          phone: doctorPhone || '',
          clinic: doctorClinic || '',
        },
      })
    }

    setSaving(false)
    onSaved()
  }

  const canAddDoctor = !isEdit && doctor.trim().length > 1 && !alreadyInList

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-4">{isEdit ? 'Editar consulta' : 'Registrar consulta'}</h3>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Horário</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-32 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
          </div>
          <input type="text" placeholder="Especialidade (Pediatria, Neurologia…)" value={specialty} onChange={e => setSpecialty(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <input type="text" placeholder="Nome do médico(a)" value={doctor} onChange={e => setDoctor(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />

          {alreadyInList && !isEdit && (
            <p className="text-[12px] text-ink-mute -mt-1">Este médico já está na sua lista.</p>
          )}

          {canAddDoctor && (
            addToDoctors ? (
              <div className="rounded-xl border border-bussola/30 bg-bussola-wash/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-ink">Adicionar à lista de médicos</p>
                  <button type="button" onClick={() => setAddToDoctors(false)}
                    className="text-[12px] text-ink-mute hover:text-ink">Cancelar</button>
                </div>
                <input type="tel" placeholder="Telefone (com DDD) — usado no WhatsApp"
                  value={doctorPhone} onChange={e => setDoctorPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                <input type="text" placeholder="Consultório (opcional)"
                  value={doctorClinic} onChange={e => setDoctorClinic(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
            ) : (
              <button type="button" onClick={() => setAddToDoctors(true)}
                className="w-full py-2.5 text-[13px] text-bussola hover:text-bussola-press rounded-xl border border-dashed border-bussola/40 hover:bg-bussola-wash/40 transition-colors">
                + Adicionar à lista de médicos
              </button>
            )
          )}

          <textarea placeholder="Observações e recomendações" value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Próximo retorno</label>
            <input type="date" value={nextReturn} onChange={e => setNextReturn(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : (isEdit ? 'Salvar' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Notas por categoria ───────────────────────────────────────────────

const SEVERITY_CONFIG = {
  leve:     { label: 'Leve',     bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  moderada: { label: 'Moderada', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  grave:    { label: 'Grave',    bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700'    },
}

const IC = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'

function NotesByCategoryTab({ category, areaLabel, childId, familyId, onChange }) {
  const { permissions } = useFamily()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [setupRequired, setSetupRequired] = useState(false)

  async function load() {
    if (!childId) return
    const { data, error } = await supabase
      .from('health_notes')
      .select('*')
      .eq('child_id', childId)
      .eq('category', category)
      .order('created_at', { ascending: false })
    if (error?.code === '42P01') {
      setSetupRequired(true)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [childId, category])

  const addLabel = category === 'medico'  ? 'Adicionar médico'
                 : category === 'remedio' ? 'Adicionar remédio'
                 : category === 'alergia' ? 'Adicionar alergia'
                 : category === 'exame'   ? 'Adicionar exame'
                 : 'Nova nota'

  if (setupRequired) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <p className="text-sm font-semibold text-amber-800 mb-1">Configuração necessária</p>
        <p className="text-xs text-amber-700 mb-4">Execute o SQL abaixo no Supabase SQL Editor para ativar Anotações:</p>
        <pre className="bg-white border border-amber-100 rounded-xl p-4 text-xs overflow-x-auto text-gray-700 leading-relaxed whitespace-pre-wrap">{HEALTH_NOTES_SQL}</pre>
        <button
          onClick={() => { setSetupRequired(false); setLoading(true); load() }}
          className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          Verificar novamente
        </button>
      </div>
    )
  }

  const empty = !loading && notes.length === 0

  function refresh() { load(); onChange?.() }

  return (
    <div>
      {permissions.canAdd && !empty && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowForm(true)} className="btn-primario">{addLabel}</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="esqueleto h-20" />)}
        </div>
      ) : empty ? (
        <div className="card py-10 text-center">
          <p className="font-display leading-[1.1]" style={{ fontSize: '26px', fontWeight: 200 }}>
            Nenhum <em className="italic font-semibold">registro</em> ainda em {areaLabel}.
          </p>
          {permissions.canAdd && (
            <button onClick={() => setShowForm(true)} className="btn-primario mt-5">{addLabel}</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <NoteCard key={note.id} note={note} onDeleted={refresh} />
          ))}
        </div>
      )}

      {showForm && (
        <NoteForm
          category={category}
          childId={childId}
          familyId={familyId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refresh() }}
        />
      )}
    </div>
  )
}

function NoteCard({ note, onDeleted }) {
  const { permissions } = useFamily()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await supabase.from('health_notes').delete().eq('id', note.id)
    onDeleted()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      {note.category === 'geral'   && <GeralContent note={note} />}
      {note.category === 'remedio' && <RemedioContent note={note} />}
      {note.category === 'alergia' && <AlergiaContent note={note} />}
      {note.category === 'medico'  && <MedicoContent note={note} />}
      {note.category === 'exame'   && <ExameContent note={note} />}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-[10px] text-gray-300">
          {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </span>
        {permissions.canDelete && (confirmDelete ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-500 font-semibold hover:text-red-700">
              {deleting ? '…' : 'Confirmar exclusão'}
            </button>
          </div>
        ) : (
          <button onClick={handleDelete} className="text-xs text-gray-300 hover:text-red-400 transition-colors">Remover</button>
        ))}
      </div>
    </div>
  )
}

function GeralContent({ note }) {
  return (
    <div>
      {note.title && <p className="font-medium text-gray-800 mb-1">{note.title}</p>}
      {note.content && <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{note.content}</p>}
    </div>
  )
}

function RemedioContent({ note }) {
  const d = note.data || {}
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-bussola-wash flex items-center justify-center flex-shrink-0">
        <div className="w-4 h-4 rounded-sm border-[1.8px] border-bussola" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-gray-800">{note.title}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            d.active === false ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'
          }`}>{d.active === false ? 'Inativo' : 'Ativo'}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
          {d.dosage    && <span className="text-xs text-gray-500">Dose: <strong className="text-gray-700">{d.dosage}</strong></span>}
          {d.frequency && <span className="text-xs text-gray-500">Freq: <strong className="text-gray-700">{d.frequency}</strong></span>}
          {d.route     && <span className="text-xs text-gray-500">Via: <strong className="text-gray-700">{d.route}</strong></span>}
        </div>
        {note.content && <p className="text-xs text-gray-400 mt-1.5">{note.content}</p>}
      </div>
    </div>
  )
}

function AlergiaContent({ note }) {
  const d = note.data || {}
  const sev = SEVERITY_CONFIG[d.severity] || SEVERITY_CONFIG.leve
  return (
    <div className={`-m-4 p-4 rounded-xl ${sev.bg} border ${sev.border}`}>
      <div className="flex items-center gap-2 justify-between flex-wrap">
        <p className={`font-semibold ${sev.text}`}>{note.title}</p>
        {d.severity && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sev.badge}`}>{sev.label}</span>
        )}
      </div>
      {d.reaction  && <p className={`text-sm mt-1.5 ${sev.text} opacity-80`}>{d.reaction}</p>}
      {note.content && <p className={`text-xs mt-1 ${sev.text} opacity-60`}>{note.content}</p>}
    </div>
  )
}

function MedicoContent({ note }) {
  const d = note.data || {}
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-bussola-wash flex items-center justify-center flex-shrink-0">
        <div className="w-4 h-4 rounded-full border-[1.8px] border-bussola" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800">{note.title}</p>
        {d.specialty && <p className="text-xs text-brand-600 font-medium mt-0.5">{d.specialty}</p>}
        <div className="mt-1.5 space-y-1">
          {d.phone && (
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={`tel:${d.phone.replace(/\D/g, '')}`}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors w-fit"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {d.phone}
              </a>
              <a
                href={buildWhatsAppUrl(d.phone)}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors w-fit"
                aria-label="Falar por WhatsApp"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.92c0 2.1.55 4.15 1.6 5.96L2 22l4.24-1.11c1.75.95 3.72 1.46 5.72 1.46h.01c5.46 0 9.91-4.45 9.91-9.92 0-2.65-1.03-5.14-2.9-7.02A9.83 9.83 0 0012.04 2zm5.71 14.15c-.24.68-1.42 1.32-1.96 1.36-.53.04-1.03.23-3.46-.72-2.93-1.14-4.78-4.14-4.92-4.34-.15-.2-1.17-1.56-1.17-2.98 0-1.42.75-2.12 1.02-2.41.27-.29.59-.36.79-.36l.57.01c.18 0 .43-.07.67.51.24.6.82 2.06.9 2.21.07.15.12.32.02.52-.09.2-.14.32-.28.5-.14.17-.3.39-.42.52-.14.15-.29.31-.13.6.16.29.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.39.28.15.44.13.61-.08.16-.2.7-.82.89-1.1.19-.29.38-.24.63-.14.25.09 1.6.75 1.88.9.28.14.47.21.53.32.06.11.06.66-.17 1.34z" />
                </svg>
                WhatsApp
              </a>
            </div>
          )}
          {d.clinic && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {d.clinic}
            </p>
          )}
        </div>
        {note.content && <p className="text-xs text-gray-400 mt-1.5">{note.content}</p>}
      </div>
    </div>
  )
}

function ExameContent({ note }) {
  const d = note.data || {}
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-gray-800">{note.title}</p>
        {d.date && (
          <span className="text-xs text-gray-400 flex-shrink-0 bg-gray-50 px-2 py-0.5 rounded-lg">
            {format(new Date(d.date + 'T12:00:00'), 'dd/MM/yyyy')}
          </span>
        )}
      </div>
      {d.result && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Resultado</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{d.result}</p>
        </div>
      )}
      {note.content && <p className="text-xs text-gray-400 mt-2">{note.content}</p>}
    </div>
  )
}

function NoteForm({ category, childId, familyId, onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [data, setData] = useState({ active: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key, val) { setData(prev => ({ ...prev, [key]: val })) }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('health_notes').insert({
      child_id: childId,
      family_id: familyId,
      category,
      title: title.trim() || null,
      content: content.trim() || null,
      data,
    })
    if (err) { setError(err.message || 'Erro ao salvar.'); setSaving(false); return }
    onSaved()
  }

  const catConfig = NOTE_CATEGORIES.find(c => c.id === category)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
Adicionar {catConfig?.label}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={save} className="space-y-3">
          {category === 'geral' && (
            <>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Título (opcional)" className={IC} />
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Anotação…" required rows={5} className={`${IC} resize-none`} />
            </>
          )}

          {category === 'remedio' && (
            <>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Nome do remédio *" required className={IC} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={data.dosage || ''} onChange={e => set('dosage', e.target.value)}
                  placeholder="Dosagem (ex: 500mg)" className={IC} />
                <input type="text" value={data.frequency || ''} onChange={e => set('frequency', e.target.value)}
                  placeholder="Frequência" className={IC} />
              </div>
              <input type="text" value={data.route || ''} onChange={e => set('route', e.target.value)}
                placeholder="Via (oral, tópico, inalatório…)" className={IC} />
              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input type="checkbox" checked={data.active !== false}
                  onChange={e => set('active', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-400" />
                <span className="text-sm text-gray-600">Uso contínuo / ativo</span>
              </label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Observações (opcional)" rows={2} className={`${IC} resize-none`} />
            </>
          )}

          {category === 'alergia' && (
            <>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Substância / alérgeno *" required className={IC} />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Gravidade</p>
                <div className="flex gap-2">
                  {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                    <button key={key} type="button" onClick={() => set('severity', key)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        data.severity === key
                          ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={data.reaction || ''} onChange={e => set('reaction', e.target.value)}
                placeholder="Como se manifesta a reação" rows={2} className={`${IC} resize-none`} />
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Observações adicionais (opcional)" rows={2} className={`${IC} resize-none`} />
            </>
          )}

          {category === 'medico' && (
            <>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Nome do médico(a) *" required className={IC} />
              <input type="text" value={data.specialty || ''} onChange={e => set('specialty', e.target.value)}
                placeholder="Especialidade (Pediatria, Neurologia…)" className={IC} />
              <div className="relative">
                <input type="tel" value={data.phone || ''} onChange={e => set('phone', e.target.value)}
                  placeholder="Telefone / WhatsApp" className={`${IC} pl-10`} />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input type="text" value={data.clinic || ''} onChange={e => set('clinic', e.target.value)}
                placeholder="Consultório / endereço" className={IC} />
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Observações (opcional)" rows={2} className={`${IC} resize-none`} />
            </>
          )}

          {category === 'exame' && (
            <>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Nome do exame *" required className={IC} />
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data do exame</label>
                <input type="date" value={data.date || ''} onChange={e => set('date', e.target.value)} className={IC} />
              </div>
              <textarea value={data.result || ''} onChange={e => set('result', e.target.value)}
                placeholder="Resultado / laudo do exame" rows={3} className={`${IC} resize-none`} />
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Observações adicionais (opcional)" rows={2} className={`${IC} resize-none`} />
            </>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Vaccination Card ────────────────────────────────────────────────────

const MAX_PHOTOS = 5

function VaccinationCardTab({ child, family }) {
  const [photos, setPhotos] = useState([]) // [{ path, url }]
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { permissions } = useFamily()

  const folder = `${family?.id}/${child?.id}`

  useEffect(() => {
    if (!child || !family) return
    loadPhotos()
  }, [child, family])

  async function loadPhotos() {
    setLoading(true)
    const { data: files } = await supabase.storage
      .from('vaccination-cards')
      .list(folder)
    if (files?.length) {
      const signed = await Promise.all(
        files.map(async f => {
          const path = `${folder}/${f.name}`
          const { data } = await supabase.storage
            .from('vaccination-cards')
            .createSignedUrl(path, 3600)
          return data?.signedUrl ? { path, url: data.signedUrl } : null
        })
      )
      setPhotos(signed.filter(Boolean))
    }
    setLoading(false)
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const slots = MAX_PHOTOS - photos.length
    const toUpload = files.slice(0, slots)
    if (toUpload.length < files.length)
      setError(`Limite de ${MAX_PHOTOS} fotos atingido. Apenas ${toUpload.length} arquivo(s) enviados.`)
    else setError('')

    const usedNums = photos.map(p => {
      const m = p.path.match(/vaccination-card-(\d+)/)
      return m ? parseInt(m[1]) : 0
    })

    setUploading(true)
    const newPhotos = []
    for (const file of toUpload) {
      if (file.size > 10 * 1024 * 1024) { setError(`${file.name}: máx 10 MB.`); continue }
      let slot = 1
      while (usedNums.includes(slot)) slot++
      usedNums.push(slot)
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${folder}/vaccination-card-${slot}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('vaccination-cards')
        .upload(path, file, { upsert: true })
      if (uploadError) {
        setError('Erro ao enviar. Tente novamente.')
      } else {
        const { data } = await supabase.storage.from('vaccination-cards').createSignedUrl(path, 3600)
        if (data?.signedUrl) newPhotos.push({ path, url: data.signedUrl })
      }
    }
    setPhotos(prev => [...prev, ...newPhotos])
    setUploading(false)
    e.target.value = ''
  }

  async function handleRemove(photo) {
    setUploading(true)
    await supabase.storage.from('vaccination-cards').remove([photo.path])
    setPhotos(prev => prev.filter(p => p.path !== photo.path))
    setUploading(false)
  }

  const canAddMore = permissions.canAdd && photos.length < MAX_PHOTOS

  return (
    <div className="max-w-lg">
      <div className="card">
        <h3 className="section-title mb-1">Fotos do cartão de vacinação</h3>
        <p className="body-sm text-slate-400 mb-4">
          Até {MAX_PHOTOS} fotos do cartão físico de {child?.name} · JPG, PNG ou PDF · Máx 10 MB cada
        </p>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {(photos.length > 0 || canAddMore) && (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo, idx) => (
                  <div key={photo.path} className="relative group">
                    <img
                      src={photo.url}
                      alt={`Cartão ${idx + 1}`}
                      className="w-full h-40 object-cover rounded-xl border border-gray-100"
                    />
                    {permissions.canAdd && (
                      <button
                        onClick={() => handleRemove(photo)}
                        disabled={uploading}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-40"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {canAddMore && (
                  <label className="cursor-pointer">
                    <input
                      type="file" accept="image/*,application/pdf"
                      multiple className="hidden"
                      onChange={handleUpload} disabled={uploading}
                    />
                    <div className="h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
                      {uploading ? (
                        <p className="text-xs text-slate-400">Enviando…</p>
                      ) : (
                        <>
                          <span className="text-2xl text-gray-300">+</span>
                          <span className="text-xs text-gray-400">
                            {photos.length === 0 ? 'Adicionar fotos' : `${MAX_PHOTOS - photos.length} restante${MAX_PHOTOS - photos.length !== 1 ? 's' : ''}`}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            )}

            {photos.length === 0 && !permissions.canAdd && (
              <div className="text-center py-10 text-gray-400 text-sm">Nenhum cartão enviado ainda.</div>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      </div>
    </div>
  )
}

const HEALTH_NOTES_SQL = `create table if not exists health_notes (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade not null,
  family_id uuid references families(id) on delete cascade not null,
  category text not null,
  title text,
  content text,
  data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table health_notes enable row level security;
create policy "Family members manage health notes"
  on health_notes for all
  using (family_id in (
    select family_id from family_members where user_id = auth.uid()
  ));`
