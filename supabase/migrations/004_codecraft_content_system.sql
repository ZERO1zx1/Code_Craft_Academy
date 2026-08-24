-- CodeCraft Academy — content management schema, role-based RLS, and seed data.
-- Requires migrations 001–003 to have been applied first.

-- ---------------------------------------------------------------------------
-- 1. Relax legacy course_id CHECK constraints so new courses need no schema change.
--    Progress/quiz tables keep course_id as text, matching the course slug.
-- ---------------------------------------------------------------------------
alter table public.course_progress drop constraint if exists course_progress_course_id_check;
alter table public.lesson_progress drop constraint if exists lesson_progress_course_id_check;
alter table public.quiz_attempts drop constraint if exists quiz_attempts_course_id_check;

-- ---------------------------------------------------------------------------
-- 2. Content tables
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  icon text not null default 'C',
  color text not null default 'purple',
  eyebrow text not null default '',
  duration text not null default '',
  level text not null default 'Анхан шат',
  description text not null default '',
  starter text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  summary text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (course_id, position)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  slug text not null,
  position integer not null default 0,
  title text not null,
  outcome text not null default '',
  task text not null default '',
  minutes integer not null default 20 check (minutes >= 1),
  explanation text not null default '',
  example text not null default '',
  exercise text not null default '',
  project text not null default '',
  pdf_url text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (course_id, slug)
);

create table if not exists public.lesson_tags (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  tag text not null,
  unique (lesson_id, tag)
);

