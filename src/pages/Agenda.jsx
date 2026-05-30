import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, parseISO, isSameDay, addMonths, subMonths } from 'date-fns'
import { createGoogleCalendarEvent } from '../lib/googleCalendar'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getGuardForDate, getGuardPeriodsForMonth } from '../lib/guard'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function Agenda() {
  const { family, child, guardPattern, guardianColors, guardianLabels, permissions } = useFamily()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [swaps, setSwaps] = useState([])

  useEffect(() => {
    if (!isSupabaseConfigured || !family) return
    loadEvents()
    loadSwaps()
  }, [family, currentMonth])

  async function loadEvents() {
    const from = startOfMonth(currentMonth).toISOString()
    const to = endOfMonth(currentMonth).toISOString()
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('family_id', family.id)
      .gte('start_at', from)
      .lte('start_at', to)
      .order('start_at')
    setEvents(data || [])
  }

  async function loadSwaps() {
    const { data } = await supabase
      .from('guard_swaps')
      .select('*')
      .eq('family_id', family.id)
      .eq('status', 'accepted')
    setSwaps(data || [])
  }

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function getEventsForDay(day) {
    return events.filter(ev => isSameDay(parseISO(ev.start_at), day))
  }

  function getDayGuardColor(day) {
    if (!guardPattern) return null
    const guardian = getGuardForDate(day, guardPattern)
    return guardian ? guardianColors[guardian] : null
  }

  const selectedEvents = getEventsForDay(selectedDay)
  const selectedGuard = guardPattern ? getGuardForDate(selectedDay, guardPattern) : null
  const selectedGuardColor = selectedGuard ? guardianColors[selectedGuard] : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Eventos de {child?.name}</p>
        </div>
        {permissions.canAdd && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo evento
          </button>
        )}
      </div>

      {/* Guard legend */}
      {guardPattern && (
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span>Guarda:</span>
          {['mother', 'father'].map(g => (
            <span key={g} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: guardianColors[g].lightHex, border: `1.5px solid ${guardianColors[g].hex}` }} />
              {guardianLabels[g]}
            </span>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="font-semibold text-gray-800 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayGuardColor = getDayGuardColor(day)
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = isSameDay(day, selectedDay)
            const isTodayDay = isToday(day)

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`
                  min-h-[56px] p-1.5 border-b border-r border-gray-50 text-left transition-colors relative
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'ring-2 ring-inset ring-brand-400' : 'hover:bg-gray-50'}
                `}
                style={dayGuardColor && isCurrentMonth ? { backgroundColor: dayGuardColor.lightHex } : {}}
              >
                <span className={`
                  text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full
                  ${isTodayDay ? 'bg-brand-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}
                `}>
                  {format(day, 'd')}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map(ev => {
                    const evGuard = guardPattern ? getGuardForDate(parseISO(ev.start_at), guardPattern) : null
                    const evC = evGuard ? guardianColors[evGuard].hex : '#6d28d9'
                    return (
                      <div key={ev.id} className="truncate text-[10px] px-1 py-0.5 rounded text-white font-medium"
                        style={{ backgroundColor: evC }}>
                        {ev.title}
                      </div>
                    )
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 2}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">
            {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
            {selectedGuardColor && (
              <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                style={{ backgroundColor: selectedGuardColor.lightHex, color: selectedGuardColor.hex }}>
                Guarda: {guardianLabels[selectedGuard]}
              </span>
            )}
          </h3>
          {permissions.canAdd && (
            <button onClick={() => { setSelectedDay(selectedDay); setShowForm(true) }}
              className="text-xs text-brand-600 hover:underline">+ Evento</button>
          )}
        </div>
        {selectedEvents.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum evento neste dia</p>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map(ev => (
              <EventCard key={ev.id} event={ev} guardPattern={guardPattern} />
            ))}
          </div>
        )}
      </div>

      {/* New event modal */}
      {showForm && (
        <EventForm
          date={selectedDay}
          familyId={family?.id}
          childId={child?.id}
          guardPattern={guardPattern}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadEvents() }}
        />
      )}
    </div>
  )
}

function EventCard({ event, guardPattern }) {
  const { guardianColors } = useFamily()
  const evGuard = guardPattern ? getGuardForDate(parseISO(event.start_at), guardPattern) : null
  const evColor = evGuard ? guardianColors[evGuard] : null
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
      <div className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0 mt-1"
        style={{ backgroundColor: evColor?.hex || '#6d28d9' }} />
      <div className="min-w-0">
        <p className="font-medium text-gray-800 text-sm">{event.title}</p>
        <p className="text-xs text-gray-400">
          {format(parseISO(event.start_at), 'HH:mm')}
          {event.end_at && ` – ${format(parseISO(event.end_at), 'HH:mm')}`}
        </p>
        {event.location && <p className="text-xs text-gray-400">📍 {event.location}</p>}
        {event.description && <p className="text-xs text-gray-500 mt-1">{event.description}</p>}
      </div>
    </div>
  )
}

function EventForm({ date, familyId, childId, guardPattern, onClose, onSaved }) {
  const { guardianLabels } = useFamily()
  const { guardianColors } = useFamily()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [googleSynced, setGoogleSynced] = useState(false)

  const dateStr = format(date, 'yyyy-MM-dd')
  const autoGuard = guardPattern ? getGuardForDate(date, guardPattern) : null

  async function save(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const startAt = `${dateStr}T${startTime}:00`
      const endAt = `${dateStr}T${endTime}:00`

      const { data: saved, error: dbError } = await supabase
        .from('calendar_events')
        .insert({
          family_id: familyId,
          child_id: childId,
          title,
          description: description || null,
          start_at: startAt,
          end_at: endAt,
          location: location || null,
          source: 'manual',
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Sync to Google Calendar using provider token
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.provider_token
      if (accessToken && saved) {
        const googleId = await createGoogleCalendarEvent(accessToken, { title, description, location, start_at: startAt, end_at: endAt })
        if (googleId) {
          await supabase.from('calendar_events').update({ google_event_id: googleId }).eq('id', saved.id)
          setGoogleSynced(true)
        }
      }

      onSaved()
    } catch (err) {
      setError(err.message || 'Erro ao salvar evento. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Novo evento</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {autoGuard && (
          <div className="mb-4 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2"
            style={{ backgroundColor: guardianColors[autoGuard].lightHex, color: guardianColors[autoGuard].hex }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: guardianColors[autoGuard].hex }} />
            Responsável automático: {guardianLabels[autoGuard]}
          </div>
        )}
        <form onSubmit={save} className="space-y-3">
          <input type="text" placeholder="Título do evento" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Início</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Fim</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
          </div>
          <input type="text" placeholder="Local (opcional)" value={location} onChange={e => setLocation(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <textarea placeholder="Observações (opcional)" value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
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
