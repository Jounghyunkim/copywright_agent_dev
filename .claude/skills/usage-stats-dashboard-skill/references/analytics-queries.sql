-- ============================================================
-- Usage Statistics Queries for PostgreSQL
-- 각 쿼리는 API 엔드포인트 또는 ad-hoc 분석에 사용 가능
-- ============================================================

-- ============================================================
-- A. Summary 엔드포인트용 쿼리
-- ============================================================

-- A-1. 오늘 DAU (today's daily active users)
SELECT COUNT(DISTINCT user_id) AS dau_today
FROM auth_session_events
WHERE event_type IN ('accessed', 'created')
  AND DATE(occurred_at) = CURRENT_DATE;

-- A-2. 이번 달 MAU (this month's monthly active users)
SELECT COUNT(DISTINCT user_id) AS mau_this_month
FROM auth_session_events
WHERE event_type IN ('accessed', 'created')
  AND occurred_at >= DATE_TRUNC('month', CURRENT_DATE);

-- A-3. 전체 고유 사용자 수 (all time)
SELECT COUNT(DISTINCT user_id) AS total_unique_users
FROM auth_login_events
WHERE success = TRUE;

-- A-4. 전체 로그인 횟수 + 성공률
SELECT
  COUNT(*) FILTER (WHERE success = TRUE) AS total_logins,
  COUNT(*) AS total_attempts,
  ROUND(
    COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC
    / NULLIF(COUNT(*), 0) * 100, 1
  ) AS success_rate
FROM auth_login_events;


-- ============================================================
-- B. DAU 트렌드 (일별 활성 사용자)
-- ============================================================

-- B-1. 최근 N일간 일별 DAU
-- 빈 날짜는 애플리케이션에서 0으로 채워야 함 (zero-fill)
SELECT
  DATE(occurred_at) AS day,
  COUNT(DISTINCT user_id) AS unique_users
FROM auth_session_events
WHERE event_type IN ('accessed', 'created')
  AND DATE(occurred_at) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(occurred_at)
ORDER BY day;


-- ============================================================
-- C. MAU 트렌드 (월별 활성 사용자)
-- ============================================================

-- C-1. 월별 MAU
-- 주의: GROUP BY에 TO_CHAR()를 쓰면 안 됨 → DATE_TRUNC() 사용
SELECT
  TO_CHAR(DATE_TRUNC('month', occurred_at), 'YYYY-MM') AS month,
  COUNT(DISTINCT user_id) AS unique_users
FROM auth_session_events
WHERE event_type IN ('accessed', 'created')
GROUP BY DATE_TRUNC('month', occurred_at)
ORDER BY DATE_TRUNC('month', occurred_at);


-- ============================================================
-- D. 개인별 활동 통계
-- ============================================================

-- D-1. 개인별 로그인 횟수 + 최근 로그인 + 조직 (from login_events)
SELECT
  user_id,
  MAX(department_snapshot) AS department,
  COUNT(*) AS login_count,
  MAX(occurred_at) AS last_login
FROM auth_login_events
WHERE success = TRUE
  AND user_id IS NOT NULL
  AND occurred_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;

-- D-2. 개인별 활동일 수 (from session_events)
SELECT
  user_id,
  COUNT(DISTINCT DATE(occurred_at)) AS active_days
FROM auth_session_events
WHERE event_type IN ('accessed', 'created')
  AND occurred_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id
ORDER BY active_days DESC;

-- D-3. 개인별 로그인 성공/실패 분리
SELECT
  COALESCE(user_id, 'unknown') AS user_key,
  COUNT(*) FILTER (WHERE success = TRUE) AS success_count,
  COUNT(*) FILTER (WHERE success = FALSE) AS fail_count
FROM auth_login_events
WHERE occurred_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1
ORDER BY success_count DESC;


-- ============================================================
-- E. 조직별 활동 통계
-- ============================================================

-- E-1. 조직별 고유 사용자 수 + 로그인 횟수 (from login_events)
SELECT
  COALESCE(department_snapshot, 'unknown') AS department,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) AS login_count
FROM auth_login_events
WHERE success = TRUE
  AND user_id IS NOT NULL
  AND occurred_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1
ORDER BY unique_users DESC;

-- E-2. 조직별 평균 활동일 (서브쿼리 조인)
-- step 1: 개인별 활동일
-- step 2: 개인 → 조직 매핑
-- step 3: 조직별 AVG(활동일)
SELECT
  dept.department,
  ROUND(AVG(days.active_days), 1) AS active_days_avg
FROM (
  SELECT user_id, COUNT(DISTINCT DATE(occurred_at)) AS active_days
  FROM auth_session_events
  WHERE event_type IN ('accessed', 'created')
    AND occurred_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id
) AS days
JOIN (
  SELECT user_id, MAX(department_snapshot) AS department
  FROM auth_login_events
  WHERE success = TRUE AND department_snapshot IS NOT NULL
  GROUP BY user_id
) AS dept ON days.user_id = dept.user_id
GROUP BY dept.department
ORDER BY active_days_avg DESC;


-- ============================================================
-- F. 부가 분석 쿼리
-- ============================================================

-- F-1. 시간대별 로그인 패턴 (KST 기준)
SELECT
  EXTRACT(HOUR FROM occurred_at AT TIME ZONE 'Asia/Seoul') AS hour_kst,
  COUNT(*) AS login_attempts,
  COUNT(*) FILTER (WHERE success = TRUE) AS successes
FROM auth_login_events
WHERE occurred_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1;

-- F-2. 일별 로그인 성공률 트렌드
SELECT
  DATE(occurred_at) AS day,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE success = TRUE) AS successes,
  ROUND(
    COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC
    / NULLIF(COUNT(*), 0) * 100, 1
  ) AS success_rate
FROM auth_login_events
WHERE occurred_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(occurred_at)
ORDER BY day;
