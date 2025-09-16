import { UltraFeedEvents } from '../collections/ultraFeedEvents/collection';
import { getSqlClientOrThrow } from '../sql/sqlClient';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export async function clearOldUltraFeedServedEvents() {
  const cutoffDate = new Date(Date.now() - FORTY_EIGHT_HOURS_MS);

  const selector = {
    eventType: 'served' as const,
    createdAt: { $lt: cutoffDate },
  };

    await UltraFeedEvents.rawRemove(selector);
  }

export async function clearLoggedOutServedSessionsWithNoViews() {
    const db = getSqlClientOrThrow('write');
    // Delete all logged-out served sessions that have zero corresponding viewed events
    await db.none(`
      WITH logged_out_served AS (
        SELECT 
          ufe_served._id,
          ufe_served."userId",
          (ufe_served.event->>'sessionId') AS session_id
        FROM "UltraFeedEvents" ufe_served
        WHERE ufe_served."eventType" = 'served'
          AND (ufe_served.event->>'loggedOut')::boolean IS TRUE
      ),
      sessions_with_views AS (
        SELECT DISTINCT los."userId", los.session_id
        FROM logged_out_served los
        JOIN "UltraFeedEvents" ufe_viewed
          ON ufe_viewed."userId" = los."userId"
            AND ufe_viewed."eventType" = 'viewed'
            AND ufe_viewed."feedItemId" = los._id
      ),
      sessions_to_delete AS (
        SELECT DISTINCT los."userId", los.session_id
        FROM logged_out_served los
        LEFT JOIN sessions_with_views swv
          ON swv."userId" = los."userId" AND swv.session_id = los.session_id
        WHERE swv."userId" IS NULL
      )
      DELETE FROM "UltraFeedEvents" ufe
      USING sessions_to_delete sd
      WHERE ufe."eventType" = 'served'
        AND (ufe.event->>'loggedOut')::boolean IS TRUE
        AND ufe."userId" = sd."userId"
        AND ufe.event->>'sessionId' = sd.session_id;
    `, [] , 'clearLoggedOutServedSessionsWithNoViews');
  }
