import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getGuardForDate } from '../lib/guard'
import { getVaccineAlerts } from '../lib/pni'

export default function Dashboard() {
  const { child, family, members, guardPattern, guardianColors, guardianLabels } = useFamily()
  const [events, setEvents] = useState([])
  const [therapyAlert, setTherapyAlert] = useState(null)
  const today = new Date()

  const currentGuard = guardPattern ? getGuardForDate(today, guardPattern) : null
  const guardColor = currentGuard ? guardianColors[currentGuard] : null
  const guardLabel = currentGuard ? guardianLabels[currentGuard] : null

  const vaccineAlerts = child?.birth_date ? getVaccineAlerts(child.birth_date) : []
  const urgentVaccines = vaccineAlerts.filter(v => v.status === 'overdue').slice(0, 3)
  const upcomingVaccines = vaccineAlerts.filter(v => v.status === 'scheduled').slice(0, 2)

  useEffect(() => {
    if (!isSupabaseConfigured || !family) return
    loadEvents()
    checkTherapy()
  }, [family])

  async function loadEvents() {
    const from = today.toISOString()
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14).toISOString()
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('family_id', family.id)
      .gte('start_at', from)
      .lte('start_at', to)
      .order('start_at')
      .limit(5)
    setEvents(data || [])
  }

  async function checkTherapy() {
    const { data } = await supabase
      .from('therapy_records')
      .select('recorded_at')
      .eq('child_id', child?.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
    if (!data?.length) {
      setTherapyAlert({ daysAgo: null, message: 'Nenhum registro de terapia ainda.' })
      return
    }
    const last = new Date(data[0].recorded_at)
    const days = differenceInDays(today, last)
    if (days > 10) setTherapyAlert({ daysAgo: days, message: `Último registro de terapia há ${days} dias.` })
  }

  function formatEventDate(dateStr) {
    const d = parseISO(dateStr)
    if (isToday(d)) return `Hoje, ${format(d, 'HH:mm')}`
    if (isTomorrow(d)) return `Amanhã, ${format(d, 'HH:mm')}`
    return format(d, "dd/MM, HH:mm", { locale: ptBR })
  }

  const greeting = () => {
    const h = today.getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">
          {greeting()}! {child ? `Olhando pelo ${child.name}` : 'Bem-vindo ao Compasso'}
        </h1>
        <p className="body-sm mt-0.5 capitalize">
          {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Guard card */}
      {guardColor && (
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: guardColor.lightHex }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: guardColor.hex + '30' }}>
            {currentGuard === 'mother' ? '💙' : '💚'}
          </div>
          <div>
            <p className="label-muted">Guarda esta semana</p>
            <p className="text-lg font-bold" style={{ color: guardColor.hex }}>{guardLabel}</p>
            {child && <p className="body-sm">{child.name} está com {guardLabel} até segunda-feira</p>}
          </div>
          <Link to="/guarda" className="ml-auto text-xs font-medium hover:underline" style={{ color: guardColor.hex }}>
            Ver calendário →
          </Link>
        </div>
      )}

      {/* Agenda preview — full width */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Próximos eventos</h2>
          <Link to="/agenda" className="text-xs text-brand-600 hover:underline">Ver agenda →</Link>
        </div>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <p className="body-sm text-slate-400">Agenda limpa nos próximos 14 dias</p>
            <Link to="/agenda" className="mt-2 inline-block text-xs text-brand-600 hover:underline">Adicionar evento</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {events.map(ev => {
              const evDate = parseISO(ev.start_at)
              const evGuard = guardPattern ? getGuardForDate(evDate, guardPattern) : null
              const evColor = evGuard ? guardianColors[evGuard] : null
              return (
                <div key={ev.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: evColor?.hex || '#9ca3af' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{ev.title}</p>
                    {ev.location && <p className="label-muted truncate">{ev.location}</p>}
                  </div>
                  <p className="label-muted flex-shrink-0 text-right">{formatEventDate(ev.start_at)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/saude?tab=anotacoes', icon: '📝', label: 'Anotações de Saúde' },
          { to: '/decisoes', icon: '🤝', label: 'Nova decisão' },
          { to: '/guarda', icon: '🛡️', label: 'Calendário de guarda' },
          { to: '/documentos', icon: '📁', label: 'Documentos' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="bg-white rounded-2xl border shadow-card p-4 text-center hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
            style={{ borderColor: 'var(--border)' }}>
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-xs font-medium text-slate-600">{item.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Alertas</h2>
            <Link to="/lembretes" className="text-xs text-brand-600 hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {therapyAlert && (
              <AlertItem icon="🧠" color="amber" label="Terapia" message={therapyAlert.message} to="/saude" />
            )}
            {urgentVaccines.map(v => (
              <AlertItem key={v.id} icon="💉" color="red" label="Vacina atrasada"
                message={`${v.vaccine_name} – ${v.dose_label}`} to="/saude" />
            ))}
            {upcomingVaccines.map(v => (
              <AlertItem key={v.id} icon="💉" color="blue" label="Vacina próxima"
                message={`${v.vaccine_name} – ${v.dose_label}`} to="/saude" />
            ))}
            {!therapyAlert && urgentVaccines.length === 0 && upcomingVaccines.length === 0 && (
              <p className="body-sm text-slate-400 text-center py-4">Nenhum alerta no momento</p>
            )}
          </div>
        </div>

        {/* Child profile card */}
        {child && (
          <div className="card flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-2xl flex-shrink-0">
              {child.photo_url ? <img src={child.photo_url} alt={child.name} className="w-full h-full rounded-full object-cover" /> : '🧒'}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{child.name}</p>
              {child.birth_date && (
                <p className="body-sm">
                  {differenceInDays(today, parseISO(child.birth_date)) > 0
                    ? `${Math.floor(differenceInDays(today, parseISO(child.birth_date)) / 365)} anos`
                    : ''}
                  {child.school ? ` · ${child.school}` : ''}
                  {child.grade ? ` · ${child.grade}` : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AlertItem({ icon, color, label, message, to }) {
  const colorMap = {
    red: 'bg-red-50 text-red-700 border-red-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
  }
  return (
    <Link to={to} className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${colorMap[color]} hover:opacity-80 transition-opacity`}>
      <span className="text-base leading-none mt-0.5">{icon}</span>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="opacity-80">{message}</p>
      </div>
    </Link>
  )
}
