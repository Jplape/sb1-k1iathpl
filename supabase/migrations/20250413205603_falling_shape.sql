/*
  # Marketplace Schema Improvements

  1. Updates
    - Add stock quantity to products
    - Add shipping information
    - Improve transaction tracking
    - Enhanced admin capabilities

  2. Security
    - Add admin policies
    - Improve seller policies
*/

-- Add new fields to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 1 CHECK (stock_quantity >= 0),
ADD COLUMN IF NOT EXISTS shipping_price numeric DEFAULT 0 CHECK (shipping_price >= 0),
ADD COLUMN IF NOT EXISTS condition text DEFAULT 'new' CHECK (condition IN ('new', 'like_new', 'good', 'fair'));

-- Add admin role check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policies to products
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  USING (is_admin());

-- Add admin policies to transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (is_admin());

-- Add seller verification to products
CREATE POLICY "Only verified sellers can create products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'pro')
    )
  );

-- Add transaction completion trigger
CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE products 
    SET status = 'sold',
        stock_quantity = stock_quantity - 1
    WHERE id = NEW.product_id
    AND stock_quantity > 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_completed
  AFTER UPDATE ON transactions
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION update_product_status();

-- Add index for product condition and stock
CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);