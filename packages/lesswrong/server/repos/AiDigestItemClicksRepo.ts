import AiDigestItemClicks from "@/server/collections/aiDigestItemClicks/collection";
import { randomId } from "@/lib/random";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class AiDigestItemClicksRepo extends AbstractRepo<"AiDigestItemClicks"> {
  constructor() {
    super(AiDigestItemClicks);
  }

  recordClick({ issueId, sectionKind, itemIndex, clickedAt }: {
    issueId: string;
    sectionKind: AiDigestSectionKind;
    itemIndex: number;
    clickedAt: Date;
  }): Promise<null> {
    return this.none(`
      -- AiDigestItemClicksRepo.recordClick
      INSERT INTO "AiDigestItemClicks" ("_id", "issueId", "sectionKind", "itemIndex", "firstClickedAt")
      VALUES ($(clickId), $(issueId), $(sectionKind), $(itemIndex), $(clickedAt))
      ON CONFLICT ("issueId", "sectionKind", "itemIndex") DO UPDATE
      SET "firstClickedAt" = LEAST("AiDigestItemClicks"."firstClickedAt", EXCLUDED."firstClickedAt")
    `, { clickId: randomId(), issueId, sectionKind, itemIndex, clickedAt });
  }
}

recordPerfMetrics(AiDigestItemClicksRepo);

export default AiDigestItemClicksRepo;
