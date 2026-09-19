create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('message','community','system')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 500),
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id, read_at) where read_at is null;

alter table public.notifications enable row level security;

create policy "Users can view their notifications"
on public.notifications for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can mark their notifications read"
on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users cannot create notifications for themselves"
on public.notifications for insert to authenticated
with check (false);

-- Trusted server-side functions/triggers should create notifications.
-- Realtime can be enabled for this table after the dedicated project is connected.
