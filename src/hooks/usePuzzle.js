import { useCallback, useEffect, useState } from 'react'
import { getPuzzle, listReplies, subscribe } from '../lib/db'

// 单个谜题 + 它的回复列表，数据来自本地存储
export function usePuzzle(id) {
  const [puzzle, setPuzzle] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setPuzzle(getPuzzle(id))
      setReplies(listReplies(id))
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { reload() }, [reload])
  useEffect(() => subscribe(reload), [reload])

  return { puzzle, replies, loading, error, reload, setPuzzle, setReplies }
}
