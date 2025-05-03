/*
  # Add Barter Category

  1. Updates
    - Add "Troc" (Barter) category to the categories table
    - Ensure idempotency with ON CONFLICT clause
*/

INSERT INTO categories (name, slug)
VALUES ('Troc', 'barter')
ON CONFLICT (slug) DO NOTHING;