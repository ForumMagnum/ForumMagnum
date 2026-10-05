CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.raw_events (
  schema_version UInt16,
  event_id String,
  source_id Nullable(Int64),
  event_time DateTime64(6, 'UTC'),
  received_at Nullable(DateTime64(6, 'UTC')),
  environment LowCardinality(String),
  event_type LowCardinality(String),
  event_json String CODEC(ZSTD(3)),
  content_hash FixedString(64),
  user_id Nullable(String) MATERIALIZED JSONExtract(event_json, 'userId', 'Nullable(String)'),
  client_id Nullable(String) MATERIALIZED JSONExtract(event_json, 'clientId', 'Nullable(String)'),
  tab_id Nullable(String) MATERIALIZED JSONExtract(event_json, 'tabId', 'Nullable(String)'),
  session_id Nullable(String) MATERIALIZED JSONExtract(event_json, 'sessionId', 'Nullable(String)')
)
ENGINE = ReplacingMergeTree
PARTITION BY cityHash64(event_id) % 16
ORDER BY event_id
SETTINGS fsync_after_insert = 1, fsync_part_directory = 1;

-- Query users receive SELECT on this view only. Same ID must always have the
-- same environment/type/time/payload; the loader checks conflicting deliveries.
-- Identity-derived partitions prevent two producer paths from putting one event
-- into different partitions. Benchmark time-sorted projections before adding one.
CREATE VIEW IF NOT EXISTS analytics.events SQL SECURITY DEFINER AS
SELECT schema_version, event_id, source_id, event_time, received_at,
       environment, event_type, event_json, content_hash,
       user_id, client_id, tab_id, session_id
FROM analytics.raw_events FINAL;

-- Backed up with raw_events while the worker lock excludes all writes.
CREATE TABLE IF NOT EXISTS analytics.applied_batches (
  object_key String, checksum FixedString(64), row_count UInt64,
  applied_at DateTime64(6, 'UTC') DEFAULT now64(6)
) ENGINE = ReplacingMergeTree(applied_at) ORDER BY object_key
SETTINGS fsync_after_insert = 1, fsync_part_directory = 1;
