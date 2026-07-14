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

-- 开启行级安全（RLS）但允许所有操作（家庭内部应用，无需账号）
alter table profiles enable row level security;
alter table puzzles enable row level security;
alter table replies enable row level security;
alter table badges enable row level security;

-- 允许所有人读写（家庭内部使用，用 anon key 访问）
create policy "allow_all_profiles" on profiles for all using (true) with check (true);
create policy "allow_all_puzzles" on puzzles for all using (true) with check (true);
create policy "allow_all_replies" on replies for all using (true) with check (true);
create policy "allow_all_badges" on badges for all using (true) with check (true);
