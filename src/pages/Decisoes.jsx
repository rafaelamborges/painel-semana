import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function Decisoes() {
  const { family, members, permissions } = useFamily()
  const [decisions, setDecisions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured || !family) return
    loadDecisions()
  }, [family])

  async function loadDecisions() {
    const { data } = await supabase
      .from('shared_decisions')
      .select('*')
      .eq('family_id', family.id)
      .order('decided_at', { ascending: false })
    setDecisions(data || [])
  }

  const filtered = decisions.filter(d =>
    d.subject.toLowerCase().includes(search.toLowerCase()) ||
    d.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acordos</h1>
          <p className="text-sm text-gray-500 mt-0.5">A memória oficial da coparentalidade</p>
        </div>
        {permissions.canAdd && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar decisão
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Buscar decisões…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">🤝</p>
          <p className="font-medium text-gray-600">
            {search ? 'Nenhuma decisão encontrada' : 'Nenhuma decisão registrada ainda'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {!search && 'Registre as decisões acordadas entre os pais para manter um histórico claro'}
          </p>
          {!search && permissions.canAdd && (
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
              Primeira decisão
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(decision => (
            <DecisionCard key={decision.id} decision={decision} members={members} />
          ))}
        </div>
      )}

      {showForm && (
        <DecisionForm
          familyId={family?.id}
          members={members}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadDecisions() }}
        />
      )}
    </div>
  )
}

function DecisionCard({ decision, members }) {
  const [expanded, setExpanded] = useState(false)
  const participants = decision.participants || []

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800">{decision.subject}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(decision.decided_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <p className="text-sm text-gray-700 mt-3 leading-relaxed whitespace-pre-wrap">{decision.content}</p>
          {participants.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">Participantes:</span>
              {participants.map((p, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DecisionForm({ familyId, members, onClose, onSaved }) {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedParticipants, setSelectedParticipants] = useState(members.map(m => m.name))
  const [saving, setSaving] = useState(false)

  function toggleParticipant(name) {
    setSelectedParticipants(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    )
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('shared_decisions').insert({
      family_id: familyId,
      subject,
      content,
      decided_at: date,
      participants: selectedParticipants,
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Registrar decisão</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <input type="text" placeholder="Assunto (ex: escola para 2027, viagem de férias)" value={subject} onChange={e => setSubject(e.target.value)} required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <textarea placeholder="Descreva a decisão acordada em detalhes…" value={content} onChange={e => setContent(e.target.value)} required rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Data da decisão</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          {members.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Participantes</label>
              <div className="flex gap-2 flex-wrap">
                {members.map(m => (
                  <button key={m.id} type="button" onClick={() => toggleParticipant(m.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedParticipants.includes(m.name) ? 'bg-brand-50 border-brand-400 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : '🤝 Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
