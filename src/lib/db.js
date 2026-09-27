// 本地数据层：所有数据存在浏览器 localStorage 里，不依赖任何后端。
//
// 从 Supabase 迁移过来后，这里是唯一的数据出入口。对外暴露的查询结果
// 刻意保持和原来 Supabase 查询一致的形状（例如 puzzle.profiles 是嵌套的创建者信息），
// 这样页面和 hooks 的改动能降到最小。
//
// 注意：数据绑定在"这台设备的这个浏览器"上，换设备/清缓存都会丢，
// 所以导出备份不是可选功能，是必须的。

const PREFIX = 'puzzle_'
const TABLES = ['profiles', 'puzzles', 'replies', 'badges']

// ---------- 底层读写 ----------

function read(table) {
  try {
    const raw = localStorage.getItem(PREFIX + table)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // 数据损坏时当作空表，避免整个应用白屏
    return []
  }
}

function write(table, rows) {
  localStorage.setItem(PREFIX + table, JSON.stringify(rows))
  notify()
}

function uid() {
  // crypto.randomUUID 需要安全上下文（https / localhost），本地直接双击 html 打开时可能没有
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function now() {
  return new Date().toISOString()
}

// ---------- 变更通知（替代原来的 Supabase Realtime）----------

const listeners = new Set()

// 订阅任意数据变更，返回取消订阅函数。hooks 用它触发重新读取。
export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  for (const fn of listeners) {
    try {
      fn()
    } catch {
      // 单个订阅者出错不应影响其他订阅者
    }
  }
}

// 同一份数据在多个标签页打开时，让其他标签页也跟着刷新
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(PREFIX)) notify()
  })
}

// ---------- profiles ----------

export function listProfiles() {
  return read('profiles').sort((a, b) =>
    String(a.created_at || '').localeCompare(String(b.created_at || ''))
  )
}

export function createProfile({ name, avatar_emoji = '🧒', avatar_url = null }) {
  const row = { id: uid(), name, avatar_emoji, avatar_url, created_at: now() }
  write('profiles', [...read('profiles'), row])
  return row
}

export function updateProfile(id, patch) {
  const rows = read('profiles').map((r) => (r.id === id ? { ...r, ...patch } : r))
  write('profiles', rows)
  return rows.find((r) => r.id === id) || null
}

// 删除成员时级联清掉他/她的谜题、回复和勋章（对齐原库的 on delete cascade）
export function deleteProfile(id) {
  const myPuzzleIds = read('puzzles')
    .filter((p) => p.creator_id === id)
    .map((p) => p.id)

  write('profiles', read('profiles').filter((r) => r.id !== id))
  write('puzzles', read('puzzles').filter((p) => p.creator_id !== id))
  write(
    'replies',
    read('replies').filter(
      (r) => r.author_id !== id && !myPuzzleIds.includes(r.puzzle_id)
    )
  )
  write(
    'badges',
    read('badges').filter(
      (b) => b.user_id !== id && !myPuzzleIds.includes(b.puzzle_id)
    )
  )
}

// ---------- puzzles ----------

// 把创建者信息挂成 profiles 字段，和原来 select('*, profiles(...)') 的形状一致
function withCreator(puzzle) {
  const creator = read('profiles').find((p) => p.id === puzzle.creator_id)
  return {
    ...puzzle,
    profiles: creator
      ? {
          name: creator.name,
          avatar_emoji: creator.avatar_emoji,
          avatar_url: creator.avatar_url,
        }
      : null,
  }
}

export function listPuzzles() {
  return read('puzzles')
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map(withCreator)
}

export function getPuzzle(id) {
  const row = read('puzzles').find((r) => r.id === id)
  return row ? withCreator(row) : null
}

export function createPuzzle({
  creator_id,
  title,
  description = null,
  category = 'other',
}) {
  const row = {
    id: uid(),
    creator_id,
    title,
    description,
    category,
    status: 'exploring',
    created_at: now(),
    solved_at: null,
  }
  write('puzzles', [...read('puzzles'), row])
  return withCreator(row)
}

