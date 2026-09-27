import { supabase } from '../lib/supabase'
import { CATEGORIES, BADGES } from './constants'

// 一次性把家庭里所有数据导出。
// 家长关心留档 —— 把 profiles / puzzles / replies / badges 全拉下来，本地生成 blob 下载。
// 支持两种格式：json（完整结构） 和 markdown（人类可读、可打印，适合当孩子成长档案）。

export async function fetchAllData() {
  const [profilesRes, puzzlesRes, repliesRes, badgesRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at'),
    supabase.from('puzzles').select('*').order('created_at'),
    supabase.from('replies').select('*').order('created_at'),
    supabase.from('badges').select('*').order('earned_at'),
  ])

  const firstError = [profilesRes, puzzlesRes, repliesRes, badgesRes].find(r => r.error)
  if (firstError) throw firstError.error

  return {
    exported_at: new Date().toISOString(),
    profiles: profilesRes.data || [],
    puzzles: puzzlesRes.data || [],
    replies: repliesRes.data || [],
    badges: badgesRes.data || [],
  }
}

function downloadBlob(content, mime, filename) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportAsJSON() {
  const data = await fetchAllData()
  const today = new Date().toISOString().slice(0, 10)
  downloadBlob(
    JSON.stringify(data, null, 2),
    'application/json',
    `谜题星球-${today}.json`
  )
  return data
}

// 把结构化数据渲染成一份对孩子/家长友好的 Markdown 档案
// 按提问者分组 -> 每人一节 -> 每题一子节 -> 附想法列表
export async function exportAsMarkdown() {
  const data = await fetchAllData()
  const today = new Date().toISOString().slice(0, 10)

  const profileMap = Object.fromEntries(data.profiles.map(p => [p.id, p]))
  const categoryMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))
  const badgeCountByUser = data.badges.reduce((acc, b) => {
    acc[b.user_id] = acc[b.user_id] || {}
    acc[b.user_id][b.badge_type] = (acc[b.user_id][b.badge_type] || 0) + 1
    return acc
  }, {})

  const lines = []
  lines.push(`# 谜题星球 · 家庭档案`)
  lines.push('')
  lines.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}`)
  lines.push(`> 家庭成员：${data.profiles.length}　谜题：${data.puzzles.length}　想法：${data.replies.length}　勋章：${data.badges.length}`)
  lines.push('')

  for (const profile of data.profiles) {
    const myPuzzles = data.puzzles.filter(p => p.creator_id === profile.id)
    if (myPuzzles.length === 0 && !badgeCountByUser[profile.id]) continue

    lines.push(`## ${profile.avatar_emoji || '👤'} ${profile.name}`)
    lines.push('')

    const badgeMap = badgeCountByUser[profile.id]
    if (badgeMap) {
      const badgeLine = Object.entries(badgeMap)
        .map(([type, count]) => {
          const info = BADGES[type]
          return info ? `${info.emoji} ${info.name} × ${count}` : ''
        })
        .filter(Boolean)
        .join('　')
      if (badgeLine) {
        lines.push(`**勋章：** ${badgeLine}`)
        lines.push('')
      }
    }

    if (myPuzzles.length === 0) continue

    for (const puzzle of myPuzzles) {
      const cat = categoryMap[puzzle.category] || categoryMap.other
      const status = puzzle.status === 'solved' ? '✅ 已解答' : '🔭 探索中'
      lines.push(`### ${cat.emoji} ${puzzle.title}`)
      lines.push('')
      lines.push(`- 分类：${cat.label}`)
      lines.push(`- 状态：${status}`)
      lines.push(`- 提出于：${new Date(puzzle.created_at).toLocaleString('zh-CN')}`)
      if (puzzle.solved_at) {
        lines.push(`- 解答于：${new Date(puzzle.solved_at).toLocaleString('zh-CN')}`)
      }
      if (puzzle.description) {
        lines.push('')
        lines.push(`> ${puzzle.description.replace(/\n/g, '\n> ')}`)
      }

      const relatedReplies = data.replies.filter(r => r.puzzle_id === puzzle.id)
      if (relatedReplies.length > 0) {
        lines.push('')
        lines.push(`**想法（${relatedReplies.length}）：**`)
        for (const r of relatedReplies) {
          const author = profileMap[r.author_id]
          const time = new Date(r.created_at).toLocaleString('zh-CN')
          lines.push('')
          lines.push(`- **${author?.name || '匿名'}** · ${time}`)
          lines.push(`  ${r.content.replace(/\n/g, '\n  ')}`)
        }
      }
      lines.push('')
    }
  }

  downloadBlob(
    lines.join('\n'),
    'text/markdown;charset=utf-8',
    `谜题星球-${today}.md`
  )
  return data
}
