-- 1️⃣ PROFILES (Enhanced with verification & hierarchy)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  role text check (role in ('HOD','TEACHER','STUDENT')) default 'STUDENT',
  device_id text,
  is_verified boolean default false,
  face_ref_blob text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- 2️⃣ CLASS SCHEDULES
create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  start_time time not null,
  end_time time not null,
  geofence_lat double precision not null,
  geofence_lon double precision not null,
  geofence_radius_m integer default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.class_schedules enable row level security;

-- 3️⃣ ATTENDANCE LOGS
create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete set null,
  class_id uuid references public.class_schedules(id) on delete set null,
  status text check (status in ('PRESENT','ABSENT','PENDING_APPROVAL')),
  marked_at timestamptz default now(),
  location jsonb,
  device_id text,
  ai_confidence numeric,
  ip_address text,
  capture_blob text
);
alter table public.attendance_logs enable row level security;

-- 🔐 RLS POLICIES (Hierarchy & Simplified)

-- Profile Access
create policy "View own profile" on public.profiles for select using (auth.uid() = id);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);

create policy "HOD manage teachers" on public.profiles for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'HOD' and role = 'TEACHER'
);

create policy "Teacher manage students" on public.profiles for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'TEACHER' and role = 'STUDENT'
);

create policy "Global read profiles" on public.profiles for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('HOD', 'TEACHER')
);

-- Schedules
create policy "Everyone view schedules" on public.class_schedules for select using (true);
create policy "HOD manage sessions" on public.class_schedules for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'HOD'
);
create policy "Teacher manage assigned" on public.class_schedules for all using (
  teacher_id = auth.uid()
);

-- Attendance
create policy "Student log attendance" on public.attendance_logs for insert with check (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'STUDENT'
);
create policy "View own attendance" on public.attendance_logs for select using (
  student_id = auth.uid()
);
create policy "Staff view reports" on public.attendance_logs for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('HOD', 'TEACHER')
);
create policy "Staff approve attendance" on public.attendance_logs for update using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('HOD', 'TEACHER')
);

-- ⚙️ TRIPLE SYNC TRIGGER
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, device_id, face_ref_blob, is_verified)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'role', 
    new.raw_user_meta_data->>'device_id',
    new.raw_user_meta_data->>'face_ref_blob',
    (case when (new.raw_user_meta_data->>'role' = 'HOD') then true else false end)
  );
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();