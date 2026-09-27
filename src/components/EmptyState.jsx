// 空状态占位
export default function EmptyState({ emoji = '🪐', title, hint, action }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{emoji}</div>
      {title && <p className="text-gray-500 font-bold text-lg mb-1">{title}</p>}
      {hint && <p className="text-gray-300 text-sm">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
