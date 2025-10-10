import AbstractRepo from "./AbstractRepo";
import Posts from "@/server/collections/posts/collection";

class ReviewPredictionsRepo extends AbstractRepo<"Posts"> {
  constructor() {
    super(Posts);
  }

  async getTopPredictedPostsByYear(year: number, limit: number): Promise<DbPost[]> {
    return this.any(
      `
      -- ReviewPredictionsRepo.getTopPredictedPostsByYear
      SELECT p.*
      FROM "Posts" p
      JOIN "ManifoldProbabilitiesCaches" m
        ON m."marketId" = p."manifoldReviewMarketId"
      WHERE p."postedAt" >= $(start)
        AND p."postedAt" < $(end)
        AND p."status" = 2 -- STATUS_APPROVED
        AND COALESCE(p."draft", false) = false
        AND COALESCE(p."shortform", false) = false
        AND COALESCE(p."unlisted", false) = false
        AND COALESCE(p."isEvent", false) = false
        AND m.year = $(year)
        AND COALESCE(m."isResolved", false) = false
      ORDER BY m.probability DESC, p."_id" ASC
      LIMIT $(limit)
      `,
      {
        year,
        start: new Date(`${year}-01-01T00:00:00.000Z`),
        end: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        limit,
      }
    );
  }
}

export default ReviewPredictionsRepo;


