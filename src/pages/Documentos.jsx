import { useState, useEffect, useRef, useCallback } from 'react'
import { useFamily } from '../context/FamilyContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

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
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [viewer, setViewer] = useState(null)
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
    }
    setLoading(false)
  }, [family, child])

  useEffect(() => { loadDocs() }, [loadDocs])

  async function openViewer(doc) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 300)
    if (data?.signedUrl) setViewer({ doc, url: data.signedUrl })
  }

  async function deleteDoc(doc) {
    await supabase.storage.from(BUCKET).remove([doc.file_path])
    await supabase.from('child_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arquivos</h1>
          {child && (
            <p className="text-sm text-gray-500 mt-0.5">
              {child.name} · {docs.length}/{MAX_DOCS}
            </p>
          )}
        </div>
        {!loading && docs.length < MAX_DOCS && permissions.canAdd && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar
          </button>
        )}
      </div>

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
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FolderIcon className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-600 font-medium">Nenhum documento ainda</p>
          <p className="text-sm text-gray-400 mt-1">
            Adicione documentos importantes de {child?.name ?? 'sua criança'}
          </p>
          {permissions.canAdd && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-5 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              + Adicionar primeiro documento
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {docs.map(doc => (
              <DocCard key={doc.id} doc={doc} onOpen={openViewer} onDelete={deleteDoc} canDelete={permissions.canDelete} />
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
        <Lightbox viewer={viewer} onClose={() => setViewer(null)} />
      )}
    </div>
  )
}

function DocCard({ doc, onOpen, onDelete, canDelete }) {
  const [thumbUrl, setThumbUrl] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (doc.file_type === 'image') {
      supabase.storage.from(BUCKET)
        .createSignedUrl(doc.file_path, 3600)
        .then(({ data }) => { if (data?.signedUrl) setThumbUrl(data.signedUrl) })
    }
  }, [doc])

  async function handleDelete(e) {
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await onDelete(doc)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
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
        {/* Expand overlay on hover */}
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
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
            {doc.file_type === 'pdf' ? 'PDF' : 'Imagem'}
          </span>
          {canDelete && (confirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
                className="text-[10px] text-gray-400 hover:text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[10px] text-red-500 font-semibold hover:text-red-700"
              >
                {deleting ? '…' : 'Confirmar'}
              </button>
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
              className="text-[10px] text-gray-300 hover:text-red-400 transition-colors font-medium"
            >
              Remover
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Lightbox({ viewer, onClose }) {
  const { doc, url } = viewer

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
        className="flex items-center justify-between mb-3 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{doc.name}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {doc.file_type === 'pdf' ? 'Documento PDF' : 'Imagem'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Fechar
        </button>
      </div>

      {/* Content — no download controls in our UI */}
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
