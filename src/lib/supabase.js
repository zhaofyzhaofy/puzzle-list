import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// 兼容新版 publishable key 和旧版 anon key
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

// 早期发现 .env.local 配置错误：以前踩过把 URL 填进 key 字段的坑
if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.error(
    '[Supabase] 缺少环境变量。请在 .env.local 中配置：\n' +
      '  VITE_SUPABASE_URL=https://<project>.supabase.co\n' +
      '  VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx'
  )
} else if (!/^https?:\/\//.test(supabaseUrl)) {
  // eslint-disable-next-line no-console
  console.error('[Supabase] VITE_SUPABASE_URL 看起来不是有效 URL：', supabaseUrl)
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }, // 家庭内部应用，暂不使用 Supabase Auth，避免不必要的 storage 交互
  realtime: { params: { eventsPerSecond: 5 } },
})
