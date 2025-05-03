/*
  # AI Integration Schema

  1. New Tables
    - embeddings
      - Stores vector embeddings for products and content
      - Used for semantic search and recommendations
    - recommendations
      - Stores AI-generated product recommendations
      - Links products based on similarity
    - search_history
      - Tracks user search patterns
      - Used for personalized recommendations
    - content_analysis
      - Stores AI analysis of product descriptions
      - Used for content moderation and categorization

  2. Security
    - Enable RLS on all tables
    - Add policies for data access
    - Protect sensitive AI operations
*/

-- Create embeddings table for semantic search
CREATE TABLE IF NOT EXISTS embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('product', 'description', 'review')),
  embedding vector(384),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  similarity_score float NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('similar', 'complementary', 'alternative')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(source_product_id, recommended_product_id)
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create content analysis table
CREATE TABLE IF NOT EXISTS content_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('product', 'review', 'message')),
  analysis_type text NOT NULL CHECK (analysis_type IN ('moderation', 'categorization', 'sentiment')),
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_embeddings_content ON embeddings(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_source ON recommendations(source_product_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_recommended ON recommendations(recommended_product_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_content ON content_analysis(content_id, content_type);

-- Add RLS policies

-- Embeddings policies
CREATE POLICY "Embeddings are viewable by everyone"
  ON embeddings FOR SELECT
  USING (true);

-- Recommendations policies
CREATE POLICY "Recommendations are viewable by everyone"
  ON recommendations FOR SELECT
  USING (true);

-- Search history policies
CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Content analysis policies
CREATE POLICY "Content analysis is viewable by content owners and admins"
  ON content_analysis FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = content_id
      AND products.seller_id = auth.uid()
    )
  );

-- Create functions for AI operations

-- Function to update embeddings
CREATE OR REPLACE FUNCTION update_product_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for the actual embedding generation
  -- The real implementation will call an Edge Function to generate embeddings
  INSERT INTO embeddings (content_id, content_type, embedding, metadata)
  VALUES (
    NEW.id,
    'product',
    NULL,  -- Will be updated by Edge Function
    jsonb_build_object(
      'title', NEW.title,
      'description', NEW.description,
      'category_id', NEW.category_id
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET metadata = EXCLUDED.metadata,
      updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update embeddings when product is created/updated
CREATE TRIGGER product_embedding_update
  AFTER INSERT OR UPDATE OF title, description, category_id
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_embedding();

-- Function to generate recommendations
CREATE OR REPLACE FUNCTION generate_product_recommendations(product_id uuid)
RETURNS TABLE (recommended_id uuid, score float) AS $$
BEGIN
  -- This is a placeholder for the actual recommendation logic
  -- The real implementation will use embeddings and similarity search
  RETURN QUERY
  SELECT 
    p.id as recommended_id,
    random() as score
  FROM products p
  WHERE p.id != product_id
  AND p.status = 'active'
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;