export function updatePuzzle(id, patch) {
  const rows = read('puzzles').map((r) => (r.id === id ? { ...r, ...patch } : r))
  write('puzzles', rows)
  const updated = rows.find((r) => r.id === id)
  return updated ? withCreator(updated) : null
}

export function deletePuzzle(id) {
  write('puzzles', read('puzzles').filter((r) => r.id !== id))
  write('replies', read('replies').filter((r) => r.puzzle_id !== id))
  // 对齐原库：谜题删除后勋章保留，只把 puzzle_id 置空（on delete set null）
  write(
    'badges',
    read('badges').map((b) => (b.puzzle_id === id ? { ...b, puzzle_id: null } : b))
  )
}

// ---------- replies ----------

function withAuthor(reply) {
  const author = read('profiles').find((p) => p.id === reply.author_id)
  return {
    ...reply,
    profiles: author
      ? {
          name: author.name,
          avatar_emoji: author.avatar_emoji,
          avatar_url: author.avatar_url,
        }
      : null,
  }
}

export function listReplies(puzzleId) {
  return read('replies')
    .filter((r) => r.puzzle_id === puzzleId)
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
    .map(withAuthor)
}

export function createReply({ puzzle_id, author_id, content }) {
  const row = { id: uid(), puzzle_id, author_id, content, created_at: now() }
  write('replies', [...read('replies'), row])
  return withAuthor(row)
}

export function updateReply(id, patch) {
  const rows = read('replies').map((r) => (r.id === id ? { ...r, ...patch } : r))
  write('replies', rows)
  const updated = rows.find((r) => r.id === id)
  return updated ? withAuthor(updated) : null
}

export function deleteReply(id) {
  write('replies', read('replies').filter((r) => r.id !== id))
}

// ---------- badges ----------

export function listBadges(userId) {
  return read('badges')
    .filter((b) => b.user_id === userId)
    .sort((a, b) => String(b.earned_at || '').localeCompare(String(a.earned_at || '')))
}

export function countBadges(userId) {
  return read('badges').filter((b) => b.user_id === userId).length
}

// 同一成员 + 同一类型 + 同一谜题只发一次（对齐原库的唯一索引，避免重复点击重复发勋章）
export function createBadge({ user_id, badge_type, puzzle_id = null }) {
  const rows = read('badges')
  const duplicated =
    puzzle_id &&
    rows.some(
      (b) =>
        b.user_id === user_id &&
        b.badge_type === badge_type &&
        b.puzzle_id === puzzle_id
    )
  if (duplicated) return null

  const row = { id: uid(), user_id, badge_type, puzzle_id, earned_at: now() }
  write('badges', [...rows, row])
  return row
}

// ---------- 导入 / 导出 ----------

export function exportAll() {
  return {
    exported_at: now(),
    profiles: read('profiles'),
    puzzles: read('puzzles'),
    replies: read('replies'),
    badges: read('badges'),
  }
}

export function isEmpty() {
  return TABLES.every((t) => read(t).length === 0)
}

// mode = 'replace'：完全覆盖本地数据（换设备恢复备份用）
// mode = 'merge'  ：按 id 去重后追加，保留本地已有数据
export function importAll(data, { mode = 'replace' } = {}) {
  if (!data || typeof data !== 'object') {
    throw new Error('备份内容不是有效的 JSON 对象')
  }
  for (const t of TABLES) {
    if (data[t] !== undefined && !Array.isArray(data[t])) {
      throw new Error(`备份格式不对：${t} 应该是数组`)
    }
  }

  for (const t of TABLES) {
    const incoming = data[t] || []
    if (mode === 'merge') {
      const existing = read(t)
      const existingIds = new Set(existing.map((r) => r.id))
      write(t, [...existing, ...incoming.filter((r) => !existingIds.has(r.id))])
    } else {
      write(t, incoming)
    }
  }

  return {
    profiles: (data.profiles || []).length,
    puzzles: (data.puzzles || []).length,
    replies: (data.replies || []).length,
    badges: (data.badges || []).length,
  }
}

export function clearAll() {
  for (const t of TABLES) localStorage.removeItem(PREFIX + t)
  notify()
}
