-- Private chat media storage.
-- Create the private Storage bucket "chat-media" in the dedicated Global Chat project.
-- Storage policies restrict objects to their owner folder (<auth.uid()>/...).
create table if not exists public.media_attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  created_at timestamptz not null default now()
);

alter table public.media_attachments enable row level security;

create policy "Owners can view their media metadata"
on public.media_attachments for select to authenticated
using (owner_id = (select auth.uid()));

create policy "Users can create their media metadata"
on public.media_attachments for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "Owners can delete their media metadata"
on public.media_attachments for delete to authenticated
using (owner_id = (select auth.uid()));

-- Storage objects should use paths beginning with the authenticated user's UUID.
-- Apply equivalent INSERT/SELECT/DELETE policies to storage.objects for bucket_id = 'chat-media'.
