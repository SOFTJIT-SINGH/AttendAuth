-- 1️⃣ PROFILES (Base table)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text check (role in ('HOD','TEACHER','STUDENT')) default 'STUDENT',
  device_id text unique,
  face_ref_blob text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- 2️⃣ CLASS SCHEDULES (Created BEFORE attendance_logs)
create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  start_time time not null,          -- e.g., '09:00:00'
  end_time time not null,            -- e.g., '10:30:00'
  geofence_lat double precision not null,
  geofence_lon double precision not null,
  geofence_radius_m integer default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.class_schedules enable row level security;

-- 3️⃣ ATTENDANCE LOGS (References profiles & class_schedules)
create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete set null,
  class_id uuid references public.class_schedules(id) on delete set null,
  status text check (status in ('PRESENT','ABSENT','PENDING_APPROVAL')),
  marked_at timestamptz default now(),
  location jsonb,
  device_id text,
  ai_confidence numeric,
  ip_address text
);
alter table public.attendance_logs enable row level security;

-- 🔐 RLS POLICIES
-- Profiles
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Staff manage profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('HOD', 'TEACHER'))
);

-- Class Schedules
create policy "View schedules" on public.class_schedules for select using (true);
create policy "Teachers manage own" on public.class_schedules for all using (teacher_id = auth.uid());
create policy "HoD manages all" on public.class_schedules for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'HOD')
);

-- Attendance Logs
create policy "Students view own logs" on public.attendance_logs for select using (student_id = auth.uid());
create policy "Staff view all logs" on public.attendance_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('HOD', 'TEACHER'))
);
create policy "Insert allowed" on public.attendance_logs for insert with check (auth.role() = 'authenticated');

-- ⚙️ AUTO-SYNC TRIGGER (Signup -> Profiles)
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, role, device_id)
  values (new.id, new.email, new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'device_id');
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();