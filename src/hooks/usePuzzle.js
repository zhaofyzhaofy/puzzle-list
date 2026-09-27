import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 单个谜题 + 它的回复列表
// 订阅该谜题的 replies 表变更（filter=puzzle_id=eq.xxx），家人在别的设备回复能实时同步
export function usePuzzle(id, { realtime = true } = {}) {
  const [puzzle, setPuzzle] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadPuzzle = useCallback(async () => {
    if (!id) return
    const { data, error: err } = await supabase
      .from('puzzles')
      .select('*, profiles(name, avatar_emoji, avatar_url)')
      .eq('id', id)
      .single()
    if (err) setError(err)
    else setPuzzle(data)
  }, [id])

  const loadReplies = useCallback(async () => {
    if (!id) return
    const { data } = await supabase
      .from('replies')
      .select('*, profiles(name, avatar_emoji, avatar_url)')
      .eq('puzzle_id', id)
      .order('created_at', { ascending: true })
    setReplies(data || [])
  }, [id])

  const reload = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadPuzzle(), loadReplies()])
    setLoading(false)
  }, [loadPuzzle, loadReplies])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    if (!realtime || !id) return
    const channel = supabase
      .channel(`puzzle-${id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'replies', filter: `puzzle_id=eq.${id}` },
        () => loadReplies()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'puzzles', filter: `id=eq.${id}` },
        () => loadPuzzle()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [realtime, id, loadReplies, loadPuzzle])

  return { puzzle, replies, loading, error, reload, setPuzzle, setReplies }
}
