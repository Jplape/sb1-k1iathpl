-- Create function to check if a table exists
create or replace function table_exists(target_table text)
returns boolean as $$
declare
  table_count integer;
  schema_name text := split_part(target_table, '.', 1);
  table_only_name text := split_part(target_table, '.', 2);
begin
  if table_only_name = '' then
    table_only_name := schema_name;
    schema_name := 'public';
  end if;
  
  execute format('
    select count(*)
    from information_schema.tables
    where table_schema = %L
    and table_name = %L',
    schema_name, table_only_name)
  into table_count;
  
  return table_count > 0;
end;
$$ language plpgsql security definer;

comment on function table_exists is 'Vérifie si une table existe dans le schéma public';