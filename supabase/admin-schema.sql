-- Admin authorization must come from auth.app_metadata or a server-managed role,
-- never from user-editable raw_user_meta_data.
create or replace function public.get_admin_stats()
returns jsonb
language plpgsql
security invoker
as $$
declare
  result jsonb;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') not in ('admin','moderator') then
    raise exception 'forbidden';
  end if;
  select jsonb_build_object(
    'users',(select count(*) from auth.users),
    'communities',(select count(*) from public.communities),
    'messages',(select count(*) from public.messages),
    'openReports',(select count(*) from public.reports where status='open')
  ) into result;
  return result;
end;
$$;

create or replace function public.moderate_report(report_id uuid, new_status text)
returns public.reports
language plpgsql
security invoker
as $$
declare
  result public.reports;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'),'') not in ('admin','moderator') then
    raise exception 'forbidden';
  end if;
  if new_status not in ('reviewing','resolved','dismissed') then
    raise exception 'invalid status';
  end if;
  update public.reports set status=new_status where id=report_id returning * into result;
  return result;
end;
$$;

revoke execute on function public.get_admin_stats() from anon;
revoke execute on function public.moderate_report(uuid,text) from anon;
