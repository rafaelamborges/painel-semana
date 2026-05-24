import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, addMonths, subMonths, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getGuardForDate, GUARDIAN_COLORS, GUARDIAN_LABELS } from '../lib/guard'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function Guarda() {
  const { family, child, members, guardPattern } = useFamily()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [swaps, setSwaps] = useState([])
  const [showSwapForm, setShowSwapForm] = useState(false)
  const [tab, setTab] = useState('calendar') // 'calendar' | 'swaps'

  useEffect(() => {
    if (!isSupabaseConfigured || !family) return
    loadSwaps()
  }, [family])

  async function loadSwaps() {
    const { data } = await supabase
      .from('guard_swaps')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })
    setSwaps(data || [])
  }

  // Calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function getDayStyle(day) {
    if (!guardPattern) return {}
    const guardian = getGuardForDate(day, guardPattern)
    if (!guardian) return {}
    const color = GUARDIAN_COLORS[guardian]
    return { backgroundColor: color.lightHex }
  }

  // Weekly summary for this month
  const weeklySummary = []
  if (guardPattern) {
    let weekStart = new Date(gridStart)
    while (weekStart <= monthEnd) {
      const guardian = getGuardForDate(weekStart, guardPattern)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weeklySummary.push({
        start: new Date(weekStart),
        end: weekEnd,
        guardian,
      })
      weekStart = new Date(weekStart)
      weekStart.setDate(weekStart.getDate() + 7)
    }
  }

  const currentGuard = guardPattern ? getGuardForDate(new Date(), guardPattern) : null
  const currentGuardColor = currentGuard ? GUARDIAN_COLORS[currentGuard] : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guarda</h1>
          {currentGuardColor && (
            <p className="text-sm mt-0.5 font-medium" style={{ color: currentGuardColor.hex }}>
              Esta semana: {GUARDIAN_LABELS[currentGuard]}
            </p>
          )}
        </div>
        <button onClick={() => setShowSwapForm(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
          Solicitar troca
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ id: 'calendar', label: 'Calendário' }, { id: 'swaps', label: 'Trocas' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && (
        <>
          {/* Guard legend */}
          <div className="flex items-center gap-6 mb-4 text-sm">
            {['mother', 'father'].map(g => (
              <div key={g} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: GUARDIAN_COLORS[g].lightHex, borderColor: GUARDIAN_COLORS[g].hex }} />
                <span className="text-gray-600">{GUARDIAN_LABELS[g]}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-dashed border-gray-400" />
              <span className="text-gray-600">Troca aceita</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            {/* Month nav */}
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

            {/* Days */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isTodayDay = isToday(day)
                const style = isCurrentMonth ? getDayStyle(day) : {}
                // Highlight Tuesday (switch day) with a dot
                const isTuesday = getDay(day) === 2

                return (
                  <div key={i} className={`min-h-[48px] p-1.5 border-b border-r border-gray-50 ${!isCurrentMonth ? 'opacity-25' : ''}`}
                    style={style}>
                    <span className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${
                      isTodayDay ? 'bg-brand-600 text-white' : 'text-gray-700'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {isTuesday && isCurrentMonth && (
                      <div className="mt-0.5 text-[9px] text-gray-400 font-medium text-center">troca</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weekly breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Semanas do mês</h3>
            <div className="space-y-2">
              {weeklySummary.map((week, i) => {
                const c = week.guardian ? GUARDIAN_COLORS[week.guardian] : null
                return (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={c ? { backgroundColor: c.lightHex } : {}}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={c ? { backgroundColor: c.hex } : {}} />
                    <span className="text-sm text-gray-600 flex-1">
                      {format(week.start, 'dd/MM')} – {format(week.end, 'dd/MM')}
                    </span>
                    <span className="text-sm font-medium" style={c ? { color: c.hex } : {}}>
                      {week.guardian ? GUARDIAN_LABELS[week.guardian] : '–'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {tab === 'swaps' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Histórico de trocas</h3>
          {swaps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">Nenhuma troca registrada ainda</p>
              <button onClick={() => setShowSwapForm(true)} className="mt-3 text-xs text-brand-600 hover:underline">
                Solicitar primeira troca
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {swaps.map(swap => (
                <SwapCard key={swap.id} swap={swap} members={members} family={family} onUpdate={loadSwaps} />
              ))}
            </div>
          )}
        </div>
      )}

      {showSwapForm && (
        <SwapForm familyId={family?.id} onClose={() => setShowSwapForm(false)} onSaved={() => { setShowSwapForm(false); loadSwaps() }} />
      )}
    </div>
  )
}

function SwapCard({ swap, members, family, onUpdate }) {
  const requester = members.find(m => m.id === swap.requested_by)
  const statusColors = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  const statusLabels = {
    pending: 'Pendente',
    accepted: 'Aceita',
    rejected: 'Recusada',
    cancelled: 'Cancelada',
  }

  async function respond(status) {
    await supabase.from('guard_swaps').update({ status, resolved_at: new Date().toISOString() }).eq('id', swap.id)
    onUpdate()
  }

  return (
    <div className={`p-4 rounded-xl border ${statusColors[swap.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Troca solicitada para {format(new Date(swap.requested_date), 'dd/MM/yyyy')}</p>
          {swap.proposed_exchange_date && (
            <p className="text-xs opacity-75">Em troca por {format(new Date(swap.proposed_exchange_date), 'dd/MM/yyyy')}</p>
          )}
          {swap.reason && <p className="text-xs opacity-75 mt-1">"{swap.reason}"</p>}
          <p className="text-xs opacity-60 mt-1">Por {requester?.name || 'desconhecido'} · {format(new Date(swap.created_at), 'dd/MM/yyyy')}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full border flex-shrink-0 ${statusColors[swap.status]}`}>
          {statusLabels[swap.status]}
        </span>
      </div>
      {swap.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => respond('accepted')} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">Aceitar</button>
          <button onClick={() => respond('rejected')} className="flex-1 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors">Recusar</button>
        </div>
      )}
    </div>
  )
}

function SwapForm({ familyId, onClose, onSaved }) {
  const { members, getCurrentUserMember } = useFamily()
  const [requestedDate, setRequestedDate] = useState('')
  const [exchangeDate, setExchangeDate] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const me = getCurrentUserMember()
    await supabase.from('guard_swaps').insert({
      family_id: familyId,
      requested_date: requestedDate,
      proposed_exchange_date: exchangeDate || null,
      reason: reason || null,
      requested_by: me?.id || null,
      status: 'pending',
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Solicitar troca de guarda</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Data solicitada</label>
            <input type="date" value={requestedDate} onChange={e => setRequestedDate(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Data proposta em troca (opcional)</label>
            <input type="date" value={exchangeDate} onChange={e => setExchangeDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Motivo (opcional)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: viagem de trabalho"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Enviando…' : 'Solicitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
