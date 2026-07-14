import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { Plus, Sparkles, X, Camera, User, Trash2, AlertCircle } from 'lucide-react'

// 头像显示组件：优先 avatar_url，降级 emoji，再降级占位
function Avatar({ profile, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-4xl' : size === 'sm' ? 'w-9 h-9 text-lg' : 'w-14 h-14 text-3xl'
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.name}
        className={`${sizeClass} rounded-2xl object-cover`}
      />
    )
  }
  return (
    <div className={`${sizeClass} rounded-2xl flex items-center justify-center`}
      style={{ background: 'linear-gradient(135deg, #fff3e0, #fce4ec)' }}>
      {profile.avatar_emoji || <User className="w-1/2 h-1/2 text-gray-300" />}
    </div>
  )
}

export { Avatar }

export default function SelectUser() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)       // File 对象
  const [avatarPreview, setAvatarPreview] = useState(null) // 本地预览 URL
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState(null) // 正在删除的成员ID
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null) // 确认删除弹窗
  const [changingAvatarId, setChangingAvatarId] = useState(null) // 正在换头像的成员ID
  const fileInputRef = useRef(null)
  const changeAvatarInputRef = useRef(null) // 换头像用的隐藏 file input
  const changeAvatarTargetRef = useRef(null) // 记录点击"换头像"的成员ID
  const { selectUser } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    setLoading(true)
    setLoadError(false)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at')
    if (error) {
      setLoadError(true)
    } else {
      setProfiles(data || [])
    }
    setLoading(false)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      alert('图片不能超过 20MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function uploadAvatar(profileId) {
    if (!avatarFile) return null
    const ext = avatarFile.name.split('.').pop()
    const path = `${profileId}.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
    if (error) {
      console.error('头像上传失败:', error)
      alert(`头像上传失败：${error.message}`)
      return null
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl + '?t=' + Date.now()
  }

  async function createProfile() {
    if (!newName.trim()) return
    if (!avatarFile) { alert('请选择一张头像图片'); return }
    setCreating(true)

    // 先创建 profile（不含头像 URL，使用默认 emoji）
    const { data, error } = await supabase
      .from('profiles')
      .insert({ name: newName.trim() })
      .select()
      .single()

    if (error || !data) {
      alert(`创建成员失败：${error?.message || '未知错误'}`)
      setCreating(false)
      return
    }

    // 上传头像并更新 profile
    setUploading(true)
    const avatarUrl = await uploadAvatar(data.id)
    setUploading(false)

    if (avatarUrl) {
      const { error: updateError } = await supabase
        .from('profiles').update({ avatar_url: avatarUrl }).eq('id', data.id)
      if (updateError) console.error('更新头像URL失败:', updateError)
      data.avatar_url = avatarUrl
    }

    setProfiles(prev => [...prev, data])
    resetForm()
    handleSelect(data)
    setCreating(false)
  }

  function resetForm() {
    setShowCreate(false)
    setNewName('')
    setAvatarFile(null)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
  }

  function handleSelect(profile) {
    selectUser(profile)
    navigate('/puzzles')
  }

  async function deleteProfile(profileId) {
    setDeletingProfile(profileId)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)
    if (error) {
      alert(`删除失败：${error.message}`)
    } else {
      setProfiles(prev => prev.filter(p => p.id !== profileId))
      setShowDeleteConfirm(null)
    }
    setDeletingProfile(null)
  }

  function handleDeleteProfile(profileId) {
    setShowDeleteConfirm(profileId)
  }

  // 点击"换头像"按钮
  function handleChangeAvatarClick(profileId, e) {
    e.stopPropagation()
    changeAvatarTargetRef.current = profileId
    changeAvatarInputRef.current?.click()
  }

  // 选择新头像文件后立即上传并更新
  async function handleChangeAvatarFile(e) {
    const file = e.target.files?.[0]
    // 清空 input 值，方便下次选同一文件也能触发
    e.target.value = ''
    const profileId = changeAvatarTargetRef.current
    if (!file || !profileId) return
    if (file.size > 20 * 1024 * 1024) {
      alert('图片不能超过 20MB')
      return
    }

    setChangingAvatarId(profileId)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profileId}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) {
        alert(`头像上传失败：${upErr.message}`)
        return
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const newUrl = urlData.publicUrl + '?t=' + Date.now()

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('id', profileId)
      if (updErr) {
        alert(`更新头像失败：${updErr.message}`)
        return
      }
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, avatar_url: newUrl } : p))
    } finally {
      setChangingAvatarId(null)
      changeAvatarTargetRef.current = null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #fff8ed 0%, #fff3e0 40%, #fce4ec 100%)' }}>

      {/* 换头像隐藏 input */}
      <input
        ref={changeAvatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChangeAvatarFile}
      />

      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🌟', '💫', '✨', '🔮', '🌈', '⭐'].map((e, i) => (
          <div key={i} className="absolute text-2xl opacity-20 animate-float"
            style={{ left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${3 + i * 0.4}s` }}>
            {e}
          </div>
        ))}
      </div>

      {/* 标题 */}
      <div className="text-center mb-10 relative z-10">
        <div className="text-7xl mb-4 animate-float inline-block">🔍</div>
        <h1 className="text-5xl font-black mb-2 tracking-tight"
          style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e, #e91e63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          谜题星球
        </h1>
        <p className="text-gray-400 text-base font-medium">把每一个好奇心都记录下来 ✨</p>
      </div>

      {/* 用户列表 */}
      <div className="w-full max-w-sm relative z-10">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl animate-float">🌍</div>
            <p className="text-gray-400 mt-3 text-sm">正在连接谜题星球...</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-10 bg-white/80 rounded-3xl p-6 shadow-sm">
            <div className="text-4xl mb-3">😅</div>
            <p className="text-red-400 mb-4 text-sm">连接失败，请检查配置</p>
            <button onClick={loadProfiles} className="px-5 py-2 bg-orange-400 text-white rounded-xl text-sm font-semibold">重试</button>
          </div>
        ) : (
          <>
            {profiles.length > 0 && (
              <p className="text-center text-gray-500 mb-5 font-semibold text-sm tracking-wide">👋 你是哪位小探索家？</p>
            )}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {profiles.map((profile, i) => (
                <div key={profile.id} className="relative group animate-slide-up">
                  <button
                    onClick={() => handleSelect(profile)}
                    className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-orange transition-all hover:-translate-y-1 active:scale-95 cursor-pointer border-2 border-transparent hover:border-orange-200 w-full"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="w-14 h-14 mb-2 flex-shrink-0 relative">
                      <Avatar profile={profile} size="md" />
                      {changingAvatarId === profile.id && (
                        <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">上传中</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-700 truncate w-full text-center leading-tight">{profile.name}</span>
                  </button>
                  {/* 换头像按钮 */}
                  <button
                    onClick={(e) => handleChangeAvatarClick(profile.id, e)}
                    disabled={changingAvatarId === profile.id}
                    title="换头像"
                    className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-600 disabled:opacity-50"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    disabled={deletingProfile === profile.id}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setShowCreate(true)}
                className="flex flex-col items-center p-4 bg-white/60 rounded-2xl border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-white/80 hover:shadow-orange transition-all hover:-translate-y-1 active:scale-95 cursor-pointer text-orange-400"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 bg-orange-50">
                  <Plus className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold">新成员</span>
              </button>
            </div>

            {profiles.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-2">还没有成员，点击上面的按钮开始吧！</p>
            )}
          </>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="text-red-500 w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-gray-800">确认删除</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              确定要删除这个成员吗？删除后，该成员的所有谜题、回复和勋章也会被删除，此操作无法撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-semibold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deleteProfile(showDeleteConfirm)}
                disabled={deletingProfile === showDeleteConfirm}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingProfile === showDeleteConfirm ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建成员弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Sparkles className="text-orange-500 w-4 h-4" />
                </div>
                <h2 className="text-lg font-black text-gray-800">加入谜题星球</h2>
              </div>
              <button onClick={resetForm}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* 头像上传区 */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">上传头像照片</p>
            <div className="flex items-center gap-4 mb-5">
              {/* 预览圆形头像 */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-100 bg-gray-50 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="预览" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-200" />
                  )}
                </div>
                {/* 相机图标 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md transition-transform active:scale-90"
                  style={{ background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)' }}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 点击区域引导文字 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl p-3 text-center hover:border-orange-300 hover:bg-orange-50 transition-colors"
              >
                <Camera className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400 font-medium">
                  {avatarFile ? avatarFile.name.slice(0, 20) : '点击选择照片'}
                </p>
                <p className="text-xs text-gray-300 mt-0.5">JPG / PNG，最大 20MB</p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* 名字输入 */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-orange-50 rounded-2xl">
              <span className="text-lg">✏️</span>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createProfile()}
                placeholder="输入你的名字..."
                maxLength={10}
                className="flex-1 bg-transparent text-gray-800 font-bold text-base outline-none placeholder:text-gray-300"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-semibold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={createProfile}
                disabled={!newName.trim() || !avatarFile || creating}
                className="flex-2 px-8 py-3 rounded-2xl font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)', boxShadow: '0 4px 15px rgba(255,107,53,0.35)' }}
              >
                {uploading ? '上传中...' : creating ? '✨ 创建中...' : '🚀 出发！'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
