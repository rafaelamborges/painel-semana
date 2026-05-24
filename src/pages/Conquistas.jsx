import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const CATEGORIES = [
  { id: 'academic', label: 'Escolar', emoji: '📚', color: 'blue' },
  { id: 'sports', label: 'Esportiva', emoji: '⚽', color: 'green' },
  { id: 'social', label: 'Social', emoji: '👫', color: 'purple' },
  { id: 'emotional', label: 'Emocional', emoji: '💛', color: 'yellow' },
  { id: 'creative', label: 'Criativa', emoji: '🎨', color: 'pink' },
]

const CELEBRATION_SUGGESTIONS = {
  academic: ['Que tal um sorvete especial?', 'Uma ida ao cinema para comemorar!', 'Uma noite de filmes favoritos!'],
  sports: ['Uma pizza em família!', 'Escolher o jantar de hoje!', 'Um passeio especial no parque!'],
  social: ['Uma festa do pijama!', 'Convidar o melhor amigo para brincar!', 'Uma saída especial a dois!'],
  emotional: ['Um abraço longo e apertado!', 'Uma conversa especial sobre o sentimento!', 'Uma noite de histórias!'],
  creative: ['Expor a obra em lugar especial!', 'Uma visita ao museu!', 'Materiais novos para criar!'],
}

export default function Conquistas() {
  const { child } = useFamily()
  const [achievements, setAchievements] = useState([])
  const [filterCategory, setFilterCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !child) return
    loadAchievements()
  }, [child])

  async function loadAchievements() {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('child_id', child.id)
      .order('achieved_at', { ascending: false })
    setAchievements(data || [])
  }

  const filtered = filterCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === filterCategory)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conquistas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{achievements.length} conquistas de {child?.name}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova conquista
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCategory === 'all' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          Todas
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filterCategory === cat.id ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium text-gray-600">Nenhuma conquista ainda</p>
          <p className="text-sm text-gray-400 mt-1">Registre as conquistas de {child?.name} e celebre cada progresso!</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
            Registrar conquista
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}

      {showForm && (
        <AchievementForm
          childId={child?.id}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadAchievements() }}
        />
      )}
    </div>
  )
}

function AchievementCard({ achievement }) {
  const cat = CATEGORIES.find(c => c.id === achievement.category)
  const suggestions = CELEBRATION_SUGGESTIONS[achievement.category] || []
  const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)]

  const colorMap = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    pink: 'bg-pink-50 border-pink-100',
  }

  return (
    <div className={`rounded-2xl border p-5 ${colorMap[cat?.color || 'blue']}`}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{cat?.emoji || '🏆'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800">{achievement.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {cat?.label} · {format(new Date(achievement.achieved_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
      {achievement.description && (
        <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
      )}
      {suggestion && (
        <div className="bg-white/70 rounded-xl p-3 flex items-start gap-2">
          <span className="text-sm">🎉</span>
          <p className="text-xs text-gray-600"><span className="font-medium">Sugestão:</span> {suggestion}</p>
        </div>
      )}
    </div>
  )
}

function AchievementForm({ childId, onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('academic')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('achievements').insert({
      child_id: childId,
      title,
      category,
      description: description || null,
      achieved_at: date,
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Nova conquista</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <input type="text" placeholder="Qual foi a conquista?" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Categoria</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium border transition-colors ${category === cat.id ? 'bg-brand-50 border-brand-400 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <textarea placeholder="Detalhes (opcional)" value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : '🏆 Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
