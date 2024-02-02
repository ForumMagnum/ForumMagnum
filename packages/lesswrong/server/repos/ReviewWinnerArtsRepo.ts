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

  async getAllReviewWinnerArtWithPosts(): Promise<ReviewWinnerArtWithPost[]> {
    const postsWithMetadata = await this.getRawDb().many<DbPost & { reviewWinnerImages: DbReviewWinnerArt[] }>(`
      SELECT
        TO_JSONB(rwa.*) AS "reviewWinnerArt",
        p.*
      FROM "ReviewWinnerArts" rwa
      JOIN "Posts" p
      ON rwa."postId" = p._id
    `);
  
    // We need to do this annoying munging in code because `TO_JSONB` causes date fields to be returned without being serialized into JS Date objects
    return postsWithMetadata.map(postWithMetadata => {
      const { reviewWinnerImages, ...post } = postWithMetadata;
      return { reviewWinnerImages, post };
    });
  }
}

recordPerfMetrics(ReviewWinnerArtsRepo);

export default ReviewWinnerArtsRepo;
