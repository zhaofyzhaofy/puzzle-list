import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { importFromJSONText } from '../lib/exporter'
import { useUser } from '../context/UserContext'

// 从备份 JSON 恢复数据。
// 数据存在浏览器本地，换设备/清缓存后靠它把数据搬回来，所以放在首页（选人页）最显眼的位置。
// 导入是覆盖式的，执行前会先把将要导入的内容告诉用户并要求确认。
export default function ImportButton({ className = '', label = '从备份恢复' }) {
  const fileRef = useRef(null)
  const [importing, setImporting] = useState(false)
  const { logout } = useUser()
  const navigate = useNavigate()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImporting(true)
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
          '如果想保留现在的内容，请先点「导出」备份一份。\n\n' +
          '确定继续吗？'
      )
      if (!ok) return

      importFromJSONText(text)
      alert('导入完成，请重新选择成员')
      // 导入后原来选中的成员可能已经不存在，回到首页重新选择
      logout()
      navigate('/')
    } catch (err) {
      alert(`导入失败：${err.message || '文件格式不正确'}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className={className}
      >
        <Upload className="w-3.5 h-3.5" />
        <span>{importing ? '导入中...' : label}</span>
      </button>
    </>
  )
}
