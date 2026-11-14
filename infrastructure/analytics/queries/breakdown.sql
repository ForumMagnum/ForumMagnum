SELECT event_type, JSONExtract(event_json, 'deviceType', 'Nullable(String)') AS device_type,
       count() AS events, uniqExactIf(user_id, user_id IS NOT NULL) AS users
FROM analytics.events
WHERE environment = {environment:String}
  AND event_time >= {start:DateTime64(6)} AND event_time < {end:DateTime64(6)}
GROUP BY event_type, device_type ORDER BY events DESC;
