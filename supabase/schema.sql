-- Compasso – Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- FAMILIES (tenant root)
-- ─────────────────────────────────────────────────────────────
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- FAMILY MEMBERS
-- ─────────────────────────────────────────────────────────────
create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  role text not null default 'parent', -- 'mother' | 'father' | 'guardian'
  color text default '#3b82f6',
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- CHILDREN
-- ─────────────────────────────────────────────────────────────
create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  name text not null,
  birth_date date not null,
  school text,
  grade text,
  photo_url text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- GUARD PATTERNS
-- ─────────────────────────────────────────────────────────────
create table if not exists guard_patterns (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  child_id uuid references children(id) on delete cascade not null,
  pattern_type text not null default 'alternating_weekly',
  switch_day int default 2, -- 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  reference_date date not null,
  reference_guardian text not null default 'mother', -- 'mother' | 'father'
  reference_member_id uuid references family_members(id) on delete set null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- GUARD SWAPS
-- ─────────────────────────────────────────────────────────────
create table if not exists guard_swaps (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  requested_date date not null,
  proposed_exchange_date date,
  reason text,
  requested_by uuid references family_members(id) on delete set null,
  status text default 'pending', -- 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- ─────────────────────────────────────────────────────────────
-- CALENDAR EVENTS
-- ─────────────────────────────────────────────────────────────
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  child_id uuid references children(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  responsible_member_id uuid references family_members(id) on delete set null,
  auto_assigned boolean default true,
  google_event_id text,
  source text default 'manual', -- 'manual' | 'google_calendar' | 'email_import'
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- HEALTH: VACCINATIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists health_vaccinations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade not null,
  vaccine_id text not null,
  vaccine_name text not null,
  dose_label text not null,
  scheduled_date date,
  administered_date date,
  status text default 'scheduled', -- 'scheduled' | 'administered' | 'overdue'
  notes text,
  created_at timestamptz default now(),
  unique(child_id, vaccine_id, dose_label)
);

-- ─────────────────────────────────────────────────────────────
-- HEALTH: CONSULTATIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists health_consultations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade not null,
  date date not null,
  doctor_name text,
  specialty text,
  notes text,
  next_return date,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- THERAPY RECORDS
-- ─────────────────────────────────────────────────────────────
create table if not exists therapy_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade not null,
  recorded_by uuid references family_members(id) on delete set null,
  guard_period text, -- 'mother' | 'father'
  content text not null,
  recorded_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- ACHIEVEMENTS
-- ─────────────────────────────────────────────────────────────
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade not null,
  category text not null, -- 'academic' | 'sports' | 'social' | 'emotional' | 'creative'
  title text not null,
  description text,
  achieved_at date not null,
  photo_url text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- SHARED DECISIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists shared_decisions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  subject text not null,
  content text not null,
  participants text[],
  decided_at date not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- EMAIL FILTERS
-- ─────────────────────────────────────────────────────────────
create table if not exists email_filters (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade not null,
  filter_type text not null, -- 'sender' | 'keyword'
  value text not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table families enable row level security;
alter table family_members enable row level security;
alter table children enable row level security;
alter table guard_patterns enable row level security;
alter table guard_swaps enable row level security;
alter table calendar_events enable row level security;
alter table health_vaccinations enable row level security;
alter table health_consultations enable row level security;
alter table therapy_records enable row level security;
alter table achievements enable row level security;
alter table shared_decisions enable row level security;
alter table email_filters enable row level security;

-- Helper: get family_id for current user
create or replace function get_my_family_id()
returns uuid
language sql stable
as $$
  select family_id from family_members
  where user_id = auth.uid()
  limit 1
$$;

-- family_members: user can see/write their own family
create policy "family_members_select" on family_members
  for select using (family_id = get_my_family_id());

create policy "family_members_insert" on family_members
  for insert with check (true); -- checked in app

create policy "family_members_update" on family_members
  for update using (family_id = get_my_family_id());

-- families
create policy "families_select" on families
  for select using (id = get_my_family_id());

create policy "families_insert" on families
  for insert with check (true);

-- children
create policy "children_all" on children
  using (family_id = get_my_family_id())
  with check (family_id = get_my_family_id());

-- guard_patterns
create policy "guard_patterns_all" on guard_patterns
  using (family_id = get_my_family_id())
  with check (family_id = get_my_family_id());

-- guard_swaps
create policy "guard_swaps_all" on guard_swaps
  using (family_id = get_my_family_id())
  with check (family_id = get_my_family_id());

-- calendar_events
create policy "calendar_events_all" on calendar_events
  using (family_id = get_my_family_id())
  with check (family_id = get_my_family_id());

-- health_vaccinations (via child)
create policy "health_vaccinations_all" on health_vaccinations
  using (child_id in (select id from children where family_id = get_my_family_id()))
  with check (child_id in (select id from children where family_id = get_my_family_id()));

-- health_consultations (via child)
create policy "health_consultations_all" on health_consultations
  using (child_id in (select id from children where family_id = get_my_family_id()))
  with check (child_id in (select id from children where family_id = get_my_family_id()));

-- therapy_records (via child)
create policy "therapy_records_all" on therapy_records
  using (child_id in (select id from children where family_id = get_my_family_id()))
  with check (child_id in (select id from children where family_id = get_my_family_id()));

-- achievements (via child)
create policy "achievements_all" on achievements
  using (child_id in (select id from children where family_id = get_my_family_id()))
  with check (child_id in (select id from children where family_id = get_my_family_id()));

-- shared_decisions
create policy "shared_decisions_all" on shared_decisions
  using (family_id = get_my_family_id())
  with check (family_id = get_my_family_id());

-- email_filters
create policy "email_filters_all" on email_filters
  using (family_id = get_my_family_id())
  with check (family_id = get_my_family_id());
