import { LWEvents } from "@/server/collections/lwevents/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class LWEventsRepo extends AbstractRepo<"LWEvents"> {
  constructor() {
    super(LWEvents);
  }

  /** The user's post views since `since` that arrived from a link tagged with the given `utm_campaign`. */
  getPostViewsFromUtmCampaign(userId: string, utmCampaign: string, since: Date): Promise<{ utmContent: string; createdAt: Date }[]> {
    return this.getRawDb().any(`
      -- LWEventsRepo.getPostViewsFromUtmCampaign
      SELECT properties->>'utmContent' AS "utmContent", "createdAt"
      FROM "LWEvents"
      WHERE name = 'post-view'
        AND "userId" = $(userId)
        AND "createdAt" >= $(since)
        AND properties->>'utmCampaign' = $(utmCampaign)
        AND properties->>'utmContent' IS NOT NULL
    `, { userId, utmCampaign, since });
  }
}

recordPerfMetrics(LWEventsRepo);

export default LWEventsRepo;
