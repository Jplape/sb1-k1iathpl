-- Initialisation admin corrigée
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jipelap@hotmail.fr') THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      is_super_admin
    ) VALUES (
      gen_random_uuid(),
      'jipelap@hotmail.fr',
      crypt('Pzeejz71%%', gen_salt('bf')),
      '{"full_name":"Administrateur"}'::jsonb,
      now(),
      now(),
      'admin',
      true
    );
    RAISE NOTICE 'Admin user created successfully';
  END IF;
END $$;