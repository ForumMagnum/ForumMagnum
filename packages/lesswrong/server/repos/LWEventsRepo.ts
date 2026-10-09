import { LWEvents } from "@/server/collections/lwevents/collection";
import { MODERATION_TEMPLATE_USED_EVENT } from "@/lib/collections/moderationTemplates/constants";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class LWEventsRepo extends AbstractRepo<"LWEvents"> {
  constructor() {
    super(LWEvents);
  }

  async getModerationTemplateUsageCounts(since: Date): Promise<{ templateId: string, count: number }[]> {
    return await this.getRawDb().any<{ templateId: string, count: number }>(`
      -- LWEventsRepo.getModerationTemplateUsageCounts
      SELECT "documentId" AS "templateId", COUNT(*)::INTEGER AS "count"
      FROM "LWEvents"
      WHERE "name" = $(eventName)
        AND "createdAt" > $(since)
        AND "documentId" IS NOT NULL
      GROUP BY "documentId"
    `, { eventName: MODERATION_TEMPLATE_USED_EVENT, since });
  }
}

recordPerfMetrics(LWEventsRepo);

export default LWEventsRepo;
