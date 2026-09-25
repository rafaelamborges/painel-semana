import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useState } from 'react'
import { useFamily } from '../context/FamilyContext'
import { getGuardForDate } from '../lib/guard'
import { useUnreadNotifications } from '../lib/useNotifications'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { guardPattern, guardianColors, guardianLabels } = useFamily()
  const { count: unread } = useUnreadNotifications()

  const today = new Date()
  const currentGuard = guardPattern ? getGuardForDate(today, guardPattern) : null
  const guardColor = currentGuard ? guardianColors[currentGuard] : null
  const guardLabel = currentGuard ? guardianLabels[currentGuard] : null

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-profundo/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile — lockup + guardião + campainha */}
        <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-linha px-4 py-3.5 flex items-center justify-between gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 flex-shrink-0"
            aria-label="Abrir menu"
          >
            <div className="w-[22px] h-[22px] rounded-full border-2 border-bussola flex items-center justify-center">
              <div className="w-[7px] h-[7px] bg-bussola" style={{ transform: 'rotate(45deg)' }} />
            </div>
            <span className="font-medium text-[15px] tracking-[-0.01em] text-ink">Compasso</span>
          </button>

          <div className="flex items-center gap-3 min-w-0">
            {guardColor && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: guardColor.hex }} />
                <span className="text-[13px] font-normal text-ink-soft truncate max-w-[120px]">{guardLabel}</span>
              </div>
            )}
            <NavLink to="/notificacoes" className="relative p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0" aria-label="Notificações">
              <svg className="w-[20px] h-[20px] text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6" />
                <path d="M10.5 19a1.5 1.5 0 003 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-alerta text-white text-[10px] font-medium leading-none flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:p-11 lg:pb-11">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
