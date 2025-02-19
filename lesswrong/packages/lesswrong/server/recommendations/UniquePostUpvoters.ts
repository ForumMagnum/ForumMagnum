import { createPostgresView } from "../postgresView";

/**
 * The collaborative filter strategy requires comparing the sets of unique voters
 * on many different posts. This is too slow to do every time we need to generate
 * recommendations as it requires scanning the entire votes collection so we
 * precompute the data into this materialized view which is periodically refreshed
 * by a cron job.
 *
 * User ids are hashed into integers as this allows us to use the efficient union
 * and intersection methods from the intarray Postgres extension. Hashing collisions
 * are possible but not statistically significant.
 */
const createUniquePostUpvotersQuery = `
  CREATE MATERIALIZED VIEW IF NOT EXISTS "UniquePostUpvoters" AS
    SELECT
      p."_id" AS "postId",
      ARRAY_AGG(DISTINCT ('x' || SUBSTR(MD5(v."userId"), 1, 8))::BIT(32)::INTEGER)
        AS "voters"
    FROM "Posts" p
    INNER JOIN "Votes" v ON
      p."_id" = v."documentId" AND
      v."collectionName" = 'Posts' AND
      v."cancelled" IS NOT TRUE AND
      v."isUnvote" IS NOT TRUE AND
      v."voteType" IN ('smallUpvote', 'bigUpvote')
    GROUP BY p."_id"
`;

const createUniquePostUpvotersIndexQuery = `
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_UniquePostUpvoters_postId"
    ON "UniquePostUpvoters" ("postId")
`;

const refreshUniquePostUpvotersQuery = `
  REFRESH MATERIALIZED VIEW "UniquePostUpvoters"
`;

createPostgresView(
  "UniquePostUpvoters",
  createUniquePostUpvotersQuery,
  [createUniquePostUpvotersIndexQuery],
  {
    interval: "every 1 hour",
    query: refreshUniquePostUpvotersQuery,
  },
  [
    {type: "extension", name: "intarray"},
    {type: "collection", name: "Posts"},
    {type: "collection", name: "Votes"},
  ],
);
