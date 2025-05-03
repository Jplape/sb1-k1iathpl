/*
  # Fix reviews table foreign key relationship

  1. Changes
    - Add foreign key constraint between reviews.user_id and profiles.id
    - Drop existing foreign key if it exists to ensure clean migration

  2. Security
    - No changes to RLS policies needed
*/

DO $$ BEGIN
  -- Drop existing foreign key if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_user_id_fkey'
  ) THEN
    ALTER TABLE public.reviews DROP CONSTRAINT reviews_user_id_fkey;
  END IF;
END $$;

-- Add foreign key constraint to profiles table instead of users
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles (id)
ON DELETE CASCADE;