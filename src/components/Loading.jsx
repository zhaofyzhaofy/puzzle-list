// 加载中占位。emoji 会浮动动画。
export default function Loading({ emoji = '🔭', text = '加载中...', full = false }) {
  const wrapCls = full
    ? 'min-h-screen flex items-center justify-center'
    : 'text-center py-16'
  return (
    <div className={wrapCls} style={full ? { background: 'linear-gradient(180deg, #fff8ed, #fff3e0)' } : {}}>
      <div className="text-center">
        <div className="text-4xl animate-float mb-3">{emoji}</div>
        <p className="text-gray-400 text-sm">{text}</p>
      </div>
    </div>
  )
}
