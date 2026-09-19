create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete cascade,
  message_id uuid,
  reason text not null check (char_length(reason) between 2 and 120),
  details text not null default '' check (char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
create index if not exists reports_reported_user_idx on public.reports(reported_user_id);

alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;

create policy "Users can view their own blocks" on public.user_blocks for select to authenticated
using (blocker_id = (select auth.uid()));

create policy "Users can create their own blocks" on public.user_blocks for insert to authenticated
with check (blocker_id = (select auth.uid()) and blocker_id <> blocked_id);

create policy "Users can delete their own blocks" on public.user_blocks for delete to authenticated
using (blocker_id = (select auth.uid()));

create policy "Users can create reports" on public.reports for insert to authenticated
with check (reporter_id = (select auth.uid()));

create policy "Users can view their own reports" on public.reports for select to authenticated
using (reporter_id = (select auth.uid()));

-- Moderators/admins should access reports through a server-side privileged workflow
-- backed by app_metadata/roles, never user-editable user_metadata.
