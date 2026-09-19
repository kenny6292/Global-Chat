-- Global Chat public communities and realtime rooms.
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  slug text not null unique check (char_length(slug) between 2 and 90),
  description text not null default '' check (char_length(description) <= 500),
  category text not null default 'General' check (char_length(category) between 2 and 40),
  country_code text not null default 'GLOBAL' check (char_length(country_code) between 2 and 3),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists communities_category_idx on public.communities(category);
create index if not exists communities_country_idx on public.communities(country_code);
create index if not exists community_members_user_idx on public.community_members(user_id);
create index if not exists community_messages_room_created_idx on public.community_messages(community_id, created_at);

alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_messages enable row level security;

create policy "Authenticated users can view communities" on public.communities for select to authenticated using (true);
create policy "Users can create communities" on public.communities for insert to authenticated with check (owner_id = (select auth.uid()));

create policy "Members can view memberships" on public.community_members for select to authenticated using (
  exists (select 1 from public.community_members own where own.community_id = community_members.community_id and own.user_id = (select auth.uid()))
);
create policy "Users can join communities" on public.community_members for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users can leave communities" on public.community_members for delete to authenticated using (user_id = (select auth.uid()));

create policy "Members can view community messages" on public.community_messages for select to authenticated using (
  exists (select 1 from public.community_members m where m.community_id = community_messages.community_id and m.user_id = (select auth.uid()))
);
create policy "Members can send community messages" on public.community_messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.community_members m where m.community_id = community_messages.community_id and m.user_id = (select auth.uid()))
);

-- Enable Realtime for community_messages on the dedicated Global Chat project after it is selected.
-- For larger-scale production realtime, use Supabase Broadcast with database triggers.