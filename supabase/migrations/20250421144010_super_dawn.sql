-- Fonction pour obtenir les statistiques du vendeur
CREATE OR REPLACE FUNCTION get_seller_stats(seller_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    WITH monthly_stats AS (
        SELECT
            date_trunc('month', created_at) as month,
            COUNT(*) as sales_count,
            SUM(price) as revenue
        FROM products
        WHERE seller_id = $1
        AND status = 'sold'
        AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month
        ORDER BY month DESC
    ),
    current_month AS (
        SELECT
            COUNT(*) as sales_count,
            SUM(price) as revenue
        FROM products
        WHERE seller_id = $1
        AND status = 'sold'
        AND created_at >= date_trunc('month', NOW())
    ),
    prev_month AS (
        SELECT
            COUNT(*) as sales_count,
            SUM(price) as revenue
        FROM products
        WHERE seller_id = $1
        AND status = 'sold'
        AND created_at >= date_trunc('month', NOW() - INTERVAL '1 month')
        AND created_at < date_trunc('month', NOW())
    ),
    ratings AS (
        SELECT
            AVG(rating) as avg_rating,
            COUNT(*) as review_count
        FROM reviews r
        JOIN products p ON p.id = r.product_id
        WHERE p.seller_id = $1
    )
    SELECT json_build_object(
        'monthly_revenue', ARRAY(
            SELECT revenue FROM monthly_stats
        ),
        'monthly_sales', ARRAY(
            SELECT sales_count FROM monthly_stats
        ),
        'current_month_revenue', COALESCE((SELECT revenue FROM current_month), 0),
        'revenue_trend', CASE
            WHEN (SELECT revenue FROM prev_month) > 0
            THEN round(((SELECT revenue FROM current_month) - (SELECT revenue FROM prev_month)) / (SELECT revenue FROM prev_month) * 100)
            ELSE 0
        END,
        'total_sales', (SELECT SUM(sales_count) FROM monthly_stats),
        'sales_trend', CASE
            WHEN (SELECT sales_count FROM prev_month) > 0
            THEN round(((SELECT sales_count FROM current_month) - (SELECT sales_count FROM prev_month)) / (SELECT sales_count FROM prev_month) * 100)
            ELSE 0
        END,
        'conversion_rate', 3.2, -- À implémenter avec les vraies données de visite
        'conversion_trend', 0.5, -- À implémenter
        'average_rating', COALESCE((SELECT avg_rating FROM ratings), 0),
        'rating_trend', 0.2 -- À implémenter
    ) INTO result;

    RETURN result;
END;
$$;

-- Fonction pour obtenir les ventes par catégorie
CREATE OR REPLACE FUNCTION get_sales_by_category(seller_id uuid)
RETURNS TABLE (
    category_name text,
    total_sales bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.name as category_name,
        COUNT(p.*) as total_sales
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    WHERE p.seller_id = seller_id
    AND p.status = 'sold'
    GROUP BY c.name
    ORDER BY total_sales DESC;
END;
$$;