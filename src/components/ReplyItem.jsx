import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Pencil, Check, X } from 'lucide-react'
import Avatar from './Avatar'

// 单条想法（回复），支持作者本人内联编辑
export default function ReplyItem({ reply, isMine, index, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(reply.content)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!content.trim()) return
    setSaving(true)
    const next = content.trim()
    const { error } = await supabase.from('replies').update({ content: next }).eq('id', reply.id)
    if (error) {
      alert('保存失败，请重试')
    } else {
      onUpdated?.(next)
      setEditing(false)
    }
    setSaving(false)
  }

  return (
    <div
      className={`animate-slide-up bg-white rounded-2xl p-4 shadow-sm ${isMine ? 'border-l-4 border-orange-300' : ''}`}
      style={{animationDelay: `${index * 0.06}s`}}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 flex-shrink-0">
          <Avatar profile={reply.profiles || {}} size="sm" />
        </div>
        <span className="font-bold text-gray-700 text-sm">{reply.profiles?.name}</span>
        {isMine && <span className="text-xs bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-full font-semibold">我</span>}
        <span className="text-gray-200 text-xs ml-auto">{new Date(reply.created_at).toLocaleDateString('zh-CN')}</span>
        {isMine && !editing && (
          <button
            onClick={() => { setContent(reply.content); setEditing(true) }}
            className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400 hover:bg-orange-100 transition-colors flex-shrink-0"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border-2 border-orange-300 text-gray-700 text-sm outline-none bg-gray-50 resize-none"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold hover:bg-gray-200 transition-colors"
            >
              <X className="w-3 h-3" /> 取消
            </button>
            <button
              onClick={save}
              disabled={saving || !content.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)'}}
            >
              <Check className="w-3 h-3" /> {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
      )}
    </div>
  )
}
