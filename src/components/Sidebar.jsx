import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFamily } from '../context/FamilyContext'
import { supabase } from '../lib/supabase'
import { getGuardForDate } from '../lib/guard'
import { useUnreadNotifications } from '../lib/useNotifications'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const navItems = [
  { to: '/',          label: 'Início',    icon: IconInicio,    exact: true },
  { to: '/agenda',    label: 'Agenda',    icon: IconAgenda },
  { to: '/bolsa',     label: 'Bolsa',     icon: IconBolsa },
  { to: '/despesas',  label: 'Despesas',  icon: IconDespesas },
  { to: '/saude',     label: 'Saúde',     icon: IconSaude },
  { to: '/documentos',label: 'Documentos', icon: IconHistorico },
  { to: '/decisoes',  label: 'Combinados',icon: IconCombinados },
  { to: '/notificacoes', label: 'Notificações', icon: IconSino,    badge: 'unread' },
  { to: '/lembretes',    label: 'Alertas',      icon: IconAlertas, showCount: true },
]

export default function Sidebar({ open, onClose }) {
  const { signOut } = useAuth()
  const { child, kids, setActiveChild, reload, guardPattern, guardianColors, guardianLabels, permissions } = useFamily()
  const { count: unread } = useUnreadNotifications()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [showNewChild, setShowNewChild] = useState(false)

  const today = new Date()
  const currentGuard = guardPattern ? getGuardForDate(today, guardPattern) : null
  const guardColor = currentGuard ? guardianColors[currentGuard] : null
  const guardLabel = currentGuard ? guardianLabels[currentGuard] : null

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-[264px] bg-white border-r border-linha flex flex-col
        transition-transform duration-200
        lg:static lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Lockup */}
      <div className="flex items-center gap-2.5 px-5 py-7">
        <CompassSymbol size={26} />
        <span className="font-sans font-medium text-[17px] tracking-[-0.01em] text-ink">Compasso</span>
        <button
          onClick={onClose}
          className="ml-auto lg:hidden p-1 rounded-btn hover:bg-linha-suave transition-colors"
        >
          <svg className="w-4 h-4 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => {
              if (exact) document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
              onClose?.()
            }}
            className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge === 'unread' && unread > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-alerta text-white text-[10px] font-medium leading-none flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé — período atual + criança */}
      <div className="mt-auto border-t border-linha px-5 pt-5 pb-6 relative">
        {guardColor && (
          <>
            <p className="rotulo mb-3">Período atual</p>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: guardColor.hex }} />
              <span className="text-[15px] font-normal text-ink">{guardLabel}</span>
            </div>
            <p className="text-[13px] font-light text-ink-mute">
              Hoje, {format(today, "EEEE, dd/MM", { locale: ptBR })}
            </p>
          </>
        )}

        {child && (
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="mt-5 min-h-[44px] flex items-center gap-2.5 w-full text-left rounded-lg hover:bg-linha-suave/60 -mx-2 px-2 py-1.5 transition-colors"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <div className="w-8 h-8 rounded-full bg-nevoa flex-none flex items-center justify-center">
              {child.photo_url
                ? <img src={child.photo_url} alt={child.name} className="w-full h-full rounded-full object-cover" />
                : <span className="text-[13px] font-medium text-bussola">{child.name?.[0]?.toUpperCase() || '·'}</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-normal text-ink leading-tight truncate">{child.name}</div>
              <div className="text-[12px] font-light text-ink-mute leading-snug">
                {kids.length > 1 ? `${kids.length} crianças` : 'Perfil e ajustes'}
              </div>
            </div>
            <svg className={`w-3.5 h-3.5 text-ink-mute flex-shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 15l-7-7-7 7" />
            </svg>
          </button>
        )}

        {profileOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
            <div className="absolute bottom-[calc(100%-8px)] left-3 right-3 z-40 bg-white rounded-xl border border-linha shadow-lg p-2">
              {kids.length > 0 && (
                <>
                  <p className="rotulo px-3 pt-2 pb-1">Trocar de criança</p>
                  {kids.map(k => {
                    const isActive = k.id === child?.id
                    return (
                      <button
                        key={k.id}
                        onClick={() => { setActiveChild(k.id); setProfileOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-nevoa text-left transition-colors"
                      >
                        <span className="w-7 h-7 rounded-full bg-nevoa flex items-center justify-center text-[12px] font-medium text-bussola flex-shrink-0">
                          {k.name?.[0]?.toUpperCase() || '·'}
                        </span>
                        <span className="flex-1 text-[14px] text-ink truncate">{k.name}</span>
                        {isActive && (
                          <svg className="w-4 h-4 text-bussola flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </>
              )}

              {permissions?.canAdd && (
                <button
                  onClick={() => { setProfileOpen(false); setShowNewChild(true) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-nevoa text-left transition-colors text-bussola"
                >
                  <span className="w-7 h-7 rounded-full bg-bussola-wash flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  <span className="text-[14px] font-medium">Adicionar criança</span>
                </button>
              )}

              <div className="h-px bg-linha my-1.5" />

              <NavLink
                to="/preferencias"
                onClick={() => { setProfileOpen(false); onClose?.() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-nevoa text-left transition-colors text-ink"
              >
                <IconAlertas className="w-4 h-4 flex-shrink-0" />
                <span className="text-[14px]">Preferências de notificação</span>
              </NavLink>

              {permissions?.canManageUsers && (
                <NavLink
                  to="/admin"
                  onClick={() => { setProfileOpen(false); onClose?.() }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-nevoa text-left transition-colors text-ink"
                >
                  <IconResponsaveis className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[14px]">Responsáveis</span>
                </NavLink>
              )}

              <button
                onClick={() => { setProfileOpen(false); handleSignOut() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-alerta/10 text-left transition-colors text-alerta"
              >
                <IconSair className="w-4 h-4 flex-shrink-0" />
                <span className="text-[14px] font-medium">Sair</span>
              </button>
            </div>
          </>
        )}
      </div>

      {showNewChild && (
        <NewChildForm
          familyId={child ? child.family_id : null}
          onClose={() => setShowNewChild(false)}
          onCreated={async (newId) => {
            setShowNewChild(false)
            await reload()
            await setActiveChild(newId)
          }}
        />
      )}
    </aside>
  )
}

function CompassSymbol({ size = 26 }) {
  const inner = Math.round(size * 0.34)
  return (
    <div
      className="rounded-full border-2 border-bussola flex items-center justify-center flex-none"
      style={{ width: size, height: size }}
    >
      <div
        className="bg-bussola"
        style={{ width: inner, height: inner, transform: 'rotate(45deg)' }}
      />
    </div>
  )
}

/* Ícones geométricos, traço 1.8px */
function IconInicio({ className }) {
  return (
    <div className={`${className} relative`}>
      <div className="w-full h-full rounded-full border-[1.8px] border-current flex items-center justify-center">
        <div className="w-[35%] h-[35%] bg-current" style={{ transform: 'rotate(45deg)' }} />
      </div>
    </div>
  )
}
function IconRotina({ className }) {
  return <div className={`${className} rounded-sm border-[1.8px] border-current`} />
}
function IconAgenda({ className }) {
  return <div className={`${className} rounded-full border-[1.8px] border-current`} />
}
function IconSaude({ className }) {
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <div className="absolute w-full h-[1.8px] bg-current" />
      <div className="absolute h-full w-[1.8px] bg-current" />
    </div>
  )
}
function IconHistorico({ className }) {
  return (
    <div className={`${className} flex flex-col justify-center gap-[3px]`}>
      <div className="h-[1.8px] w-full bg-current" />
      <div className="h-[1.8px] w-[70%] bg-current" />
      <div className="h-[1.8px] w-[90%] bg-current" />
    </div>
  )
}
function IconCombinados({ className }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <div className="w-full h-full rounded-[3px] border-[1.8px] border-current" style={{ borderRadius: '50% 6px 50% 6px' }} />
    </div>
  )
}
function IconAlertas({ className }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <div
        className="w-[80%] h-[80%] border-[1.8px] border-current"
        style={{ borderRadius: '5px 5px 2px 2px' }}
      />
    </div>
  )
}
function IconSino({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10.5 19a1.5 1.5 0 003 0" />
    </svg>
  )
}
function IconBolsa({ className }) {
  return (
    <div className={`${className} flex items-end justify-center`}>
      <div className="w-full h-[80%] border-[1.8px] border-current rounded-b-[3px] rounded-t-[6px] relative">
        <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[45%] h-[35%] border-[1.8px] border-current border-b-0 rounded-t-full" />
      </div>
    </div>
  )
}
function IconDespesas({ className }) {
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <div className="absolute inset-0 rounded-full border-[1.8px] border-current" />
      <div className="absolute top-[18%] bottom-[18%] left-1/2 w-[1.8px] bg-current" />
      <div className="absolute top-[32%] w-[55%] h-[1.8px] bg-current" style={{ left: '22%' }} />
      <div className="absolute bottom-[32%] w-[55%] h-[1.8px] bg-current" style={{ left: '22%' }} />
    </div>
  )
}
function IconResponsaveis({ className }) {
  return (
    <div className={`${className} flex items-end gap-[2px]`}>
      <div className="w-[45%] h-[70%] rounded-full border-[1.8px] border-current" />
      <div className="w-[45%] h-[90%] rounded-full border-[1.8px] border-current" />
    </div>
  )
}
function IconSair({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function NewChildForm({ familyId, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(e) {
    e.preventDefault()
    if (!familyId) { setError('Família não carregada.'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('children')
      .insert({
        family_id: familyId,
        name: name.trim(),
        birth_date: birthDate || null,
        school: school.trim() || null,
        grade: grade.trim() || null,
      })
      .select()
      .single()
    if (err) { setError(err.message); setSaving(false); return }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`compasso.active-child.${familyId}`, data.id)
    }
    onCreated?.(data.id)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink">Adicionar criança</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-nevoa">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-ink-mute mb-4">
          A nova criança compartilha os mesmos membros da família. Configure a rotina de guarda depois pela Agenda.
        </p>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="input-label">Nome</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="input" placeholder="Nome da criança" autoFocus />
          </div>
          <div>
            <label className="input-label">Data de nascimento</label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">Escola (opcional)</label>
            <input type="text" value={school} onChange={e => setSchool(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">Turma / Ano (opcional)</label>
            <input type="text" value={grade} onChange={e => setGrade(e.target.value)} className="input" />
          </div>
          {error && <p className="text-alerta text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secundario flex-1">Cancelar</button>
            <button type="submit" disabled={saving || !name.trim()} className="btn-primario flex-1 disabled:opacity-50">
              {saving ? 'Salvando…' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
