// 解锁勋章的庆祝弹窗（拆出来让 PuzzleDetail 更清爽）
export default function BadgeUnlockModal({ badge, onClose }) {
  if (!badge) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl animate-bounce-in">
        <div className="flex justify-center gap-2 mb-3">
          {['⭐','🌟','✨'].map((s, i) => (
            <span key={i} className="text-xl animate-star-pop" style={{animationDelay: `${i * 0.15}s`}}>{s}</span>
          ))}
        </div>
        <div className="text-8xl mb-3 animate-bounce-in">{badge.emoji}</div>
        <div className="font-black text-2xl mb-1"
          style={{
            background: 'linear-gradient(135deg, #ff9a3c, #e91e63)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          获得勋章！
        </div>
        <h2 className="text-lg font-black text-gray-800 mb-1">{badge.name}</h2>
        <p className="text-gray-400 text-sm mb-6">{badge.desc}</p>
        <button
          onClick={onClose}
          className="w-full py-3.5 text-white font-black rounded-2xl transition-all active:scale-95"
          style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)', boxShadow: '0 4px 15px rgba(255,107,53,0.4)'}}
        >
          🎉 超棒！
        </button>
      </div>
    </div>
  )
}
