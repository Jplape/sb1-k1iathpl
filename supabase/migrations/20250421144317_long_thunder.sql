-- Fonction pour obtenir les statistiques administrateur
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    WITH daily_stats AS (
        SELECT
            date_trunc('day', created_at) as day,
            COUNT(*) as sales_count,
            SUM(price) as revenue
        FROM products
        WHERE status = 'sold'
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day DESC
    ),
    user_stats AS (
        SELECT
            COUNT(*) as total_users,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users,
            COUNT(CASE WHEN last_sign_in_at >= NOW() - INTERVAL '30 days' THEN 1 END) as active_users
        FROM auth.users
    ),
    report_stats AS (
        SELECT COUNT(*) as pending_count
        FROM reports
        WHERE status = 'pending'
    ),
    monthly_stats AS (
        SELECT
            SUM(price) as current_month_revenue,
            COUNT(*) as current_month_sales
        FROM products
        WHERE status = 'sold'
        AND created_at >= date_trunc('month', NOW())
    ),
    prev_month_stats AS (
        SELECT
            SUM(price) as prev_month_revenue,
            COUNT(*) as prev_month_sales
        FROM products
        WHERE status = 'sold'
        AND created_at >= date_trunc('month', NOW() - INTERVAL '1 month')
        AND created_at < date_trunc('month', NOW())
    )
    SELECT json_build_object(
        'daily_revenue', ARRAY(
            SELECT revenue FROM daily_stats
        ),
        'active_users', (SELECT active_users FROM user_stats),
        'new_users', (SELECT new_users FROM user_stats),
        'pending_reports', (SELECT pending_count FROM report_stats),
        'total_sales', (SELECT current_month_sales FROM monthly_stats),
        'monthly_revenue', (SELECT current_month_revenue FROM monthly_stats),
        'sales_growth', CASE
            WHEN (SELECT prev_month_sales FROM prev_month_stats) > 0
            THEN round(((SELECT current_month_sales FROM monthly_stats) - (SELECT prev_month_sales FROM prev_month_stats))::numeric / (SELECT prev_month_sales FROM prev_month_stats) * 100)
            ELSE 0
        END,
        'revenue_growth', CASE
            WHEN (SELECT prev_month_revenue FROM prev_month_stats) > 0
            THEN round(((SELECT current_month_revenue FROM monthly_stats) - (SELECT prev_month_revenue FROM prev_month_stats))::numeric / (SELECT prev_month_revenue FROM prev_month_stats) * 100)
            ELSE 0
        END
    ) INTO result;

    RETURN result;
END;
$$;

-- Fonction pour obtenir les statistiques de modération
CREATE OR REPLACE FUNCTION get_moderation_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    WITH report_stats AS (
        SELECT
            content_type,
            status,
            COUNT(*) as count,
            AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric(10,2) as avg_resolution_time
        FROM reports
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY content_type, status
    ),
    daily_reports AS (
        SELECT
            date_trunc('day', created_at) as day,
            COUNT(*) as count
        FROM reports
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day DESC
    )
    SELECT json_build_object(
        'report_stats', (
            SELECT json_agg(row_to_json(report_stats))
            FROM report_stats
        ),
        'daily_reports', ARRAY(
            SELECT count FROM daily_reports
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_products_status_created_at ON products(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_status_created_at ON reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_content_type ON reports(content_type);