import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { EmptyState, EmptyDocuments } from '../components/illustrations'
import PerfilAtalhoCard from '../components/PerfilAtalhoCard'

const MAX_DOCS = 20
const MAX_SIZE_MB = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const BUCKET = 'child-documents'

const SQL_SETUP = `-- 1. Execute no SQL Editor do Supabase:
create table if not exists child_documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  child_id uuid references children(id) on delete cascade not null,
  name text not null,
  file_path text not null,
  file_type text not null,
  file_name text not null,
  created_at timestamptz default now()
);
alter table child_documents enable row level security;
create policy "Family members manage documents"
  on child_documents for all
  using (family_id in (
    select family_id from family_members where user_id = auth.uid()
  ));

-- 2. Em Storage > New bucket: crie "child-documents" (privado)

-- 3. Em Storage > Policies (ou SQL Editor):
create policy "Family members manage files"
  on storage.objects for all
  using (
    bucket_id = 'child-documents' and
    (storage.foldername(name))[1] in (
      select family_id::text from family_members
      where user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'child-documents' and
    (storage.foldername(name))[1] in (
      select family_id::text from family_members
      where user_id = auth.uid()
    )
  );`

export default function Documentos() {
  const { family, child, permissions } = useFamily()
  const [docs, setDocs] = useState([])
  const [decisionsById, setDecisionsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [viewer, setViewer] = useState(null)
  const [renaming, setRenaming] = useState(null)
  const [setupRequired, setSetupRequired] = useState(false)

  const loadDocs = useCallback(async () => {
    if (!family || !child) return
    setLoading(true)
    const { data, error } = await supabase
      .from('child_documents')
      .select('*')
      .eq('family_id', family.id)
      .eq('child_id', child.id)
      .order('created_at', { ascending: false })
    if (error?.code === '42P01') {
      setSetupRequired(true)
    } else {
      setDocs(data || [])
      const decisionIds = [...new Set((data || []).map(d => d.decision_id).filter(Boolean))]
      if (decisionIds.length) {
        const { data: decs } = await supabase
          .from('shared_decisions')
          .select('id, subject')
          .in('id', decisionIds)
        setDecisionsById(Object.fromEntries((decs || []).map(d => [d.id, d])))
      } else {
        setDecisionsById({})
      }
    }
    setLoading(false)
  }, [family, child])

  useEffect(() => { loadDocs() }, [loadDocs])

  const filteredDocs = docs

  async function openViewer(doc) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 300)
    if (data?.signedUrl) setViewer({ doc, url: data.signedUrl })
  }

  async function deleteDoc(doc) {
    await supabase.storage.from(BUCKET).remove([doc.file_path])
    await supabase.from('child_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
    setViewer(v => (v?.doc.id === doc.id ? null : v))
  }

  async function downloadDoc(doc) {
    // Pede uma URL assinada curta e força o download
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 60, { download: doc.file_name })
    if (error || !data?.signedUrl) { alert('Não consegui preparar o download. Tente de novo.'); return }
    const a = document.createElement('a')
    a.href = data.signedUrl
    a.download = doc.file_name || doc.name
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function renameDoc(doc, newName) {
    const trimmed = (newName || '').trim()
    if (!trimmed || trimmed === doc.name) return
    const { error } = await supabase.from('child_documents').update({ name: trimmed }).eq('id', doc.id)
    if (error) { alert('Não consegui renomear: ' + error.message); return }
    setDocs(prev => prev.map(d => (d.id === doc.id ? { ...d, name: trimmed } : d)))
    setViewer(v => (v?.doc.id === doc.id ? { ...v, doc: { ...v.doc, name: trimmed } } : v))
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-400 text-sm">Supabase não configurado.</p>
      </div>
    )
  }

  if (setupRequired) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Arquivos</h1>
        <p className="text-sm text-gray-500 mb-6">Configure o banco de dados para ativar esta funcionalidade.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-sm font-semibold text-amber-800 mb-1">Configuração necessária</p>
          <p className="text-xs text-amber-700 mb-4">Execute os passos abaixo no painel Supabase:</p>
          <pre className="bg-white border border-amber-100 rounded-xl p-4 text-xs overflow-x-auto text-gray-700 leading-relaxed whitespace-pre-wrap">{SQL_SETUP}</pre>
          <button
            onClick={() => { setSetupRequired(false); loadDocs() }}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Verificar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="rotulo mb-2">Arquivos {child?.name ? `de ${child.name}` : ''}</p>
          <h1 className="page-title">Documentos</h1>
          {child && <p className="apoio mt-2">{docs.length}/{MAX_DOCS} documentos</p>}
        </div>
        {!loading && docs.length < MAX_DOCS && permissions.canAdd && (
          <button onClick={() => setShowUpload(true)} className="btn-primario">Adicionar</button>
        )}
      </div>

      {child && (
        <div className="mb-6">
          <PerfilAtalhoCard />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-square bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-8">
          <EmptyState
            art={<EmptyDocuments />}
            title="Nenhum documento ainda"
            subtitle={`Guarde certidões, RG, cartão de vacinação e outros documentos importantes de ${child?.name ?? 'sua criança'}.`}
            action={permissions.canAdd && (
              <button
                onClick={() => setShowUpload(true)}
                className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                + Adicionar primeiro documento
              </button>
            )}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocs.map(doc => (
              <DocCard
                key={doc.id}
                doc={doc}
                decision={doc.decision_id ? decisionsById[doc.decision_id] : null}
                onOpen={openViewer}
                onDownload={downloadDoc}
                onRename={d => setRenaming(d)}
                onDelete={deleteDoc}
                canEdit={permissions.canEdit || permissions.canAdd}
                canDelete={permissions.canDelete}
              />
            ))}
          </div>
          {docs.length >= MAX_DOCS && (
            <p className="text-center text-xs text-gray-400 mt-5">
              Limite de {MAX_DOCS} documentos atingido. Remova um para adicionar outro.
            </p>
          )}
        </>
      )}

      {showUpload && (
        <UploadModal
          familyId={family.id}
          childId={child.id}
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); loadDocs() }}
        />
      )}

      {viewer && (
        <Lightbox
          viewer={viewer}
          onClose={() => setViewer(null)}
          onDownload={() => downloadDoc(viewer.doc)}
          onRename={() => setRenaming(viewer.doc)}
          onDelete={() => deleteDoc(viewer.doc)}
          canEdit={permissions.canEdit || permissions.canAdd}
          canDelete={permissions.canDelete}
        />
      )}

      {renaming && (
        <RenameModal
          doc={renaming}
          onClose={() => setRenaming(null)}
          onSave={async newName => {
            await renameDoc(renaming, newName)
            setRenaming(null)
          }}
        />
      )}
    </div>
  )
}

