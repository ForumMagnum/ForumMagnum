import { createPostgresView } from "../postgresView";

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

const refreshUniquePostUpvotersQuery = `
  REFRESH MATERIALIZED VIEW "UniquePostUpvoters"
`;

const createUniquePostUpvotersIndexQuery = `
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_UniquePostUpvoters_postId"
    ON "UniquePostUpvoters" ("postId")
`;

createPostgresView(
  createUniquePostUpvotersQuery,
  [refreshUniquePostUpvotersQuery],
  createUniquePostUpvotersIndexQuery,
);
