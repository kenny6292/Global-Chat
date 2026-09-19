-- Global topics and follows.
-- Run only in the dedicated Global Chat Supabase project.

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9_-]{1,49}$'),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 300),
  follower_count bigint not null default 0 check (follower_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.topic_follows (
  topic_id uuid not null references public.topics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (topic_id, user_id)
);

alter table public.topics enable row level security;
alter table public.topic_follows enable row level security;

create policy "Authenticated users can view topics"
on public.topics for select to authenticated using (true);

create policy "Users can view their topic follows"
on public.topic_follows for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can follow topics"
on public.topic_follows for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can unfollow their topics"
on public.topic_follows for delete to authenticated
using ((select auth.uid()) = user_id);

create index if not exists topics_follower_count_idx on public.topics(follower_count desc);
create index if not exists topic_follows_user_idx on public.topic_follows(user_id);

create or replace function public.sync_topic_follower_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.topics set follower_count = follower_count + 1 where id = new.topic_id;
  elsif tg_op = 'DELETE' then
    update public.topics set follower_count = greatest(follower_count - 1, 0) where id = old.topic_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists topic_follower_count_trigger on public.topic_follows;
create trigger topic_follower_count_trigger after insert or delete on public.topic_follows
for each row execute function public.sync_topic_follower_count();
