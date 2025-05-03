/*
  # Add Pro Features Schema

  1. Updates
    - Add KYC and Pro columns to profiles
    - Create tables for KYC requests and subscriptions
    - Add security policies and triggers
*/

-- Add KYC and Pro columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'unverified'
CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;

-- Create KYC requests table
CREATE TABLE IF NOT EXISTS kyc_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  document_url text NOT NULL,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('incomplete', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription features table
CREATE TABLE IF NOT EXISTS subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own KYC requests" ON kyc_requests;
  DROP POLICY IF EXISTS "Users can create KYC requests" ON kyc_requests;
  DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Anyone can view subscription features" ON subscription_features;
END $$;

-- Add RLS policies
CREATE POLICY "Users can view their own KYC requests"
  ON kyc_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create KYC requests"
  ON kyc_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view subscription features"
  ON subscription_features
  FOR SELECT
  TO authenticated
  USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_kyc_requests_user_id ON kyc_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON kyc_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS on_kyc_request_status_change ON kyc_requests;
DROP FUNCTION IF EXISTS update_kyc_status();
DROP TRIGGER IF EXISTS on_subscription_status_change ON subscriptions;
DROP FUNCTION IF EXISTS update_pro_status();

-- Add trigger to update KYC status
CREATE OR REPLACE FUNCTION update_kyc_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE profiles
    SET kyc_status = 'verified',
        kyc_verified_at = now()
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE profiles
    SET kyc_status = 'rejected'
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_kyc_request_status_change
  AFTER UPDATE OF status ON kyc_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_kyc_status();

-- Add trigger to update Pro status
CREATE OR REPLACE FUNCTION update_pro_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE profiles
    SET is_pro = true
    WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('canceled', 'unpaid') THEN
    UPDATE profiles
    SET is_pro = false
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_status_change
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_pro_status();