import keyBy from "lodash/keyBy";
import ReviewWinnerArts from "../../lib/collections/reviewWinnerArts/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

export interface ReviewWinnerArtWithPost {
  reviewWinnerImages: DbReviewWinnerArt[];
  post: DbPost;
}

class ReviewWinnerArtsRepo extends AbstractRepo<"ReviewWinnerArts"> {
  constructor() {
    super(ReviewWinnerArts);
  }

  async getAllActiveReviewWinnerArt(postIds: string[]) {
    const reviewWinnerArts = await this.any(`
      WITH cte AS (
        SELECT
          rwa._id,
          ROW_NUMBER() OVER (PARTITION BY sac_with_rownumber."reviewWinnerArtId" ORDER BY sac_with_rownumber."createdAt" DESC) as rn
        FROM "SplashArtCoordinates" AS sac_with_rownumber
        JOIN "ReviewWinnerArts" AS rwa
        ON sac_with_rownumber."reviewWinnerArtId" = rwa._id
      )
      SELECT rwa.*
      FROM cte
      JOIN "ReviewWinnerArts" AS rwa
      ON cte._id = rwa._id
      WHERE cte.rn = 1
    `, []);

    const artByPostId = keyBy(reviewWinnerArts, rwa => rwa.postId);
    return postIds.map(postId => artByPostId[postId] ?? null);
  }
}

recordPerfMetrics(ReviewWinnerArtsRepo);

export default ReviewWinnerArtsRepo;
