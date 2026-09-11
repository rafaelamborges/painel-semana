import { useState, useEffect, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSearchParams } from 'react-router-dom'
import { useFamily } from '../context/FamilyContext'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { EmptyState, EmptyDecisions } from '../components/illustrations'

const DOC_BUCKET = 'child-documents'
const MAX_DOC_SIZE_MB = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

export default function Decisoes() {
  const { family, child, members, permissions, getCurrentUserMember } = useFamily()
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('todos')
  const [searchParams, setSearchParams] = useSearchParams()
  const openId = searchParams.get('decision')
  const me = getCurrentUserMember()

  useEffect(() => {
    if (!isSupabaseConfigured || !family) return
    loadDecisions()
  }, [family])

  async function loadDecisions() {
    setLoading(true)
    const { data } = await supabase
      .from('shared_decisions')
      .select(`
        *,
        agreements:decision_agreements(member_id, agreed_at),
        documents:child_documents(id, name, file_path, file_type, file_name)
      `)
      .eq('family_id', family.id)
      .order('decided_at', { ascending: false })
    setDecisions(data || [])
    setLoading(false)
  }

  const enriched = useMemo(() => decisions.map(d => {
    const agreements = d.agreements || []
    const isLegacy = agreements.length === 0
    const total = agreements.length
    const agreed = agreements.filter(a => a.agreed_at).length
    const status = isLegacy
      ? 'legacy'
      : agreed === total ? 'concluded' : 'pending'
    return { ...d, isLegacy, total, agreed, status }
  }), [decisions])

  const filtered = enriched.filter(d => {
    if (tab === 'pendentes'  && d.status !== 'pending')   return false
    if (tab === 'concluidos' && d.status !== 'concluded' && d.status !== 'legacy') return false
    const q = search.toLowerCase()
    if (!q) return true
    return d.subject.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)
  })

  const counts = {
    todos:       enriched.length,
    pendentes:   enriched.filter(d => d.status === 'pending').length,
    concluidos:  enriched.filter(d => d.status === 'concluded' || d.status === 'legacy').length,
  }

  async function handleAgree(decision) {
    if (!me) return
    await supabase.from('decision_agreements')
      .update({ agreed_at: new Date().toISOString() })
      .eq('decision_id', decision.id)
      .eq('member_id', me.id)
    loadDecisions()
  }

  async function handleDelete(decision) {
    // Storage cleanup for attached docs
    const paths = (decision.documents || []).map(d => d.file_path)
    if (paths.length) await supabase.storage.from(DOC_BUCKET).remove(paths)
    await supabase.from('shared_decisions').delete().eq('id', decision.id)
    loadDecisions()
  }

  function clearOpenParam() {
    if (openId) {
      searchParams.delete('decision')
      setSearchParams(searchParams, { replace: true })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
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

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {[
          { id: 'todos',      label: 'Todos'      },
          { id: 'pendentes',  label: 'Pendentes'  },
          { id: 'concluidos', label: 'Concluídos' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label} <span className="text-xs opacity-60 ml-1">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Buscar acordos…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-8">
          <EmptyState
            art={<EmptyDecisions />}
            title={search || tab !== 'todos' ? 'Nenhum acordo encontrado' : 'Nenhum acordo registrado ainda'}
            subtitle={!search && tab === 'todos' && 'Registre as decisões acordadas entre os pais para manter um histórico claro entre as duas casas — com anexos e "Concordo" de cada parte.'}
            action={!search && tab === 'todos' && permissions.canAdd && (
              <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
                Primeiro acordo
              </button>
            )}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <DecisionCard
              key={d.id}
              decision={d}
              members={members}
              me={me}
              initiallyOpen={openId === d.id}
              onOpen={clearOpenParam}
              canDelete={permissions.canDelete}
              onAgree={() => handleAgree(d)}
              onDelete={() => handleDelete(d)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <DecisionForm
          family={family}
          child={child}
          members={members}
          me={me}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadDecisions() }}
        />
      )}
    </div>
  )
}

