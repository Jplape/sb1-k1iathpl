/*
  # Add Watchlist Feature

  1. New Tables
    - watchlist
      - Stores user's watched items
      - Tracks price history
      - Notification preferences
    - price_history
      - Records product price changes
      - Used for price drop detection

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  original_price numeric NOT NULL,
  notify_price_drop boolean DEFAULT true,
  notify_back_in_stock boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create price history table
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can manage their watchlist"
  ON watchlist
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view price history"
  ON price_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_product ON watchlist(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON price_history(created_at);

-- Function to record price changes
CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO price_history (product_id, price)
    VALUES (NEW.id, NEW.price);

    -- Notify users watching this product about price drop
    IF NEW.price < OLD.price THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        content
      )
      SELECT
        w.user_id,
        'price_drop',
        'Price Drop Alert',
        format('The price of %s has dropped from %s€ to %s€', NEW.title, OLD.price, NEW.price)
      FROM watchlist w
      WHERE w.product_id = NEW.id
      AND w.notify_price_drop = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for price changes
CREATE TRIGGER on_price_change
  AFTER UPDATE OF price ON products
  FOR EACH ROW
  EXECUTE FUNCTION record_price_change();

-- Function to get price history with percentage changes
CREATE OR REPLACE FUNCTION get_price_history(p_product_id uuid)
RETURNS TABLE (
  date timestamptz,
  price numeric,
  change_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH history AS (
    SELECT
      created_at,
      price,
      LAG(price) OVER (ORDER BY created_at) as prev_price
    FROM price_history
    WHERE product_id = p_product_id
    ORDER BY created_at DESC
    LIMIT 30
  )
  SELECT
    h.created_at,
    h.price,
    CASE
      WHEN h.prev_price IS NOT NULL AND h.prev_price > 0
      THEN round(((h.price - h.prev_price) / h.prev_price * 100)::numeric, 2)
      ELSE 0
    END as change_percentage
  FROM history h;
END;
$$ LANGUAGE plpgsql;