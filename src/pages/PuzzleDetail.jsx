import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { BADGES, CATEGORIES, getCategoryById } from '../lib/constants'
import { ArrowLeft, CheckCircle, Send, Star, Trash2, AlertCircle, Pencil, Check, X } from 'lucide-react'
import { Avatar } from './SelectUser'

export default function PuzzleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const [puzzle, setPuzzle] = useState(null)
  const [replies, setReplies] = useState([])
  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [solving, setSolving] = useState(false)
  const [showBadge, setShowBadge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // 编辑谜题
  const [editingPuzzle, setEditingPuzzle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('other')
  const [savingPuzzle, setSavingPuzzle] = useState(false)
  // 编辑想法
  const [editingReplyId, setEditingReplyId] = useState(null)
  const [editReplyContent, setEditReplyContent] = useState('')
  const [savingReply, setSavingReply] = useState(false)

  useEffect(() => {
    if (!currentUser) { navigate('/'); return }
    loadPuzzle()
    loadReplies()
  }, [id, currentUser, navigate])

  async function loadPuzzle() {
    setLoading(true)
    const { data, error } = await supabase
      .from('puzzles')
      .select('*, profiles(name, avatar_emoji)')
      .eq('id', id)
      .single()
    if (error) {
      setError('加载失败，请返回重试')
    } else {
      setPuzzle(data)
    }
    setLoading(false)
  }

  async function loadReplies() {
    const { data } = await supabase
      .from('replies')
      .select('*, profiles(name, avatar_emoji)')
      .eq('puzzle_id', id)
      .order('created_at', { ascending: true })
    setReplies(data || [])
  }

  async function submitReply() {
    if (!newReply.trim()) return
    setSubmitting(true)
    const content = newReply.trim()
    setNewReply('')
    const { data, error } = await supabase
      .from('replies')
      .insert({ puzzle_id: id, author_id: currentUser.id, content })
      .select('*, profiles(name, avatar_emoji)')
      .single()
    if (error) {
      setNewReply(content)
      alert('发送失败，请重试')
    } else if (data) {
      setReplies(prev => [...prev, data])
    }
    setSubmitting(false)
  }

  async function markSolved() {
    if (!puzzle || puzzle.status === 'solved' || solving) return
    setSolving(true)
    const { error: puzzleError } = await supabase
      .from('puzzles')
      .update({ status: 'solved', solved_at: new Date().toISOString() })
      .eq('id', id)
    if (puzzleError) {
      alert('操作失败，请重试')
      setSolving(false)
      return
    }
    const badgeType = puzzle.category
    await supabase.from('badges').insert({
      user_id: puzzle.creator_id,
      badge_type: badgeType,
      puzzle_id: id,
    })
    setPuzzle(prev => ({ ...prev, status: 'solved' }))
    setShowBadge(BADGES[badgeType])
    setSolving(false)
  }
  async function deletePuzzle() {
    setDeleting(true)
    const { error } = await supabase
      .from('puzzles')
      .delete()
      .eq('id', id)
    if (error) {
      alert(`删除失败：${error.message}`)
    } else {
      navigate('/puzzles')
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  function startEditPuzzle() {
    setEditTitle(puzzle.title)
    setEditDescription(puzzle.description || '')
    setEditCategory(puzzle.category || 'other')
    setEditingPuzzle(true)
  }

  async function saveEditPuzzle() {
    if (!editTitle.trim()) return
    setSavingPuzzle(true)
    const nextCategory = editCategory || 'other'
    const { error } = await supabase
      .from('puzzles')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: nextCategory,
      })
      .eq('id', id)
    if (error) {
      alert('保存失败，请重试')
    } else {
      setPuzzle(prev => ({
        ...prev,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: nextCategory,
      }))
      setEditingPuzzle(false)
    }
    setSavingPuzzle(false)
  }

  function startEditReply(reply) {
    setEditingReplyId(reply.id)
    setEditReplyContent(reply.content)
  }

  async function saveEditReply(replyId) {
    if (!editReplyContent.trim()) return
    setSavingReply(true)
    const { error } = await supabase
      .from('replies')
      .update({ content: editReplyContent.trim() })
      .eq('id', replyId)
    if (error) {
      alert('保存失败，请重试')
    } else {
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, content: editReplyContent.trim() } : r))
      setEditingReplyId(null)
    }
    setSavingReply(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(180deg, #fff8ed, #fff3e0)'}}>
      <div className="text-center">
        <div className="text-5xl animate-float mb-3">🔮</div>
        <p className="text-gray-400 text-sm">加载谜题中...</p>
      </div>
    </div>
  )

  if (error || !puzzle) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{background: 'linear-gradient(180deg, #fff8ed, #fff3e0)'}}>
      <div className="text-5xl">😅</div>
      <p className="text-gray-500 font-semibold">{error || '谜题不存在'}</p>
      <button onClick={() => navigate('/puzzles')} className="px-5 py-2.5 text-white rounded-2xl text-sm font-bold"
        style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)'}}>
        返回列表
      </button>
    </div>
  )

  const cat = getCategoryById(puzzle.category)
  const isOwner = currentUser?.id === puzzle.creator_id

  return (
    <div className="min-h-screen pb-28" style={{background: 'linear-gradient(180deg, #fff8ed 0%, #fff3e0 100%)'}}>

      {/* 顶部 */}
      <div className="sticky top-0 z-10 glass border-b border-orange-100/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/puzzles')}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${cat.color}`}>
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </div>
          {puzzle.status === 'solved' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600">✅ 已解答</span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* 谜题卡片 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-5 border border-orange-50">
          {/* 谜题提问者 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 flex-shrink-0">
              <Avatar profile={puzzle.profiles || {}} size="sm" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">{puzzle.profiles?.name}</p>
              <p className="text-xs text-gray-400">{new Date(puzzle.created_at).toLocaleDateString('zh-CN')} 提出</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isOwner && puzzle.status === 'exploring' && (
                <button
                  onClick={markSolved}
                  disabled={solving}
                  className="flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                  style={{background: 'linear-gradient(135deg, #43e97b, #38f9d7)'}}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {solving ? '处理中...' : '🎉 已解答！'}
                </button>
              )}
              {isOwner && !editingPuzzle && (
                <button
                  onClick={startEditPuzzle}
                  className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors text-orange-500"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 谜题内容 */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 mb-2">
            {editingPuzzle ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-orange-300 text-gray-800 font-bold text-base outline-none bg-white"
                  placeholder="谜题标题"
                />
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-orange-200 text-gray-600 text-sm outline-none bg-white resize-none"
                  placeholder="补充描述（选填）"
                  rows={3}
                />
                {/* 分类（标签类型）选择 */}
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1.5">标签类型</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(c => {
                      const active = editCategory === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setEditCategory(c.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                            active
                              ? `${c.color} ${c.border} shadow-sm`
                              : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          <span>{c.emoji}</span>
                          <span>{c.label}</span>
                          {active && <span className="ml-0.5">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingPuzzle(false)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> 取消
                  </button>
                  <button
                    onClick={saveEditPuzzle}
                    disabled={savingPuzzle || !editTitle.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                    style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)'}}
                  >
                    <Check className="w-3.5 h-3.5" /> {savingPuzzle ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <span className="text-xl flex-shrink-0 mt-0.5">❓</span>
                <div>
                  <h1 className="text-lg font-black text-gray-800 leading-snug">{puzzle.title}</h1>
                  {puzzle.description && (
                    <p className="text-gray-600 text-sm leading-relaxed mt-2">{puzzle.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 回复区标题 */}
        {replies.length > 0 && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span className="text-sm font-bold text-gray-600">{replies.length} 个想法</span>
          </div>
        )}

        {replies.length === 0 && (
          <div className="text-center py-8 bg-white/50 rounded-3xl mb-4">
            <div className="text-4xl mb-2">💭</div>
            <p className="text-gray-400 text-sm font-medium">还没有人分享想法</p>
            <p className="text-gray-300 text-xs mt-1">你来说第一个？</p>
          </div>
        )}

        {/* 回复列表 */}
        <div className="flex flex-col gap-3">
          {replies.map((reply, i) => {
            const isMine = reply.author_id === currentUser?.id
            const isEditingThis = editingReplyId === reply.id
            return (
              <div
                key={reply.id}
                className={`animate-slide-up bg-white rounded-2xl p-4 shadow-sm ${isMine ? 'border-l-4 border-orange-300' : ''}`}
                style={{animationDelay: `${i * 0.06}s`}}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 flex-shrink-0">
                    <Avatar profile={reply.profiles || {}} size="sm" />
                  </div>
                  <span className="font-bold text-gray-700 text-sm">{reply.profiles?.name}</span>
                  {isMine && <span className="text-xs bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-full font-semibold">我</span>}
                  <span className="text-gray-200 text-xs ml-auto">{new Date(reply.created_at).toLocaleDateString('zh-CN')}</span>
                  {isMine && !isEditingThis && (
                    <button
                      onClick={() => startEditReply(reply)}
                      className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400 hover:bg-orange-100 transition-colors flex-shrink-0"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {isEditingThis ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editReplyContent}
                      onChange={e => setEditReplyContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-orange-300 text-gray-700 text-sm outline-none bg-gray-50 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingReplyId(null)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-3 h-3" /> 取消
                      </button>
                      <button
                        onClick={() => saveEditReply(reply.id)}
                        disabled={savingReply || !editReplyContent.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                        style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)'}}
                      >
                        <Check className="w-3 h-3" /> {savingReply ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 底部输入框 */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-orange-100/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2.5 border-2 border-transparent focus-within:border-orange-300 transition-colors">
            <textarea
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
              placeholder="分享你的想法..."
              rows={1}
              className="w-full bg-transparent text-gray-700 text-sm outline-none resize-none placeholder:text-gray-300 leading-relaxed"
              style={{minHeight: '22px', maxHeight: '88px'}}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply() } }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            />
          </div>
          <button
            onClick={submitReply}
            disabled={!newReply.trim() || submitting}
            className="w-11 h-11 rounded-2xl text-white flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 flex-shrink-0"
            style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)', boxShadow: '0 3px 12px rgba(255,107,53,0.4)'}}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 勋章弹窗 */}
      {showBadge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl animate-bounce-in">
            {/* 星星装饰 */}
            <div className="flex justify-center gap-2 mb-3">
              {['⭐','🌟','✨'].map((s, i) => (
                <span key={i} className="text-xl animate-star-pop" style={{animationDelay: `${i * 0.15}s`}}>{s}</span>
              ))}
            </div>
            <div className="text-8xl mb-3 animate-bounce-in">{showBadge.emoji}</div>
            <div className="font-black text-2xl mb-1"
              style={{
                background: 'linear-gradient(135deg, #ff9a3c, #e91e63)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              获得勋章！
            </div>
            <h2 className="text-lg font-black text-gray-800 mb-1">{showBadge.name}</h2>
            <p className="text-gray-400 text-sm mb-6">{showBadge.desc}</p>
            <button
              onClick={() => setShowBadge(null)}
              className="w-full py-3.5 text-white font-black rounded-2xl transition-all active:scale-95"
              style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)', boxShadow: '0 4px 15px rgba(255,107,53,0.4)'}}
            >
              🎉 超棒！
            </button>
          </div>
        </div>
      )}

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
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-semibold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={deletePuzzle}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
