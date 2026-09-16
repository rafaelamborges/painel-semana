import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useState } from 'react'
import { useFamily } from '../context/FamilyContext'
import { getGuardForDate } from '../lib/guard'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { guardPattern, guardianColors, guardianLabels } = useFamily()

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
        <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-linha px-5 py-3.5 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2"
            aria-label="Abrir menu"
          >
            <div className="w-[22px] h-[22px] rounded-full border-2 border-bussola flex items-center justify-center">
              <div className="w-[7px] h-[7px] bg-bussola" style={{ transform: 'rotate(45deg)' }} />
            </div>
            <span className="font-medium text-[15px] tracking-[-0.01em] text-ink">Compasso</span>
          </button>

          <div className="flex items-center gap-3">
            {guardColor && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: guardColor.hex }} />
                <span className="text-[13px] font-normal text-ink-soft">{guardLabel}</span>
              </div>
            )}
            <NavLink to="/lembretes" className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Alertas">
              <div className="w-[18px] h-[18px] border-[1.8px] border-ink-soft flex items-center justify-center"
                style={{ borderRadius: '5px 5px 2px 2px' }} />
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 pb-24 lg:p-11 lg:pb-11">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
