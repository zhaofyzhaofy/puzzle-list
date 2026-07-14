// 谜题分类配置
export const CATEGORIES = [
  { id: 'science', label: '自然科学', emoji: '🔬', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { id: 'life', label: '生活常识', emoji: '🏠', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  { id: 'imagination', label: '天马行空', emoji: '🌈', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  { id: 'math', label: '数学王国', emoji: '🔢', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  { id: 'other', label: '其他', emoji: '💡', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
]

// 勋章配置（每个分类对应一种勋章）
export const BADGES = {
  science: { emoji: '🏅', name: '科学探索家', desc: '解决了一个自然科学谜题', color: 'bg-blue-50 border-blue-300' },
  life: { emoji: '⭐', name: '生活小达人', desc: '解决了一个生活常识谜题', color: 'bg-green-50 border-green-300' },
  imagination: { emoji: '🌟', name: '想象力大师', desc: '解决了一个天马行空谜题', color: 'bg-purple-50 border-purple-300' },
  math: { emoji: '🎯', name: '数学小神童', desc: '解决了一个数学谜题', color: 'bg-yellow-50 border-yellow-300' },
  other: { emoji: '💎', name: '万能探索者', desc: '解决了一个谜题', color: 'bg-orange-50 border-orange-300' },
  first: { emoji: '🚀', name: '首个谜题', desc: '提出了第一个谜题', color: 'bg-pink-50 border-pink-300' },
}

// 默认可选头像
export const AVATARS = ['🧒', '👦', '👧', '👨', '👩', '👴', '👵', '🧑', '🧔', '👱', '🐱', '🐶', '🦊', '🐼', '🐸']

export const getCategoryById = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[4]
