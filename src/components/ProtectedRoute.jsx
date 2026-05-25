import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFamily } from '../context/FamilyContext'
import { isSupabaseConfigured } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { onboardingDone, loading: familyLoading } = useFamily()

  if (authLoading || familyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-600 font-medium">Carregando…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (onboardingDone === false) return <Navigate to="/onboarding" replace />

  return children
}
