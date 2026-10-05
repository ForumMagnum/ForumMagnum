-- Preserve queue/archive data. Record the capture gap before resuming imports.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';
DROP TRIGGER IF EXISTS analytics_archive_capture ON public.raw;
COMMIT;
