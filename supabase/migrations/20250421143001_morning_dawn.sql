/*
  # Ajout des fonctionnalités Pro

  1. Nouvelles Tables
    - `kyc_requests` : Demandes de vérification d'identité
    - `subscriptions` : Abonnements Pro
    - `subscription_features` : Fonctionnalités incluses dans les abonnements

  2. Modifications
    - Ajout de colonnes KYC et Pro dans la table `profiles`
    - Ajout de contraintes et politiques de sécurité

  3. Sécurité
    - Politiques RLS pour les nouvelles tables
    - Restrictions d'accès basées sur le statut de vérification
*/

-- Ajout des colonnes KYC dans profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'unverified'
CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;

-- Table des demandes KYC
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

-- Table des abonnements
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

-- Table des fonctionnalités d'abonnement
CREATE TABLE IF NOT EXISTS subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour kyc_requests
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

-- Politiques RLS pour subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Politiques RLS pour subscription_features
CREATE POLICY "Anyone can view subscription features"
  ON subscription_features
  FOR SELECT
  TO authenticated
  USING (true);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_kyc_requests_user_id ON kyc_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON kyc_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Trigger pour mettre à jour le statut KYC
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

-- Trigger pour mettre à jour le statut Pro
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