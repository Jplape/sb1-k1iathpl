/*
  # Add Payments Table for Ad Options

  1. New Tables
    - payments
      - Stores payment history for ad options
      - Links to products and includes option details
      - Tracks Stripe payment information

  2. Security
    - Enable RLS
    - Add policies for sellers to view their payments
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_session_id text,
  options jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Sellers can view their payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = payments.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payments_product ON payments(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);