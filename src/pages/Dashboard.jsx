import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow, differenceInDays, parseISO,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getGuardForDate } from '../lib/guard'
import { getVaccineAlerts } from '../lib/pni'
import { CompassMascot } from '../components/illustrations'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border"
        style={{ background: 'linear-gradient(120deg, #FFF7ED 0%, #EEF2FF 60%, #FBCFE8 130%)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <CompassMascot size={72} wave />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="page-title">
              {greeting()}! {child ? `Olhando pelo ${child.name}` : 'Bem-vindo ao Compasso'}
            </h1>
            <p className="body-sm mt-0.5 capitalize">
              {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-10 w-40 h-40 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, #FDBA74, transparent)' }} />
      </div>

      {/* Guard card */}
      {guardColor && (
        <div
          className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${guardColor.hex}15 0%, ${guardColor.hex}30 100%)`, border: `1px solid ${guardColor.hex}30` }}
        >
          {/* Decorative circle */}
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10"
            style={{ backgroundColor: guardColor.hex }} />
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: guardColor.hex + '25' }}>
            {currentGuard === 'mother' ? '💙' : '💚'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="label-muted">Guarda esta semana</p>
            <p className="text-lg font-bold" style={{ color: guardColor.hex }}>{guardLabel}</p>
            {child && <p className="body-sm truncate">{child.name} está com {guardLabel}</p>}
          </div>
          <Link to="/guarda" className="ml-auto text-xs font-semibold hover:underline flex-shrink-0"
            style={{ color: guardColor.hex }}>
            Ver →
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

      {/* Monthly calendar with guard + events */}
      <HomeCalendar
        familyId={family?.id}
        guardPattern={guardPattern}
        guardianColors={guardianColors}
        guardianLabels={guardianLabels}
      />

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

function HomeCalendar({ familyId, guardPattern, guardianColors, guardianLabels }) {
  const [month, setMonth] = useState(() => new Date())
  const [monthEvents, setMonthEvents] = useState([])
  const [swaps, setSwaps] = useState([])

  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 0 })
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [month])

  useEffect(() => {
    if (!familyId) return
    const from = monthStart.toISOString()
    const to   = monthEnd.toISOString()
    supabase.from('calendar_events')
      .select('id, title, start_at')
      .eq('family_id', familyId)
      .gte('start_at', from).lte('start_at', to)
      .order('start_at')
      .then(({ data }) => setMonthEvents(data || []))
    supabase.from('guard_swaps')
      .select('id, requested_date, proposed_exchange_date, reason, status')
      .eq('family_id', familyId)
      .then(({ data }) => setSwaps(data || []))
  }, [familyId, month])

  const eventsByDay = useMemo(() => {
    const map = new Map()
    for (const ev of monthEvents) {
      const key = format(parseISO(ev.start_at), 'yyyy-MM-dd')
      const list = map.get(key) || []
      list.push(ev)
      map.set(key, list)
    }
    return map
  }, [monthEvents])

  function getManualOverride(day) {
    const dayStr = format(day, 'yyyy-MM-dd')
    for (const s of swaps) {
      if (!s.reason?.startsWith('[override:')) continue
      const start = s.requested_date
      const end = s.proposed_exchange_date || s.requested_date
      if (dayStr >= start && dayStr <= end) {
        return s.reason.match(/\[override:(mother|father)\]/)?.[1] || null
      }
    }
    return null
  }

  function guardianForDay(day) {
    if (!guardPattern) return null
    return getManualOverride(day) || getGuardForDate(day, guardPattern)
  }

  return (
    <div>
      {guardPattern && (
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <span>Guarda:</span>
          {['mother', 'father'].map(g => (
            <span key={g} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: guardianColors[g].lightHex, border: `1.5px solid ${guardianColors[g].hex}` }} />
              {guardianLabels[g]}
            </span>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={() => setMonth(m => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Mês anterior">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="font-semibold text-gray-800 capitalize">
            {format(month, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button onClick={() => setMonth(m => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Próximo mês">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, month)
            const today = isToday(day)
            const guardian = inMonth ? guardianForDay(day) : null
            const color = guardian ? guardianColors[guardian] : null
            const dayEvents = eventsByDay.get(format(day, 'yyyy-MM-dd')) || []

            return (
              <div key={i}
                className={`min-h-[56px] p-1.5 border-b border-r border-gray-50 text-left relative ${!inMonth ? 'opacity-30' : ''}`}
                style={color && inMonth ? { backgroundColor: color.lightHex } : {}}>
                <span className={`
                  text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full
                  ${today ? 'bg-brand-600 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'}
                `}>
                  {format(day, 'd')}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map(ev => {
                    const evGuard = guardPattern ? getGuardForDate(parseISO(ev.start_at), guardPattern) : null
                    const evC = evGuard ? guardianColors[evGuard].hex : '#6d28d9'
                    return (
                      <div key={ev.id} className="truncate text-[10px] px-1 py-0.5 rounded text-white font-medium"
                        style={{ backgroundColor: evC }} title={ev.title}>
                        {ev.title}
                      </div>
                    )
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 2}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
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
