import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../context/AuthContext'

export function useUnreadNotifications() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return }
    const { count: c } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_user_id', user.id)
      .is('read_at', null)
    setCount(c || 0)
  }, [user])

  useEffect(() => {
    refresh()
    if (!user) return
    const channel = supabase
      .channel(`notif-unread-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, refresh])

  return { count, refresh }
}
