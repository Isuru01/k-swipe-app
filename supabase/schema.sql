-- 1. Profiles Table (Extends Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  proficiency_level text check (proficiency_level in ('beginner', 'intermediate', 'expert')) default 'beginner',
  daily_streak integer default 0,
  last_played_at timestamptz default now(),
  interests jsonb default '[]', -- Stores ['K-Pop', 'Food', etc.]
  created_at timestamptz default now()
);

-- 2. User Performance Table (For Spaced Repetition/SRS)
create table user_performance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  word_id integer not null, -- Links to your local Vocabulary ID
  success_count integer default 0,
  failure_count integer default 0,
  last_reviewed_at timestamptz default now(),
  next_review_at timestamptz,
  unique(user_id, word_id)
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table user_performance enable row level security;

-- Policies: Users can only see/edit their own data
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can manage own performance" on user_performance for all using (auth.uid() = user_id);
