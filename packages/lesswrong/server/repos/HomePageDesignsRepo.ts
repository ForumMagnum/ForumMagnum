import HomePageDesigns from "@/server/collections/homePageDesigns/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

interface HomePageDesignSummary {
  publicId: string;
  title: string;
  createdAt: Date;
}

class HomePageDesignsRepo extends AbstractRepo<"HomePageDesigns"> {
  constructor() {
    super(HomePageDesigns);
  }

  /**
   * Returns the latest revision of each design (grouped by publicId) for the
   * given owner IDs, ordered by most-recently-updated first.
   */
  async getLatestDesignsByOwner(ownerIds: string[], limit?: number): Promise<DbHomePageDesign[]> {
    return this.any(`
      -- HomePageDesignsRepo.getLatestDesignsByOwner
      SELECT * FROM (
        SELECT DISTINCT ON ("publicId") *
        FROM "HomePageDesigns"
        WHERE "ownerId" = ANY($(ownerIds))
        ORDER BY "publicId", "createdAt" DESC
      ) sub
      ORDER BY "createdAt" DESC
      ${limit ? `LIMIT $(limit)` : ""}
    `, { ownerIds, limit });
  }

  /**
   * Returns lightweight summaries (publicId, title, createdAt) for the latest
   * revision of each design owned by the given IDs.
   */
  async getDesignSummariesByOwner(ownerIds: string[]): Promise<HomePageDesignSummary[]> {
    return this.getRawDb().any(`
      -- HomePageDesignsRepo.getDesignSummariesByOwner
      SELECT "publicId", "title", "createdAt" FROM (
        SELECT DISTINCT ON ("publicId") "publicId", "title", "createdAt"
        FROM "HomePageDesigns"
        WHERE "ownerId" = ANY($(ownerIds))
        ORDER BY "publicId", "createdAt" DESC
      ) sub
      ORDER BY "createdAt" DESC
    `, { ownerIds });
  }
}

recordPerfMetrics(HomePageDesignsRepo);

export default HomePageDesignsRepo;
