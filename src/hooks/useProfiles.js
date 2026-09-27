import { useCallback, useEffect, useState } from 'react'
import { listProfiles, subscribe } from '../lib/db'

// 家庭成员列表 hook
// 提供 profiles / loading / error / reload / setProfiles(用于乐观更新)
// 数据来自浏览器本地存储，任何写入都会通过本地订阅触发重新读取
export function useProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    try {
      setProfiles(listProfiles())
    } catch (err) {
      setError(err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => subscribe(load), [load])

  return { profiles, loading, error, reload: load, setProfiles }
}
