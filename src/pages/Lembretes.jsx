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
    // Therapy
    ...(therapyDays === null || therapyDays > 10 ? [{
      id: 'therapy',
      type: 'therapy',
      priority: therapyDays === null ? 'high' : therapyDays > 20 ? 'high' : 'medium',
      icon: '🧠',
      title: 'Registro de terapia',
      description: therapyDays === null ? 'Nenhum registro ainda' : `Último registro há ${therapyDays} dias`,
      link: '/terapia',
    }] : []),

    // Overdue vaccines
    ...overdueVaccines.map(v => ({
      id: `vax_overdue_${v.id}`,
      type: 'vaccine_overdue',
      priority: 'high',
      icon: '💉',
      title: 'Vacina atrasada',
      description: `${v.vaccine_name} – ${v.dose_label}`,
      link: '/saude',
    })),

    // Upcoming events
    ...events.slice(0, 3).map(ev => {
      const daysUntil = differenceInDays(parseISO(ev.start_at), today)
      return {
        id: `event_${ev.id}`,
        type: 'event',
        priority: daysUntil <= 3 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
        icon: '📅',
        title: ev.title,
        description: `${format(parseISO(ev.start_at), "dd/MM 'às' HH:mm")}${ev.location ? ` · ${ev.location}` : ''}`,
        daysUntil,
        link: '/agenda',
      }
    }),

    // Upcoming vaccines
    ...upcomingVaccines.map(v => ({
      id: `vax_upcoming_${v.id}`,
      type: 'vaccine',
      priority: differenceInDays(v.scheduledDate, today) <= 30 ? 'medium' : 'low',
      icon: '💉',
      title: `Vacina: ${v.vaccine_name}`,
      description: `${v.dose_label} · Prevista para ${format(v.scheduledDate, 'dd/MM/yyyy')}`,
      link: '/saude',
    })),

    // Consultation returns
    ...consultations.map(c => ({
      id: `consult_${c.id}`,
      type: 'consultation',
      priority: differenceInDays(new Date(c.next_return), today) <= 7 ? 'high' : 'medium',
      icon: '🩺',
      title: `Retorno: ${c.specialty || 'Consulta'}`,
      description: format(new Date(c.next_return), "dd 'de' MMMM", { locale: ptBR }),
      link: '/saude',
    })),
  ]

  const sortedAlerts = allAlerts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })

  const priorityConfig = {
    high: { bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-400', label: 'Urgente' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-400', label: 'Atenção' },
    low: { bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-400', label: 'Info' },
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Central unificada de alertas</p>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 mb-6">
        {['high', 'medium', 'low'].map(p => {
          const count = sortedAlerts.filter(a => a.priority === p).length
          if (!count) return null
          const cfg = priorityConfig[p]
          return (
            <div key={p} className={`px-3 py-2 rounded-xl border ${cfg.bg} ${cfg.border}`}>
              <span className={`text-sm font-bold`}>{count}</span>
              <span className="text-xs ml-1 opacity-70">{cfg.label}</span>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-8">
          <EmptyState
            art={<EmptyReminders />}
            title="Tudo em dia!"
            subtitle="Nenhum alerta no momento — aproveite o dia com tranquilidade."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAlerts.map(alert => {
            const cfg = priorityConfig[alert.priority]
            return (
              <a key={alert.id} href={alert.link}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-opacity hover:opacity-80 ${cfg.bg} ${cfg.border}`}>
                <span className="text-xl flex-shrink-0">{alert.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{alert.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-medium text-gray-500">{cfg.label}</span>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {/* Birthday reminder */}
      {child?.birth_date && (() => {
        const birth = new Date(child.birth_date)
        const thisYear = new Date()
        const nextBirthday = new Date(thisYear.getFullYear(), birth.getMonth(), birth.getDate())
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1)
        const days = differenceInDays(nextBirthday, today)
        if (days > 30) return null
        return (
          <div className="mt-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-100 p-5 flex items-center gap-4">
            <span className="text-3xl">🎂</span>
            <div>
              <p className="font-semibold text-gray-800">Aniversário de {child.name}!</p>
              <p className="text-sm text-gray-600">
                {days === 0 ? 'É hoje! Feliz aniversário!' : `Em ${days} dia${days !== 1 ? 's' : ''}`} ·{' '}
                {format(nextBirthday, "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
