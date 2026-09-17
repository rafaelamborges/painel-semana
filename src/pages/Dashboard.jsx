import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow, differenceInDays, parseISO,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getGuardForDate, getGuardWeekStart, isDayBeforeSwap, isSwapDay, getNextSwapDate } from '../lib/guard'
import { getVaccineAlerts } from '../lib/pni'

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

export default function Dashboard() {
  const { child, family, guardPattern, guardianColors, guardianLabels } = useFamily()
  const [events, setEvents] = useState([])
  const [therapyAlert, setTherapyAlert] = useState(null)
  const today = new Date()

  const currentGuard = guardPattern ? getGuardForDate(today, guardPattern) : null
  const guardColor = currentGuard ? guardianColors[currentGuard] : null
  const guardLabel = currentGuard ? guardianLabels[currentGuard] : null

  // Período atual: início/fim da semana de guarda e progresso
  const weekStart = guardPattern ? getGuardWeekStart(today, guardPattern.switch_day ?? 2) : today
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6)
  const cumpridos = Math.max(0, differenceInDays(today, weekStart) + 1)
  const restantes = Math.max(0, differenceInDays(weekEnd, today))

  // Próxima troca: primeiro switch_day após hoje
  const proximaTroca = new Date(weekStart); proximaTroca.setDate(proximaTroca.getDate() + 7)

  const vaccineAlerts = child?.birth_date ? getVaccineAlerts(child.birth_date) : []
  const urgentVaccines = vaccineAlerts.filter(v => v.status === 'overdue').slice(0, 2)
  const upcomingVaccines = vaccineAlerts.filter(v => v.status === 'scheduled').slice(0, 1)

  useEffect(() => {
    if (!isSupabaseConfigured || !family) return
    loadEvents()
    checkTherapy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!data?.length) return
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

  const alertas = useMemo(() => {
    const out = []
    for (const v of urgentVaccines) {
      out.push({
        nivel: 'URGENTE', cor: 'text-alerta',
        texto: `${v.vaccine_name}, ${v.dose_label}: pendente.`,
      })
    }
    if (therapyAlert) {
      out.push({
        nivel: 'ATENÇÃO', cor: 'text-ink-mute',
        texto: therapyAlert.message,
      })
    }
    for (const v of upcomingVaccines) {
      out.push({
        nivel: 'INFORMATIVO', cor: 'text-ink-mute',
        texto: `${v.vaccine_name} — próxima dose.`,
      })
    }
    return out.slice(0, 2)
  }, [urgentVaccines, upcomingVaccines, therapyAlert])

  return (
    <div className="max-w-[1320px] mx-auto space-y-6">
      {/* Faixa de abertura */}
      <div className="faixa">
        <p className="rotulo mb-5">
          {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }).toUpperCase()}
        </p>
        {child && guardLabel && (
          <h1 className="display font-display" style={{ fontSize: 'clamp(30px,4.6vw,52px)', maxWidth: '16em' }}>
            {child.name} está com <em className="italic font-semibold">{guardLabel}</em> até {format(weekEnd, "EEEE", { locale: ptBR })}.
          </h1>
        )}
        {!child && (
          <h1 className="display font-display" style={{ fontSize: 'clamp(30px,4.6vw,52px)' }}>
            Duas casas. <em className="italic font-semibold">Uma só criança.</em>
          </h1>
        )}
        <div className="flex flex-wrap gap-3 mt-8">
          <Link to="/guarda" className="btn-primario">Propor troca de período</Link>
          <Link to="/saude" className="btn-secundario">Registrar consulta</Link>
        </div>
      </div>

      {/* Aviso da bolsa: véspera ou dia da troca */}
      {guardPattern && (isDayBeforeSwap(today, guardPattern) || isSwapDay(today, guardPattern)) && child && (
        <Link to="/bolsa" className="card-link block">
          <p className="rotulo mb-2">Bolsa de {child.name}</p>
          <p className="font-display leading-snug tracking-tight text-ink" style={{ fontSize: '22px', fontWeight: 200 }}>
            {isSwapDay(today, guardPattern)
              ? <>Hoje é <em className="italic font-semibold">dia de troca</em>. Que tal revisar a bolsa?</>
              : <>Amanhã é <em className="italic font-semibold">dia de troca</em>. Que tal deixar a bolsa pronta?</>}
          </p>
          <span className="btn-texto mt-3">Preparar bolsa →</span>
        </Link>
      )}

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Coluna 1 — Período atual */}
        <div className="flex flex-col gap-5 min-w-0">
          {guardColor && (
            <div className="card">
              <p className="rotulo mb-4">Período atual</p>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: guardColor.hex }} />
                <span className="text-[20px] font-medium leading-tight text-ink">{guardLabel}</span>
              </div>
              <p className="text-[15px] font-light text-ink-body">
                De {format(weekStart, "EEE, dd/MM", { locale: ptBR })} a {format(weekEnd, "EEE, dd/MM 'às' HH'h'", { locale: ptBR })}.
              </p>
              <div className="flex h-[6px] rounded-full overflow-hidden mt-5">
                <div style={{ flex: cumpridos || 1, backgroundColor: guardColor.hex }} />
                <div style={{ flex: restantes || 1, backgroundColor: guardColor.hex + '40' }} />
              </div>
              <div className="flex justify-between mt-2.5 rotulo">
                <span>{cumpridos} {cumpridos === 1 ? 'DIA CUMPRIDO' : 'DIAS CUMPRIDOS'}</span>
                <span>{restantes} {restantes === 1 ? 'RESTANTE' : 'RESTANTES'}</span>
              </div>
            </div>
          )}
          <div className="card">
            <p className="rotulo mb-4">Próxima troca</p>
            <p className="text-[17px] font-light leading-snug text-ink-body">
              {format(proximaTroca, "EEEE, dd/MM 'às' HH'h'", { locale: ptBR })}.
            </p>
          </div>
        </div>

        {/* Coluna 2 — Alertas + próximos registros */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Alertas</h2>
            <Link to="/lembretes" className="btn-texto">Ver todos</Link>
          </div>

          {alertas.length === 0 ? (
            <div className="card">
              <p className="corpo">Nenhum alerta agora.</p>
            </div>
          ) : (
            alertas.map((a, i) => (
              <Link key={i} to="/lembretes" className="card-link">
                <p className={`rotulo mb-2.5 ${a.cor}`}>{a.nivel}</p>
                <p className="text-[16px] font-light leading-snug text-ink-body">{a.texto}</p>
              </Link>
            ))
          )}

          <h2 className="section-title mt-3">Próximos registros</h2>
          {events.length === 0 ? (
            <div className="card">
              <p className="corpo">Agenda limpa nos próximos 14 dias.</p>
              <Link to="/agenda" className="btn-texto mt-2">Adicionar evento</Link>
            </div>
          ) : (
            <div className="card-lista">
              {events.map(ev => {
                const evDate = parseISO(ev.start_at)
                const evGuard = guardPattern ? getGuardForDate(evDate, guardPattern) : null
                const evColor = evGuard ? guardianColors[evGuard] : null
                return (
                  <div key={ev.id} className="linha-item">
                    <span className="ponto" style={{ backgroundColor: evColor?.hex || '#9896B0' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-normal text-ink truncate">{ev.title}</p>
                      {ev.location && <p className="apoio truncate">{ev.location}</p>}
                    </div>
                    <p className="font-mono text-[12px] text-ink-soft flex-shrink-0 text-right">{formatEventDate(ev.start_at)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Coluna 3 — Mini calendário + card de marca */}
        <div className="flex flex-col gap-5 min-w-0">
          <MiniCalendar familyId={family?.id} guardPattern={guardPattern} guardianColors={guardianColors} />
          <div className="card-marca">
            <p className="font-display leading-snug tracking-tight text-ink" style={{ fontSize: '24px', fontWeight: 200 }}>
              O histórico da criança <em className="italic font-semibold">é dela</em>.
            </p>
            <p className="text-[15px] font-light text-ink-body mt-3">
              Vacinas, agenda, documentos e combinados — em ordem, com autoria e data.
            </p>
            <Link to="/documentos" className="btn-texto mt-4">Abrir histórico</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniCalendar({ familyId, guardPattern, guardianColors }) {
  const [month, setMonth] = useState(() => new Date())
  const [monthEvents, setMonthEvents] = useState([])
  const [swaps, setSwaps] = useState([])

  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [month])

  useEffect(() => {
    if (!familyId) return
    supabase.from('calendar_events').select('id, start_at')
      .eq('family_id', familyId)
      .gte('start_at', monthStart.toISOString())
      .lte('start_at', monthEnd.toISOString())
      .then(({ data }) => setMonthEvents(data || []))
    supabase.from('guard_swaps').select('id, requested_date, proposed_exchange_date, reason')
      .eq('family_id', familyId)
      .then(({ data }) => setSwaps(data || []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, month])

  const eventsByDay = useMemo(() => {
    const map = new Map()
    for (const ev of monthEvents) {
      const key = format(parseISO(ev.start_at), 'yyyy-MM-dd')
      map.set(key, (map.get(key) || 0) + 1)
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
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="btn-icon" aria-label="Mês anterior">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <p className="rotulo">{format(month, "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase()}</p>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="btn-icon" aria-label="Próximo mês">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center rotulo py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, month)
          const today = isToday(day)
          const guardian = inMonth ? guardianForDay(day) : null
          const color = guardian ? guardianColors[guardian] : null
          const dayEvents = eventsByDay.get(format(day, 'yyyy-MM-dd')) || 0
          return (
            <div
              key={i}
              className="aspect-square rounded-md flex items-center justify-center relative"
              style={{
                backgroundColor: color ? color.lightHex : 'transparent',
                opacity: inMonth ? 1 : 0.3,
              }}
            >
              <span
                className={`text-[12px] font-normal ${today ? 'w-6 h-6 rounded-full bg-bussola text-white flex items-center justify-center' : 'text-ink'}`}
              >
                {format(day, 'd')}
              </span>
              {dayEvents > 0 && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-ink-mute" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
