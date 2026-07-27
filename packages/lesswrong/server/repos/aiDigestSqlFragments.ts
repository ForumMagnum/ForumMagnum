/**
 * SQL fragments shared by the AI digest queries in PostsRepo and CommentsRepo.
 * Every fragment in this file references a $(userId) parameter (the digest
 * recipient), which the enclosing query must bind.
 */

interface AiDigestVotableDocument {
  collectionName: "Posts" | "Comments";
  /** SQL expression for the voted-on document's _id, e.g. `p."_id"`. */
  documentIdExpression: string;
}

const positiveVoteConditions = ({ collectionName, documentIdExpression }: AiDigestVotableDocument) => `
    v."userId" = $(userId)
    AND v."collectionName" = '${collectionName}'
    AND v."documentId" = ${documentIdExpression}
    AND v."voteType" IN ('smallUpvote', 'bigUpvote')
    AND v.cancelled IS FALSE
    AND v."isUnvote" IS FALSE
`;

/**
 * Scalar subquery: the strength of the reader's current positive vote on the
 * document ('strong' for a big upvote, 'regular' for a small one), or NULL if
 * they have no live upvote.
 */
export const aiDigestPositiveVoteStrengthSubquery = (target: AiDigestVotableDocument) => `(
  SELECT CASE
    WHEN v."voteType" = 'bigUpvote' THEN 'strong'
    ELSE 'regular'
  END
  FROM "Votes" v
  WHERE ${positiveVoteConditions(target)}
  ORDER BY v."votedAt" DESC
  LIMIT 1
)`;

/**
 * Subquery selecting the reader's current positive vote on the document as
 * "positivePreferenceStrength" and "positivePreferenceAt" (empty if they have
 * no live upvote). Attach with LEFT JOIN LATERAL ... ON TRUE.
 */
export const aiDigestPositiveVoteLateralSubquery = (target: AiDigestVotableDocument) => `(
  SELECT
    CASE
      WHEN v."voteType" = 'bigUpvote' THEN 'strong'
      ELSE 'regular'
    END AS "positivePreferenceStrength",
    v."votedAt" AS "positivePreferenceAt"
  FROM "Votes" v
  WHERE ${positiveVoteConditions(target)}
  ORDER BY v."votedAt" DESC
  LIMIT 1
)`;

/**
 * EXISTS subquery: the reader has un-cancelled "see less" feedback on the
 * document.
 */
export const aiDigestActiveSeeLessExistsSubquery = ({ collectionName, documentIdExpression }: AiDigestVotableDocument) => `EXISTS (
  SELECT 1
  FROM "UltraFeedEvents" ufe
  WHERE ufe."userId" = $(userId)
    AND ufe."collectionName" = '${collectionName}'
    AND ufe."documentId" = ${documentIdExpression}
    AND ufe."eventType" = 'seeLess'
    AND COALESCE((ufe.event ->> 'cancelled')::boolean, FALSE) IS FALSE
)`;

/**
 * Conditions on a "Subscriptions" row (aliased `subscriptionAlias`) selecting
 * the reader's active subscriptions to users; combine with a condition on
 * "documentId" to pick out particular authors.
 */
export const aiDigestActiveAuthorSubscriptionConditions = (subscriptionAlias: string) => `
    ${subscriptionAlias}."userId" = $(userId)
    AND ${subscriptionAlias}."collectionName" = 'Users'
    AND ${subscriptionAlias}.state = 'subscribed'
    AND ${subscriptionAlias}.deleted IS FALSE
`;
