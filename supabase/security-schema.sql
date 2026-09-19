-- Security audit events.
-- Never store passwords, access tokens, refresh tokens, MFA secrets, or other auth secrets.
-- Run only in the dedicated Global Chat Supabase project.

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in (
    'password_changed','signed_out','mfa_enabled','mfa_disabled',
    'session_revoked','security_setting_changed'
  )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.security_events enable row level security;

create policy "Users can view their security events"
on public.security_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Clients cannot insert security events"
on public.security_events for insert to authenticated
with check (false);

create index if not exists security_events_user_created_idx
on public.security_events(user_id, created_at desc);
