-- Add moderation system tables
CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('approval', 'rejection', 'ban')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  admin_id uuid REFERENCES auth.users(id),
  risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at timestamptz DEFAULT now()
);

-- Add admin stats function
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  WITH revenue_stats AS (
    SELECT
      SUM(amount) as total_revenue,
      SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as current_revenue,
      SUM(CASE WHEN created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as prev_revenue
    FROM payments
    WHERE created_at >= NOW() - INTERVAL '60 days'
  ),
  user_stats AS (
    SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN last_sign_in_at >= NOW() - INTERVAL '30 days' THEN 1 END) as active_users,
      COUNT(CASE WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN 1 END) as suspended_users
    FROM auth.users
  ),
  content_stats AS (
    SELECT
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_content,
      COUNT(CASE WHEN risk_score >= 75 THEN 1 END) as flagged_content,
      COUNT(CASE WHEN status = 'removed' THEN 1 END) as removed_content
    FROM products
  ),
  fraud_stats AS (
    SELECT
      AVG(risk_score) as avg_risk_score,
      COUNT(CASE WHEN risk_score >= 75 THEN 1 END) as high_risk_users
    FROM user_risk_scores
  )
  SELECT json_build_object(
    'revenue', json_build_object(
      'total', COALESCE((SELECT total_revenue FROM revenue_stats), 0),
      'growth', CASE
        WHEN (SELECT prev_revenue FROM revenue_stats) > 0
        THEN round(((SELECT current_revenue FROM revenue_stats) - (SELECT prev_revenue FROM revenue_stats)) / (SELECT prev_revenue FROM revenue_stats) * 100)
        ELSE 0
      END
    ),
    'users', json_build_object(
      'total', (SELECT total_users FROM user_stats),
      'active', (SELECT active_users FROM user_stats),
      'suspended', (SELECT suspended_users FROM user_stats)
    ),
    'content', json_build_object(
      'pending', (SELECT pending_content FROM content_stats),
      'flagged', (SELECT flagged_content FROM content_stats),
      'removed', (SELECT removed_content FROM content_stats)
    ),
    'fraud', json_build_object(
      'riskScore', round((SELECT avg_risk_score FROM fraud_stats)),
      'flaggedUsers', (SELECT high_risk_users FROM fraud_stats)
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Add bulk moderation function
CREATE OR REPLACE FUNCTION bulk_moderation_action(action_type text, content_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Perform bulk action
  CASE action_type
    WHEN 'approve' THEN
      UPDATE products
      SET status = 'active',
          moderated_at = now(),
          moderated_by = auth.uid()
      WHERE id = ANY(content_ids);
      
    WHEN 'reject' THEN
      UPDATE products
      SET status = 'rejected',
          moderated_at = now(),
          moderated_by = auth.uid()
      WHERE id = ANY(content_ids);
      
    ELSE
      RAISE EXCEPTION 'Invalid action type';
  END CASE;

  -- Log actions
  INSERT INTO moderation_actions (type, target_id, reason, admin_id)
  SELECT
    action_type,
    id,
    'Bulk action',
    auth.uid()
  FROM unnest(content_ids) id;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON moderation_actions(type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin ON moderation_actions(admin_id);

-- Enable RLS
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Only admins can manage moderation actions"
  ON moderation_actions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );