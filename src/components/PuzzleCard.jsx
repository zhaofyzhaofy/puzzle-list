import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from '../lib/constants'
import { Pencil, Trash2, CheckCircle, Check, X } from 'lucide-react'
import Avatar from './Avatar'

// 谜题头部卡片：展示提问者、状态操作按钮、标题正文；带内联编辑
// 逻辑封装在这里，PuzzleDetail 只负责组合
export default function PuzzleCard({ puzzle, isOwner, onSolved, onDelete, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(puzzle.title)
  const [editDescription, setEditDescription] = useState(puzzle.description || '')
  const [editCategory, setEditCategory] = useState(puzzle.category || 'other')
  const [saving, setSaving] = useState(false)
  const [solving, setSolving] = useState(false)

  function startEdit() {
    setEditTitle(puzzle.title)
    setEditDescription(puzzle.description || '')
    setEditCategory(puzzle.category || 'other')
    setEditing(true)
  }

  async function save() {
    if (!editTitle.trim()) return
    setSaving(true)
    const next = {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      category: editCategory || 'other',
    }
    const { error } = await supabase.from('puzzles').update(next).eq('id', puzzle.id)
    if (error) {
      alert('保存失败，请重试')
    } else {
      onUpdated?.(next)
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleMarkSolved() {
    if (puzzle.status === 'solved' || solving) return
    setSolving(true)
    await onSolved?.()
    setSolving(false)
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm mb-5 border border-orange-50">
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
              onClick={handleMarkSolved}
              disabled={solving}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
              style={{background: 'linear-gradient(135deg, #43e97b, #38f9d7)'}}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {solving ? '处理中...' : '🎉 已解答！'}
            </button>
          )}
          {isOwner && !editing && (
            <button
              onClick={startEdit}
              className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors text-orange-500"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {isOwner && (
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 mb-2">
        {editing ? (
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
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> 取消
              </button>
              <button
                onClick={save}
                disabled={saving || !editTitle.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)'}}
              >
                <Check className="w-3.5 h-3.5" /> {saving ? '保存中...' : '保存'}
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
  )
}
