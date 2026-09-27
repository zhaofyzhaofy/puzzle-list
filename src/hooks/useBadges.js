import { useCallback, useEffect, useState } from 'react'
import { countBadges, listBadges, subscribe } from '../lib/db'

// 某个成员的勋章列表，数据来自本地存储
export function useBadges(userId) {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!userId) return
    setLoading(true)
    setBadges(listBadges(userId))
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])
  useEffect(() => subscribe(load), [load])

  return { badges, loading, reload: load }
}

// 只需勋章数量的场景（列表页头部小徽标）
export function useBadgeCount(userId) {
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    if (!userId) return
    setCount(countBadges(userId))
  }, [userId])

  useEffect(() => { load() }, [load])
  useEffect(() => subscribe(load), [load])

  return { count, reload: load }
}