create table if not exists public.lesson_keywords (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  keyword text not null,
  unique (lesson_id, keyword)
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position integer not null default 0,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index integer not null default 0 check (correct_index >= 0),
  explanation text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- 3. Instructors / ownership
-- ---------------------------------------------------------------------------
create table if not exists public.course_instructors (
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'teacher' check (role in ('owner', 'teacher', 'reviewer')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (course_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 4. Certificates, achievements
-- ---------------------------------------------------------------------------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  serial text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  template text not null default 'codecraft-standard',
  issued_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default '🏆',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default timezone('utc', now()),
  unique (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- 5. Content import log
-- ---------------------------------------------------------------------------
create table if not exists public.content_imports (
  id uuid primary key default gen_random_uuid(),
  imported_by uuid references auth.users(id) on delete set null,
  source text not null default 'json',
  file_name text not null default '',
  status text not null default 'pending' check (status in ('pending', 'dry_run', 'applied', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists modules_course_idx on public.modules(course_id, position);
create index if not exists lessons_course_idx on public.lessons(course_id, position);
create index if not exists lessons_module_idx on public.lessons(module_id, position);
create index if not exists lesson_tags_lesson_idx on public.lesson_tags(lesson_id);
create index if not exists lesson_keywords_lesson_idx on public.lesson_keywords(lesson_id);
create index if not exists quiz_questions_lesson_idx on public.quiz_questions(lesson_id, position);
create index if not exists certificates_user_idx on public.certificates(user_id, issued_at desc);
create index if not exists user_achievements_user_idx on public.user_achievements(user_id, earned_at desc);
create index if not exists course_instructors_user_idx on public.course_instructors(user_id);
create index if not exists content_imports_by_idx on public.content_imports(imported_by, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. Updated-at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at before update on public.courses for each row execute function public.set_updated_at();
drop trigger if exists modules_set_updated_at on public.modules;
create trigger modules_set_updated_at before update on public.modules for each row execute function public.set_updated_at();
drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at before update on public.lessons for each row execute function public.set_updated_at();
drop trigger if exists quiz_questions_set_updated_at on public.quiz_questions;
create trigger quiz_questions_set_updated_at before update on public.quiz_questions for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. RLS helper functions (security definer, pinned search_path)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role from public.profiles p where p.id = auth.uid()), 'user');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'owner');
$$;

-- Can the current user manage (create/edit) the given course?
create or replace function public.can_manage_course(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.course_instructors ci
    where ci.course_id = target and ci.user_id = auth.uid() and ci.role in ('owner', 'teacher')
  );
$$;

-- Can the current user review (view all states of) the given course?
create or replace function public.can_review_course(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_course(target) or public.current_user_role() = 'reviewer';
$$;

-- Grant a user owner/teacher rights on a course. Callable only by admins/owners.
-- The backend calls this via RPC after a teacher creates a new course.
create or replace function public.add_course_instructor(
  p_course_id uuid,
  p_user_id uuid,
  p_role text default 'teacher'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can grant instructor rights';
  end if;
  insert into public.course_instructors (course_id, user_id, role)
  values (p_course_id, p_user_id, p_role)
  on conflict (course_id, user_id)
  do update set role = excluded.role;
end;
$$;

grant execute on function public.add_course_instructor(uuid, uuid, text) to authenticated;
revoke execute on function public.add_course_instructor(uuid, uuid, text) from anon, public;

grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_tags enable row level security;
alter table public.lesson_keywords enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.course_instructors enable row level security;
alter table public.certificates enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.content_imports enable row level security;

-- Courses: everyone can read published; managers can read any state.
drop policy if exists "Courses are publicly readable" on public.courses;
create policy "Courses are publicly readable" on public.courses
  for select using (status = 'published' or public.can_review_course(id));

-- Staff may create new courses; afterwards they must be added as owner/teacher
-- before they can manage the course (see course_instructors policy + backend RPC).
drop policy if exists "Staff can create courses" on public.courses;
create policy "Staff can create courses" on public.courses
  for insert with check (public.is_admin() or public.current_user_role() = 'teacher');

drop policy if exists "Courses are managed by instructors" on public.courses;
create policy "Courses are managed by instructors" on public.courses
  for update using (public.can_manage_course(id)) with check (public.can_manage_course(id));

drop policy if exists "Courses are deleted by instructors" on public.courses;
create policy "Courses are deleted by instructors" on public.courses
  for delete using (public.can_manage_course(id));

-- Modules: readable with the parent course; managed via the parent course.
drop policy if exists "Modules are readable" on public.modules;
create policy "Modules are readable" on public.modules
  for select using (
    exists (select 1 from public.courses c where c.id = modules.course_id and (c.status = 'published' or public.can_review_course(c.id)))
  );

drop policy if exists "Modules are managed via course" on public.modules;
create policy "Modules are managed via course" on public.modules
  for all using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

-- Lessons: readable with the parent course; managed via the parent course.
drop policy if exists "Lessons are readable" on public.lessons;
create policy "Lessons are readable" on public.lessons
  for select using (
    exists (select 1 from public.courses c where c.id = lessons.course_id and (c.status = 'published' or public.can_review_course(c.id)))
  );

drop policy if exists "Lessons are managed via course" on public.lessons;
create policy "Lessons are managed via course" on public.lessons
  for all using (public.can_manage_course(course_id)) with check (public.can_manage_course(course_id));

-- Tags / keywords / quiz questions follow the parent lesson's course permissions.
drop policy if exists "Tags are readable" on public.lesson_tags;
create policy "Tags are readable" on public.lesson_tags
  for select using (
    exists (select 1 from public.lessons l where l.id = lesson_tags.lesson_id
            and exists (select 1 from public.courses c where c.id = l.course_id and (c.status = 'published' or public.can_review_course(c.id))))
  );

drop policy if exists "Tags are managed via course" on public.lesson_tags;
create policy "Tags are managed via course" on public.lesson_tags
  for all using (
    exists (select 1 from public.lessons l where l.id = lesson_tags.lesson_id and public.can_manage_course(l.course_id))
  ) with check (
    exists (select 1 from public.lessons l where l.id = lesson_tags.lesson_id and public.can_manage_course(l.course_id))
  );

drop policy if exists "Keywords are readable" on public.lesson_keywords;
create policy "Keywords are readable" on public.lesson_keywords
  for select using (
    exists (select 1 from public.lessons l where l.id = lesson_keywords.lesson_id
            and exists (select 1 from public.courses c where c.id = l.course_id and (c.status = 'published' or public.can_review_course(c.id))))
  );

drop policy if exists "Keywords are managed via course" on public.lesson_keywords;
create policy "Keywords are managed via course" on public.lesson_keywords
  for all using (
    exists (select 1 from public.lessons l where l.id = lesson_keywords.lesson_id and public.can_manage_course(l.course_id))
  ) with check (
    exists (select 1 from public.lessons l where l.id = lesson_keywords.lesson_id and public.can_manage_course(l.course_id))
  );

drop policy if exists "Quiz questions are readable" on public.quiz_questions;
create policy "Quiz questions are readable" on public.quiz_questions
  for select using (
    exists (select 1 from public.lessons l where l.id = quiz_questions.lesson_id
            and exists (select 1 from public.courses c where c.id = l.course_id and (c.status = 'published' or public.can_review_course(c.id))))
  );

drop policy if exists "Quiz questions are managed via course" on public.quiz_questions;
create policy "Quiz questions are managed via course" on public.quiz_questions
  for all using (
    exists (select 1 from public.lessons l where l.id = quiz_questions.lesson_id and public.can_manage_course(l.course_id))
  ) with check (
    exists (select 1 from public.lessons l where l.id = quiz_questions.lesson_id and public.can_manage_course(l.course_id))
  );

-- Course instructors: admins/owners manage; users can read their own memberships.
drop policy if exists "Instructors are visible to members" on public.course_instructors;
create policy "Instructors are visible to members" on public.course_instructors
  for select using (public.is_admin() or user_id = auth.uid());

drop policy if exists "Instructors are managed by admins" on public.course_instructors;
create policy "Instructors are managed by admins" on public.course_instructors
  for all using (public.is_admin()) with check (public.is_admin());

-- Certificates: owners see theirs; admins see all. Issued by the service role server-side.
drop policy if exists "Users can view their own certificates" on public.certificates;
create policy "Users can view their own certificates" on public.certificates
  for select using (user_id = auth.uid() or public.is_admin());

-- Achievements: public catalog; per-user earnings are private.
drop policy if exists "Achievements are publicly readable" on public.achievements;
create policy "Achievements are publicly readable" on public.achievements for select using (true);

drop policy if exists "Users can view their own achievements" on public.user_achievements;
create policy "Users can view their own achievements" on public.user_achievements
  for select using (user_id = auth.uid() or public.is_admin());

-- Content imports: admins see all; importers see their own.
drop policy if exists "Imports are visible to admins and importer" on public.content_imports;
create policy "Imports are visible to admins and importer" on public.content_imports
  for select using (public.is_admin() or imported_by = auth.uid());

drop policy if exists "Imports are created by staff" on public.content_imports;
create policy "Imports are created by staff" on public.content_imports
  for insert with check (public.is_admin() or public.current_user_role() = 'teacher');

-- ---------------------------------------------------------------------------
-- 9. Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.courses, public.modules, public.lessons,
  public.lesson_tags, public.lesson_keywords, public.quiz_questions,
  public.course_instructors, public.certificates, public.achievements,
  public.user_achievements, public.content_imports to authenticated;
grant select on public.courses, public.modules, public.lessons,
  public.lesson_tags, public.lesson_keywords, public.quiz_questions,
  public.achievements to anon;

-- ---------------------------------------------------------------------------
-- 10. Add plan column to profiles (kept additive for existing installs)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists plan text not null default 'free';

-- ---------------------------------------------------------------------------
-- 11. Seed the four existing courses so the platform works immediately.
-- ---------------------------------------------------------------------------
insert into public.courses (slug, label, icon, color, eyebrow, duration, level, description, starter, status, sort_order)
values
  ('python', 'Python', 'Py', 'purple', 'Програмчлалын сэтгэлгээ', '6 долоо хоног', 'Анхан шат',
   'Код хэрхэн ажилладгийг ойлгож, логик сэтгэлгээ болон асуудал задлах сууриа тавина.',
   E'name = ''CodeCraft''\nfor step in range(1, 4):\n    print(f''{step}. Сайн уу, {name}!'')', 'published', 1),
  ('html', 'HTML', '<>', 'orange', 'Вэбийн утга ба бүтэц', '4 долоо хоног', 'Анхан шат',
   'Хүртээмжтэй, хайлтын системд ойлгомжтой веб хуудсыг зөв бүтцээр байгуулна.',
   E'<main>\n  <h1>Миний анхны вэб</h1>\n  <p>Би semantic HTML ашиглаж байна.</p>\n  <button>Эхлэх</button>\n</main>', 'published', 2),
  ('css', 'CSS', '#', 'blue', 'Харагдац ба layout', '7 долоо хоног', 'Анхан → дунд',
   'Design token-оос responsive layout хүртэл бодит интерфэйсийг системтэй загварчилна.',
   E':root {\n  --brand: #7c3aed;\n}\n.card {\n  padding: 24px;\n  border-radius: 18px;\n  color: white;\n  background: var(--brand);\n}', 'published', 3),
  ('javascript', 'JavaScript', 'JS', 'yellow', 'Вэбийн логик ба үйлдэл', '10 долоо хоног', 'Анхан → дунд',
   'DOM, state, API, async урсгалаар интерактив frontend бүтээгдэхүүн бүтээнэ.',
   E'const button = document.querySelector(''button'');\nlet count = 0;\nbutton?.addEventListener(''click'', () => {\n  count += 1;\n  button.textContent = `Даралт: ${count}`;\n});', 'published', 4)
on conflict (slug) do nothing;

-- Achievements catalog
insert into public.achievements (slug, title, description, icon)
values
  ('first-lesson', 'Эхний алхам', 'Эхний хичээлээ дуусгалаа', '🌱'),
  ('first-course', 'Эхний курс', 'Бүтэн курс дуусгалаа', '🎓'),
  ('quiz-master', 'Quiz мастер', '5 шалгалтдаа тэнцлээ', '🧠'),
  ('streak-7', 'Долоо хоног тасралтгүй', '7 өдөр дараалан суралцлаа', '🔥')
on conflict (slug) do nothing;