import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { BADGES } from '../lib/constants'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Avatar } from './SelectUser'

export default function BadgeWall() {
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) { navigate('/'); return }
    loadBadges()
  }, [currentUser, navigate])

  async function loadBadges() {
    const { data } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('earned_at', { ascending: false })
    setBadges(data || [])
    setLoading(false)
  }

  const badgeCounts = badges.reduce((acc, b) => {
    acc[b.badge_type] = (acc[b.badge_type] || 0) + 1
    return acc
  }, {})

  const earnedTypes = Object.keys(badgeCounts)

  return (
    <div className="min-h-screen pb-10" style={{background: 'linear-gradient(180deg, #fffbeb 0%, #fff8e1 100%)'}}>

      {/* 顶部 */}
      <div className="sticky top-0 z-10 glass border-b border-yellow-100/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/puzzles')}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-400" />
          <h1 className="font-black text-gray-800">我的勋章墙</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* 用户信息卡 */}
        <div className="rounded-3xl p-6 text-center mb-6 relative overflow-hidden"
          style={{background: 'linear-gradient(135deg, #ffd700 0%, #ff9a3c 50%, #ff6b35 100%)'}}>
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-10">
            {['⭐','🌟','✨','💫','⭐','🌟'].map((s, i) => (
              <span key={i} className="absolute text-3xl" style={{
                left: `${5 + i * 16}%`, top: `${10 + (i%2)*60}%`
              }}>{s}</span>
            ))}
          </div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-3 animate-float">
              <Avatar profile={currentUser} size="lg" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">{currentUser.name}</h2>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
              <Trophy className="w-4 h-4 text-white fill-white" />
              <span className="text-white font-bold text-sm">{badges.length} 枚勋章</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="text-4xl animate-float">🏆</div>
          </div>
        ) : (
          <>
            {/* 勋章展示网格：始终展示全部勋章，已获得亮显，未获得灰显 */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">勋章收藏</h3>
              <span className="text-xs font-bold text-gray-400">
                {earnedTypes.length} / {Object.keys(BADGES).length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6 sm:grid-cols-4">
              {Object.entries(BADGES).map(([type, badge], i) => {
                const count = badgeCounts[type] || 0
                const has = count > 0
                return (
                  <div
                    key={type}
                    title={badge.desc}
                    className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                      has
                        ? `${badge.color} shadow-sm animate-slide-up`
                        : 'bg-gray-50 border-gray-100 opacity-50'
                    }`}
                    style={has ? {animationDelay: `${i * 0.08}s`} : {}}
                  >
                    <div className={`text-4xl mb-2 ${!has ? 'grayscale' : ''}`}>{badge.emoji}</div>
                    <p className={`text-xs font-bold text-center leading-tight ${has ? 'text-gray-700' : 'text-gray-400'}`}>
                      {badge.name}
                    </p>
                    {count > 1 && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black"
                        style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)'}}>
                        {count}
                      </div>
                    )}
                    {has ? (
                      <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                        style={{background: 'linear-gradient(135deg, #43e97b, #38f9d7)'}}>
                        ✓
                      </div>
                    ) : (
                      <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center bg-gray-300 text-white text-[10px]">
                        🔒
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {badges.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-3xl shadow-sm">
                <div className="text-5xl mb-3">🏆</div>
                <p className="font-black text-gray-600 text-lg mb-1">还没有解锁勋章</p>
                <p className="text-gray-400 text-sm mb-5">解答谜题就能点亮上方勋章！</p>
                <button
                  onClick={() => navigate('/puzzles')}
                  className="px-6 py-3 text-white font-bold rounded-2xl"
                  style={{background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)'}}
                >
                  去探索谜题 →
                </button>
              </div>
            ) : (
              <>
                {/* 获得记录 */}
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">获得记录</h3>
                <div className="flex flex-col gap-2">
                  {badges.slice(0, 10).map((badge, i) => {
                    const info = BADGES[badge.badge_type]
                    if (!info) return null
                    return (
                      <div key={badge.id}
                        className="animate-slide-up flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm"
                        style={{animationDelay: `${i * 0.06}s`}}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${info.color}`}>
                          {info.emoji}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-700 text-sm">{info.name}</p>
                          <p className="text-xs text-gray-400">{info.desc}</p>
                        </div>
                        <p className="text-xs text-gray-300 flex-shrink-0">{new Date(badge.earned_at).toLocaleDateString('zh-CN')}</p>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
