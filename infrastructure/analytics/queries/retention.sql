-- Cohort is FIRST OBSERVED in the selected window, not lifetime acquisition.
WITH active_days AS (
  SELECT user_id, toDate(event_time) AS day FROM analytics.events
  WHERE environment = {environment:String} AND user_id IS NOT NULL
    AND event_time >= {start:DateTime64(6)} AND event_time < {end:DateTime64(6)}
  GROUP BY user_id, day
), cohorts AS (
  SELECT user_id, min(day) AS cohort FROM active_days GROUP BY user_id
)
SELECT cohort, dateDiff('day', cohort, day) AS days_since_first_observed,
       uniqExact(a.user_id) AS users
FROM active_days a JOIN cohorts c ON a.user_id = c.user_id
GROUP BY cohort, days_since_first_observed ORDER BY cohort, days_since_first_observed;
