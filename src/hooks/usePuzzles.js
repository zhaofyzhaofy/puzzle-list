import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 谜题列表 hook
// realtime=true 时会自动订阅 puzzles 表变更（新增/编辑/删除都会重新拉取）
export function usePuzzles({ realtime = true } = {}) {
  const [puzzles, setPuzzles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('puzzles')
      .select('*, profiles(name, avatar_emoji, avatar_url)')
      .order('created_at', { ascending: false })
    if (err) setError(err)
    else setPuzzles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!realtime) return
    const channel = supabase
      .channel('puzzles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'puzzles' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [realtime, load])

  return { puzzles, loading, error, reload: load, setPuzzles }
}
