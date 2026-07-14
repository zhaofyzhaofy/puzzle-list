import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)

  // 从 localStorage 恢复上次选择的用户
  useEffect(() => {
    const saved = localStorage.getItem('puzzle_current_user')
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('puzzle_current_user')
      }
    }
  }, [])

  const selectUser = (user) => {
    setCurrentUser(user)
    localStorage.setItem('puzzle_current_user', JSON.stringify(user))
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('puzzle_current_user')
  }

  return (
    <UserContext.Provider value={{ currentUser, selectUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
