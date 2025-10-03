/* eslint-disable no-console */

import { getSqlClientOrThrow } from "../sql/sqlClient";
import { getPgPromiseLib } from "../sqlConnection";

type PostVotingSystem = Pick<DbPost, "_id" | "votingSystem">;
type VoteType = Pick<DbVote, "documentId" | "extendedVoteType">;
type VoteCounts = {agree: number, disagree: number};

export const convertDefaultVotingSystemToEAEmojis = async (postId: string) => {
  await getSqlClientOrThrow().none(`
    UPDATE "Posts"
    SET "votingSystem" = 'eaEmojis'
    WHERE "_id" = $1
  `, [postId]);
}

export const convertTwoAxisVotingSystemToEAEmojis = async (postId: string) => {
  await getSqlClientOrThrow().tx(async (db) => {
    const votes: VoteType[] = await db.any(`
      UPDATE "Votes" AS v
      SET "extendedVoteType" = CASE v."extendedVoteType"->>'agreement'
        WHEN 'smallUpvote' THEN '{"agree":true}'::JSONB
        WHEN 'bigUpvote' THEN '{"agree":true}'::JSONB
        WHEN 'smallDownvote' THEN '{"disagree":true}'::JSONB
        WHEN 'bigDownvote' THEN '{"disagree":true}'::JSONB
        ELSE NULL
        END
      FROM "Comments" AS c
      WHERE
        c."_id" = v."documentId" AND
        v."collectionName" = 'Comments' AND
        c."postId" = $1 AND
        v."cancelled" IS NOT TRUE AND
        v."isUnvote" IS NOT TRUE AND
        v."extendedVoteType"->>'agreement' IS NOT NULL
      RETURNING "documentId", "extendedVoteType"
    `, [postId]);

    const voteCounts: Record<string, VoteCounts> = {};
    for (const {documentId, extendedVoteType} of votes) {
      if (!extendedVoteType) {
        continue;
      }
      if (!voteCounts[documentId]) {
        voteCounts[documentId] = {agree: 0, disagree: 0};
      }
      if (extendedVoteType.agree) {
        voteCounts[documentId].agree++;
      } else if (extendedVoteType.disagree) {
        voteCounts[documentId].disagree++;
      }
    }

    const commentIdsToUpdate = Object.keys(voteCounts);
    const queries: {query: string, values: unknown[]}[] = [];
    for (const commentId of commentIdsToUpdate) {
      queries.push({
        query: `
          UPDATE "Comments"
          SET "extendedScore" = "extendedScore" || $2::JSONB
          WHERE "_id" = $1
        `,
        values: [commentId, voteCounts[commentId]],
      });
    }

    queries.push({
      query: `
        UPDATE "Posts"
        SET "votingSystem" = 'eaEmojis'
        WHERE "_id" = $1
      `,
      values: [postId],
    });

    const concatenatedQuery = getPgPromiseLib().helpers.concat(queries);
    await db.multi(concatenatedQuery);
  });
}

export const convertAllPostsToEAEmojis = async () => {
  console.log("Converting voting systems to EA emojis...");
  const posts: PostVotingSystem[] = await getSqlClientOrThrow().any(`
    SELECT "_id", "votingSystem"
    FROM "Posts"
    WHERE "votingSystem" <> 'eaEmojis'
  `);

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    try {
      switch (post.votingSystem) {
      case "default":
        console.log(
          "  ...converting default voting system for post",
          post._id,
          `(${i}/${posts.length})`,
        );
        await convertDefaultVotingSystemToEAEmojis(post._id);
        break;
      case "twoAxis":
        console.log(
          "  ...converting two-axis voting system for post",
          post._id,
          `(${i}/${posts.length})`,
        );
        await convertTwoAxisVotingSystemToEAEmojis(post._id);
        break;
      default:
        // Do nothing for other voting systems
        break;
      }
    } catch (e) {
      console.error(`Failed to convert post ${post._id}:`, e);
    }
  }
}
