-- Global Chat private messaging schema.
-- Run this only in the dedicated Global Chat Supabase project.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists conversation_participants_user_idx
  on public.conversation_participants(user_id);

create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create policy "Participants can view conversations"
on public.conversations for select
to authenticated
using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversations.id
      and cp.user_id = (select auth.uid())
  )
);

create policy "Participants can view participants"
on public.conversation_participants for select
to authenticated
using (
  exists (
    select 1 from public.conversation_participants own
    where own.conversation_id = conversation_participants.conversation_id
      and own.user_id = (select auth.uid())
  )
);

create policy "Participants can view messages"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = (select auth.uid())
  )
);

create policy "Participants can send messages"
on public.messages for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = (select auth.uid())
  )
);

create or replace function public.set_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_update_conversation on public.messages;
create trigger messages_update_conversation
after insert on public.messages
for each row execute function public.set_conversation_updated_at();

-- Realtime database changes must be enabled for messages in the project.
-- This command is intentionally kept separate from execution because the
-- dedicated Global Chat project has not been selected yet.
-- alter publication supabase_realtime add table public.messages;
