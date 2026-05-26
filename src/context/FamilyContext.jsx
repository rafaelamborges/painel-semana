import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { getPermissions } from '../lib/permissions'

const FamilyContext = createContext(null)

function hexToRgba(hex, alpha = 0.15) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function FamilyProvider({ children }) {
  const { user } = useAuth()
  const [family, setFamily] = useState(null)
  const [child, setChild] = useState(null)
  const [members, setMembers] = useState([])
  const [guardPattern, setGuardPattern] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingDone, setOnboardingDone] = useState(null)

  const myAccessRole = useMemo(() => {
    const myMember = members.find(m => m.user_id === user?.id)
    return myMember?.access_role || 'editor'
  }, [members, user])

  const permissions = useMemo(() => getPermissions(myAccessRole), [myAccessRole])

  const guardianLabels = useMemo(() => {
    const motherMember = members.find(m => m.role === 'mother')
    const fatherMember = members.find(m => m.role === 'father')
    return {
      mother: motherMember?.name || 'Mamãe',
      father: fatherMember?.name || 'Papai',
    }
  }, [members])

  const guardianColors = useMemo(() => {
    const motherMember = members.find(m => m.role === 'mother')
    const fatherMember = members.find(m => m.role === 'father')
    const motherHex = motherMember?.color || '#3b82f6'
    const fatherHex = fatherMember?.color || '#10b981'
    return {
      mother: { hex: motherHex, lightHex: hexToRgba(motherHex) },
      father: { hex: fatherHex, lightHex: hexToRgba(fatherHex) },
    }
  }, [members])

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
      guardianColors,
      guardianLabels,
      myAccessRole,
      permissions,
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
