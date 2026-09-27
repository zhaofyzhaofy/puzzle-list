import { getCategoryById } from '../lib/constants'

// 分类标签：统一样式的胶囊标签
export default function CategoryTag({ category, size = 'sm' }) {
  const cat = getCategoryById(category)
  const cls = size === 'md'
    ? 'text-sm px-3 py-1 rounded-full font-bold flex items-center gap-1'
    : 'text-xs px-2 py-0.5 rounded-full font-semibold'
  return (
    <span className={`${cls} ${cat.color}`}>
      {size === 'md' && <span>{cat.emoji}</span>}
      <span>{cat.label}</span>
    </span>
  )
}

// 状态徽章
export function StatusBadge({ status }) {
  if (status === 'solved') {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">✅ 已解答</span>
  }
  return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-400 font-semibold">🔭 探索中</span>
}
