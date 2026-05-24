import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFamily } from '../context/FamilyContext'
import { getGuardForDate } from '../lib/guard'
import { GUARDIAN_LABELS, GUARDIAN_COLORS } from '../lib/guard'

const navItems = [
  { to: '/', label: 'Início', icon: HomeIcon, exact: true },
  { to: '/agenda', label: 'Agenda', icon: CalendarIcon },
  { to: '/guarda', label: 'Guarda', icon: ShieldIcon },
  { to: '/saude', label: 'Saúde', icon: HeartIcon },
  { to: '/terapia', label: 'Terapia', icon: BrainIcon },
  { to: '/conquistas', label: 'Conquistas', icon: TrophyIcon },
  { to: '/decisoes', label: 'Decisões', icon: HandshakeIcon },
  { to: '/emails', label: 'Emails', icon: EmailIcon },
  { to: '/lembretes', label: 'Lembretes', icon: BellIcon },
]

export default function Sidebar({ open, onClose }) {
  const { signOut } = useAuth()
  const { child, guardPattern } = useFamily()
  const navigate = useNavigate()

  const today = new Date()
  const currentGuard = guardPattern ? getGuardForDate(today, guardPattern) : null
  const guardColor = currentGuard ? GUARDIAN_COLORS[currentGuard] : null
  const guardLabel = currentGuard ? GUARDIAN_LABELS[currentGuard] : null

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300
      lg:static lg:translate-x-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <CompassLogo />
        <div>
          <span className="text-lg font-bold text-brand-700">Compasso</span>
          {child && (
            <p className="text-xs text-gray-400">{child.name}</p>
          )}
        </div>
        <button onClick={onClose} className="ml-auto lg:hidden p-1 rounded hover:bg-gray-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Guard badge */}
      {guardColor && (
        <div className="mx-4 my-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: guardColor.lightHex, color: guardColor.hex }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: guardColor.hex }} />
          Hoje: {guardLabel}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <LogoutIcon className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}

function CompassLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#f5f3ff" stroke="#6d28d9" strokeWidth="2"/>
      <circle cx="16" cy="16" r="2" fill="#6d28d9"/>
      <polygon points="16,4 18,16 16,14 14,16" fill="#6d28d9"/>
      <polygon points="16,28 14,16 16,18 18,16" fill="#9ca3af"/>
      <polygon points="4,16 16,14 14,16 16,18" fill="#9ca3af"/>
      <polygon points="28,16 16,18 18,16 16,14" fill="#6d28d9"/>
    </svg>
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
function BrainIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
}
function TrophyIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14M5 3a2 2 0 00-2 2v3a7 7 0 007 7 7 7 0 007-7V5a2 2 0 00-2-2M5 3H3m16 0h2M12 17v4m-4 0h8" /></svg>
}
function HandshakeIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function EmailIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
}
function BellIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
}
function LogoutIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
}
