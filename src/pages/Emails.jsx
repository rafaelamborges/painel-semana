import { useState, useEffect } from 'react'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getGuardForDate, GUARDIAN_LABELS, GUARDIAN_COLORS } from '../lib/guard'
import { format } from 'date-fns'

const INITIAL_FILTERS = [
  { filter_type: 'sender', value: 'cbv.com.br' },
  { filter_type: 'keyword', value: 'CBV Jaqueira' },
]

export default function Emails() {
  const { family, child, guardPattern } = useFamily()
  const [filters, setFilters] = useState([])
  const [previews, setPreviews] = useState([])
  const [processing, setProcessing] = useState(false)
  const [showFilterForm, setShowFilterForm] = useState(false)
  const [tab, setTab] = useState('import')

  useEffect(() => {
    if (!isSupabaseConfigured || !family) return
    loadFilters()
  }, [family])

  async function loadFilters() {
    const { data } = await supabase
      .from('email_filters')
      .select('*')
      .eq('family_id', family.id)
    setFilters(data?.length ? data : INITIAL_FILTERS)
  }

  async function processEmail(emailContent) {
    setProcessing(true)
    try {
      // In production: call Anthropic API via edge function
      // For demo, parse simple patterns
      const extracted = extractEmailInfo(emailContent)
      setPreviews([extracted])
    } finally {
      setProcessing(false)
    }
  }

  function extractEmailInfo(content) {
    // Demo extraction logic — in production this calls Claude
    return {
      id: Date.now(),
      title: 'Evento extraído do email',
      date: '',
      time: '',
      location: '',
      description: content.slice(0, 200),
      items: [],
      confirmed: false,
      raw: content,
    }
  }

  async function confirmImport(preview) {
    if (!preview.title || !preview.date) return
    const guard = preview.date ? getGuardForDate(new Date(preview.date), guardPattern) : null
    await supabase.from('calendar_events').insert({
      family_id: family.id,
      child_id: child?.id,
      title: preview.title,
      description: preview.description || null,
      start_at: `${preview.date}T${preview.time || '08:00'}:00`,
      location: preview.location || null,
      source: 'email_import',
    })
    setPreviews(prev => prev.filter(p => p.id !== preview.id))
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Importação de emails</h1>
        <p className="text-sm text-gray-500 mt-0.5">IA extrai informações de emails escolares automaticamente</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ id: 'import', label: 'Importar' }, { id: 'filters', label: 'Filtros' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'import' && (
        <div className="space-y-4">
          {/* How it works */}
          <div className="bg-brand-50 rounded-2xl p-5 border border-brand-100">
            <h3 className="font-semibold text-brand-800 mb-3">Como funciona</h3>
            <div className="space-y-2">
              {[
                { step: '1', text: 'Cole o conteúdo de um email escolar abaixo' },
                { step: '2', text: 'A IA (Claude) extrai data, hora, local, itens necessários e valores' },
                { step: '3', text: 'Confirme a prévia antes de criar o evento na agenda' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-brand-200 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</span>
                  <p className="text-sm text-brand-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Email paste area */}
          <EmailPasteArea onProcess={processEmail} processing={processing} />

          {/* Previews */}
          {previews.map(preview => (
            <EmailPreview
              key={preview.id}
              preview={preview}
              guardPattern={guardPattern}
              onConfirm={() => confirmImport(preview)}
              onDiscard={() => setPreviews(prev => prev.filter(p => p.id !== preview.id))}
            />
          ))}

          {/* Google integration note */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
            <p className="font-medium mb-1">🔗 Integração com Gmail</p>
            <p className="text-xs text-gray-500">A integração completa com Gmail e Google Calendar está disponível configurando as credenciais da API do Google nas variáveis de ambiente.</p>
          </div>
        </div>
      )}

      {tab === 'filters' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowFilterForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
              + Adicionar filtro
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {filters.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">Nenhum filtro configurado</p>
            ) : filters.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${f.filter_type === 'sender' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {f.filter_type === 'sender' ? 'Remetente' : 'Palavra-chave'}
                  </span>
                  <span className="text-sm font-medium text-gray-700 font-mono">{f.value}</span>
                </div>
              </div>
            ))}
          </div>
          {showFilterForm && (
            <FilterForm
              familyId={family?.id}
              onClose={() => setShowFilterForm(false)}
              onSaved={() => { setShowFilterForm(false); loadFilters() }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function EmailPasteArea({ onProcess, processing }) {
  const [content, setContent] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (content.trim()) onProcess(content)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-3">Colar email escolar</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Cole aqui o conteúdo do email da escola…"
          rows={6}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none font-mono"
        />
        <button type="submit" disabled={!content.trim() || processing}
          className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analisando com IA…
            </>
          ) : '✨ Extrair informações com IA'}
        </button>
      </form>
    </div>
  )
}

function EmailPreview({ preview, guardPattern, onConfirm, onDiscard }) {
  const [title, setTitle] = useState(preview.title || '')
  const [date, setDate] = useState(preview.date || '')
  const [time, setTime] = useState(preview.time || '')
  const [location, setLocation] = useState(preview.location || '')

  const guard = date ? getGuardForDate(new Date(date), guardPattern) : null
  const guardColor = guard ? GUARDIAN_COLORS[guard] : null

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-brand-600">✨</span>
        <h3 className="font-semibold text-gray-800">Prévia do evento extraído</h3>
        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">Confirmar antes de importar</span>
      </div>
      <div className="space-y-3">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do evento"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        <div className="flex gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Local"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        {guardColor && date && (
          <div className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2"
            style={{ backgroundColor: guardColor.lightHex, color: guardColor.hex }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: guardColor.hex }} />
            Guarda: {GUARDIAN_LABELS[guard]}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onDiscard} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Descartar</button>
          <button onClick={onConfirm} disabled={!title || !date}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
            ✓ Importar para agenda
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterForm({ familyId, onClose, onSaved }) {
  const [type, setType] = useState('sender')
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('email_filters').insert({ family_id: familyId, filter_type: type, value })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-4">Adicionar filtro de email</h3>
        <form onSubmit={save} className="space-y-4">
          <div className="flex gap-2">
            {[{ id: 'sender', label: 'Remetente' }, { id: 'keyword', label: 'Palavra-chave' }].map(t => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${type === t.id ? 'bg-brand-50 border-brand-400 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <input type="text" value={value} onChange={e => setValue(e.target.value)} required
            placeholder={type === 'sender' ? 'ex: cbv.com.br' : 'ex: Festa Junina'}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
