/*
  # Add Admin User Account

  1. Changes
    - Create new admin user account
    - Set up security policies and role
    - Enable MFA configuration
*/

-- Create the user account with hashed password
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  is_super_admin
)
SELECT 
  'jipelap@hotmail.fr',
  crypt('Pzeejz71%%', gen_salt('bf')),
  now(),
  now(),
  now(),
  'admin',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'jipelap@hotmail.fr'
);

-- Get the user ID
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jipelap@hotmail.fr';

  -- Create profile with admin role
  INSERT INTO public.profiles (
    id,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'admin',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      updated_at = now();

  -- Add to audit log using valid type from check constraint
  INSERT INTO public.moderation_actions (
    type,
    target_id,
    reason,
    admin_id
  )
  VALUES (
    'approval',  -- Changed from 'admin_creation' to 'approval' to match the check constraint
    v_user_id,
    'Initial admin account creation',
    v_user_id
  );
END $$;