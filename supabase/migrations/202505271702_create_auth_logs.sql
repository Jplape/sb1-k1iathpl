-- Create auth logs table for monitoring authentication attempts
create table if not exists auth_logs (
  id bigint primary key generated always as identity,
  email text not null,
  status text not null, -- 'attempt', 'success', 'failed'
  details jsonb,
  timestamp timestamp with time zone not null default now(),
  user_agent text,
  ip_address text,
  email_confirmed boolean,
  error_type text,
  attempt_count integer default 1
);

comment on table auth_logs is 'Logs des tentatives d''authentification';
comment on column auth_logs.email is 'Email utilisé pour la tentative';
comment on column auth_logs.status is 'Statut de la tentative';
comment on column auth_logs.details is 'Détails supplémentaires sous forme JSON';
comment on column auth_logs.email_confirmed is 'Statut de confirmation de l''email';
comment on column auth_logs.error_type is 'Type d''erreur (email_non_confirmé, mdp_incorrect, etc)';
comment on column auth_logs.attempt_count is 'Nombre de tentatives pour cette session';

-- Enable Row Level Security
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from all users (bypass RLS if needed)
CREATE POLICY "Enable insert for all users"
ON auth_logs FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Désactivation complète de RLS pour auth_logs
ALTER TABLE auth_logs DISABLE ROW LEVEL SECURITY;