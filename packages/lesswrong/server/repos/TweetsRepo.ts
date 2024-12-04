import AbstractRepo from "./AbstractRepo";
import Tweets from "../../lib/collections/tweets/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { getViewablePostsSelector } from "./helpers";

class TweetsRepo extends AbstractRepo<"Tweets"> {
  constructor() {
    super(Tweets);
  }

  /**
   * @returns {string[]} The ids of posts that have crossed `threshold` karma since `since`
   */
  async getUntweetedPostsCrossingKarmaThreshold({threshold, limit}: {threshold: number, limit: number}): Promise<string[]> {
    const res = await this.getRawDb().any<{postId: string}>(`
      -- TweetsRepo.getPostsCrossingKarmaThreshold
      WITH KarmaChanges AS (
        SELECT
          *,
          prior_karma + power AS post_karma
        FROM (
          SELECT
            v."votedAt",
            v."documentId" AS post_id,
            v.power,
            (
              SELECT
                sum(v1.power) AS karma
              FROM
                "Votes" v1
              WHERE
                v1."documentId" = v."documentId"
                AND v1.cancelled IS FALSE
                AND v1."votedAt" < v."votedAt"
              GROUP BY
                v1."documentId") AS prior_karma
          FROM
            "Votes" v
            INNER JOIN "Posts" p ON p._id = v."documentId"
            LEFT JOIN "Tweets" t ON t."postId" = p._id
          WHERE
            "collectionName" = 'Posts'
            AND cancelled = FALSE
            AND ${getViewablePostsSelector("p")}
            AND t._id IS NULL
            AND p."frontpageDate" IS NOT NULL
          ORDER BY
            "votedAt" DESC) q
      )
      SELECT
        post_id AS "postId"
      FROM
        KarmaChanges
      WHERE
        prior_karma < $1
        AND post_karma >= $1
      LIMIT $2;
    `, [threshold, limit]);

    return res?.map(r => r.postId) ?? []
  }
}

recordPerfMetrics(TweetsRepo);

export default TweetsRepo;
