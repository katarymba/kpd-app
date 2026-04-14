-- Удалить старые таблицы если есть
drop table if exists likes cascade;
drop table if exists purchases cascade;
drop table if exists rewards cascade;
drop table if exists points cascade;
drop table if exists task_completions cascade;
drop table if exists tasks cascade;
drop table if exists profiles cascade;
drop table if exists families cascade;
drop table if exists system_log cascade;
drop table if exists grades cascade;
drop table if exists x2_activations cascade;

create extension if not exists "uuid-ossp";

-- СЕМЬИ
create table families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique not null,
  created_by uuid,
  settings jsonb default '{
    "points_per_ruble": 1,
    "x2_weekly_limit": 2,
    "like_daily_limit": 5,
    "like_same_person_daily_limit": 3,
    "super_like_daily_limit": 2,
    "super_like_points": 10,
    "like_points": 2,
    "grade_5_points": 8,
    "grade_4_points": 5,
    "grade_3_points": 0,
    "grade_2_penalty": -5,
    "min_balance_limit": -50,
    "penalty_requires_comment": true,
    "task_daily_limit": 1
  }'::jsonb,
  created_at timestamptz default now()
);

-- ПРОФИЛИ
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin', 'adult', 'child')),
  family_id uuid references families(id),
  avatar text default '👤',
  created_at timestamptz default now()
);

-- ЗАДАНИЯ
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'home' check (category in ('home','study','active','hobby','looks','other')),
  type text not null default 'daily' check (type in ('daily','once','required')),
  points int not null default 5 check (points > 0),
  assigned_to uuid references profiles(id),
  created_by uuid references profiles(id),
  is_active boolean default true,
  daily_limit int default 1,
  created_at timestamptz default now()
);

-- ВЫПОЛНЕНИЯ ЗАДАНИЙ
create table task_completions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  child_id uuid references profiles(id),
  family_id uuid references families(id),
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  completed_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  rejection_reason text
);

-- БАЛЛЫ (каждая транзакция)
create table points (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id) on delete cascade,
  user_id uuid references profiles(id),
  amount int not null,
  source text not null check (source in ('task','grade','like','bonus','penalty','manual','purchase','x2_bonus')),
  description text not null,
  created_by uuid references profiles(id),
  is_x2 boolean default false,
  related_id uuid,
  created_at timestamptz default now()
);

-- НАГРАДЫ
create table rewards (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id) on delete cascade,
  title text not null,
  description text,
  icon text default '🎁',
  cost int not null check (cost > 0),
  type text default 'gift' check (type in ('money','gift','permission')),
  is_available boolean default true,
  stock int,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ПОКУПКИ
create table purchases (
  id uuid primary key default uuid_generate_v4(),
  reward_id uuid references rewards(id),
  reward_title text not null,
  child_id uuid references profiles(id),
  family_id uuid references families(id),
  cost_paid int not null,
  status text default 'pending' check (status in ('pending','approved','delivered')),
  purchased_at timestamptz default now(),
  approved_by uuid references profiles(id),
  approved_at timestamptz
);

-- ЛАЙКИ
create table likes (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references profiles(id),
  to_user_id uuid references profiles(id),
  family_id uuid references families(id),
  is_super boolean default false,
  points int not null default 2,
  created_at timestamptz default now()
);

-- ОЦЕНКИ
create table grades (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references profiles(id),
  family_id uuid references families(id),
  subject text not null,
  grade int not null check (grade between 2 and 5),
  points_change int not null default 0,
  entered_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- X2 АКТИВАЦИИ
create table x2_activations (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id),
  child_id uuid references profiles(id),
  activated_by uuid references profiles(id),
  category text,
  active_date date not null default current_date,
  created_at timestamptz default now()
);

-- СИСТЕМНЫЙ ЛОГ
create table system_log (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id),
  user_id uuid references profiles(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table families enable row level security;
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_completions enable row level security;
alter table points enable row level security;
alter table rewards enable row level security;
alter table purchases enable row level security;
alter table likes enable row level security;
alter table grades enable row level security;
alter table x2_activations enable row level security;
alter table system_log enable row level security;

-- ПОЛИТИКИ

-- profiles
create policy "profiles_select" on profiles for select using (auth.uid() is not null);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin' and p.family_id = profiles.family_id));

-- families
create policy "families_select" on families for select
  using (id in (select family_id from profiles where id = auth.uid()));
create policy "families_insert" on families for insert with check (auth.uid() is not null);
create policy "families_update" on families for update
  using (created_by = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and role = 'admin' and family_id = families.id));

-- tasks
create policy "tasks_select" on tasks for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "tasks_insert" on tasks for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()) and
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','adult')));
create policy "tasks_update" on tasks for update
  using (family_id in (select family_id from profiles where id = auth.uid()) and
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','adult')));
create policy "tasks_delete" on tasks for delete
  using (family_id in (select family_id from profiles where id = auth.uid()) and
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','adult')));

-- task_completions
create policy "tc_select" on task_completions for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "tc_insert" on task_completions for insert
  with check (child_id = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','adult')));
create policy "tc_update" on task_completions for update
  using (family_id in (select family_id from profiles where id = auth.uid()) and
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','adult')));

-- points
create policy "points_select" on points for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "points_insert" on points for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()));

-- rewards
create policy "rewards_select" on rewards for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "rewards_insert" on rewards for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()) and
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','adult')));
create policy "rewards_update" on rewards for update
  using (family_id in (select family_id from profiles where id = auth.uid()) and
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','adult')));
create policy "rewards_delete" on rewards for delete
  using (family_id in (select family_id from profiles where id = auth.uid()) and
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','adult')));

-- purchases
create policy "purchases_select" on purchases for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "purchases_insert" on purchases for insert
  with check (child_id = auth.uid());
create policy "purchases_update" on purchases for update
  using (family_id in (select family_id from profiles where id = auth.uid()) and
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','adult')));

-- likes
create policy "likes_select" on likes for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "likes_insert" on likes for insert
  with check (from_user_id = auth.uid() and to_user_id != auth.uid() and
    family_id in (select family_id from profiles where id = auth.uid()));

-- grades
create policy "grades_all" on grades for all
  using (family_id in (select family_id from profiles where id = auth.uid()));

-- x2
create policy "x2_all" on x2_activations for all
  using (family_id in (select family_id from profiles where id = auth.uid()));

-- system_log
create policy "log_select" on system_log for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "log_insert" on system_log for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()));

-- ФУНКЦИЯ: получить баланс пользователя
create or replace function get_balance(p_user_id uuid)
returns int as $$
  select coalesce(sum(amount), 0)::int
  from points
  where user_id = p_user_id;
$$ language sql security definer;

-- ФУНКЦИЯ: получить количество лайков сегодня от пользователя
create or replace function get_today_likes_count(p_from_user_id uuid)
returns int as $$
  select count(*)::int
  from likes
  where from_user_id = p_from_user_id
    and created_at::date = current_date;
$$ language sql security definer;
