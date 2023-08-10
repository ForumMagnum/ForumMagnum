import AbstractRepo from "./AbstractRepo";
import Votes from "../../lib/collections/votes/collection";
import type { TagCommentType } from "../../lib/collections/comments/types";
import { logIfSlow } from "../../lib/sql/sqlClient";
import type { RecentVoteInfo } from "../../lib/rateLimits/types";

export const RECENT_CONTENT_COUNT = 20

export type KarmaChangesArgs = {
  userId: string,
  startDate: Date,
  endDate: Date,
  af?: boolean,
  showNegative?: boolean,
}

export type KarmaChangeBase = {
  _id: string,
  collectionName: CollectionNameString,
  scoreChange: number,
}

export type CommentKarmaChange = KarmaChangeBase & {
  description?: string,
  postId?: string,
  tagId?: string,
  tagCommentType?: TagCommentType,
  
  // Not filled in by the initial query; added by a followup query in the resolver
  tagSlug?: string
}

export type PostKarmaChange = KarmaChangeBase & {
  title: string,
  slug: string,
}

export type TagRevisionKarmaChange = KarmaChangeBase & {
  tagId: string,

  // Not filled in by the initial query; added by a followup query in the resolver
  tagSlug?: string
  tagName?: string
}

type PostVoteCounts = {
  postId: string,
  smallUpvoteCount: number,
  bigUpvoteCount: number,
  smallDownvoteCount: number
  bigDownvoteCount: number
}

export default class VotesRepo extends AbstractRepo<DbVote> {
  constructor() {
    super(Votes);
  }

  /**
   * Get data to populate the karma-change notifier (that is, the star icon that
   * appears in the header for logged-in users). The query here starts with the
   * Votes collection, summing up net vote power for votes within a given date
   * range.
   *
   * Cancelled votes *are* counted when summing up vote powers here; for each
   * cancelled vote the Votes collection will have a matching "unvote", with the
   * opposite power. The datestamps of the vote and the unvote are when the vote
   * was placed and when it was cancelled. So for example if a user placed an
   * upvote (+1) at 5:00 and then converted it to a strong upvote (+2) at 6:00,
   * this is three rows in the votes collection:
   *   voteType     votedAt   power  cancelled  isUnvote
   *   smallUpvote  5:00      1      true       false
   *   smallUpvote  6:00      -1     true       true
   *   bigUpvote    6:00      2      false      false
   *
   * The inner select produces a list of document IDs, the collectionName of
   * the collection the document is in, and the net change in score of that
   * document in the given time range, for all content by the given user. Then
   * for each collection that document might be in, we join against that
   * collection to get a bit more information about the document (to make an
   * excerpt to show in the UI, and to determine the link URL). Fields that
   * correspond to documents in the wrong collection will be null.
   *
   * Then in JS, we take the result set, split it into a separate array for
   * each voteable collection, and move fields around to make it typecheck.
   */
  async getKarmaChanges(
    {userId, startDate, endDate, af, showNegative}: KarmaChangesArgs,
  ): Promise<{
    changedComments: CommentKarmaChange[],
    changedPosts: PostKarmaChange[],
    changedTagRevisions: TagRevisionKarmaChange[],
  }> {
    const powerField = af ? "afPower" : "power";

    const allChanges = await logIfSlow(() => this.getRawDb().any(`
      SELECT
        v.*,
        comment."contents"->'html' AS "commentHtml",
        comment."postId" AS "commentPostId",
        comment."tagId" AS "commentTagId",
        comment."tagCommentType" AS "commentTagCommentType",
        post."title" AS "postTitle",
        post."slug" AS "postSlug",
        revision."documentId" AS "revisionTagId"
      FROM (
        SELECT
          "documentId" AS "_id",
          "Votes"."collectionName" as "collectionName",
          SUM("${powerField}") AS "scoreChange"
        FROM "Votes"
        WHERE
          ${af ? '"afPower" IS NOT NULL AND' : ''}
          "authorIds" @> ARRAY[$1::CHARACTER VARYING] AND
          "votedAt" >= $2 AND
          "votedAt" <= $3 AND
          "userId" <> $1
        GROUP BY "Votes"."documentId", "Votes"."collectionName"
      ) v
      LEFT JOIN "Comments" comment ON (
        v."collectionName" = 'Comments'
        AND comment._id = v._id
      )
      LEFT JOIN "Posts" post ON (
        v."collectionName" = 'Posts'
        AND post._id = v._id
      )
      LEFT JOIN "Revisions" revision ON (
        v."collectionName" = 'Revisions'
        AND revision._id = v._id
      )
      WHERE v."scoreChange" ${showNegative ? "<>" : ">"} 0
    `, [userId, startDate, endDate]),
      `getKarmaChanges(${userId}, ${startDate}, ${endDate})`
    );

    let changedComments: CommentKarmaChange[] = [];
    let changedPosts: PostKarmaChange[] = [];
    let changedTagRevisions: TagRevisionKarmaChange[] = [];
    for (let votedContent of allChanges) {
      let change: KarmaChangeBase = {
        _id: votedContent._id,
        collectionName: votedContent.collectionName,
        scoreChange: votedContent.scoreChange,
      };
      if (votedContent.collectionName==="Comments") {
        changedComments.push({
          ...change,
          description: votedContent.commentHtml,
          postId: votedContent.commentPostId,
          tagId: votedContent.commentTagId,
          tagCommentType: votedContent.commentTagCommentType,
        });
      } else if (votedContent.collectionName==="Posts") {
        changedPosts.push({
          ...change,
          title: votedContent.postTitle,
          slug: votedContent.postSlug,
        });
      } else if (votedContent.collectionName==="Revisions") {
        changedTagRevisions.push({
          ...change,
          tagId: votedContent.revisionTagId,
        });
      }
    }
    return {changedComments, changedPosts, changedTagRevisions};
  }

