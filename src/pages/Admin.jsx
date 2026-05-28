import { useState } from 'react'
import { useFamily } from '../context/FamilyContext'
import { supabase } from '../lib/supabase'

const MAX_MEMBERS = 6

const ROLE_LABELS = {
  mother: 'Mãe',
  father: 'Pai',
  babysitter: 'Babá',
  grandparent: 'Avó/Avô',
  stepparent: 'Padrasto/Madrasta',
  relative: 'Parente',
  other: 'Outro',
}

const ACCESS_ROLE_CONFIG = {
  sysadmin: { label: 'Sysadmin',    badge: 'bg-purple-100 text-purple-700' },
  admin:    { label: 'Admin',        badge: 'bg-blue-100 text-blue-700'    },
  editor:   { label: 'Editor',       badge: 'bg-green-100 text-green-700'  },
  viewer:   { label: 'Visualizador', badge: 'bg-gray-100 text-gray-600'    },
}

export default function Admin() {
  const { family, child, members, permissions, reload, getCurrentUserMember } = useFamily()
  const [showForm, setShowForm] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [changingRole, setChangingRole] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const atLimit = members.length >= MAX_MEMBERS
  const me = getCurrentUserMember?.()

  async function removeMember(id) {
    await supabase.from('family_members').delete().eq('id', id)
    reload()
  }

  async function changeAccessRole(memberId, newRole) {
    await supabase.rpc('update_member_access_role', { p_member_id: memberId, p_access_role: newRole })
    setChangingRole(null)
    reload()
  }

  function startRename(m) {
    setRenamingId(m.id)
    setRenameValue(m.name || '')
    setChangingRole(null)
  }

  async function saveRename(id) {
    const trimmed = renameValue.trim()
    if (trimmed) {
      await supabase.from('family_members').update({ name: trimmed }).eq('id', id)
      reload()
    }
    setRenamingId(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Admin de usuários</h1>
        {family?.name && <p className="body-sm mt-0.5">{family.name}</p>}
      </div>

      {/* Family info */}
      {(family || child) && (
        <div className="card mb-6">
          <h2 className="section-title mb-3">Família</h2>
          <div className="space-y-1">
            {family?.name && (
              <div className="flex items-center gap-2 text-sm">
                <span className="label-muted w-24">Família</span>
                <span className="font-medium text-gray-800">{family.name}</span>
              </div>
            )}
            {child?.name && (
              <div className="flex items-center gap-2 text-sm">
                <span className="label-muted w-24">Criança</span>
                <span className="font-medium text-gray-800">
                  {child.name}
                  {child.school ? ` · ${child.school}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Membros da família</h2>
            <p className="text-xs text-gray-400 mt-0.5">{members.length} / {MAX_MEMBERS} membros</p>
          </div>
          {permissions.canManageUsers && (
            <div className="flex gap-2">
              {!atLimit ? (
                <>
                  <button onClick={() => setShowInvite(true)}
                    className="px-3 py-1.5 border border-brand-300 text-brand-700 rounded-xl text-xs font-medium hover:bg-brand-50 transition-colors flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Convidar
                  </button>
                  <button onClick={() => setShowForm(true)}
                    className="px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-medium hover:bg-brand-700 transition-colors">
                    + Adicionar
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Limite atingido</span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {members.map(m => {
            const roleCfg = ACCESS_ROLE_CONFIG[m.access_role] || ACCESS_ROLE_CONFIG.viewer
            const isSysadmin = m.access_role === 'sysadmin'
            const isMe = me?.id === m.id
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: m.color || '#9ca3af' }}>
                  {(m.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {renamingId === m.id ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveRename(m.id); if (e.key === 'Escape') setRenamingId(null) }}
                        className="flex-1 text-sm px-2 py-1 border border-brand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                      <button onClick={() => saveRename(m.id)} className="text-xs text-brand-600 font-medium hover:text-brand-800">Salvar</button>
                      <button onClick={() => setRenamingId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${roleCfg.badge}`}>{roleCfg.label}</span>
                      {isMe && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 flex-shrink-0">Você</span>
                      )}
                      {permissions.canManageUsers && !isSysadmin && (
                        <button onClick={() => startRename(m)} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">{ROLE_LABELS[m.role] || m.role}{m.email ? ` · ${m.email}` : ''}</p>
                </div>
                {permissions.canManageUsers && !isSysadmin && renamingId !== m.id && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {changingRole === m.id ? (
                      <>
                        {['admin', 'editor', 'viewer'].map(r => (
                          <button key={r} onClick={() => changeAccessRole(m.id, r)}
                            className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                              m.access_role === r
                                ? 'bg-brand-50 border-brand-400 text-brand-700'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}>
                            {ACCESS_ROLE_CONFIG[r].label}
                          </button>
                        ))}
                        <button onClick={() => setChangingRole(null)} className="text-xs text-gray-400 hover:text-gray-600 ml-1">✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setChangingRole(m.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-0.5 rounded-lg hover:bg-gray-50">
                          Papel
                        </button>
                        {!m.user_id && (
                          <button onClick={() => removeMember(m.id)} className="text-xs text-red-400 hover:text-red-600">Remover</button>
                        )}
                      </>
                    )}
                  </div>
                )}
                {(!permissions.canManageUsers || isSysadmin) && m.user_id && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">Ativo</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showForm && (
        <AddMemberForm familyId={family?.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); reload() }} />
      )}
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} />
      )}
    </div>
  )
}

function InviteModal({ onClose }) {
  const [selectedRole, setSelectedRole] = useState('editor')
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const roleOptions = [
    { value: 'admin',  label: 'Admin',        desc: 'Pode adicionar, editar e excluir dados' },
    { value: 'editor', label: 'Editor',        desc: 'Pode adicionar novos dados' },
    { value: 'viewer', label: 'Visualizador',  desc: 'Somente leitura e visualização' },
  ]

  async function generateInvite() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.rpc('create_family_invite', { p_access_role: selectedRole })
    if (error || !data) {
      setError(error?.message?.includes('member_limit') ? 'Limite de 6 membros atingido.' : 'Erro ao gerar convite.')
      setLoading(false)
      return
    }
    setLink(`${window.location.origin}/join/${data}`)
    setLoading(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Convidar para o Compasso</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!link ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Nível de acesso do convidado</p>
              <div className="space-y-2">
                {roleOptions.map(r => (
                  <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      selectedRole === r.value ? 'bg-brand-50 border-brand-400' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                    <p className={`text-sm font-medium ${selectedRole === r.value ? 'text-brand-700' : 'text-gray-700'}`}>{r.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <button onClick={generateInvite} disabled={loading}
              className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              {loading ? 'Gerando…' : 'Gerar link de convite'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Link com acesso <strong>{roleOptions.find(r => r.value === selectedRole)?.label}</strong>. Válido por 7 dias, uso único.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-600 truncate font-mono">{link}</p>
            </div>
            <button onClick={copy}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                copied ? 'bg-green-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}>
              {copied ? '✓ Link copiado!' : 'Copiar link'}
            </button>
          </div>
        )}
      </div>
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
    { value: 'stepparent', label: 'Padrasto/Madrasta' },
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
