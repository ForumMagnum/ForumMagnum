import { Globals } from "../vulcan-lib";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import RecommendationService from "../recommendations/RecommendationService";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import type { StrategySpecification } from "../../lib/collections/users/recommendationSettings";

const randomRecommendationSamples = async () => {
  let cutoff = new Date();
  cutoff = new Date(cutoff.setFullYear(cutoff.getFullYear() - 1));

  const db = getSqlClientOrThrow();
  const posts = await db.many(`
    SELECT "_id", "title", "slug"
    FROM "Posts"
    WHERE "createdAt" > $1 AND
      "status" = 2 AND
      "draft" IS NOT TRUE AND
      "deletedDraft" IS NOT TRUE AND
      "isFuture" IS NOT TRUE AND
      "shortform" IS NOT TRUE AND
      "hiddenRelatedQuestion" IS NOT TRUE AND
      "groupId" IS NULL AND
      "baseScore" >= 5 AND
      "isEvent" IS NOT TRUE
    ORDER BY RANDOM()
    LIMIT 50
  `, [cutoff]);

  const service = new RecommendationService();
  const count = 3;

  const algorithms: ((postId: string) => StrategySpecification)[] = [
    (postId: string) => ({postId, name: "moreFromTag"}),
    (postId: string) => ({postId, name: "tagWeightedCollabFilter", bias: 0.5}),
    (postId: string) => ({postId, name: "tagWeightedCollabFilter", bias: 1.5}),
  ];

  for (const algorithm of algorithms) {
    const recommendations = await Promise.all(posts.map(({_id}) =>
      service.recommend(null, null, count, algorithm(_id)),
    ));

    let result = "";

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const title = post.title.replace(/,/g, " ");
      for (let j = 0; j < count; j++) {
        const rec = recommendations[i][j];
        const recTitle = rec.title.replace(/,/g, " ");
        const srcLink = "https://forum.effectivealtruism.org" + postGetPageUrl(post);
        const targetLink = "https://forum.effectivealtruism.org" + postGetPageUrl(rec);
        result += `"${title}",${srcLink},"${recTitle}",${targetLink}\n`;
      }
    }

    // eslint-disable-next-line no-console
    console.log("\n\n", algorithm);

    // eslint-disable-next-line no-console
    console.log(result, "\n\n");
  }
}

Globals.randomRecommendationSamples = randomRecommendationSamples;
