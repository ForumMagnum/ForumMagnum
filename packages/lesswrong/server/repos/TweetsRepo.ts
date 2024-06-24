import AbstractRepo from "./AbstractRepo";
import Tweets from "../../lib/collections/tweets/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { getViewablePostsSelector } from "./helpers";

class TweetsRepo extends AbstractRepo<"Tweets"> {
  constructor() {
    super(Tweets);
  }

  async getUntweetedPostsCrossingKarmaThreshold({threshold, since}: {threshold: number, since: Date}): Promise<string[]> {
    const res = await this.getRawDb().any<{postId: string}>(`
      -- TweetsRepo.getPostsCrossingKarmaThreshold
      WITH KarmaChanges AS (
        SELECT
          v."votedAt",
          v."documentId" AS post_id,
          v.power,
          (
            SELECT
              sum(v1.power) AS karma
          FROM
            "Posts" p1
          LEFT JOIN "Votes" v1 ON p1._id = v1."documentId"
        WHERE
          p1._id = v."documentId"
          AND v1.cancelled IS FALSE
          AND v1."votedAt" < v."votedAt"
        GROUP BY
          p1._id) AS prior_karma,
        (
          SELECT
            sum(v1.power) AS karma
          FROM
            "Posts" p1
          LEFT JOIN "Votes" v1 ON p1._id = v1."documentId"
        WHERE
          p1._id = v."documentId"
          AND v1.cancelled IS FALSE
          AND v1."votedAt" <= v."votedAt"
        GROUP BY
          p1._id) AS post_karma
      FROM
        "Votes" v
        INNER JOIN "Posts" p ON p._id = v."documentId"
        LEFT JOIN "Tweets" t ON t."postId" = p._id
        WHERE
          "collectionName" = 'Posts'
          AND cancelled = FALSE
          AND "votedAt" > $2
          AND ${getViewablePostsSelector("p")}
          AND t._id IS NULL
        GROUP BY
          "votedAt",
          "documentId",
          "power"
        ORDER BY
          "votedAt" DESC
      )
      SELECT post_id as "postId" FROM KarmaChanges WHERE prior_karma < $1 AND post_karma >= $1;
    `, [threshold, since]);

    return res?.map(r => r.postId) ?? []
  }
}

recordPerfMetrics(TweetsRepo);

export default TweetsRepo;
