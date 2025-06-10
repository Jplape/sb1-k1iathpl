-- Correction de la contrainte NOT NULL sur auth.users.id
ALTER TABLE auth.users ALTER COLUMN id SET NOT NULL;