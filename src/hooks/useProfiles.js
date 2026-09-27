import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 家庭成员列表 hook
// 提供 profiles / loading / error / reload / setProfiles(用于乐观更新)
// 自动订阅 profiles 表变更（家庭内部数据量小，全量刷新最简单可靠）
export function useProfiles({ realtime = true } = {}) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at')
    if (err) setError(err)
    else setProfiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!realtime) return
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [realtime, load])

  return { profiles, loading, error, reload: load, setProfiles }
}
