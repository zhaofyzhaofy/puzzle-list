import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProfile as createProfileInDb, deleteProfile as deleteProfileInDb, updateProfile } from '../lib/db'
import { useUser } from '../context/UserContext'
import { Plus, Sparkles, X, Camera, User, Trash2, Settings } from 'lucide-react'
import Avatar from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'
import DataMenu from '../components/DataMenu'
import Loading from '../components/Loading'
import { useProfiles } from '../hooks/useProfiles'

// 向后兼容旧引用（尚未清理的其他页面还在从这里 import Avatar）
export { default as Avatar } from '../components/Avatar'

export default function SelectUser() {
  const { profiles, loading, error: loadError, reload, setProfiles } = useProfiles()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [changingAvatarId, setChangingAvatarId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const fileInputRef = useRef(null)
  const changeAvatarInputRef = useRef(null)
  const changeAvatarTargetRef = useRef(null)
  const { selectUser } = useUser()
  const navigate = useNavigate()

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

  // 把选中的图片压缩成小尺寸 JPEG 再转 base64 存进本地。
  // 直接存原图会迅速撑爆 localStorage（容量约 5MB），所以必须先压缩。
  //
  // 手机上的两个坑：
  // 1. 相机原图动辄 5-10MB，转成 data URL 后字符串巨大，部分移动浏览器会直接解析失败。
  //    这里改用 createObjectURL / createImageBitmap 解码，不经过 data URL。
  // 2. iPhone 和部分安卓默认拍 HEIC/HEIF，很多浏览器解不了，这种情况给出明确提示。
  async function compressImage(file, maxSize = 256, quality = 0.85) {
    let source = null
    let objectUrl = null

    try {
      if (typeof createImageBitmap === 'function') {
        try {
          source = await createImageBitmap(file)
        } catch {
          // 当前浏览器不支持这个格式，继续用 <img> 兜底
        }
      }

      if (!source) {
        objectUrl = URL.createObjectURL(file)
        source = await new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error(describeImageError(file)))
          img.src = objectUrl
        })
      }

      const scale = Math.min(1, maxSize / Math.max(source.width, source.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(source.width * scale))
      canvas.height = Math.max(1, Math.round(source.height * scale))
      canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', quality)
    } finally {
      if (source && typeof source.close === 'function') source.close()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }

  // 把解码失败翻译成用户能看懂的原因
  function describeImageError(file) {
    const isHeic = /heic|heif/i.test(file.type || '') || /\.(heic|heif)$/i.test(file.name || '')
    if (isHeic) {
      return '这张照片是 HEIC/HEIF 格式，当前浏览器无法处理。请在相册里先导出为 JPG 再试'
    }
    return '图片无法解析，请换一张 JPG/PNG 格式的照片'
  }

  async function createProfile() {
    if (!newName.trim()) return
    if (!avatarFile) { alert('请选择一张头像图片'); return }
    setCreating(true)

    try {
      setUploading(true)
      const avatarUrl = await compressImage(avatarFile)
      setUploading(false)

      const data = createProfileInDb({ name: newName.trim(), avatar_url: avatarUrl })
      setProfiles(prev => [...prev, data])
      resetForm()
      handleSelect(data)
    } catch (err) {
      alert(`创建成员失败：${err.message}`)
    }
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

  /**
   * 删除指定用户
   *
   * 从数据库中删除用户档案，同时更新本地状态移除该用户。
   *
   * @async
   * @param {string} profileId - 要删除的用户 ID
   * @returns {Promise<void>}
   */
  function deleteProfile(profileId) {
    setDeletingProfile(profileId)
    try {
      deleteProfileInDb(profileId)
      setProfiles(prev => prev.filter(p => p.id !== profileId))
      setShowDeleteConfirm(null)
    } catch (err) {
      alert(`删除失败：${err.message}`)
    }
    setDeletingProfile(null)
  }

  function handleChangeAvatarClick(profileId, e) {
    e.stopPropagation()
    changeAvatarTargetRef.current = profileId
    changeAvatarInputRef.current?.click()
  }

  async function handleChangeAvatarFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    const profileId = changeAvatarTargetRef.current
    if (!file || !profileId) return
    if (file.size > 20 * 1024 * 1024) {
      alert('图片不能超过 20MB')
      return
    }

    setChangingAvatarId(profileId)
    try {
      const newUrl = await compressImage(file)
      updateProfile(profileId, { avatar_url: newUrl })
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, avatar_url: newUrl } : p))
    } catch (err) {
      alert(`更新头像失败：${err.message}`)
    } finally {
      setChangingAvatarId(null)
      changeAvatarTargetRef.current = null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #fff8ed 0%, #fff3e0 40%, #fce4ec 100%)' }}>

      <input
        ref={changeAvatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChangeAvatarFile}
      />

      {/* 右上角功能入口：数据备份 / 家庭设置，都收成小图标避免误触 */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <DataMenu />
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          title="家庭设置"
          aria-label="家庭设置"
          className="w-8 h-8 rounded-xl bg-white/80 text-gray-400 flex items-center justify-center shadow-sm hover:bg-white hover:text-orange-500 active:scale-95 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

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
          <Loading emoji="🌍" text="正在连接谜题星球..." />
        ) : loadError ? (
          <div className="text-center py-10 bg-white/80 rounded-3xl p-6 shadow-sm">
            <div className="text-4xl mb-3">😅</div>
            <p className="text-red-400 mb-4 text-sm">连接失败，请检查配置</p>
            <button onClick={reload} className="px-5 py-2 bg-orange-400 text-white rounded-xl text-sm font-semibold">重试</button>
          </div>
        ) : (
          <>
            {profiles.length > 0 && (
              <p className="text-center text-gray-500 mb-5 font-semibold text-sm tracking-wide">👋 你是哪位小探索家？</p>
            )}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {profiles.map((profile, i) => (
                <div key={profile.id} className="animate-slide-up">
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

      {/* 家庭设置：换头像和删除成员都收在这里，首页只留干净的头像卡片 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Settings className="text-orange-500 w-4 h-4" />
                </div>
                <h2 className="text-lg font-black text-gray-800">家庭设置</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">成员管理</p>
            <div className="flex flex-col gap-2 mb-4">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-2xl">
                  <div className="w-9 h-9 flex-shrink-0">
                    <Avatar profile={profile} size="sm" />
                  </div>
                  <span className="flex-1 min-w-0 text-sm font-bold text-gray-700 truncate">{profile.name}</span>
                  <button
                    onClick={(e) => handleChangeAvatarClick(profile.id, e)}
                    disabled={changingAvatarId === profile.id}
                    title="换头像"
                    className="w-8 h-8 rounded-xl bg-white text-orange-500 flex items-center justify-center shadow-sm hover:bg-orange-50 active:scale-90 transition-all disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setShowSettings(false); setShowDeleteConfirm(profile.id) }}
                    disabled={deletingProfile === profile.id}
                    title="删除成员"
                    className="w-8 h-8 rounded-xl bg-white text-red-400 flex items-center justify-center shadow-sm hover:bg-red-50 active:scale-90 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {profiles.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-3">还没有成员</p>
              )}
            </div>

            <button
              onClick={() => { setShowSettings(false); setShowCreate(true) }}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-orange-200 text-orange-500 text-sm font-bold hover:bg-orange-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              添加成员
            </button>

            <p className="text-center text-gray-300 text-xs mt-4">数据只保存在这台设备的浏览器里</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!showDeleteConfirm}
        title="确认删除"
        message="确定要删除这个成员吗？删除后，该成员的所有谜题、回复和勋章也会被删除，此操作无法撤销。"
        confirmText="确认删除"
        loading={deletingProfile === showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={() => deleteProfile(showDeleteConfirm)}
      />

      {/* 创建成员弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
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

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">上传头像照片</p>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-100 bg-gray-50 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="预览" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-200" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md transition-transform active:scale-90"
                  style={{ background: 'linear-gradient(135deg, #ff9a3c, #ff6b35)' }}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

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
