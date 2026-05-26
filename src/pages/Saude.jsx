import { useState, useEffect } from 'react'
import { format, parseISO, isPast, isFuture, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { generateVaccinationSchedule } from '../lib/pni'

export default function Saude() {
  const { child, family } = useFamily()
  const [tab, setTab] = useState('vacinas')
  const [consultations, setConsultations] = useState([])
  const [administered, setAdministered] = useState([])
  const [showConsultationForm, setShowConsultationForm] = useState(false)
  const [showVaccineForm, setShowVaccineForm] = useState(false)
  const [selectedVaccine, setSelectedVaccine] = useState(null)

  const vaccinationSchedule = child?.birth_date ? generateVaccinationSchedule(child.birth_date) : []

  useEffect(() => {
    if (!isSupabaseConfigured || !child) return
    loadConsultations()
    loadAdministered()
  }, [child])

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

  const administeredIds = new Set(administered.map(a => `${a.vaccine_id}_${a.dose_label}`))

  const overdueVaccines = vaccinationSchedule.filter(v => !administeredIds.has(v.id) && isPast(v.scheduledDate))
  const upcomingVaccines = vaccinationSchedule.filter(v => !administeredIds.has(v.id) && isFuture(v.scheduledDate))
    .slice(0, 6)
  const doneVaccines = vaccinationSchedule.filter(v => administeredIds.has(v.id))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saúde</h1>
          <p className="text-sm text-gray-500 mt-0.5">{child?.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Vacinas em atraso" value={overdueVaccines.length} color="red" />
        <StatCard label="Próximas vacinas" value={upcomingVaccines.length} color="amber" />
        <StatCard label="Consultas registradas" value={consultations.length} color="green" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {[
          { id: 'vacinas', label: 'Vacinas' },
          { id: 'consultas', label: 'Consultas' },
          { id: 'anotacoes', label: 'Anotações' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'vacinas' && (
        <div className="space-y-5">
          {overdueVaccines.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Em atraso ({overdueVaccines.length})
              </h3>
              <div className="space-y-2">
                {overdueVaccines.map(v => (
                  <VaccineRow key={v.id} vaccine={v} status="overdue"
                    onAdminister={() => { setSelectedVaccine(v); setShowVaccineForm(true) }} />
                ))}
              </div>
            </div>
          )}

          {upcomingVaccines.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Próximas ({upcomingVaccines.length})
              </h3>
              <div className="space-y-2">
                {upcomingVaccines.map(v => (
                  <VaccineRow key={v.id} vaccine={v} status="upcoming"
                    onAdminister={() => { setSelectedVaccine(v); setShowVaccineForm(true) }} />
                ))}
              </div>
            </div>
          )}

          {doneVaccines.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Aplicadas ({doneVaccines.length})
              </h3>
              <div className="space-y-2">
                {doneVaccines.map(v => (
                  <VaccineRow key={v.id} vaccine={v} status="done" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'consultas' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowConsultationForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova consulta
            </button>
          </div>

          {consultations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400">Nenhuma consulta registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map(c => (
                <ConsultationCard key={c.id} consultation={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'anotacoes' && (
        <AnotacoesTab childId={child?.id} familyId={family?.id} />
      )}

      {showVaccineForm && selectedVaccine && (
        <VaccineForm
          vaccine={selectedVaccine}
          childId={child?.id}
          onClose={() => setShowVaccineForm(false)}
          onSaved={() => { setShowVaccineForm(false); loadAdministered() }}
        />
      )}

      {showConsultationForm && (
        <ConsultationForm
          childId={child?.id}
          onClose={() => setShowConsultationForm(false)}
          onSaved={() => { setShowConsultationForm(false); loadConsultations() }}
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

function VaccineRow({ vaccine, status, onAdminister }) {
  const daysUntil = differenceInDays(vaccine.scheduledDate, new Date())
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
      status === 'overdue' ? 'border-red-100 bg-red-50' :
      status === 'upcoming' ? 'border-amber-100 bg-amber-50' :
      'border-green-100 bg-green-50'
    }`}>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        status === 'overdue' ? 'bg-red-400' : status === 'upcoming' ? 'bg-amber-400' : 'bg-green-400'
      }`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${status === 'done' ? 'text-green-700' : 'text-gray-800'}`}>
          {vaccine.vaccine_name}
        </p>
        <p className="text-xs text-gray-500">
          {vaccine.dose_label} · Prevista: {format(vaccine.scheduledDate, 'dd/MM/yyyy')}
          {status === 'overdue' && <span className="text-red-500"> · {Math.abs(daysUntil)} dias atrás</span>}
          {status === 'upcoming' && daysUntil <= 90 && <span className="text-amber-600"> · em {daysUntil} dias</span>}
        </p>
      </div>
      {(status === 'overdue' || status === 'upcoming') && onAdminister && (
        <button onClick={onAdminister}
          className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
          Registrar
        </button>
      )}
      {status === 'done' && (
        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  )
}

function ConsultationCard({ consultation }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-800">{consultation.specialty || 'Consulta'}</p>
          {consultation.doctor_name && <p className="text-sm text-gray-500">Dr(a). {consultation.doctor_name}</p>}
          <p className="text-xs text-gray-400 mt-0.5">{format(new Date(consultation.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        {consultation.next_return && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg flex-shrink-0">
            Retorno: {format(new Date(consultation.next_return), 'dd/MM/yyyy')}
          </span>
        )}
      </div>
      {consultation.notes && <p className="text-sm text-gray-600 mt-2 border-t border-gray-50 pt-2">{consultation.notes}</p>}
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

function ConsultationForm({ childId, onClose, onSaved }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [doctor, setDoctor] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [notes, setNotes] = useState('')
  const [nextReturn, setNextReturn] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('health_consultations').insert({
      child_id: childId,
      date,
      doctor_name: doctor || null,
      specialty: specialty || null,
      notes: notes || null,
      next_return: nextReturn || null,
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-4">Registrar consulta</h3>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <input type="text" placeholder="Especialidade (Pediatria, Neurologia…)" value={specialty} onChange={e => setSpecialty(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <input type="text" placeholder="Nome do médico(a)" value={doctor} onChange={e => setDoctor(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
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
              {saving ? 'Salvando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Anotações ─────────────────────────────────────────────────────────

const NOTE_CATEGORIES = [
  { id: 'geral',   label: 'Geral',    emoji: '📝' },
  { id: 'remedio', label: 'Remédios', emoji: '💊' },
  { id: 'alergia', label: 'Alergias', emoji: '⚠️'  },
  { id: 'medico',  label: 'Médicos',  emoji: '🩺' },
  { id: 'exame',   label: 'Exames',   emoji: '🔬' },
]

const SEVERITY_CONFIG = {
  leve:     { label: 'Leve',     bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  moderada: { label: 'Moderada', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  grave:    { label: 'Grave',    bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700'    },
}

const IC = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300'

function AnotacoesTab({ childId, familyId }) {
  const [subTab, setSubTab] = useState('geral')
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
      .order('created_at', { ascending: false })
    if (error?.code === '42P01') {
      setSetupRequired(true)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [childId])

  const filtered = notes.filter(n => n.category === subTab)
  const currentCat = NOTE_CATEGORIES.find(c => c.id === subTab)

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

  return (
    <div>
      {/* Sub-category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {NOTE_CATEGORIES.map(cat => {
          const count = notes.filter(n => n.category === cat.id).length
          const active = subTab === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSubTab(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
              {count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none font-semibold ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar {currentCat?.label}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <p className="text-3xl mb-3">{currentCat?.emoji}</p>
          <p className="text-gray-500 font-medium">Nenhum registro em {currentCat?.label}</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-brand-600 hover:underline">
            + Adicionar primeiro
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => (
            <NoteCard key={note.id} note={note} onDeleted={load} />
          ))}
        </div>
      )}

      {showForm && (
        <NoteForm
          category={subTab}
          childId={childId}
          familyId={familyId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function NoteCard({ note, onDeleted }) {
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
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-500 font-semibold hover:text-red-700">
              {deleting ? '…' : 'Confirmar exclusão'}
            </button>
          </div>
        ) : (
          <button onClick={handleDelete} className="text-xs text-gray-300 hover:text-red-400 transition-colors">Remover</button>
        )}
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
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-lg">💊</div>
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
        <p className={`font-semibold ${sev.text} flex items-center gap-1.5`}>⚠️ {note.title}</p>
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
      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 text-lg">🩺</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800">{note.title}</p>
        {d.specialty && <p className="text-xs text-brand-600 font-medium mt-0.5">{d.specialty}</p>}
        <div className="mt-1.5 space-y-1">
          {d.phone && (
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
            <span>{catConfig?.emoji}</span> Adicionar {catConfig?.label}
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
