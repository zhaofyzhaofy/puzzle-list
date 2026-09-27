import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { CATEGORIES } from '../lib/constants'
import { ArrowLeft } from 'lucide-react'
// 保持文件独立性，未使用共享 hook（这里只有一次性插入）

export default function NewPuzzle() {
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!currentUser) navigate('/')
  }, [currentUser, navigate])

  async function createPuzzle() {
    if (!title.trim()) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('puzzles')
      .insert({
        creator_id: currentUser.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        status: 'exploring',
      })
      .select()
      .single()
    if (!error && data) {
      navigate(`/puzzles/${data.id}`)
    } else if (error) {
      alert('创建失败，请重试')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, #fff8ed 0%, #fff3e0 100%)'}}>

      {/* 顶部 */}
      <div className="sticky top-0 z-10 glass border-b border-orange-100/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/puzzles')}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <h1 className="font-black text-gray-800">✏️ 提出新谜题</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* 鼓励语 */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 mb-6 flex gap-3 items-start">
          <span className="text-2xl animate-float flex-shrink-0">💡</span>
          <div>
            <p className="font-bold text-orange-700 text-sm mb-0.5">好奇心是最棒的魔法！</p>
            <p className="text-orange-500 text-xs">把你的问题记下来，说不定某天就找到答案了～</p>
          </div>
        </div>

        {/* 分类选择 */}
        <div className="mb-6">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-3">这个问题属于哪个领域？</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 transition-all text-left ${
                  category === cat.id
                    ? `${cat.color} ${cat.border} shadow-sm -translate-y-0.5`
                    : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-sm font-bold text-gray-700">{cat.label}</span>
                {category === cat.id && <span className="ml-auto text-sm">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 谜题标题 */}
        <div className="mb-4">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
            你的问题是？ <span className="text-red-400 normal-case">*必填</span>
          </label>
          <div className="bg-white rounded-2xl border-2 border-transparent focus-within:border-orange-400 shadow-sm transition-colors overflow-hidden">
            <div className="flex items-start gap-2 p-4">
              <span className="text-xl mt-0.5 flex-shrink-0">❓</span>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例如：为什么天空是蓝色的？"
                maxLength={100}
                className="flex-1 text-gray-800 text-base font-semibold outline-none placeholder:text-gray-300 placeholder:font-normal"
                autoFocus
              />
            </div>
            <div className="px-4 pb-2 text-right">
              <span className="text-xs text-gray-300">{title.length}/100</span>
            </div>
          </div>
        </div>

        {/* 详细描述 */}
        <div className="mb-8">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
            补充说明 <span className="text-gray-300 normal-case font-normal">（可选）</span>
          </label>
          <div className="bg-white rounded-2xl border-2 border-transparent focus-within:border-orange-400 shadow-sm transition-colors p-4">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="可以写写你现在的猜想，或者什么让你想到这个问题..."
              rows={4}
              maxLength={500}
              className="w-full text-gray-700 text-sm outline-none resize-none leading-relaxed placeholder:text-gray-300"
            />
            <div className="text-right mt-1">
              <span className="text-xs text-gray-300">{description.length}/500</span>
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          onClick={createPuzzle}
          disabled={!title.trim() || submitting}
          className="w-full py-4 text-white text-lg font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: !title.trim() ? '#d1d5db' : 'linear-gradient(135deg, #ff9a3c, #ff6b35)',
            boxShadow: title.trim() ? '0 6px 20px rgba(255,107,53,0.4)' : 'none'
          }}
        >
          {submitting ? '🚀 记录中...' : '🚀 记录这个谜题！'}
        </button>
      </div>
    </div>
  )
}
