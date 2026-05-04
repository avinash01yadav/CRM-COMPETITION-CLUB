create table if not exists public.competition_club_leads (
  id text primary key,
  student_id text,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.competition_club_leads enable row level security;

drop policy if exists "Allow public read for testing" on public.competition_club_leads;
drop policy if exists "Allow public insert for testing" on public.competition_club_leads;
drop policy if exists "Allow public update for testing" on public.competition_club_leads;
drop policy if exists "Allow public delete for testing" on public.competition_club_leads;

-- Temporary public policies for testing from GitHub Pages.
-- For real student data, replace these with login-based policies before sharing widely.
create policy "Allow public read for testing"
on public.competition_club_leads
for select
to anon
using (true);

create policy "Allow public insert for testing"
on public.competition_club_leads
for insert
to anon
with check (true);

create policy "Allow public update for testing"
on public.competition_club_leads
for update
to anon
using (true)
with check (true);

create policy "Allow public delete for testing"
on public.competition_club_leads
for delete
to anon
using (true);

create table if not exists public.competition_club_schedules (
  id text primary key,
  class_date date,
  teacher_name text,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.competition_club_schedules enable row level security;

drop policy if exists "Allow public schedule read for testing" on public.competition_club_schedules;
drop policy if exists "Allow public schedule insert for testing" on public.competition_club_schedules;
drop policy if exists "Allow public schedule update for testing" on public.competition_club_schedules;
drop policy if exists "Allow public schedule delete for testing" on public.competition_club_schedules;

create policy "Allow public schedule read for testing"
on public.competition_club_schedules
for select
to anon
using (true);

create policy "Allow public schedule insert for testing"
on public.competition_club_schedules
for insert
to anon
with check (true);

create policy "Allow public schedule update for testing"
on public.competition_club_schedules
for update
to anon
using (true)
with check (true);

create policy "Allow public schedule delete for testing"
on public.competition_club_schedules
for delete
to anon
using (true);

create table if not exists public.competition_club_scheduler_masters (
  id text primary key,
  master_type text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.competition_club_scheduler_masters enable row level security;

drop policy if exists "Allow public master read for testing" on public.competition_club_scheduler_masters;
drop policy if exists "Allow public master insert for testing" on public.competition_club_scheduler_masters;
drop policy if exists "Allow public master update for testing" on public.competition_club_scheduler_masters;
drop policy if exists "Allow public master delete for testing" on public.competition_club_scheduler_masters;

create policy "Allow public master read for testing"
on public.competition_club_scheduler_masters
for select
to anon
using (true);

create policy "Allow public master insert for testing"
on public.competition_club_scheduler_masters
for insert
to anon
with check (true);

create policy "Allow public master update for testing"
on public.competition_club_scheduler_masters
for update
to anon
using (true)
with check (true);

create policy "Allow public master delete for testing"
on public.competition_club_scheduler_masters
for delete
to anon
using (true);
