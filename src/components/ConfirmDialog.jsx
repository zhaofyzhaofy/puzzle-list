import { AlertCircle } from 'lucide-react'

// 通用的确认对话框：用于删除/危险操作二次确认
export default function ConfirmDialog({
  open,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  loading = false,
  onConfirm,
  onCancel,
  danger = true,
}) {
  if (!open) return null

  const confirmClass = danger
    ? 'bg-red-500 text-white hover:bg-red-600'
    : 'text-white'
  const confirmStyle = danger
    ? {}
    : { background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)' }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-orange-100'}`}>
            <AlertCircle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-orange-500'}`} />
          </div>
          <h2 className="text-lg font-black text-gray-800">{title}</h2>
        </div>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-semibold hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmClass}`}
            style={confirmStyle}
          >
            {loading ? '处理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
