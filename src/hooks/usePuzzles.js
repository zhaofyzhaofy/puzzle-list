import { useCallback, useEffect, useState } from 'react'
import { listPuzzles, subscribe } from '../lib/db'

// 谜题列表 hook，数据来自本地存储，按创建时间倒序
export function usePuzzles() {
  const [puzzles, setPuzzles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    try {
      setPuzzles(listPuzzles())
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => subscribe(load), [load])

  return { puzzles, loading, error, reload: load, setPuzzles }
}
