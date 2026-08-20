create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'reviewer', 'teacher', 'admin', 'owner')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (course_id in ('python', 'html', 'css', 'javascript')),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, course_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (course_id in ('python', 'html', 'css', 'javascript')),
  lesson_id text not null,
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default timezone('utc', now())
);

create index if not exists course_progress_user_idx on public.course_progress(user_id);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id, submitted_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists course_progress_set_updated_at on public.course_progress;
create trigger course_progress_set_updated_at before update on public.course_progress for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.course_progress enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can view their own progress" on public.course_progress;
create policy "Users can view their own progress" on public.course_progress for select using (auth.uid() = user_id);
drop policy if exists "Users can create their own progress" on public.course_progress;
create policy "Users can create their own progress" on public.course_progress for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own progress" on public.course_progress;
create policy "Users can update their own progress" on public.course_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view their own quiz attempts" on public.quiz_attempts;
create policy "Users can view their own quiz attempts" on public.quiz_attempts for select using (auth.uid() = user_id);
drop policy if exists "Users can create their own quiz attempts" on public.quiz_attempts;
create policy "Users can create their own quiz attempts" on public.quiz_attempts for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Learning progress is intentionally isolated from the project's other public tables.
-- A learner can only read or mutate their own records.
alter table public.profiles add column if not exists locale text not null default 'mn' check (locale in ('mn', 'en'));
alter table public.profiles add column if not exists theme text not null default 'system' check (theme in ('light', 'dark', 'system'));

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (course_id in ('python', 'html', 'css', 'javascript')),
  lesson_id text not null check (char_length(lesson_id) between 1 and 96),
  completed_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, course_id, lesson_id)
);

create index if not exists lesson_progress_user_idx on public.lesson_progress(user_id, completed_at desc);

alter table public.lesson_progress enable row level security;

drop policy if exists "Users can view their own lesson progress" on public.lesson_progress;
create policy "Users can view their own lesson progress" on public.lesson_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own lesson progress" on public.lesson_progress;
create policy "Users can create their own lesson progress" on public.lesson_progress for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own lesson progress" on public.lesson_progress;
create policy "Users can update their own lesson progress" on public.lesson_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own lesson progress" on public.lesson_progress;
create policy "Users can delete their own lesson progress" on public.lesson_progress for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles, public.course_progress, public.lesson_progress, public.quiz_attempts to authenticated;

-- Postgres Changes keeps signed-in browser sessions in sync across tabs/devices.
do $$
begin
  alter publication supabase_realtime add table public.course_progress;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.lesson_progress;
exception when duplicate_object then null;
end;
$$;

revoke execute on function public.handle_new_user() from public;

