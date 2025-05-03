/*
  # Initial Schema Setup for Marketplace Platform

  1. New Tables
    - profiles
      - Extends auth.users with additional user information
      - Stores user role and profile data
    - ads
      - Stores marketplace listings
      - Includes basic and premium features
    - categories
      - Predefined listing categories
    - favorites
      - User's favorite listings

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'pro', 'admin')),
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  category_id uuid REFERENCES categories(id),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  images text[] DEFAULT ARRAY[]::text[],
  featured boolean DEFAULT false,
  urgent boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ads are viewable by everyone"
  ON ads FOR SELECT
  USING (true);

CREATE POLICY "Users can create ads"
  ON ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ads"
  ON ads FOR UPDATE
  USING (auth.uid() = user_id);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES ads(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, ad_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);

-- Insert initial categories
INSERT INTO categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Vehicles', 'vehicles'),
  ('Real Estate', 'real-estate'),
  ('Fashion', 'fashion'),
  ('Home & Garden', 'home-garden'),
  ('Sports & Leisure', 'sports-leisure'),
  ('Jobs', 'jobs'),
  ('Services', 'services')
ON CONFLICT (slug) DO NOTHING;