import { useState, useEffect } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getGuardForDate, GUARDIAN_LABELS, GUARDIAN_COLORS } from '../lib/guard'
import { EmptyState, EmptyTherapy } from '../components/illustrations'

export default function Terapia() {
  const { child, members, guardPattern, getCurrentUserMember } = useFamily()
  const [records, setRecords] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !child) return
    loadRecords()
  }, [child])

  async function loadRecords() {
    const { data } = await supabase
      .from('therapy_records')
      .select('*')
      .eq('child_id', child.id)
      .order('recorded_at', { ascending: false })
    setRecords(data || [])
  }

  const lastRecord = records[0]
  const daysSinceLast = lastRecord ? differenceInDays(new Date(), parseISO(lastRecord.recorded_at)) : null
  const needsAlert = daysSinceLast === null || daysSinceLast > 10

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terapia & Desenvolvimento</h1>
          <p className="text-sm text-gray-500 mt-0.5">{child?.name}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo registro
        </button>
      </div>

      {/* Alert banner */}
      {needsAlert && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-800">
              {daysSinceLast === null ? 'Nenhum registro ainda' : `${daysSinceLast} dias sem registro`}
            </p>
            <p className="text-sm text-amber-700">Recomendamos registrar pelo menos a cada 10 dias.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="ml-auto text-xs font-medium text-amber-700 hover:underline">Registrar agora</button>
        </div>
      )}

      {/* Timeline */}
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-8">
          <EmptyState
            art={<EmptyTherapy />}
            title="Nenhum registro de terapia ainda"
            subtitle="Anote observações semanais sobre o desenvolvimento emocional. Poucos parágrafos já ajudam a ver o quadro geral."
            action={
              <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
                Primeiro registro
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, i) => {
            const author = members.find(m => m.id === record.recorded_by)
            const guard = guardPattern ? getGuardForDate(parseISO(record.recorded_at), guardPattern) : null
            const guardColor = guard ? GUARDIAN_COLORS[guard] : null
            const days = i === 0 && i !== records.length - 1
              ? differenceInDays(new Date(), parseISO(record.recorded_at))
              : i > 0 ? differenceInDays(parseISO(records[i-1].recorded_at), parseISO(record.recorded_at))
              : null

            return (
              <div key={record.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full border-2 mt-5 flex-shrink-0"
                    style={guardColor ? { borderColor: guardColor.hex, backgroundColor: guardColor.lightHex } : { borderColor: '#9ca3af', backgroundColor: '#f3f4f6' }} />
                  {i < records.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs text-gray-400">
                          {format(parseISO(record.recorded_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {author && <span className="text-xs font-medium text-gray-600">Por {author.name}</span>}
                          {guardColor && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: guardColor.lightHex, color: guardColor.hex }}>
                              {GUARDIAN_LABELS[guard]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{record.content}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <TherapyForm
          childId={child?.id}
          guardPattern={guardPattern}
          getCurrentUserMember={getCurrentUserMember}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadRecords() }}
        />
      )}
    </div>
  )
}

function TherapyForm({ childId, guardPattern, getCurrentUserMember, onClose, onSaved }) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const today = new Date()
  const guard = guardPattern ? getGuardForDate(today, guardPattern) : null
  const guardColor = guard ? GUARDIAN_COLORS[guard] : null

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const me = getCurrentUserMember()
    await supabase.from('therapy_records').insert({
      child_id: childId,
      recorded_by: me?.id || null,
      guard_period: guard,
      content,
      recorded_at: today.toISOString(),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Novo registro de terapia</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {guardColor && (
          <div className="mb-4 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2"
            style={{ backgroundColor: guardColor.lightHex, color: guardColor.hex }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: guardColor.hex }} />
            Período de guarda: {GUARDIAN_LABELS[guard]}
          </div>
        )}
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Como foi? O que observou?</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Descreva o estado emocional, comportamentos, progressos, preocupações…"
              rows={6}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving || !content.trim()} className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
