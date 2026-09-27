import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import SelectUser from './pages/SelectUser'
import PuzzleList from './pages/PuzzleList'
import PuzzleDetail from './pages/PuzzleDetail'
import NewPuzzle from './pages/NewPuzzle'
import BadgeWall from './pages/BadgeWall'

function ProtectedRoute({ children }) {
  const { currentUser } = useUser()
  if (!currentUser) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SelectUser />} />
      <Route path="/puzzles" element={
        <ProtectedRoute><PuzzleList /></ProtectedRoute>
      } />
      <Route path="/puzzles/new" element={
        <ProtectedRoute><NewPuzzle /></ProtectedRoute>
      } />
      <Route path="/puzzles/:id" element={
        <ProtectedRoute><PuzzleDetail /></ProtectedRoute>
      } />
      <Route path="/badges" element={
        <ProtectedRoute><BadgeWall /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// 应用部署在 /puzzle-list/ 子路径下，路由必须带上同样的前缀，
// 否则刷新页面或直接访问子路由会匹配不到。
// BASE_URL 来自 vite.config.js 的 base，末尾带斜杠，而 React Router 不接受尾斜杠，故去掉。
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

function App() {
  return (
    <BrowserRouter basename={basename}>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
