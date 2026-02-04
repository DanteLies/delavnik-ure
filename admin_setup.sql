-- 1. Add is_admin column to profiles
alter table profiles add column is_admin boolean default false;

-- 2. Create a secure function to check if current user is admin
-- Security Definer allows this function to bypass RLS when checking the profiles table
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from profiles
    where id = auth.uid()
    and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- 3. Add policies for Admins
-- Profiles: Admins can view all profiles
create policy "Admins can view all profiles" on profiles
  for select using (public.is_admin());

-- Entries: Admins can view all entries
create policy "Admins can view all entries" on entries
  for select using (public.is_admin());

-- Entries: Admins can delete any entry
create policy "Admins can delete all entries" on entries
  for delete using (public.is_admin());

-- Entries: Admins can update any entry
create policy "Admins can update all entries" on entries
  for update using (public.is_admin());

-- 4. Update handle_new_user to handle potential admin creation (optional, mainly manual)
-- No changes needed strictly, but good to know.
