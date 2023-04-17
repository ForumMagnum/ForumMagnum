import { Globals } from "../vulcan-lib";
import { getSqlClientOrThrow } from "../../lib/sql/sqlClient";
import RecommendationService from "../recommendations/RecommendationService";

const randomRecommendationSamples = async () => {
  let cutoff = new Date();
  cutoff = new Date(cutoff.setFullYear(cutoff.getFullYear() - 1));

  const db = getSqlClientOrThrow();
  const posts = await db.many(`
    SELECT "_id", "title"
    FROM "Posts"
    WHERE "createdAt" > $1 AND
      "status" = 2 AND
      "draft" IS NOT TRUE AND
      "deletedDraft" IS NOT TRUE AND
      "isFuture" IS NOT TRUE AND
      "shortform" IS NOT TRUE AND
      "hiddenRelatedQuestion" IS NOT TRUE AND
      "groupId" IS NULL AND
      "baseScore" >= 5
    ORDER BY RANDOM()
    LIMIT 20
  `, cutoff);

  const service = new RecommendationService();
  const count = 3;

  const recommendations = await Promise.all(posts.map(({_id}) => {
    return service.recommend(null, count, {
      name: "moreFromTag",
      postId: _id,
    });
  }));

  let result = "";

  for (let i = 0; i < posts.length; i++) {
    const {_id, title} = posts[i];
    for (let j = 0; j < count; j++) {
      const rec = recommendations[i][j];
      result += `${_id},"${title}",${rec._id},"${rec.title}"\n`;
    }
  }

  console.log(result);
}

Globals.randomRecommendationSamples = randomRecommendationSamples;