function StatusBadge({ status, agreed, total }) {
  if (status === 'legacy')
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">Histórico</span>
  if (status === 'concluded')
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">Concluído</span>
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">Pendente · {agreed}/{total}</span>
}

function DecisionCard({ decision, members, me, initiallyOpen, onOpen, canDelete, onAgree, onDelete }) {
  const [expanded, setExpanded] = useState(!!initiallyOpen)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (initiallyOpen && !expanded) setExpanded(true)
  }, [initiallyOpen])

  function toggle() {
    if (!expanded) onOpen?.()
    setExpanded(v => !v)
  }

  const partyMembers = (decision.agreements || []).map(a => {
    const m = members.find(x => x.id === a.member_id)
    return { ...a, member: m }
  })

  const myAgreement = me && partyMembers.find(p => p.member_id === me.id)
  const canAgree = decision.status === 'pending' && myAgreement && !myAgreement.agreed_at

  async function handleAgree() {
    setBusy(true)
    await onAgree()
    setBusy(false)
  }
  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setBusy(true)
    await onDelete()
    setBusy(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={toggle} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-800">{decision.subject}</p>
              <StatusBadge status={decision.status} agreed={decision.agreed} total={decision.total} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(decision.decided_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {decision.documents?.length > 0 && <span> · {decision.documents.length} arquivo{decision.documents.length > 1 ? 's' : ''}</span>}
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

          {decision.isLegacy ? (
            (decision.participants || []).length > 0 && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Participantes:</span>
                {(decision.participants || []).map((p, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            )
          ) : (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Partes do acordo</p>
              <div className="space-y-1.5">
                {partyMembers.map(p => {
                  const color = p.member?.color || '#9ca3af'
                  const initial = (p.member?.name || '?')[0].toUpperCase()
                  return (
                    <div key={p.member_id} className="flex items-center gap-2.5 text-sm">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: color }}>
                        {initial}
                      </div>
                      <span className="text-gray-700 flex-1">{p.member?.name || 'Membro removido'}</span>
                      {p.agreed_at ? (
                        <span className="text-xs text-green-700 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Concordou em {format(new Date(p.agreed_at), 'dd/MM')}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600">Aguardando</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {decision.documents?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Arquivos anexos</p>
              <div className="space-y-1.5">
                {decision.documents.map(doc => (
                  <DocLink key={doc.id} doc={doc} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2 flex-wrap">
            {canAgree && (
              <button onClick={handleAgree} disabled={busy}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
                {busy ? 'Registrando…' : 'Concordo'}
              </button>
            )}
            {canDelete && (confirmDelete ? (
              <>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                <button onClick={handleDelete} disabled={busy} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  {busy ? 'Removendo…' : 'Confirmar remoção'}
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="ml-auto text-xs text-gray-300 hover:text-red-500 transition-colors">
                Remover acordo
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DocLink({ doc }) {
  const [opening, setOpening] = useState(false)
  async function open() {
    setOpening(true)
    const { data } = await supabase.storage.from(DOC_BUCKET).createSignedUrl(doc.file_path, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    setOpening(false)
  }
  return (
    <button onClick={open} disabled={opening}
      className="w-full flex items-center gap-3 text-left px-3 py-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.file_type === 'image' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
        {doc.file_type === 'image' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        ) : (
          <span className="text-[9px] font-bold tracking-widest">PDF</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 truncate">{doc.name}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{doc.file_type === 'image' ? 'Imagem' : 'Documento'}</p>
      </div>
      <svg className={`w-4 h-4 text-gray-300 flex-shrink-0 ${opening ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {opening
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        }
      </svg>
    </button>
  )
}

function DecisionForm({ family, child, members, me, onClose, onSaved }) {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedIds, setSelectedIds] = useState(() => {
    const initial = new Set()
    if (me) initial.add(me.id)
    for (const m of members) if (m.role === 'mother' || m.role === 'father') initial.add(m.id)
    return [...initial]
  })
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function toggle(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function addFiles(list) {
    const next = []
    for (const f of Array.from(list)) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError('Formato não suportado. Use JPG, PNG, WebP ou PDF.')
        continue
      }
      if (f.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
        setError(`Arquivo "${f.name}" muito grande (máx ${MAX_DOC_SIZE_MB} MB).`)
        continue
      }
      next.push({
        file: f,
        name: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim(),
      })
    }
    if (next.length) setError('')
    setFiles(prev => [...prev, ...next])
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  function renameFile(idx, name) {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, name } : f))
  }

  async function save(e) {
    e.preventDefault()
    if (!subject.trim() || !content.trim() || selectedIds.length === 0) return
    setSaving(true)
    setError('')
    try {
      const decisionId = crypto.randomUUID()
      const nowIso = new Date().toISOString()

      // 1. Decision row
      const participantNames = selectedIds
        .map(id => members.find(m => m.id === id)?.name)
        .filter(Boolean)
      const { error: decErr } = await supabase.from('shared_decisions').insert({
        id: decisionId,
        family_id: family.id,
        subject: subject.trim(),
        content: content.trim(),
        decided_at: date,
        participants: participantNames,
        created_by: me?.id || null,
      })
      if (decErr) throw decErr

      // 2. Agreements: creator auto-agreed, others pending
      const rows = selectedIds.map(id => ({
        decision_id: decisionId,
        member_id: id,
        agreed_at: (me && id === me.id) ? nowIso : null,
      }))
      const { error: agrErr } = await supabase.from('decision_agreements').insert(rows)
      if (agrErr) throw agrErr

      // 3. Files
      for (const item of files) {
        const ext = item.file.name.split('.').pop().toLowerCase()
        const path = `${family.id}/${child.id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from(DOC_BUCKET)
          .upload(path, item.file, { contentType: item.file.type })
        if (upErr) throw upErr
        const { error: docErr } = await supabase.from('child_documents').insert({
          family_id: family.id,
          child_id: child.id,
          name: item.name || item.file.name,
          file_path: path,
          file_type: item.file.type.startsWith('image/') ? 'image' : 'pdf',
          file_name: item.file.name,
          decision_id: decisionId,
        })
        if (docErr) throw docErr
      }

      onSaved()
    } catch (err) {
      setError(err.message || 'Erro ao salvar acordo.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Registrar acordo</h3>
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

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Partes do acordo <span className="text-gray-400 font-normal">(cada uma precisa dar "Concordo")</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {members.map(m => {
                const active = selectedIds.includes(m.id)
                const isMe = me?.id === m.id
                return (
                  <button key={m.id} type="button" onClick={() => toggle(m.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${active ? 'bg-brand-50 border-brand-400 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color || '#9ca3af' }} />
                    {m.name}{isMe && <span className="text-[10px] opacity-70">(você)</span>}
                  </button>
                )
              })}
            </div>
            {me && selectedIds.includes(me.id) && (
              <p className="text-[11px] text-gray-400 mt-1.5">Você já entra como quem propôs — seu "Concordo" é registrado no ato.</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Arquivos anexos <span className="text-gray-400 font-normal">(opcional — também aparecem em Arquivos)</span>
            </label>
            <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.gif,.pdf" className="hidden"
              onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
              + Anexar arquivo (PDF, JPG, PNG · máx {MAX_DOC_SIZE_MB} MB)
            </button>
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold ${f.file.type.startsWith('image/') ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                      {f.file.type.startsWith('image/') ? 'IMG' : 'PDF'}
                    </div>
                    <input type="text" value={f.name} onChange={e => renameFile(i, e.target.value)}
                      className="flex-1 text-xs border-none focus:outline-none bg-transparent min-w-0" />
                    <button type="button" onClick={() => removeFile(i)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving || !subject.trim() || !content.trim() || selectedIds.length === 0}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : 'Registrar acordo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
