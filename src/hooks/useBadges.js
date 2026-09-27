import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 某个用户的勋章列表
export function useBadges(userId, { realtime = true } = {}) {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
    setBadges(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!realtime || !userId) return
    const channel = supabase
      .channel(`badges-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'badges', filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [realtime, userId, load])

  return { badges, loading, reload: load }
}

// 只需勋章数量的场景（列表页头部小徽标）
export function useBadgeCount(userId, { realtime = true } = {}) {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    if (!userId) return
    const { count: c } = await supabase
      .from('badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    setCount(c || 0)
  }, [userId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!realtime || !userId) return
    const channel = supabase
      .channel(`badge-count-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'badges', filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [realtime, userId, load])

  return { count, reload: load }
}
