-- User preferences.
-- Run only in the dedicated Global Chat Supabase project.

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_notifications boolean not null default true,
  message_notifications boolean not null default true,
  community_activity boolean not null default true,
  reduce_motion boolean not null default false,
  discoverable_profile boolean not null default true,
  allow_connection_requests boolean not null default true,
  show_online_status boolean not null default true,
  language text not null default 'en' check (language ~ '^[a-z]{2,5}(-[A-Z]{2})?$'),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can view their preferences"
on public.user_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their preferences"
on public.user_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their preferences"
on public.user_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.set_user_preferences_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at before update on public.user_preferences
for each row execute function public.set_user_preferences_updated_at();
