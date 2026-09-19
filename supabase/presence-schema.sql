-- Presence preferences/schema.
-- Realtime Presence is ephemeral; do not persist live connections as rows.
-- Run only in the dedicated Global Chat Supabase project.

alter table public.profiles
  add column if not exists presence_status text not null default 'online'
  check (presence_status in ('online','away','busy','invisible'));

alter table public.profiles
  add column if not exists show_online_status boolean not null default true;

create index if not exists profiles_presence_status_idx on public.profiles(presence_status);

-- Realtime Presence should be used by the client for live online state.
