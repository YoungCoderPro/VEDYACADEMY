-- ============================================================
-- VedyAcademy — Supabase schema, security policies, and RPCs
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL → New query)
-- ============================================================

-- ---------- profiles: one row per signed-up user ----------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'student' check (role in ('teacher','admin','student')),
  student_id text,           -- links a student account to a students row
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- auto-create a profile whenever someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- app data tables (jsonb keeps the app's object shapes) ----------
create table if not exists public.students (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id text primary key,
  student_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring (
  id text primary key,
  student_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- helper: is the caller approved staff? ----------
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and approved and role in ('teacher','admin')
  );
$$;

-- ---------- Row Level Security ----------
alter table public.profiles  enable row level security;
alter table public.students  enable row level security;
alter table public.lessons   enable row level security;
alter table public.recurring enable row level security;
alter table public.documents enable row level security;

-- profiles: users see their own; staff see and manage all
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists profiles_staff_update on public.profiles;
create policy profiles_staff_update on public.profiles
  for update using (public.is_staff()) with check (public.is_staff());

-- data tables: ONLY staff can touch them directly.
-- Students never query these tables — they go through the sanitized RPCs below.
drop policy if exists students_staff_all on public.students;
create policy students_staff_all on public.students
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists lessons_staff_all on public.lessons;
create policy lessons_staff_all on public.lessons
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists recurring_staff_all on public.recurring;
create policy recurring_staff_all on public.recurring
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists documents_staff_all on public.documents;
create policy documents_staff_all on public.documents
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- student portal: sanitized read ----------
-- Strips payments, money, private notes, and parent/contact details before the
-- data ever leaves the database. Security enforced here, not in the UI.
create or replace function public.get_student_portal()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  prof public.profiles;
  st public.students;
  clean jsonb;
  out_lessons jsonb;
  out_recurring jsonb;
  out_docs jsonb;
begin
  select * into prof from public.profiles where user_id = auth.uid();
  if prof is null or not prof.approved or prof.student_id is null then
    return jsonb_build_object('status','pending');
  end if;

  select * into st from public.students where id = prof.student_id;
  if st is null then
    return jsonb_build_object('status','pending');
  end if;

  clean := st.data
    - 'payments' - 'hourlyRate' - 'lessonCost' - 'notes' - 'parent' - 'phone' - 'email';

  select coalesce(jsonb_agg(l.data), '[]'::jsonb) into out_lessons
    from public.lessons l where l.student_id = st.id;
  select coalesce(jsonb_agg(r.data), '[]'::jsonb) into out_recurring
    from public.recurring r where r.student_id = st.id;
  select coalesce(jsonb_agg(d.data), '[]'::jsonb) into out_docs
    from public.documents d
    where st.data->'sharedDocs' ? d.id;

  return jsonb_build_object(
    'status','ready',
    'student', clean,
    'lessons', out_lessons,
    'recurring', out_recurring,
    'documents', out_docs
  );
end $$;

-- students may mark their own homework done/undone — nothing else
create or replace function public.toggle_my_homework(hw_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  prof public.profiles;
begin
  select * into prof from public.profiles where user_id = auth.uid();
  if prof is null or not prof.approved or prof.student_id is null then
    raise exception 'not authorized';
  end if;

  update public.students s
  set data = jsonb_set(
        s.data, '{homework}',
        (select coalesce(jsonb_agg(
           case when elem->>'id' = hw_id
                then jsonb_set(elem, '{done}', to_jsonb(not coalesce((elem->>'done')::boolean, false)))
                else elem end), '[]'::jsonb)
         from jsonb_array_elements(coalesce(s.data->'homework','[]'::jsonb)) elem)
      ),
      updated_at = now()
  where s.id = prof.student_id;
end $$;

grant execute on function public.get_student_portal() to authenticated;
grant execute on function public.toggle_my_homework(text) to authenticated;

-- ---------- storage: private "documents" bucket ----------
insert into storage.buckets (id, name, public)
values ('documents','documents', false)
on conflict (id) do nothing;

-- staff: full access to files
drop policy if exists docs_staff_all on storage.objects;
create policy docs_staff_all on storage.objects
  for all using (bucket_id = 'documents' and public.is_staff())
  with check (bucket_id = 'documents' and public.is_staff());

-- students: may read a file only if its doc id is in THEIR sharedDocs list
drop policy if exists docs_student_read on storage.objects;
create policy docs_student_read on storage.objects
  for select using (
    bucket_id = 'documents' and exists (
      select 1
      from public.profiles p
      join public.students s on s.id = p.student_id
      where p.user_id = auth.uid()
        and p.approved and p.role = 'student'
        and s.data->'sharedDocs' ? split_part(storage.objects.name, '.', 1)
    )
  );

-- ============================================================
-- AFTER RUNNING THIS FILE:
-- 1. Sign up in the app with the teacher's email.
-- 2. Promote that account by running (replace the email):
--
--    update public.profiles
--    set role = 'teacher', approved = true
--    where email = 'TEACHER_EMAIL_HERE';
--
-- (Use role = 'admin' the same way for an admin account.)
-- ============================================================
