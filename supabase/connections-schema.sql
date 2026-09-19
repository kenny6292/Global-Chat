-- Global Chat connections schema.
-- Run only in the dedicated Global Chat Supabase project.

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

alter table public.connections enable row level security;

create policy "Users can view their connections"
on public.connections for select to authenticated
using ((select auth.uid()) in (requester_id, addressee_id));

create policy "Users can send connection requests"
on public.connections for insert to authenticated
with check ((select auth.uid()) = requester_id and requester_id <> addressee_id);

drop policy if exists "Users can update their received or sent requests" on public.connections;

create policy "Requesters can cancel pending requests"
on public.connections for update to authenticated
using ((select auth.uid()) = requester_id and status = 'pending')
with check ((select auth.uid()) = requester_id and status = 'cancelled');

create policy "Addressees can accept or reject pending requests"
on public.connections for update to authenticated
using ((select auth.uid()) = addressee_id and status = 'pending')
with check ((select auth.uid()) = addressee_id and status in ('accepted','rejected'));

create index if not exists connections_requester_idx on public.connections(requester_id, status);
create index if not exists connections_addressee_idx on public.connections(addressee_id, status);

create or replace function public.set_connections_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists connections_updated_at on public.connections;
create trigger connections_updated_at before update on public.connections
for each row execute function public.set_connections_updated_at();
