import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { CATEGORIES, getCategoryById } from '../lib/constants'
import { Plus, Search, Trophy, LogOut, Trash2, AlertCircle } from 'lucide-react'
import { Avatar } from './SelectUser'

const STATUS_FILTERS = [
  { id: 'all', label: '全部', emoji: '🌍' },
  { id: 'exploring', label: '探索中', emoji: '🔭' },
  { id: 'solved', label: '已解答', emoji: '✅' },
]

export default function PuzzleList() {
  const [puzzles, setPuzzles] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [badgeCount, setBadgeCount] = useState(0)
  const [deletingPuzzle, setDeletingPuzzle] = useState(null) // 正在删除的谜题ID
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null) // 确认删除弹窗
  const { currentUser, logout } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) { navigate('/'); return }
    loadPuzzles()
    loadProfiles()
    loadBadgeCount()
  }, [currentUser, navigate])

  async function loadPuzzles() {
    setLoading(true)
    const { data } = await supabase
      .from('puzzles')
      .select('*, profiles(name, avatar_emoji, avatar_url)')
      .order('created_at', { ascending: false })
    setPuzzles(data || [])
    setLoading(false)
  }

  async function loadProfiles() {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_emoji, avatar_url')
      .order('created_at')
    setProfiles(data || [])
  }

  async function loadBadgeCount() {
    const { count } = await supabase
      .from('badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
    setBadgeCount(count || 0)
  }

  async function deletePuzzle(puzzleId) {
    setDeletingPuzzle(puzzleId)
    const { error } = await supabase
      .from('puzzles')
      .delete()
      .eq('id', puzzleId)
    if (error) {
      alert(`删除失败：${error.message}`)
    } else {
      setPuzzles(prev => prev.filter(p => p.id !== puzzleId))
      setShowDeleteConfirm(null)
    }
    setDeletingPuzzle(null)
  }

  function handleDeletePuzzle(puzzleId) {
    setShowDeleteConfirm(puzzleId)
  }

  const filtered = puzzles.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchText.toLowerCase())
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchCreator = creatorFilter === 'all' || p.creator_id === creatorFilter
    return matchSearch && matchCat && matchStatus && matchCreator
  })

  if (!currentUser) return null

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, #fff8ed 0%, #fff3e0 100%)'}}>

      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 glass border-b border-orange-100/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <Avatar profile={currentUser} size="sm" />
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm leading-tight">{currentUser.name}</p>
              <p className="text-xs text-gray-400 leading-tight">的谜题星球 🪐</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 勋章按钮 */}
            <button
              onClick={() => navigate('/badges')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-95"
              style={{background: 'linear-gradient(135deg, #ffd700, #ff9a3c)', color: '#fff', boxShadow: '0 2px 10px rgba(255,154,60,0.35)'}}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{badgeCount}</span>
            </button>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索谜题..."
            className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border-2 border-transparent focus:border-orange-300 outline-none text-gray-700 shadow-sm text-sm font-medium placeholder:text-gray-300"
          />
        </div>

        {/* 状态筛选 */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                statusFilter === f.id
                  ? 'text-white shadow-orange scale-[1.02]'
                  : 'bg-white text-gray-500 hover:bg-orange-50 shadow-sm'
              }`}
              style={statusFilter === f.id ? {background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)'} : {}}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* 分类筛选 */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                categoryFilter === cat.id
                  ? `${cat.color} shadow-sm scale-105`
                  : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 创建人筛选 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setCreatorFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              creatorFilter === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'
            }`}
          >
            <span>👥</span>
            <span>所有人</span>
          </button>
          {profiles.map(p => {
            const active = creatorFilter === p.id
            return (
              <button
                key={p.id}
                onClick={() => setCreatorFilter(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  active
                    ? 'text-white shadow-orange scale-105'
                    : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'
                }`}
                style={active ? {background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)'} : {}}
              >
                <span className="w-4 h-4 rounded-md overflow-hidden inline-flex items-center justify-center flex-shrink-0"
                  style={{background: 'linear-gradient(135deg, #fff3e0, #fce4ec)'}}>
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[10px]">{p.avatar_emoji || '👤'}</span>
                  }
                </span>
                <span>{p.name}</span>
              </button>
            )
          })}
        </div>

        {/* 谜题列表 */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl animate-float mb-3">🔭</div>
            <p className="text-gray-400 text-sm">正在加载谜题...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🪐</div>
            <p className="text-gray-500 font-bold text-lg mb-1">宇宙一片寂静</p>
            <p className="text-gray-300 text-sm">点击右下角按钮，提出你的第一个谜题！</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((puzzle, i) => {
              const cat = getCategoryById(puzzle.category)
              const isOwner = currentUser?.id === puzzle.creator_id
              return (
                <div
                  key={puzzle.id}
                  className="relative group animate-slide-up"
                  style={{animationDelay: `${i * 0.05}s`}}
                >
                  <button
                    onClick={() => navigate(`/puzzles/${puzzle.id}`)}
                    className="w-full text-left bg-white rounded-2xl p-4 shadow-sm hover:shadow-orange border-2 border-transparent hover:border-orange-100 transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {/* 分类图标 */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${cat.color}`}>
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.color}`}>{cat.label}</span>
                          {puzzle.status === 'solved' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">✅ 已解答</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-400 font-semibold">🔭 探索中</span>
                          )}
                        </div>
                        <p className="font-bold text-gray-800 text-sm line-clamp-2 mb-1.5 leading-snug">{puzzle.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="w-5 h-5 rounded-lg overflow-hidden inline-flex items-center justify-center flex-shrink-0"
                            style={{background: 'linear-gradient(135deg, #fff3e0, #fce4ec)'}}>
                            {puzzle.profiles?.avatar_url
                              ? <img src={puzzle.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <span className="text-xs">{puzzle.profiles?.avatar_emoji || '👤'}</span>
                            }
                          </span>
                          <span>{puzzle.profiles?.name}</span>
                          <span className="text-gray-200">·</span>
                          <span>{new Date(puzzle.created_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  {/* 删除按钮 */}
                  {isOwner && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePuzzle(puzzle.id); }}
                      disabled={deletingPuzzle === puzzle.id}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white shadow-sm border border-gray-100 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 悬浮新建按钮 */}
      <button
        onClick={() => navigate('/puzzles/new')}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-white flex items-center justify-center active:scale-90 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)',
          boxShadow: '0 4px 20px rgba(255,107,53,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="text-red-500 w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-gray-800">确认删除</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              确定要删除这个谜题吗？删除后，谜题的所有回复和相关勋章也会被删除，此操作无法撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-semibold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deletePuzzle(showDeleteConfirm)}
                disabled={deletingPuzzle === showDeleteConfirm}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingPuzzle === showDeleteConfirm ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
