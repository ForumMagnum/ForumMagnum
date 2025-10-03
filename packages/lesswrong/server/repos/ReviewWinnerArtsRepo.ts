import keyBy from "lodash/keyBy";
import ReviewWinnerArts from "../../server/collections/reviewWinnerArts/collection";
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

  async getActiveReviewWinnerArt(postIds: string[]) {
    const reviewWinnerArts = await this.any(`
      WITH "RankedReviewWinnerArts" AS (
        SELECT
          rwa._id,
          ROW_NUMBER() OVER (PARTITION BY rwa."postId" ORDER BY sac."createdAt" DESC) AS rn
        FROM "ReviewWinnerArts" rwa
        INNER JOIN (
          SELECT
            sac."reviewWinnerArtId",
            MAX(sac."createdAt") AS "mostRecentlyCreatedAt"
          FROM "SplashArtCoordinates" sac
          GROUP BY sac."reviewWinnerArtId"
        ) latest_splash_art_coordinates ON rwa._id = latest_splash_art_coordinates."reviewWinnerArtId"
        INNER JOIN "SplashArtCoordinates" sac ON rwa._id = sac."reviewWinnerArtId" AND sac."createdAt" = latest_splash_art_coordinates."mostRecentlyCreatedAt"
        WHERE rwa."postId" IN ($1:csv)
      )
      SELECT *
      FROM "RankedReviewWinnerArts"
      JOIN "ReviewWinnerArts" AS rwa
      ON "RankedReviewWinnerArts"._id = rwa._id
      WHERE rn = 1;
    `, [postIds]);

    const artByPostId = keyBy(reviewWinnerArts, rwa => rwa.postId);
    return postIds.map(postId => artByPostId[postId] ?? null);
  }
}

recordPerfMetrics(ReviewWinnerArtsRepo);

export default ReviewWinnerArtsRepo;
