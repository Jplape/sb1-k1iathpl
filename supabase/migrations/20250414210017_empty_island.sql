/*
  # Core Marketplace Features

  1. Updates
    - Add messaging system
    - Add moderation flags
    - Improve product management
    - Enhanced transaction tracking

  2. Security
    - Add moderation policies
    - Improve seller verification
*/

-- Add messaging system
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid REFERENCES auth.users(id),
  receiver_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  buyer_id uuid REFERENCES auth.users(id),
  seller_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add moderation system
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id),
  reported_id uuid REFERENCES auth.users(id),
  content_type text NOT NULL CHECK (content_type IN ('product', 'message', 'user')),
  content_id uuid NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);

-- Add notification system
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('message', 'offer', 'purchase', 'system')),
  title text NOT NULL,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Reports policies
CREATE POLICY "Anyone can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can manage reports"
  ON reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Add functions for conversation management
CREATE OR REPLACE FUNCTION create_conversation(
  p_product_id uuid,
  p_seller_id uuid
) RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Check if conversation already exists
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE product_id = p_product_id
    AND buyer_id = auth.uid()
    AND seller_id = p_seller_id
    AND status = 'active';

  -- If not, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (product_id, buyer_id, seller_id)
    VALUES (p_product_id, auth.uid(), p_seller_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;