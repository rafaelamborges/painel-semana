import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

const FamilyContext = createContext(null)

export function FamilyProvider({ children }) {
  const { user } = useAuth()
  const [family, setFamily] = useState(null)
  const [child, setChild] = useState(null)
  const [members, setMembers] = useState([])
  const [guardPattern, setGuardPattern] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingDone, setOnboardingDone] = useState(null)

  const loadFamily = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    try {
      // Find this user's family membership
      const { data: membership } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership) {
        setOnboardingDone(false)
        setLoading(false)
        return
      }

      setFamily(membership.families)
      setOnboardingDone(true)

      const familyId = membership.families.id

      // Load all family members
      const { data: allMembers } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)

      setMembers(allMembers || [])

      // Load first child
      const { data: children } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', familyId)
        .limit(1)

      if (children?.[0]) {
        setChild(children[0])

        // Load guard pattern
        const { data: pattern } = await supabase
          .from('guard_patterns')
          .select('*')
          .eq('child_id', children[0].id)
          .maybeSingle()

        setGuardPattern(pattern || null)
      }
    } catch (err) {
      console.error('Error loading family:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadFamily()
  }, [loadFamily])

  function getMemberById(id) {
    return members.find(m => m.id === id)
  }

  function getCurrentUserMember() {
    return members.find(m => m.user_id === user?.id)
  }

  return (
    <FamilyContext.Provider value={{
      family,
      child,
      members,
      guardPattern,
      loading,
      onboardingDone,
      reload: loadFamily,
      getMemberById,
      getCurrentUserMember,
      setGuardPattern,
    }}>
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider')
  return ctx
}
