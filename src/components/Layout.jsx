import { Outlet } from 'react-router-dom'
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
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--page-bg)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar — logo + guard badge only, no hamburger */}
        <header
          className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm border-b sticky top-0 z-20"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="font-bold text-brand-700 text-lg">Compasso</span>
          {guardColor && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: guardColor.lightHex, color: guardColor.hex }}
            >
              {guardLabel}
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-8 lg:pb-8">
          <Outlet />
        </main>

        {/* Bottom navigation (mobile only) */}
        <BottomNav />
      </div>
    </div>
  )
}
