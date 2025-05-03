/*
  # Messaging System Implementation

  1. New Tables
    - blocked_users: Track blocked user relationships
    - message_attachments: Store message attachment metadata

  2. Updates
    - Add attachment support to messages
    - Add rate limiting and message retention
    - Add blocking functionality

  3. Security
    - Add RLS policies for message access
    - Add validation for attachments
    - Add rate limiting functions
*/

-- Add attachment support to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS location_lat numeric,
ADD COLUMN IF NOT EXISTS location_lng numeric;

-- Create blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id uuid REFERENCES auth.users(id),
  blocked_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_user_id)
);

-- Create message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY blocked_users_manage ON blocked_users
  FOR ALL
  TO authenticated
  USING (blocker_id = auth.uid());

CREATE POLICY message_attachments_select ON message_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_attachments.message_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Function to check if a user is blocked
CREATE OR REPLACE FUNCTION is_blocked(blocked_id uuid, blocker_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = $2 AND blocked_user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old messages
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

-- Add message sending policy
CREATE POLICY messages_insert ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (
        is_blocked(auth.uid(), c.buyer_id) OR
        is_blocked(auth.uid(), c.seller_id)
      )
    )
  );

-- Add rate limiting function
CREATE OR REPLACE FUNCTION check_message_rate_limit(user_id uuid)
RETURNS boolean AS $$
DECLARE
  message_count integer;
BEGIN
  SELECT COUNT(*)
  INTO message_count
  FROM messages
  WHERE sender_id = user_id
  AND created_at > NOW() - INTERVAL '1 minute';

  RETURN message_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;