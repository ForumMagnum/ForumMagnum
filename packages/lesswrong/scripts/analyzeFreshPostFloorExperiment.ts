/* eslint-disable no-console */
import groupBy from "lodash/groupBy";
import mean from "lodash/mean";
import sortBy from "lodash/sortBy";
import { isInFreshPostFloorTreatmentArm } from "@/lib/scoring";
import { userBigVotePower } from "@/lib/voting/voteTypes";
import { getViewablePostsSelector } from "@/server/repos/helpers";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

// Compares posts that got the fresh-post karma floor with posts that didn't. Use
// an endDate at least a week ago, so that karma has mostly settled:
//
//   npm run repl -- dev lw packages/lesswrong/scripts/analyzeFreshPostFloorExperiment.ts 'analyzeFreshPostFloorExperiment("2026-11-10", "2027-01-10")'

interface ExperimentPost {
  _id: string
  baseScore: number
  voteCount: number
  commentCount: number
  authorKarma: number
}

const STRONG_POST_KARMA = 50;

function getSelfVoteBucket({ authorKarma }: ExperimentPost): string {
  const selfVote = userBigVotePower(authorKarma, 1);
  if (selfVote <= 2) return "self-vote 1-2";
  if (selfVote <= 6) return "self-vote 3-6";
  return "self-vote 7+";
}

function summarize(posts: ExperimentPost[]): string {
  const karma = sortBy(posts.map(post => post.baseScore));
  const medianKarma = karma[Math.floor(karma.length / 2)];
  const strongShare = karma.filter(k => k >= STRONG_POST_KARMA).length / karma.length;
  return [
    `n=${posts.length}`,
    `median karma=${medianKarma}`,
    `mean karma=${mean(karma).toFixed(1)}`,
    `karma>=${STRONG_POST_KARMA}: ${(100 * strongShare).toFixed(0)}%`,
    `mean votes=${mean(posts.map(post => post.voteCount)).toFixed(1)}`,
    `mean comments=${mean(posts.map(post => post.commentCount)).toFixed(1)}`,
  ].join(", ");
}

export const analyzeFreshPostFloorExperiment = async (startDate: string, endDate: string) => {
  const posts = await getSqlClientOrThrow().any<ExperimentPost>(`
    -- analyzeFreshPostFloorExperiment
    SELECT
      p."_id",
      p."baseScore",
      p."voteCount",
      p."commentCount",
      u."karma" AS "authorKarma"
    FROM "Posts" p
    JOIN "Users" u ON u."_id" = p."userId"
    WHERE
      ${getViewablePostsSelector("p")}
      AND p."frontpageDate" IS NOT NULL
      AND p."postedAt" >= $(startDate)
      AND p."postedAt" < $(endDate)
  `, { startDate, endDate });

  const postsByBucket = groupBy(posts, getSelfVoteBucket);
  for (const bucket of sortBy(Object.keys(postsByBucket))) {
    const bucketPosts = postsByBucket[bucket];
    console.log(bucket);
    console.log(`  treatment: ${summarize(bucketPosts.filter(post => isInFreshPostFloorTreatmentArm(post._id)))}`);
    console.log(`  control:   ${summarize(bucketPosts.filter(post => !isInFreshPostFloorTreatmentArm(post._id)))}`);
  }
};
