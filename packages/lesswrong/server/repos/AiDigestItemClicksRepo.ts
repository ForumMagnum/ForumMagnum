import AiDigestItemClicks from "@/server/collections/aiDigestItemClicks/collection";
import { randomId } from "@/lib/random";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class AiDigestItemClicksRepo extends AbstractRepo<"AiDigestItemClicks"> {
  constructor() {
    super(AiDigestItemClicks);
  }

  recordClick({ issueId, sectionKind, itemIndex }: {
    issueId: string;
    sectionKind: AiDigestSectionKind;
    itemIndex: number;
  }): Promise<null> {
    return this.none(`
      -- AiDigestItemClicksRepo.recordClick
      INSERT INTO "AiDigestItemClicks" ("_id", "issueId", "sectionKind", "itemIndex")
      VALUES ($(clickId), $(issueId), $(sectionKind), $(itemIndex))
      ON CONFLICT ("issueId", "sectionKind", "itemIndex") DO NOTHING
    `, { clickId: randomId(), issueId, sectionKind, itemIndex });
  }
}

recordPerfMetrics(AiDigestItemClicksRepo);

export default AiDigestItemClicksRepo;
