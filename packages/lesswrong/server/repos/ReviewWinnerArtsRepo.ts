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
      WITH "LatestSplashArtCoordinate" AS (
        SELECT
          sac."reviewWinnerArtId",
          MAX(sac."createdAt") AS "mostRecentlyCreatedAt"
        FROM "SplashArtCoordinates" sac
        GROUP BY sac."reviewWinnerArtId"
      ),
      "RankedReviewWinnerArts" AS (
        SELECT
          rwa._id,
          ROW_NUMBER() OVER (PARTITION BY rwa."postId" ORDER BY sac."createdAt" DESC) AS rn
        FROM "ReviewWinnerArts" rwa
        INNER JOIN "LatestSplashArtCoordinate" lsac ON rwa._id = lsac."reviewWinnerArtId"
        INNER JOIN "SplashArtCoordinates" sac ON rwa._id = sac."reviewWinnerArtId" AND sac."createdAt" = lsac."mostRecentlyCreatedAt"
        JOIN "Posts" p ON rwa."postId" = p._id
      )
      SELECT *
      FROM "RankedReviewWinnerArts"
      JOIN "ReviewWinnerArts" AS rwa
      ON "RankedReviewWinnerArts"._id = rwa._id
      WHERE rn = 1;
    `, []);

    const artByPostId = keyBy(reviewWinnerArts, rwa => rwa.postId);
    return postIds.map(postId => artByPostId[postId] ?? null);
  }
}

recordPerfMetrics(ReviewWinnerArtsRepo);

export default ReviewWinnerArtsRepo;
