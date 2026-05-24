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
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'vacinas', label: 'Vacinas' },
          { id: 'consultas', label: 'Consultas' },
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
