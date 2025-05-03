-- Fonction pour obtenir les statistiques vendeur
CREATE OR REPLACE FUNCTION get_seller_stats(seller_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    WITH daily_views AS (
        SELECT
            date_trunc('day', created_at) as day,
            SUM(views) as views
        FROM products
        WHERE seller_id = $1
        AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day
        ORDER BY day DESC
    ),
    message_stats AS (
        SELECT
            COUNT(*) as total_messages,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_messages
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE c.seller_id = $1
    ),
    conversion_stats AS (
        SELECT
            COUNT(DISTINCT p.id) as total_listings,
            COUNT(DISTINCT CASE WHEN p.status = 'sold' THEN p.id END) as sold_listings
        FROM products p
        WHERE p.seller_id = $1
        AND p.created_at >= NOW() - INTERVAL '30 days'
    ),
    option_stats AS (
        SELECT
            COUNT(*) as total_options
        FROM products
        WHERE seller_id = $1
        AND (featured = true OR urgent = true)
        AND status = 'active'
    )
    SELECT json_build_object(
        'daily_views', ARRAY(
            SELECT views FROM daily_views
        ),
        'total_views', (
            SELECT SUM(views)
            FROM products
            WHERE seller_id = $1
        ),
        'views_growth', (
            SELECT round(
                ((SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN views ELSE 0 END) * 1.0 /
                NULLIF(SUM(CASE WHEN created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days' THEN views ELSE 0 END), 0)) - 1) * 100
            )
            FROM products
            WHERE seller_id = $1
        ),
        'total_messages', COALESCE((SELECT total_messages FROM message_stats), 0),
        'messages_growth', (
            SELECT round(
                ((COUNT(CASE WHEN m.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) * 1.0 /
                NULLIF(COUNT(CASE WHEN m.created_at >= NOW() - INTERVAL '14 days' AND m.created_at < NOW() - INTERVAL '7 days' THEN 1 END), 0)) - 1) * 100
            )
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE c.seller_id = $1
        ),
        'conversion_rate', (
            SELECT CASE
                WHEN total_listings > 0
                THEN round((sold_listings * 100.0 / total_listings)::numeric, 1)
                ELSE 0
            END
            FROM conversion_stats
        ),
        'conversion_growth', 0, -- À implémenter avec l'historique
        'active_options', COALESCE((SELECT total_options FROM option_stats), 0)
    ) INTO result;

    RETURN result;
END;
$$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_products_seller_views ON products(seller_id, views);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);