function DocCard({ doc, decision, onOpen, onDownload, onRename, onDelete, canEdit, canDelete }) {
  const [thumbUrl, setThumbUrl] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (doc.file_type === 'image') {
      supabase.storage.from(BUCKET)
        .createSignedUrl(doc.file_path, 3600)
        .then(({ data }) => { if (data?.signedUrl) setThumbUrl(data.signedUrl) })
    }
  }, [doc])

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await onDelete(doc)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow relative">
      {/* Thumbnail area */}
      <div
        className="aspect-square bg-gray-50 relative cursor-pointer overflow-hidden"
        onClick={() => onOpen(doc)}
      >
        {doc.file_type === 'image' ? (
          thumbUrl ? (
            <img src={thumbUrl} alt={doc.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 animate-pulse" />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-red-50">
            <PdfIcon size="large" />
            <span className="text-[10px] font-bold text-red-400 tracking-widest">PDF</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
              <ExpandIcon className="w-4 h-4 text-gray-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 truncate leading-tight" title={doc.name}>
          {doc.name}
        </p>
        {decision && (
          <Link
            to={`/decisoes?decision=${decision.id}`}
            onClick={e => e.stopPropagation()}
            className="mt-1 flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 truncate"
            title={`Ver acordo: ${decision.subject}`}
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="truncate">Acordo: {decision.subject}</span>
          </Link>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
            {doc.file_type === 'pdf' ? 'PDF' : 'Imagem'}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); setConfirmDelete(false) }}
              className="p-1 -mr-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Ações"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="5"  cy="12" r="1.6" fill="currentColor" />
                <circle cx="12" cy="12" r="1.6" fill="currentColor" />
                <circle cx="19" cy="12" r="1.6" fill="currentColor" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={e => { e.stopPropagation(); setMenuOpen(false); setConfirmDelete(false) }} />
                <div
                  className="absolute right-0 bottom-full mb-1 z-40 bg-white rounded-xl border border-gray-100 shadow-lg py-1 min-w-[160px]"
                  onClick={e => e.stopPropagation()}
                >
                  <MenuItem icon="download" label="Baixar" onClick={() => { onDownload(doc); setMenuOpen(false) }} />
                  {canEdit && <MenuItem icon="rename" label="Renomear" onClick={() => { onRename(doc); setMenuOpen(false) }} />}
                  {canDelete && (
                    confirmDelete ? (
                      <MenuItem icon="trash" label={deleting ? 'Removendo…' : 'Confirmar remoção'} danger onClick={handleDelete} />
                    ) : (
                      <MenuItem icon="trash" label="Remover" danger onClick={handleDelete} />
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <ActionIcon name={icon} className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </button>
  )
}

function ActionIcon({ name, className }) {
  if (name === 'download') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
    </svg>
  )
  if (name === 'rename') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5h-5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5m-1.5-9.5l3 3L11 15H8v-3l7.5-7.5z" />
    </svg>
  )
  if (name === 'trash') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16m-10 0V4a1 1 0 011-1h2a1 1 0 011 1v3m2 0v13a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
    </svg>
  )
  return null
}

function Lightbox({ viewer, onClose, onDownload, onRename, onDelete, canEdit, canDelete }) {
  const { doc, url } = viewer
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex flex-col p-4"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3 flex-shrink-0 gap-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">{doc.name}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {doc.file_type === 'pdf' ? 'Documento PDF' : 'Imagem'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onDownload()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
            title="Baixar"
          >
            <ActionIcon name="download" className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar</span>
          </button>
          {canEdit && (
            <button
              onClick={() => onRename()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              title="Renomear"
            >
              <ActionIcon name="rename" className="w-4 h-4" />
              <span className="hidden sm:inline">Renomear</span>
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => {
                if (!confirmDelete) { setConfirmDelete(true); return }
                onDelete()
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                confirmDelete
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Remover"
            >
              <ActionIcon name="trash" className="w-4 h-4" />
              <span className="hidden sm:inline">{confirmDelete ? 'Confirmar' : 'Remover'}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
            title="Fechar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center min-h-0"
        onClick={e => e.stopPropagation()}
      >
        {doc.file_type === 'image' ? (
          <img
            src={url}
            alt={doc.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
            onContextMenu={e => e.preventDefault()}
          />
        ) : (
          <iframe
            src={`${url}#toolbar=0&navpanes=0`}
            title={doc.name}
            className="w-full h-full rounded-lg shadow-2xl bg-white"
            style={{ maxWidth: '900px' }}
          />
        )}
      </div>
    </div>
  )
}

function RenameModal({ doc, onClose, onSave }) {
  const [name, setName] = useState(doc.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Dê um nome ao documento.'); return }
    if (trimmed === doc.name) { onClose(); return }
    setSaving(true)
    setError('')
    try {
      await onSave(trimmed)
    } catch (err) {
      setError(err?.message || 'Erro ao renomear.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Renomear documento</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nome</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={80}
              autoFocus
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UploadModal({ familyId, childId, onClose, onSaved }) {
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  function processFile(f) {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Formato não suportado. Use imagens (JPG, PNG, WebP) ou PDF.')
      return
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${MAX_SIZE_MB} MB.`)
      return
    }
    setFile(f)
    setError('')
    if (!name) {
      setName(f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim())
    }
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview('pdf')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }

  async function save(e) {
    e.preventDefault()
    if (!file || !name.trim()) return
    setSaving(true)
    setError('')
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${familyId}/${childId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
      })
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase.from('child_documents').insert({
        family_id: familyId,
        child_id: childId,
        name: name.trim(),
        file_path: path,
        file_type: file.type.startsWith('image/') ? 'image' : 'pdf',
        file_name: file.name,
      })
      if (dbError) throw dbError
      onSaved()
    } catch (err) {
      setError(err.message || 'Erro ao salvar documento.')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800">Adicionar documento</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={save} className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-brand-400 bg-brand-50'
                : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) processFile(f)
                e.target.value = ''
              }}
            />
            {!file ? (
              <div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
                  <UploadIcon className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">Arraste ou clique para selecionar</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, WebP · Máx. {MAX_SIZE_MB} MB</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0">
                  {preview && preview !== 'pdf' ? (
                    <img src={preview} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-red-50 flex items-center justify-center">
                      <PdfIcon size="small" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}
                    className="text-xs text-brand-600 hover:underline mt-0.5"
                  >
                    Trocar arquivo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Name input */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nome do documento</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Cartão de vacinação, RG, Laudo médico…"
              maxLength={80}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !file || !name.trim()}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────

function FolderIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  )
}

function ExpandIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  )
}

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )
}

function PdfIcon({ size = 'large' }) {
  const dim = size === 'large' ? 44 : 28
  const fontSize = size === 'large' ? 7 : 5
  const sw = size === 'large' ? 1.5 : 1.2
  return (
    <svg width={dim} height={dim} viewBox="0 0 44 44" fill="none">
      <path
        d={`M10 6h16l10 10v22a2 2 0 01-2 2H10a2 2 0 01-2-2V8a2 2 0 012-2z`}
        fill="white" stroke="#FCA5A5" strokeWidth={sw} strokeLinejoin="round"
      />
      <path d="M26 6v10h10" stroke="#FCA5A5" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <text x="22" y="33" textAnchor="middle" fill="#EF4444"
        fontSize={fontSize} fontWeight="700" fontFamily="system-ui, sans-serif">PDF</text>
    </svg>
  )
}
