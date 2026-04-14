-- Расширения
create extension if not exists "uuid-ossp";

-- Таблица семей
create table families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique not null,
  created_by uuid,
  settings jsonb default '{
    "points_per_ruble": 1,
    "daily_limit": 20,
    "penalties_enabled": true,
    "x2_weekly_limit": 2,
    "grade_5_points": 8,
    "grade_4_points": 5,
    "grade_3_points": 0,
    "grade_2_penalty": -5,
    "like_daily_limit": 5,
    "super_like_points": 5
  }'::jsonb,
  created_at timestamptz default now()
);

-- Таблица профилей пользователей (расширяет auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('adult', 'child')),
  family_id uuid references families(id),
  avatar text default '👤',
  created_at timestamptz default now()
);

-- Таблица заданий
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id) on delete cascade,
  title text not null,
  category text not null check (category in ('home', 'study', 'active', 'hobby', 'looks', 'like')),
  type text not null check (type in ('daily', 'once', 'required')),
  points int not null default 5,
  assigned_to uuid references profiles(id),
  created_by uuid references profiles(id),
  status text not null default 'pending' check (status in ('pending', 'done', 'confirmed')),
  created_at timestamptz default now()
);

-- Таблица начислений баллов
create table points (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id) on delete cascade,
  child_id uuid references profiles(id),
  amount int not null,
  category text,
  source text check (source in ('task', 'grade', 'like', 'bonus', 'manual')),
  description text,
  created_by uuid references profiles(id),
  is_x2 boolean default false,
  created_at timestamptz default now()
);

-- Таблица наград
create table rewards (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references families(id) on delete cascade,
  title text not null,
  icon text default '🎁',
  description text,
  cost int not null,
  type text check (type in ('money', 'gift', 'permission')),
  is_available boolean default true,
  created_at timestamptz default now()
);

-- Таблица покупок
create table purchases (
  id uuid primary key default uuid_generate_v4(),
  reward_id uuid references rewards(id),
  child_id uuid references profiles(id),
  cost_paid int not null,
  status text default 'pending' check (status in ('pending', 'approved', 'delivered')),
  purchased_at timestamptz default now()
);

-- Таблица оценок
create table grades (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references profiles(id),
  family_id uuid references families(id),
  subject text,
  grade int check (grade between 2 and 5),
  points_earned int,
  entered_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Таблица лайков
create table likes (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references profiles(id),
  to_user_id uuid references profiles(id),
  family_id uuid references families(id),
  is_super boolean default false,
  points int default 2,
  created_at timestamptz default now()
);

-- RLS (Row Level Security) — каждая семья видит только свои данные
alter table families enable row level security;
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table points enable row level security;
alter table rewards enable row level security;
alter table purchases enable row level security;
alter table grades enable row level security;
alter table likes enable row level security;

-- Политики доступа

-- Profiles: видят все авторизованные
create policy "profiles_select" on profiles for select using (auth.uid() is not null);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Families: видят члены семьи
create policy "families_select" on families for select
  using (id in (select family_id from profiles where id = auth.uid()));
create policy "families_insert" on families for insert with check (auth.uid() is not null);
create policy "families_update" on families for update
  using (id in (select family_id from profiles where id = auth.uid()));

-- Tasks: видят члены семьи
create policy "tasks_select" on tasks for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "tasks_insert" on tasks for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()));
create policy "tasks_update" on tasks for update
  using (family_id in (select family_id from profiles where id = auth.uid()));

-- Points: видят члены семьи
create policy "points_select" on points for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "points_insert" on points for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()));

-- Rewards: видят члены семьи
create policy "rewards_select" on rewards for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "rewards_insert" on rewards for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()));

-- Purchases: видят члены семьи
create policy "purchases_select" on purchases for select
  using (child_id = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and role = 'adult' and family_id in (
      select family_id from profiles where id = purchases.child_id
    )));
create policy "purchases_insert" on purchases for insert with check (child_id = auth.uid());

-- Grades: видят члены семьи
create policy "grades_select" on grades for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "grades_insert" on grades for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()));

-- Likes: видят члены семьи
create policy "likes_select" on likes for select
  using (family_id in (select family_id from profiles where id = auth.uid()));
create policy "likes_insert" on likes for insert
  with check (family_id in (select family_id from profiles where id = auth.uid()));

-- Функция автосоздания профиля при регистрации
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Профиль создаётся вручную после регистрации с именем и ролью
  return new;
end;
$$ language plpgsql security definer;
