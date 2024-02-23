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

  getActiveReviewWinnerArt(postId: string) {
    return this.oneOrNone(`
      SELECT rwa.*
      FROM "ReviewWinnerArts" AS rwa
      JOIN "SplashArtCoordinates" AS sac
      ON sac."reviewWinnerArtId" = rwa._id
      WHERE rwa."postId" = $1
      ORDER BY sac."createdAt" DESC
      LIMIT 1
    `, [postId]);
  }
}

recordPerfMetrics(ReviewWinnerArtsRepo);

export default ReviewWinnerArtsRepo;
