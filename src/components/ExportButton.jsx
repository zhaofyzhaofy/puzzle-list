import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { exportAsJSON, exportAsMarkdown } from '../lib/exporter'

// 导出按钮：点击展开菜单，可选 Markdown（成长档案）或 JSON（备份）
export default function ExportButton() {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  async function handleExport(kind) {
    setExporting(kind)
    try {
      if (kind === 'md') await exportAsMarkdown()
      else await exportAsJSON()
      setOpen(false)
    } catch (err) {
      alert(`导出失败：${err.message || err}`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="导出全部数据"
        className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white text-gray-500 font-bold text-sm shadow-sm hover:bg-orange-50 hover:text-orange-500 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">导出</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden z-20">
          <button
            onClick={() => handleExport('md')}
            disabled={!!exporting}
            className="w-full text-left px-4 py-3 hover:bg-orange-50 disabled:opacity-50 flex items-start gap-3 transition-colors"
          >
            <span className="text-lg">📖</span>
            <div>
              <p className="text-sm font-bold text-gray-700">
                {exporting === 'md' ? '导出中...' : '成长档案 (Markdown)'}
              </p>
              <p className="text-xs text-gray-400">按人分组，可读可打印</p>
            </div>
          </button>
          <div className="h-px bg-gray-100" />
          <button
            onClick={() => handleExport('json')}
            disabled={!!exporting}
            className="w-full text-left px-4 py-3 hover:bg-orange-50 disabled:opacity-50 flex items-start gap-3 transition-colors"
          >
            <span className="text-lg">💾</span>
            <div>
              <p className="text-sm font-bold text-gray-700">
                {exporting === 'json' ? '导出中...' : '完整备份 (JSON)'}
              </p>
              <p className="text-xs text-gray-400">原始结构，可用于恢复</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