  getSelfVotes(tagRevisionIds: string[]): Promise<DbVote[]> {
    return this.any(`
      SELECT * FROM "Votes" WHERE
        $1::TEXT[] @> ARRAY["documentId"]::TEXT[] AND
        "collectionName" = 'Revisions' AND
        "cancelled" = FALSE AND
        "isUnvote" = FALSE AND
        "authorIds" @> ARRAY["userId"]
    `, [tagRevisionIds]);
  }

  transferVotesTargetingUser(oldUserId: string, newUserId: string): Promise<null> {
    return this.none(`
      UPDATE "Votes"
      SET "authorIds" = ARRAY_APPEND(ARRAY_REMOVE("authorIds", $1), $2)
      WHERE ARRAY_POSITION("authorIds", $1) IS NOT NULL
    `, [oldUserId, newUserId]);
  }

  private votesOnContentVoteFields = `"Votes"._id, "Votes"."userId", "Votes"."power", "Votes"."documentId", "Votes"."collectionName", "Votes"."votedAt"`;
  private votesOnContentPostFields = `"Posts"."postedAt", "Posts"."baseScore" AS "totalDocumentKarma"`;
  private votesOnContentCommentFields = `"Comments"."postedAt", "Comments"."baseScore" AS "totalDocumentKarma"`;

  private selectVotesOnPostsJoin = `
    SELECT ${this.votesOnContentVoteFields}, ${this.votesOnContentPostFields}
    FROM "Votes"
    JOIN "Posts" on "Posts"._id = "Votes"."documentId"
  `;

  private selectVotesOnCommentsJoin = `
    SELECT ${this.votesOnContentVoteFields}, ${this.votesOnContentCommentFields}
    FROM "Votes"
    JOIN "Comments" on "Comments"._id = "Votes"."documentId"
  `;

  // Get votes from recent content by a user,
  // to use to decide on their rate limit
  // (note: needs to get the user's own self-upvotes so that
  // it doesn't skip posts with no other votes)
  async getVotesOnRecentContent(userId: string): Promise<RecentVoteInfo[]> {
    const votes = await this.getRawDb().any(`
      (
        ${this.selectVotesOnPostsJoin}
        WHERE
          "Votes"."documentId" in (
            SELECT _id FROM "Posts" 
            WHERE
              "Posts"."userId" = $1
              AND
              "Posts"."draft" IS NOT true
            ORDER BY "Posts"."postedAt" DESC
            LIMIT ${RECENT_CONTENT_COUNT}
          )
          AND 
          "cancelled" IS NOT true
        ORDER BY "Posts"."postedAt" DESC
      )
      UNION
      (
        ${this.selectVotesOnCommentsJoin}
        WHERE
          "Votes"."documentId" in (
            SELECT _id FROM "Comments" 
            WHERE
              "Comments"."userId" = $1
            ORDER by "Comments"."postedAt" DESC
            LIMIT ${RECENT_CONTENT_COUNT}
          )
          AND
          "cancelled" IS NOT true
        ORDER BY "Comments"."postedAt" DESC
      )
    `, [userId])
    return votes
  }

  async getVotesOnPreviousContentItem(userId: string, collectionName: 'Posts' | 'Comments', before: Date) {
    if (collectionName === 'Posts') {
      return this.getRawDb().any(`
        ${this.selectVotesOnPostsJoin}
        WHERE
          "Votes"."documentId" in (
            SELECT _id FROM "Posts" 
            WHERE
              "Posts"."userId" = $1
            AND
              "Posts"."draft" IS NOT true
            AND
              "Posts"."postedAt" < $2
            ORDER BY "Posts"."postedAt" DESC
            LIMIT 1
          )
        AND 
          "cancelled" IS NOT true
        ORDER BY "Posts"."postedAt" DESC
      `, [userId, before]);
    } else {
      return this.getRawDb().any(`
        ${this.selectVotesOnCommentsJoin}
        WHERE
          "Votes"."documentId" in (
            SELECT _id FROM "Comments" 
            WHERE
              "Comments"."userId" = $1
            AND
              "Comments"."postedAt" < $2
            ORDER by "Comments"."postedAt" DESC
            LIMIT 1
          )
        AND
          "cancelled" IS NOT true
        ORDER BY "Comments"."postedAt" DESC
      `, [userId, before]);
    }
  }

  async getDigestPlannerVotesForPosts(postIds: string[]): Promise<Array<PostVoteCounts>> {
    return await logIfSlow(async () => await this.getRawDb().manyOrNone(`
      SELECT p._id as "postId",
        count(v._id) FILTER(WHERE v."voteType" = 'smallUpvote') as "smallUpvoteCount",
        count(v._id) FILTER(WHERE v."voteType" = 'bigUpvote') as "bigUpvoteCount",
        count(v._id) FILTER(WHERE v."voteType" = 'smallDownvote') as "smallDownvoteCount",
        count(v._id) FILTER(WHERE v."voteType" = 'bigDownvote') as "bigDownvoteCount"
      FROM "Posts" p
      JOIN "Votes" v tablesample system(50) ON v."documentId" = p."_id"
      WHERE p._id IN ($1:csv)
        AND v."collectionName" = 'Posts'
        AND v.cancelled = false
      GROUP BY p._id
    `, [postIds]), "getDigestPlannerVotesForPosts");
  }
}
