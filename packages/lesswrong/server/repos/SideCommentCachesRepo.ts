import AbstractRepo from "./AbstractRepo";
import SideCommentCaches from "../../lib/collections/sideCommentCaches/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { sideCommentCacheVersion } from "../../lib/collections/posts/schema";
import { randomId } from "../../lib/random";

class SideCommentCachesRepo extends AbstractRepo<"SideCommentCaches"> {
  constructor() {
    super(SideCommentCaches);
  }

  async saveSideCommentCache(
    postId: string,
    annotatedHtml: string,
    commentsByBlock: Record<string, string[]>,
    version = sideCommentCacheVersion,
  ): Promise<void> {
    await this.none(`
      -- SideCommentCachesRepo.saveSideCommentCache
      INSERT INTO "SideCommentCaches" (
        "_id",
        "postId",
        "annotatedHtml",
        "commentsByBlock",
        "version",
        "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, NOW()
      ) ON CONFLICT ("postId", "version") DO UPDATE SET
        "annotatedHtml" = $3,
        "commentsByBlock" = $4,
        "createdAt" = NOW()
    `, [randomId(), postId, annotatedHtml, commentsByBlock, version]);
  }
}

recordPerfMetrics(SideCommentCachesRepo);

export default SideCommentCachesRepo;
