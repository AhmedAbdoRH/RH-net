create or replace function public.get_usage_metrics()
returns table (
  database_bytes bigint,
  storage_bytes bigint,
  storage_files bigint,
  total_users bigint
)
language sql
security definer
set search_path = pg_catalog
as $$
  select
    pg_database_size(current_database())::bigint,
    coalesce((
      select sum(coalesce(nullif(metadata ->> 'size', '')::bigint, 0))
      from storage.objects
    ), 0)::bigint,
    (select count(*) from storage.objects)::bigint,
    (select count(*) from auth.users)::bigint;
$$;

revoke all on function public.get_usage_metrics() from public;
revoke all on function public.get_usage_metrics() from anon, authenticated;
grant execute on function public.get_usage_metrics() to service_role;
