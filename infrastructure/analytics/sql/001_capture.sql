-- Manual analytics-RDS migration. Never run in the application migration runner.
-- See RUNBOOK.md for source-loss, writer, lock, and cost rollout gates.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';
CREATE SCHEMA analytics_export;
REVOKE ALL ON SCHEMA analytics_export FROM PUBLIC;

CREATE TABLE analytics_export.pending (
  raw_id bigint PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT clock_timestamp()
) WITH (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.02);
CREATE INDEX pending_received_at ON analytics_export.pending (received_at);

CREATE FUNCTION analytics_export.capture_raw() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  -- Do not swallow errors: doing so would create an undetectable capture gap.
  -- A NULL id fails this insert and rolls back the source insert too.
  INSERT INTO analytics_export.pending (raw_id) SELECT id FROM inserted_raw;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION analytics_export.capture_raw() FROM PUBLIC;
CREATE TRIGGER analytics_archive_capture AFTER INSERT ON public.raw
REFERENCING NEW TABLE AS inserted_raw FOR EACH STATEMENT
EXECUTE FUNCTION analytics_export.capture_raw();
COMMIT;

-- Separately grant USAGE on analytics_export, SELECT/DELETE on pending, SELECT
-- on public.raw to the dedicated exporter role. It needs no INSERT on raw.
-- The trigger owner must retain INSERT on pending; callers need no queue rights.
