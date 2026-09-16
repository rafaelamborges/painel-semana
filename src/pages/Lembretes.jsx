import { useState, useEffect } from 'react'
import { format, isPast, isFuture, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getVaccineAlerts } from '../lib/pni'
import { getGuardForDate } from '../lib/guard'
import { EmptyState, EmptyReminders } from '../components/illustrations'

export default function Lembretes() {
  const { child, family, guardPattern } = useFamily()
  const [events, setEvents] = useState([])
  const [consultations, setConsultations] = useState([])
  const [therapyRecords, setTherapyRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const vaccineAlerts = child?.birth_date ? getVaccineAlerts(child.birth_date) : []

  useEffect(() => {
    if (!isSupabaseConfigured || !child) {
      setLoading(false)
      return
    }
    Promise.all([loadEvents(), loadConsultations(), loadTherapy()]).finally(() => setLoading(false))
  }, [child])

  async function loadEvents() {
    const today = new Date()
    const in30Days = new Date(today)
    in30Days.setDate(in30Days.getDate() + 30)
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('family_id', family.id)
      .gte('start_at', today.toISOString())
      .lte('start_at', in30Days.toISOString())
      .order('start_at')
    setEvents(data || [])
  }

  async function loadConsultations() {
    const { data } = await supabase
      .from('health_consultations')
      .select('*')
      .eq('child_id', child.id)
      .gte('next_return', new Date().toISOString().split('T')[0])
      .order('next_return')
      .limit(5)
    setConsultations(data || [])
  }

  async function loadTherapy() {
    const { data } = await supabase
      .from('therapy_records')
      .select('recorded_at')
      .eq('child_id', child.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
    setTherapyRecords(data || [])
  }

  const today = new Date()
  const lastTherapy = therapyRecords[0]
  const therapyDays = lastTherapy ? differenceInDays(today, parseISO(lastTherapy.recorded_at)) : null

  const overdueVaccines = vaccineAlerts.filter(v => v.status === 'overdue')
  const upcomingVaccines = vaccineAlerts.filter(v => v.status === 'scheduled').slice(0, 3)

  const allAlerts = [
    ...(therapyDays === null || therapyDays > 10 ? [{
      id: 'therapy',
      type: 'therapy',
      priority: therapyDays === null ? 'high' : therapyDays > 20 ? 'high' : 'medium',
      title: 'Registro de terapia',
      description: therapyDays === null ? 'Nenhum registro ainda' : `Último registro há ${therapyDays} dias`,
      origem: `Terapia · ${child?.name || 'criança'}`,
      link: '/terapia',
    }] : []),

    ...overdueVaccines.map(v => ({
      id: `vax_overdue_${v.id}`,
      type: 'vaccine_overdue',
      priority: 'high',
      title: `${v.vaccine_name}, ${v.dose_label}: pendente.`,
      description: `Prevista para ${format(v.scheduledDate, 'dd/MM/yyyy')}`,
      origem: `Calendário PNI · ${child?.name || 'criança'}`,
      link: '/saude',
    })),

    ...events.slice(0, 3).map(ev => {
      const daysUntil = differenceInDays(parseISO(ev.start_at), today)
      return {
        id: `event_${ev.id}`,
        type: 'event',
        priority: daysUntil <= 3 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
        title: ev.title,
        description: `${format(parseISO(ev.start_at), "dd/MM 'às' HH:mm")}${ev.location ? ` · ${ev.location}` : ''}`,
        origem: 'Agenda compartilhada',
        daysUntil,
        link: '/agenda',
      }
    }),

    ...upcomingVaccines.map(v => ({
      id: `vax_upcoming_${v.id}`,
      type: 'vaccine',
      priority: differenceInDays(v.scheduledDate, today) <= 30 ? 'medium' : 'low',
      title: `${v.vaccine_name} — próxima dose.`,
      description: `${v.dose_label} · Prevista para ${format(v.scheduledDate, 'dd/MM/yyyy')}`,
      origem: `Calendário PNI · ${child?.name || 'criança'}`,
      link: '/saude',
    })),

    ...consultations.map(c => ({
      id: `consult_${c.id}`,
      type: 'consultation',
      priority: differenceInDays(new Date(c.next_return), today) <= 7 ? 'high' : 'medium',
      title: `Retorno: ${c.specialty || 'Consulta'}`,
      description: format(new Date(c.next_return), "dd 'de' MMMM", { locale: ptBR }),
      origem: 'Consulta registrada',
      link: '/saude',
    })),
  ]

  const sortedAlerts = allAlerts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })

  const priorityConfig = {
    high:   { label: 'URGENTE',      cls: 'pill-urgente' },
    medium: { label: 'ATENÇÃO',      cls: 'pill-neutro' },
    low:    { label: 'INFORMATIVO',  cls: 'pill-neutro' },
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="rotulo mb-2">Central única</p>
        <h1 className="page-title">Alertas</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-bussola border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedAlerts.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="display font-display text-[26px]" style={{ fontWeight: 200 }}>
            Tudo <em className="italic font-semibold">em dia</em>.
          </p>
          <p className="corpo mt-3">Nenhum alerta no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAlerts.map(alert => {
            const cfg = priorityConfig[alert.priority]
            return (
              <a key={alert.id} href={alert.link} className="card-link block">
                <p className={`${cfg.cls} mb-3`}>{cfg.label}</p>
                <p className="text-[16px] font-light leading-snug text-ink-body">{alert.title}</p>
                {alert.description && <p className="apoio mt-2">{alert.description}</p>}
                {alert.origem && <p className="apoio mt-1">{alert.origem}</p>}
              </a>
            )
          })}
        </div>
      )}

      {child?.birth_date && (() => {
        const birth = new Date(child.birth_date)
        const thisYear = new Date()
        const nextBirthday = new Date(thisYear.getFullYear(), birth.getMonth(), birth.getDate())
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1)
        const days = differenceInDays(nextBirthday, today)
        if (days > 30) return null
        return (
          <div className="mt-4 card-marca">
            <p className="rotulo mb-3">Aniversário</p>
            <p className="font-display leading-snug tracking-tight text-ink" style={{ fontSize: '24px', fontWeight: 200 }}>
              {child.name}, <em className="italic font-semibold">{days === 0 ? 'é hoje' : `em ${days} ${days === 1 ? 'dia' : 'dias'}`}</em>.
            </p>
            <p className="corpo mt-2">
              {format(nextBirthday, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        )
      })()}
    </div>
  )
}
