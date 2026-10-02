SELECT toDate(event_time) AS day, count() AS events,
       uniqExactIf(user_id, user_id IS NOT NULL) AS users,
       uniqExactIf(client_id, client_id IS NOT NULL) AS clients
FROM analytics.events
WHERE environment = {environment:String}
  AND event_time >= {start:DateTime64(6)} AND event_time < {end:DateTime64(6)}
GROUP BY day ORDER BY day;
