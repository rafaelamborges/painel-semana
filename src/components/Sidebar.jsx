import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFamily } from '../context/FamilyContext'
import { getGuardForDate } from '../lib/guard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const navItems = [
  { to: '/',          label: 'Início',    icon: IconInicio,    exact: true },
  { to: '/guarda',    label: 'Rotina',    icon: IconRotina },
  { to: '/agenda',    label: 'Agenda',    icon: IconAgenda },
  { to: '/bolsa',     label: 'Bolsa',     icon: IconBolsa },
  { to: '/saude',     label: 'Saúde',     icon: IconSaude },
  { to: '/documentos',label: 'Documentos', icon: IconHistorico },
  { to: '/decisoes',  label: 'Combinados',icon: IconCombinados },
  { to: '/lembretes', label: 'Alertas',   icon: IconAlertas, showCount: true },
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
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé — período atual + criança */}
      <div className="mt-auto border-t border-linha px-5 pt-5 pb-6">
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
            onClick={() => { onClose?.(); navigate('/admin') }}
            className="mt-5 min-h-[44px] flex items-center gap-2.5 w-full text-left"
          >
            <div className="w-8 h-8 rounded-full bg-nevoa flex-none flex items-center justify-center">
              {child.photo_url
                ? <img src={child.photo_url} alt={child.name} className="w-full h-full rounded-full object-cover" />
                : <span className="text-[13px] font-medium text-bussola">{child.name?.[0]?.toUpperCase() || '·'}</span>
              }
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-normal text-ink leading-tight truncate">{child.name}</div>
              <div className="text-[12px] font-light text-ink-mute leading-snug">Perfil e acessos</div>
            </div>
          </button>
        )}

        {permissions?.canManageUsers && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) => `nav-item mt-3${isActive ? ' nav-item-active' : ''}`}
          >
            <IconResponsaveis className="w-4 h-4 flex-shrink-0" />
            Responsáveis
          </NavLink>
        )}
        <button
          onClick={handleSignOut}
          className="nav-item w-full mt-1 hover:bg-alerta/10 hover:text-alerta"
        >
          <IconSair className="w-4 h-4 flex-shrink-0" />
          Sair
        </button>
      </div>
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
function IconBolsa({ className }) {
  return (
    <div className={`${className} flex items-end justify-center`}>
      <div className="w-full h-[80%] border-[1.8px] border-current rounded-b-[3px] rounded-t-[6px] relative">
        <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[45%] h-[35%] border-[1.8px] border-current border-b-0 rounded-t-full" />
      </div>
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
