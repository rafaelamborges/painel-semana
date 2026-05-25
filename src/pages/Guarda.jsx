import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, addMonths, subMonths, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getGuardForDate, GUARDIAN_LABELS } from '../lib/guard'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const ROLE_LABELS = {
  mother: 'Mãe',
  father: 'Pai',
  babysitter: 'Babá',
  grandparent: 'Avó/Avô',
  relative: 'Parente',
  other: 'Outro',
}

export default function Guarda() {
  const { family, child, members, guardPattern, setGuardPattern, reload, guardianColors } = useFamily()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [swaps, setSwaps] = useState([])
  const [showSwapForm, setShowSwapForm] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [tab, setTab] = useState('calendar')

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

  function getDayStyle(day) {
    if (!guardPattern) return {}
    const override = getManualOverride(day)
    const guardian = override || getGuardForDate(day, guardPattern)
    if (!guardian) return {}
    const color = guardianColors[guardian]
    return {
      backgroundColor: color.lightHex,
      ...(override ? { outline: `2px solid ${color.hex}`, outlineOffset: '-2px' } : {}),
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const weeklySummary = []
  if (guardPattern) {
    let weekStart = new Date(gridStart)
    while (weekStart <= monthEnd) {
      const guardian = getGuardForDate(weekStart, guardPattern)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weeklySummary.push({ start: new Date(weekStart), end: weekEnd, guardian })
      weekStart = new Date(weekStart)
      weekStart.setDate(weekStart.getDate() + 7)
    }
  }

  const currentGuard = guardPattern ? getGuardForDate(new Date(), guardPattern) : null
  const currentGuardColor = currentGuard ? guardianColors[currentGuard] : null

  const tabs = [
    { id: 'calendar', label: 'Calendário' },
    { id: 'swaps', label: 'Trocas' },
    { id: 'members', label: 'Membros' },
    { id: 'history', label: 'Histórico' },
  ]

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
        <div className="flex gap-2">
          <button onClick={() => setShowManualForm(true)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Ajuste manual
          </button>
          <button onClick={() => setShowSwapForm(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
            Solicitar troca
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
            {['mother', 'father'].map(g => (
              <div key={g} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: guardianColors[g].lightHex, borderColor: guardianColors[g].hex }} />
                <span className="text-gray-600">{GUARDIAN_LABELS[g]}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: guardianColors['mother'].lightHex, outline: `2px solid ${guardianColors['mother'].hex}`, outlineOffset: '-2px' }} />
              <span className="text-gray-600">Ajuste manual</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="font-semibold text-gray-800 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 border-b border-gray-100">
              {WEEKDAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isTodayDay = isToday(day)
                const style = isCurrentMonth ? getDayStyle(day) : {}
                const isTuesday = getDay(day) === 2
                return (
                  <div key={i} className={`min-h-[48px] p-1.5 border-b border-r border-gray-50 ${!isCurrentMonth ? 'opacity-25' : ''}`} style={style}>
                    <span className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${isTodayDay ? 'bg-brand-600 text-white' : 'text-gray-700'}`}>
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

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Semanas do mês</h3>
            <div className="space-y-2">
              {weeklySummary.map((week, i) => {
                const c = week.guardian ? guardianColors[week.guardian] : null
                return (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={c ? { backgroundColor: c.lightHex } : {}}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={c ? { backgroundColor: c.hex } : {}} />
                    <span className="text-sm text-gray-600 flex-1">{format(week.start, 'dd/MM')} – {format(week.end, 'dd/MM')}</span>
                    <span className="text-sm font-medium" style={c ? { color: c.hex } : {}}>{week.guardian ? GUARDIAN_LABELS[week.guardian] : '–'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {tab === 'swaps' && (
        <div className="space-y-4">
          {swaps.some(s => s.reason?.startsWith('[override:')) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Ajustes manuais</h3>
              <div className="space-y-3">
                {swaps.filter(s => s.reason?.startsWith('[override:')).map(swap => (
                  <OverrideCard
                    key={swap.id} swap={swap}
                    familyId={family?.id} guardPattern={guardPattern}
                    members={members} setGuardPattern={setGuardPattern}
                    onUpdate={loadSwaps}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Trocas solicitadas</h3>
            {swaps.filter(s => !s.reason?.startsWith('[override:') && !s.reason?.startsWith('[reorganized:')).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Nenhuma troca registrada ainda</p>
                <button onClick={() => setShowSwapForm(true)} className="mt-3 text-xs text-brand-600 hover:underline">Solicitar primeira troca</button>
              </div>
            ) : (
              <div className="space-y-3">
                {swaps.filter(s => !s.reason?.startsWith('[override:') && !s.reason?.startsWith('[reorganized:')).map(swap => (
                  <SwapCard key={swap.id} swap={swap} members={members} family={family} onUpdate={loadSwaps} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <MembersTab familyId={family?.id} members={members} onMembersChanged={reload} />
      )}

      {tab === 'history' && (
        <HistoryTab swaps={swaps} members={members} />
      )}

      {showSwapForm && (
        <SwapForm familyId={family?.id} onClose={() => setShowSwapForm(false)} onSaved={() => { setShowSwapForm(false); loadSwaps() }} />
      )}
      {showManualForm && (
        <ManualOverrideForm familyId={family?.id} members={members} onClose={() => setShowManualForm(false)} onSaved={() => { setShowManualForm(false); loadSwaps() }} />
      )}
    </div>
  )
}

function OverrideCard({ swap, familyId, guardPattern, members, setGuardPattern, onUpdate }) {
  const { guardianColors } = useFamily()
  const guardian = swap.reason?.match(/\[override:(mother|father)\]/)?.[1]
  const color = guardian ? guardianColors[guardian] : null
  const note = swap.reason?.replace(/\[override:(mother|father)\]\s*/, '') || ''
  const [confirming, setConfirming] = useState(false)
  const [reorganizing, setReorganizing] = useState(false)

  const dateLabel = swap.requested_date === swap.proposed_exchange_date || !swap.proposed_exchange_date
    ? format(new Date(swap.requested_date + 'T12:00:00'), 'dd/MM/yyyy')
    : `${format(new Date(swap.requested_date + 'T12:00:00'), 'dd/MM')} – ${format(new Date(swap.proposed_exchange_date + 'T12:00:00'), 'dd/MM/yyyy')}`

  async function remove() {
    await supabase.from('guard_swaps').delete().eq('id', swap.id)
    onUpdate()
  }

  async function reorganize() {
    if (!guardPattern || !guardian) return
    setReorganizing(true)
    const refMember = members.find(m => m.role === guardian)
    const newPattern = {
      reference_date: swap.requested_date,
      reference_guardian: guardian,
      ...(refMember ? { reference_member_id: refMember.id } : {}),
    }
    await supabase.from('guard_patterns').update(newPattern).eq('id', guardPattern.id)
    await supabase.from('guard_swaps').insert({
      family_id: familyId,
      requested_date: swap.requested_date,
      proposed_exchange_date: swap.requested_date,
      reason: `[reorganized:${guardian}] A partir de ${format(new Date(swap.requested_date + 'T12:00:00'), 'dd/MM/yyyy')}`,
      status: 'accepted',
      resolved_at: new Date().toISOString(),
    })
    setGuardPattern({ ...guardPattern, ...newPattern })
    setConfirming(false)
    setReorganizing(false)
    onUpdate()
  }

  return (
    <div className="p-4 rounded-xl border border-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={color ? { backgroundColor: color.hex } : {}} />
          <div>
            <p className="text-sm font-medium text-gray-800">
              {guardian ? GUARDIAN_LABELS[guardian] : '–'} · {dateLabel}
            </p>
            {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setConfirming(c => !c)}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium">
            Reorganizar
          </button>
          <button onClick={remove} className="text-xs text-red-400 hover:text-red-600">Remover</button>
        </div>
      </div>

      {confirming && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-800 font-medium mb-1">Reorganizar troca a partir deste dia</p>
          <p className="text-xs text-amber-700 mb-3">
            O calendário de guarda será redefinido: <strong>{guardian ? GUARDIAN_LABELS[guardian] : '–'}</strong> passa a ter a semana de referência a partir de <strong>{swap.requested_date ? format(new Date(swap.requested_date + 'T12:00:00'), 'dd/MM/yyyy') : ''}</strong>. As semanas seguintes alternarão automaticamente a partir daí.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)}
              className="flex-1 py-1.5 border border-amber-300 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
              Cancelar
            </button>
            <button onClick={reorganize} disabled={reorganizing}
              className="flex-1 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-50">
              {reorganizing ? 'Aplicando…' : 'Confirmar reorganização'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MembersTab({ familyId, members, onMembersChanged }) {
  const [showForm, setShowForm] = useState(false)

  async function removeMember(id) {
    await supabase.from('family_members').delete().eq('id', id)
    onMembersChanged()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Membros da família</h3>
          <button onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-medium hover:bg-brand-700 transition-colors">
            + Adicionar membro
          </button>
        </div>
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: m.color || '#9ca3af' }}>
                {(m.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[m.role] || m.role}{m.email ? ` · ${m.email}` : ''}</p>
              </div>
              {m.user_id ? (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Ativo</span>
              ) : (
                <button onClick={() => removeMember(m.id)} className="text-xs text-red-400 hover:text-red-600">Remover</button>
              )}
            </div>
          ))}
        </div>
      </div>
      {showForm && (
        <AddMemberForm familyId={familyId} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); onMembersChanged() }} />
      )}
    </div>
  )
}

function AddMemberForm({ familyId, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('babysitter')
  const [color, setColor] = useState('#f59e0b')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('family_members').insert({
      id: crypto.randomUUID(),
      family_id: familyId,
      user_id: null,
      name,
      role,
      color,
      email: email || null,
    })
    setSaving(false)
    onSaved()
  }

  const extraRoles = [
    { value: 'babysitter', label: 'Babá' },
    { value: 'grandparent', label: 'Avó/Avô' },
    { value: 'relative', label: 'Parente' },
    { value: 'other', label: 'Outro' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Adicionar membro</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nome</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nome do membro"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Papel</label>
            <div className="grid grid-cols-2 gap-2">
              {extraRoles.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors ${role === r.value ? 'bg-brand-50 border-brand-400 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Email (opcional)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Cor de identificação</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
              <span className="text-xs text-gray-500">Cor exibida no calendário e listas</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function HistoryTab({ swaps, members }) {
  if (swaps.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-gray-400 text-sm">Nenhum evento registrado ainda</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-5">Histórico de alterações</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
        <div className="space-y-1">
          {swaps.map((swap, i) => (
            <HistoryEntry key={swap.id} swap={swap} members={members} isLast={i === swaps.length - 1} />
          ))}
        </div>
      </div>
    </div>
  )
}

function HistoryEntry({ swap, members }) {
  const { guardianColors } = useFamily()
  const requester = members.find(m => m.id === swap.requested_by)
  const isOverride = swap.reason?.startsWith('[override:')
  const isReorganized = swap.reason?.startsWith('[reorganized:')

  let iconBg, icon, title, detail

  if (isOverride) {
    const guardian = swap.reason?.match(/\[override:(mother|father)\]/)?.[1]
    const color = guardian ? guardianColors[guardian] : null
    const note = swap.reason?.replace(/\[override:(mother|father)\]\s*/, '')
    const dateLabel = swap.requested_date === swap.proposed_exchange_date || !swap.proposed_exchange_date
      ? format(new Date(swap.requested_date + 'T12:00:00'), 'dd/MM/yyyy')
      : `${format(new Date(swap.requested_date + 'T12:00:00'), 'dd/MM')} – ${format(new Date(swap.proposed_exchange_date + 'T12:00:00'), 'dd/MM/yyyy')}`
    iconBg = color?.hex || '#6b7280'
    icon = <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
    title = `Ajuste manual — ${guardian ? GUARDIAN_LABELS[guardian] : '–'} · ${dateLabel}`
    detail = note || null
  } else if (isReorganized) {
    const guardian = swap.reason?.match(/\[reorganized:(mother|father)\]/)?.[1]
    const color = guardian ? guardianColors[guardian] : null
    iconBg = color?.hex || '#8b5cf6'
    icon = <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
    const note = swap.reason?.replace(/\[reorganized:(mother|father)\]\s*/, '')
    title = `Calendário reorganizado`
    detail = note || null
  } else {
    const statusConfig = {
      pending:   { bg: '#f59e0b', label: 'Troca solicitada' },
      accepted:  { bg: '#10b981', label: 'Troca aceita' },
      rejected:  { bg: '#ef4444', label: 'Troca recusada' },
      cancelled: { bg: '#9ca3af', label: 'Troca cancelada' },
    }
    const cfg = statusConfig[swap.status] || statusConfig.pending
    iconBg = cfg.bg
    icon = <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    const dateLabel = swap.requested_date ? format(new Date(swap.requested_date + 'T12:00:00'), 'dd/MM/yyyy') : '–'
    title = `${cfg.label} — ${dateLabel}`
    detail = swap.reason && !swap.reason.startsWith('[') ? `"${swap.reason}"` : null
  }

  return (
    <div className="relative flex gap-4 pb-5">
      <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 pt-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-tight">{title}</p>
        {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {requester?.name || (isOverride || isReorganized ? 'Ajuste direto' : 'Sistema')}
          {' · '}
          {format(new Date(swap.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  )
}

function SwapCard({ swap, members, family, onUpdate }) {
  const requester = members.find(m => m.id === swap.requested_by)
  const statusColors = {
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    accepted:  'bg-green-50 text-green-700 border-green-200',
    rejected:  'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  const statusLabels = { pending: 'Pendente', accepted: 'Aceita', rejected: 'Recusada', cancelled: 'Cancelada' }

  async function respond(status) {
    await supabase.from('guard_swaps').update({ status, resolved_at: new Date().toISOString() }).eq('id', swap.id)
    onUpdate()
  }

  return (
    <div className={`p-4 rounded-xl border ${statusColors[swap.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Troca para {format(new Date(swap.requested_date + 'T12:00:00'), 'dd/MM/yyyy')}</p>
          {swap.proposed_exchange_date && (
            <p className="text-xs opacity-75">Em troca por {format(new Date(swap.proposed_exchange_date + 'T12:00:00'), 'dd/MM/yyyy')}</p>
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

function ManualOverrideForm({ familyId, members, onClose, onSaved }) {
  const { getCurrentUserMember } = useFamily()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [guardian, setGuardian] = useState('mother')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const me = getCurrentUserMember()
    await supabase.from('guard_swaps').insert({
      family_id: familyId,
      requested_date: startDate,
      proposed_exchange_date: endDate || startDate,
      reason: `[override:${guardian}]${note ? ' ' + note : ''}`,
      requested_by: me?.id || null,
      status: 'accepted',
      resolved_at: new Date().toISOString(),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Ajuste manual de guarda</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Define manualmente quem tem a guarda em um período, sobrepondo o calendário padrão.</p>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">De</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value) }} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Até</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Quem fica com a guarda?</label>
            <div className="flex gap-3">
              {['mother', 'father'].map(role => (
                <button key={role} type="button" onClick={() => setGuardian(role)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${guardian === role ? 'bg-brand-50 border-brand-400 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                  {role === 'mother' ? '💙 Mãe' : '💚 Pai'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Observação (opcional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: férias escolares"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !startDate}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : 'Salvar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SwapForm({ familyId, onClose, onSaved }) {
  const { getCurrentUserMember } = useFamily()
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
