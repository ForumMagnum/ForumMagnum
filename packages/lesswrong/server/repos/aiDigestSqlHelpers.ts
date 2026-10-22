// Each of these fragments expects a `$(userId)` query parameter naming the reader.

export const readerFollowedAuthorIds = `
  SELECT s."documentId"
  FROM "Subscriptions" s
  WHERE s."userId" = $(userId)
    AND s."collectionName" = 'Users'
    AND s.state = 'subscribed'
    AND s.deleted IS NOT TRUE
    AND s.type IN ('newActivityForFeed', 'newPosts')
`;

export const joinReaderUpvote = (
  collectionName: "Posts" | "Comments",
  documentIdExpression: string,
  alias: string,
) => `
  LEFT JOIN LATERAL (
    SELECT
      CASE WHEN v."voteType" = 'bigUpvote' THEN 'strong' ELSE 'regular' END AS liked,
      v."votedAt" AS "likedAt"
    FROM "Votes" v
    WHERE v."userId" = $(userId)
      AND v."collectionName" = '${collectionName}'
      AND v."documentId" = ${documentIdExpression}
      AND v."voteType" IN ('smallUpvote', 'bigUpvote')
      AND v.cancelled IS FALSE
      AND v."isUnvote" IS FALSE
    ORDER BY v."votedAt" DESC
    LIMIT 1
  ) ${alias} ON TRUE
`;

export const readerSeesLessOf = (
  collectionName: "Posts" | "Comments",
  documentIdExpression: string,
) => `EXISTS (
  SELECT 1
  FROM "UltraFeedEvents" ufe
  WHERE ufe."userId" = $(userId)
    AND ufe."collectionName" = '${collectionName}'
    AND ufe."documentId" = ${documentIdExpression}
    AND ufe."eventType" = 'seeLess'
    AND COALESCE((ufe.event ->> 'cancelled')::boolean, FALSE) IS FALSE
)`;
