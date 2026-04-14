-- Sample analytics queries for auth statistics (PostgreSQL)

-- 1) Daily unique login users (success only)
SELECT
  DATE_TRUNC('day', occurred_at) AS day,
  COUNT(DISTINCT user_id) AS unique_users
FROM auth_login_events
WHERE success = TRUE
  AND user_id IS NOT NULL
  AND occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1;

-- 2) Per-user success/fail counts
SELECT
  COALESCE(user_id, 'unknown') AS user_key,
  COUNT(*) FILTER (WHERE success = TRUE) AS success_count,
  COUNT(*) FILTER (WHERE success = FALSE) AS fail_count
FROM auth_login_events
WHERE occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY success_count DESC;

-- 3) Department-level active users
SELECT
  COALESCE(department_snapshot, 'unknown') AS department,
  COUNT(DISTINCT user_id) AS users
FROM auth_login_events
WHERE success = TRUE
  AND user_id IS NOT NULL
  AND occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY users DESC;

-- 4) Hourly login attempts (KST example)
SELECT
  EXTRACT(HOUR FROM occurred_at AT TIME ZONE 'Asia/Seoul') AS hour_kr,
  COUNT(*) AS login_attempts
FROM auth_login_events
WHERE occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1;

