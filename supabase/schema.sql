-- ⚠️ 历史文件，当前版本已不再使用 Supabase。
-- 数据现在存在浏览器本地（见 src/lib/db.js），这份 schema 仅作为数据模型的参考保留：
-- 字段定义、唯一约束、级联删除规则都以它为准。
--
-- 谜题清单数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件

-- 家庭成员表
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_emoji text not null default '🧒',
  avatar_url text,
  created_at timestamptz default now()
);

-- 谜题表
create table if not exists puzzles (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'other',
  status text not null default 'exploring' check (status in ('exploring', 'solved')),
  created_at timestamptz default now(),
  solved_at timestamptz
);

-- 回复表
create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid not null references puzzles(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- 勋章表
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_type text not null,
  puzzle_id uuid references puzzles(id) on delete set null,
  earned_at timestamptz default now()
);

-- 索引：列表页按 created_at 倒序、详情页按 puzzle_id 拉回复、勋章按 user_id 查
create index if not exists idx_puzzles_created_at on puzzles (created_at desc);
create index if not exists idx_puzzles_creator on puzzles (creator_id, created_at desc);
create index if not exists idx_puzzles_status on puzzles (status);
create index if not exists idx_replies_puzzle on replies (puzzle_id, created_at);
create index if not exists idx_badges_user on badges (user_id, earned_at desc);

-- 勋章去重：同一谜题、同一用户、同一类型只能有一条勋章，避免多次点击/并发重复发放
create unique index if not exists uniq_badge_per_puzzle_type
  on badges (user_id, badge_type, puzzle_id)
  where puzzle_id is not null;

-- 开启实时（Supabase Realtime 需要显式添加到 publication）
-- 若你的项目里 supabase_realtime publication 已存在，下面几条 alter 会补齐订阅
do $$ begin
  execute 'alter publication supabase_realtime add table puzzles';
exception when others then null; end $$;
do $$ begin
  execute 'alter publication supabase_realtime add table replies';
exception when others then null; end $$;
do $$ begin
  execute 'alter publication supabase_realtime add table badges';
exception when others then null; end $$;
do $$ begin
  execute 'alter publication supabase_realtime add table profiles';
exception when others then null; end $$;

-- 开启行级安全（RLS）但允许所有操作（家庭内部应用，无需账号）
alter table profiles enable row level security;
alter table puzzles enable row level security;
alter table replies enable row level security;
alter table badges enable row level security;

-- 允许所有人读写（家庭内部使用，用 anon key 访问）
-- ⚠️ 生产环境请改为基于 auth.uid() / family_id 的严格策略
drop policy if exists "allow_all_profiles" on profiles;
drop policy if exists "allow_all_puzzles" on puzzles;
drop policy if exists "allow_all_replies" on replies;
drop policy if exists "allow_all_badges" on badges;
create policy "allow_all_profiles" on profiles for all using (true) with check (true);
create policy "allow_all_puzzles" on puzzles for all using (true) with check (true);
create policy "allow_all_replies" on replies for all using (true) with check (true);
create policy "allow_all_badges" on badges for all using (true) with check (true);
