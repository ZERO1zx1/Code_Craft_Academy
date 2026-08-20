-- Preferences upsert remains safe even if a profile trigger has not run yet.
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);
