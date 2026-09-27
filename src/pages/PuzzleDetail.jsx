import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { BADGES, getCategoryById } from '../lib/constants'
import { ArrowLeft, Send, Star } from 'lucide-react'
import Loading from '../components/Loading'
import ConfirmDialog from '../components/ConfirmDialog'
import PuzzleCard from '../components/PuzzleCard'
import ReplyItem from '../components/ReplyItem'
import BadgeUnlockModal from '../components/BadgeUnlockModal'
import { usePuzzle } from '../hooks/usePuzzle'

export default function PuzzleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useUser()

  const { puzzle, replies, loading, error, setPuzzle, setReplies } = usePuzzle(id)

  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showBadge, setShowBadge] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!currentUser) navigate('/')
  }, [currentUser, navigate])

  async function submitReply() {
    if (!newReply.trim()) return
    setSubmitting(true)
    const content = newReply.trim()
    setNewReply('')
    const { data, error: err } = await supabase
      .from('replies')
      .insert({ puzzle_id: id, author_id: currentUser.id, content })
      .select('*, profiles(name, avatar_emoji, avatar_url)')
      .single()
    if (err) {
      setNewReply(content)
      alert('发送失败，请重试')
    } else if (data) {
      // realtime 也会推送新记录，去重后再插入
      setReplies(prev => prev.some(r => r.id === data.id) ? prev : [...prev, data])
    }
    setSubmitting(false)
  }

  async function markSolved() {
    if (!puzzle || puzzle.status === 'solved') return
    const { error: err } = await supabase
      .from('puzzles')
      .update({ status: 'solved', solved_at: new Date().toISOString() })
      .eq('id', id)
    if (err) {
      alert('操作失败，请重试')
      return
    }
    const badgeType = puzzle.category
    await supabase.from('badges').insert({
      user_id: puzzle.creator_id,
      badge_type: badgeType,
      puzzle_id: id,
    })
    setPuzzle(prev => prev ? { ...prev, status: 'solved' } : prev)
    setShowBadge(BADGES[badgeType])
  }

  async function deletePuzzle() {
    setDeleting(true)
    const { error: err } = await supabase.from('puzzles').delete().eq('id', id)
    if (err) {
      alert(`删除失败：${err.message}`)
    } else {
      navigate('/puzzles')
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  if (loading) return <Loading emoji="🔮" text="加载谜题中..." full />

  if (error || !puzzle) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{background: 'linear-gradient(180deg, #fff8ed, #fff3e0)'}}>
      <div className="text-5xl">😅</div>
      <p className="text-gray-500 font-semibold">谜题不存在或加载失败</p>
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

        <PuzzleCard
          puzzle={puzzle}
          isOwner={isOwner}
          onSolved={markSolved}
          onDelete={() => setShowDeleteConfirm(true)}
          onUpdated={(next) => setPuzzle(prev => prev ? { ...prev, ...next } : prev)}
        />

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

        <div className="flex flex-col gap-3">
          {replies.map((reply, i) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              index={i}
              isMine={reply.author_id === currentUser?.id}
              onUpdated={(next) => setReplies(prev => prev.map(r => r.id === reply.id ? { ...r, content: next } : r))}
            />
          ))}
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

      <BadgeUnlockModal badge={showBadge} onClose={() => setShowBadge(null)} />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认删除"
        message="确定要删除这个谜题吗？删除后，谜题的所有回复和相关勋章也会被删除，此操作无法撤销。"
        confirmText="确认删除"
        loading={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={deletePuzzle}
      />
    </div>
  )
}
