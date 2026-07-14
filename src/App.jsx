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

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
