import { recordPerfMetrics } from "./perfMetricWrapper";
import AbstractRepo from "./AbstractRepo";
import Spotlights from "../collections/spotlights/collection";
import { FeedSpotlight } from "../../components/ultraFeed/ultraFeedTypes";

class SpotlightsRepo extends AbstractRepo<"Spotlights"> {
  constructor() {
    super(Spotlights);
  }

  /**
   * Gets spotlight items for the UltraFeed
   * Prioritizes spotlights with fewer views
   */
  public async getUltraFeedSpotlights(
    context: ResolverContext, 
    limit = 5
  ): Promise<FeedSpotlight[]> {
    const userIdOrClientId = context.userId ?? context.clientId;
    
    const spotlightRows = await this.getRawDb().manyOrNone(`
      -- SpotlightsRepo.getUltraFeedSpotlights - Prioritize by fewest views
      WITH "RecentViews" AS (
        SELECT
          "documentId",
          COUNT(*) AS "viewCount"
        FROM "UltraFeedEvents"
        WHERE "collectionName" = 'Spotlights'
          AND "eventType" = 'viewed'
          AND "createdAt" > NOW() - INTERVAL '90 days'
          AND "userId" = $(userIdOrClientId)
        GROUP BY "documentId"
        HAVING COUNT(*) <= 5
      )
      SELECT
        s._id,
        s."documentType",
        s."documentId"
      FROM "Spotlights" s
      LEFT JOIN "RecentViews" rv ON s._id = rv."documentId"
      WHERE s."draft" IS NOT TRUE
        AND s."deletedDraft" IS NOT TRUE
        AND "documentType" = 'Post'
      order by
        COALESCE(rv."viewCount", 0) ASC,
        RANDOM()
      LIMIT $(limit)
    `, { limit, userIdOrClientId });
    
    if (!spotlightRows || !spotlightRows.length) {
      return [];
    }
    
    const spotlightItems = spotlightRows.map(row => {
      return {
        spotlightId: row._id,
        documentType: row.documentType,
        documentId: row.documentId,
      };
    });
    
    return spotlightItems;
  }
}

recordPerfMetrics(SpotlightsRepo);

export default SpotlightsRepo; 
