import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database } from 'lucide-react'
import { exportAsJSON, exportAsMarkdown, importFromJSONText } from '../lib/exporter'
import { useUser } from '../context/UserContext'

// 数据管理菜单（导出备份 / 导出成长档案 / 从备份恢复）。
// 数据存在本机浏览器里，导入导出是唯一的备份和迁移手段；但这些操作低频且有风险，
// 所以收成一个 32px 的小图标，必须先点开菜单才会出现选项，避免误触。
export default function DataMenu({ className = '' }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null) // 'md' | 'json' | 'import'
  const wrapRef = useRef(null)
  const fileRef = useRef(null)
  const { logout } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  async function handleExport(kind) {
    setBusy(kind)
    try {
      if (kind === 'md') await exportAsMarkdown()
      else await exportAsJSON()
      setOpen(false)
    } catch (err) {
      alert(`导出失败：${err.message || err}`)
    } finally {
      setBusy(null)
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setOpen(false)
    setBusy('import')
    try {
      const text = await file.text()
      const preview = JSON.parse(text)
      const summary =
        `成员 ${preview.profiles?.length || 0} 人、` +
        `谜题 ${preview.puzzles?.length || 0} 条、` +
        `想法 ${preview.replies?.length || 0} 条、` +
        `勋章 ${preview.badges?.length || 0} 个`

      const ok = window.confirm(
        `即将导入：${summary}\n\n` +
          '导入会【覆盖】当前设备上的全部数据，且无法撤销。\n' +
          '如果想保留现在的内容，请先导出备份。\n\n' +
          '确定继续吗？'
      )
      if (!ok) return

      importFromJSONText(text)
      alert('导入完成，请重新选择成员')
      logout()
      navigate('/')
    } catch (err) {
      alert(`导入失败：${err.message || '文件格式不正确'}`)
    } finally {
      setBusy(null)
    }
  }

  const itemClass =
    'w-full text-left px-3.5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50 flex items-center gap-2.5 transition-colors'

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="数据备份与恢复"
        aria-label="数据备份与恢复"
        className="w-8 h-8 rounded-xl bg-white/80 text-gray-400 flex items-center justify-center shadow-sm hover:bg-white hover:text-orange-500 active:scale-95 transition-all"
      >
        <Database className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden z-30 py-1">
          <button type="button" onClick={() => handleExport('md')} disabled={!!busy} className={itemClass}>
            <span>📖</span>
            <span>{busy === 'md' ? '导出中...' : '成长档案'}</span>
          </button>
          <button type="button" onClick={() => handleExport('json')} disabled={!!busy} className={itemClass}>
            <span>💾</span>
            <span>{busy === 'json' ? '导出中...' : '完整备份'}</span>
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={!!busy} className={itemClass}>
            <span>📥</span>
            <span>{busy === 'import' ? '导入中...' : '从备份恢复'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
