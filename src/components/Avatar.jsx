import { User } from 'lucide-react'

// 头像组件：优先使用 avatar_url，其次 emoji，最后占位图标
// size: 'sm' (36px) | 'md' (56px) | 'lg' (80px)
export default function Avatar({ profile, size = 'md', className = '' }) {
  const sizeClass =
    size === 'lg' ? 'w-20 h-20 text-4xl'
    : size === 'sm' ? 'w-9 h-9 text-lg'
    : 'w-14 h-14 text-3xl'

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.name}
        className={`${sizeClass} rounded-2xl object-cover ${className}`}
      />
    )
  }
  return (
    <div
      className={`${sizeClass} rounded-2xl flex items-center justify-center ${className}`}
      style={{ background: 'linear-gradient(135deg, #fff3e0, #fce4ec)' }}
    >
      {profile?.avatar_emoji || <User className="w-1/2 h-1/2 text-gray-300" />}
    </div>
  )
}
