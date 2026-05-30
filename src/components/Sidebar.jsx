import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFamily } from '../context/FamilyContext'
import { getGuardForDate } from '../lib/guard'

const navItems = [
  { to: '/', label: 'Início', icon: HomeIcon, exact: true },
  { to: '/agenda', label: 'Eventos', icon: CalendarIcon },
  { to: '/guarda', label: 'Rotina', icon: ShieldIcon },
  { to: '/saude', label: 'Saúde', icon: HeartIcon },
  { to: '/documentos', label: 'Arquivos', icon: FolderIcon },
  { to: '/decisoes', label: 'Acordos', icon: HandshakeIcon },
  { to: '/lembretes', label: 'Alertas', icon: BellIcon },
]

export default function Sidebar({ open, onClose }) {
  const { signOut } = useAuth()
  const { child, guardPattern, guardianColors, guardianLabels, permissions } = useFamily()
  const navigate = useNavigate()

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
        fixed inset-y-0 left-0 z-30 w-64 bg-brand-600 border-r border-brand-700/30 flex flex-col transition-transform duration-300
        lg:static lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-brand-700/40">
        <CompassLogo />
        <div>
          <span className="text-white text-[17px] font-bold">Compasso</span>
          {child && (
            <p className="text-white/60 text-xs">{child.name}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-auto lg:hidden p-1 rounded-lg text-white/60 hover:bg-white/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Guard badge */}
      {guardColor && (
        <div
          className="mx-4 my-3 rounded-xl px-3 py-2.5 text-sm font-semibold flex items-center gap-2"
          style={{ backgroundColor: guardColor.lightHex, color: guardColor.hex }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: guardColor.hex }} />
          Hoje: {guardLabel}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest px-4 pb-1 pt-3">
          Menu
        </p>
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `nav-item${isActive ? ' nav-item-active' : ''}`
            }
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-brand-700/40 space-y-0.5">
        {permissions?.canManageUsers && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) =>
              `nav-item${isActive ? ' nav-item-active' : ''}`
            }
          >
            <UsersIcon className="w-[18px] h-[18px] flex-shrink-0" />
            Responsáveis
          </NavLink>
        )}
        <button
          onClick={handleSignOut}
          className="nav-item w-full hover:!bg-red-900/30 hover:!text-red-300"
        >
          <LogoutIcon className="w-[18px] h-[18px] flex-shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}

function CompassLogo() {
  return (
    <div className="w-9 h-9 rounded-full bg-warm-500 flex items-center justify-center flex-shrink-0">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="1.5" fill="white" />
        <polygon points="10,2 11.2,10 10,8.8 8.8,10" fill="white" />
        <polygon points="10,18 8.8,10 10,11.2 11.2,10" fill="rgba(255,255,255,0.5)" />
        <polygon points="2,10 10,8.8 8.8,10 10,11.2" fill="rgba(255,255,255,0.5)" />
        <polygon points="18,10 10,11.2 11.2,10 10,8.8" fill="white" />
      </svg>
    </div>
  )
}

function HomeIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function CalendarIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
}
function ShieldIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
}
function HeartIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
}
function FolderIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
}
function HandshakeIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function BellIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
}
function UsersIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
}
function LogoutIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
}
