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

