import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',           label: 'Início',    icon: IconInicio, exact: true },
  { to: '/guarda',     label: 'Rotina',    icon: IconRotina },
  { to: '/agenda',     label: 'Agenda',    icon: IconAgenda },
  { to: '/saude',      label: 'Saúde',     icon: IconSaude },
  { to: '/documentos', label: 'Histórico', icon: IconHistorico },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-linha safe-b">
      <div className="flex px-1 py-2">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className="flex-1 min-h-[52px] flex flex-col items-center justify-center gap-1.5"
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-bussola' : 'text-ink-soft'}`} />
                <span className={`text-[10px] font-normal leading-none ${isActive ? 'text-bussola' : 'text-ink-soft'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

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
