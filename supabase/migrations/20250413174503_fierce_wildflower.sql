/*
  # Add Marketplace Tables

  1. New Tables
    - products
      - Core product information
      - Price and status tracking
      - Image management
    - transactions
      - Payment records
      - Buyer and seller tracking
    - reviews
      - Product reviews
      - User ratings

  2. Security
    - Enable RLS on all tables
    - Add policies for buyers and sellers
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  images text[] DEFAULT ARRAY[]::text[],
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  featured boolean DEFAULT false,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  buyer_id uuid REFERENCES auth.users(id),
  seller_id uuid REFERENCES auth.users(id),
  amount numeric NOT NULL CHECK (amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  stripe_payment_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Sellers can manage their products"
  ON products FOR ALL
  USING (seller_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view their transactions"
  ON transactions FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Verified buyers can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE product_id = reviews.product_id
      AND buyer_id = auth.uid()
      AND status = 'completed'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);