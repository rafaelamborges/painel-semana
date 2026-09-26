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

export function FamilyProvider({ children: reactChildren }) {
  const { user } = useAuth()
  const [family, setFamily] = useState(null)
  const [child, setChild] = useState(null)
  const [childrenList, setChildrenList] = useState([])
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
      mother: motherMember?.name || 'Guardião A',
      father: fatherMember?.name || 'Guardião B',
    }
  }, [members])

  const guardianColors = useMemo(() => {
    const motherMember = members.find(m => m.role === 'mother')
    const fatherMember = members.find(m => m.role === 'father')
    const motherHex = motherMember?.color || '#5B8FF9'
    const fatherHex = fatherMember?.color || '#4DC9B8'
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

      // Load todas as crianças da família
      const { data: kidsData } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true })

      const kids = kidsData || []
      setChildrenList(kids)

      if (kids.length) {
        // Recupera qual criança estava ativa (por família) do localStorage
        const stored = typeof window !== 'undefined'
          ? window.localStorage.getItem(`compasso.active-child.${familyId}`)
          : null
        const chosen = kids.find(k => k.id === stored) || kids[0]
        setChild(chosen)

        // Load guard pattern da criança escolhida
        const { data: pattern } = await supabase
          .from('guard_patterns')
          .select('*')
          .eq('child_id', chosen.id)
          .maybeSingle()

        setGuardPattern(pattern || null)
      } else {
        setChild(null)
        setGuardPattern(null)
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

  async function setActiveChild(childId) {
    const chosen = childrenList.find(k => k.id === childId)
    if (!chosen || !family) return
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`compasso.active-child.${family.id}`, chosen.id)
    }
    setChild(chosen)
    const { data: pattern } = await supabase
      .from('guard_patterns')
      .select('*')
      .eq('child_id', chosen.id)
      .maybeSingle()
    setGuardPattern(pattern || null)
  }

  return (
    <FamilyContext.Provider value={{
      family,
      child,
      children: childrenList,
      setActiveChild,
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
      {reactChildren}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider')
  return ctx
}
