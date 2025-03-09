import { LWEvents } from "@/server/collections/lwevents/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class LWEventsRepo extends AbstractRepo<"LWEvents"> {
  constructor() {
    super(LWEvents);
  }

  async countDisplayNameChanges({
    userId,
    sinceDaysAgo,
  }: {
    userId: string;
    sinceDaysAgo: number;
  }): Promise<number> {
    const res = await this.getRawDb().one<{nameChanges: string}>(
      `
      -- LWEventsRepo.countDisplayNameChanges30Days
      SELECT
        count(*) AS "nameChanges"
      FROM
        "LWEvents"
      WHERE
        "name" = 'fieldChanges'
        AND "userId" = $1
        AND "documentId" = $1
        AND "createdAt" > now() - interval '$2 days'
        AND properties -> 'before' ->> 'displayName' <> properties -> 'after' ->> 'displayName'
        -- Don't count the case when they are first setting their username
        AND coalesce(properties -> 'before' ->> 'usernameUnset', '') = coalesce(properties->'after'->>'usernameUnset', '');
    `,
      [userId, sinceDaysAgo]
    );

    return parseInt(res.nameChanges);
  }
}

recordPerfMetrics(LWEventsRepo);

export default LWEventsRepo;
