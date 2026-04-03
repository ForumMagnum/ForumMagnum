import HomePageDesigns from "@/server/collections/homePageDesigns/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

interface HomePageDesignSummary {
  publicId: string;
  title: string;
  createdAt: Date;
}

interface MarketplaceDesign {
  publicId: string;
  title: string;
  html: string;
  verified: boolean;
  commentId: string | null;
  commentBaseScore: number;
}

interface AdminDesignReview {
  _id: string;
  publicId: string;
  title: string;
  html: string;
  verified: boolean;
  autoReviewPassed: boolean | null;
  autoReviewMessage: string | null;
  createdAt: Date;
  source: string;
  modelName: string | null;
  commentId: string | null;
  ownerDisplayName: string;
  ownerSlug: string;
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
   * Returns the latest revision of each published design, joined with the
   * comment's baseScore, ordered by karma descending.
   */
  async getPublishedDesigns(): Promise<MarketplaceDesign[]> {
    return this.getRawDb().any(`
      -- HomePageDesignsRepo.getPublishedDesigns
      SELECT * FROM (
        SELECT DISTINCT ON (d."publicId")
          d."publicId",
          d."title",
          d."html",
          d."verified",
          d."commentId",
          c."baseScore" AS "commentBaseScore"
        FROM "HomePageDesigns" d
        JOIN "Comments" c ON c._id = d."commentId"
        WHERE d."commentId" IS NOT NULL
          AND d."autoReviewPassed" = TRUE
        ORDER BY d."publicId", d."createdAt" DESC
      ) sub
      ORDER BY sub."commentBaseScore" DESC
    `);
  }

  /**
   * Returns published designs for admin review, with owner user info.
   * Includes all review statuses (pending, passed, failed) and both
   * verified and unverified designs.
   */
  async getDesignsForAdminReview(): Promise<AdminDesignReview[]> {
    return this.getRawDb().any(`
      -- HomePageDesignsRepo.getDesignsForAdminReview
      SELECT * FROM (
        SELECT DISTINCT ON (d."publicId")
          d._id,
          d."publicId",
          d."title",
          d."html",
          d."verified",
          d."autoReviewPassed",
          d."autoReviewMessage",
          d."createdAt",
          d."source",
          d."modelName",
          d."commentId",
          COALESCE(u."displayName", '(unknown)') AS "ownerDisplayName",
          COALESCE(u."slug", '') AS "ownerSlug"
        FROM "HomePageDesigns" d
        LEFT JOIN "Users" u ON u._id = d."ownerId"
        WHERE d."commentId" IS NOT NULL
        ORDER BY d."publicId", d."createdAt" DESC
      ) sub
      ORDER BY sub."createdAt" DESC
    `);
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
