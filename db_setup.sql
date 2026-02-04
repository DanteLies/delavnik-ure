-- 1. Create a table for user profiles
create table profiles (
  id uuid references auth.users not null primary key,
  username text,
  hourly_rate numeric default 9,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create a table for work entries
create table entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  shifts jsonb default '[]'::jsonb,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date)
);

-- 3. Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table entries enable row level security;

-- 4. Create policies
-- Profiles: Users can see and update their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Entries: Users can perform all actions on their own entries
create policy "Users can view own entries" on entries
  for select using (auth.uid() = user_id);

create policy "Users can insert own entries" on entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update own entries" on entries
  for update using (auth.uid() = user_id);

create policy "Users can delete own entries" on entries
  for delete using (auth.uid() = user_id);

-- 5. Create a trigger to create a profile entry when a new user signs up (Optional but recommended)
-- This ensures every user has a profile row
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, hourly_rate)
  values (new.id, new.raw_user_meta_data->>'username', 9);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
