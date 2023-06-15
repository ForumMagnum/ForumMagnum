import AbstractRepo from "./AbstractRepo";
import Votes from "../../lib/collections/votes/collection";
import type { TagCommentType } from "../../lib/collections/comments/types";
import { logIfSlow } from "../../lib/sql/sqlClient";

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
}

export type PostKarmaChange = KarmaChangeBase & {
  title: string,
  slug: string,
}

export type TagRevisionKarmaChange = KarmaChangeBase & {
  tagId: string,
}

export type UserContent = {
  comments: DbComment[],
  posts: DbPost[],
  voteInfo: Array<{
    documentId: string,
    collectionName: 'Posts' | 'Comments',
    votedAt: Date
  }>
};

export default class VotesRepo extends AbstractRepo<DbVote> {
  constructor() {
    super(Votes);
  }

  private getKarmaChanges<T extends KarmaChangeBase>(
    {userId, startDate, endDate, af, showNegative}: KarmaChangesArgs,
    collectionName: CollectionNameString,
    dataFields: string[],
  ): Promise<T[]> {
    return logIfSlow(() => this.getRawDb().any(`
      SELECT
        v.*,
        '${collectionName}' AS "collectionName",
        ${dataFields.join(", ")}
      FROM (
        SELECT
          "documentId" AS "_id",
          SUM("${af ? "afPower" : "power"}") AS "scoreChange"
        FROM "Votes"
        WHERE
          ${af ? '"afPower" IS NOT NULL AND' : ''}
          "authorIds" @> ARRAY[$1::CHARACTER VARYING] AND
          "votedAt" >= $2 AND
          "votedAt" <= $3 AND
          "userId" <> $1 AND
          "collectionName" = '${collectionName}'
        GROUP BY "Votes"."documentId"
      ) v
      JOIN "${collectionName}" data ON data."_id" = v."_id"
      WHERE v."scoreChange" ${showNegative ? "<>" : ">"} 0
    `, [userId, startDate, endDate]),
      "getKarmaChanges"
    );
  }

  getKarmaChangesForComments(args: KarmaChangesArgs): Promise<CommentKarmaChange[]> {
    return this.getKarmaChanges(args, "Comments", [
      'data."contents"->>\'html\' AS "description"',
      'data."postId"',
      'data."tagId"',
      'data."tagCommentType"',
    ]);
  }

  getKarmaChangesForPosts(args: KarmaChangesArgs): Promise<PostKarmaChange[]> {
    return this.getKarmaChanges(args, "Posts", [
      'data."title"',
      'data."slug"',
    ]);
  }

  getKarmaChangesForTagRevisions(args: KarmaChangesArgs): Promise<TagRevisionKarmaChange[]> {
    return this.getKarmaChanges(args, "Revisions", [
      'data."documentId" AS "tagId"',
    ]);
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

  async getRecentUserVotedOnContent(userId: string, limit: number): Promise<UserContent> {
    const recentVotedOnDocumentIds = await this.getRawDb().any(`
      SELECT v."documentId", v."collectionName", v."votedAt"
      FROM "Votes" v
      WHERE v."userId" = $1
      AND cancelled IS NOT TRUE
      AND NOT ($1 = ANY(v."authorIds"))
      AND "collectionName" IN ('Posts', 'Comments')
      ORDER BY "votedAt" DESC
      LIMIT $2
    `, [userId, limit]);

    const votedOnCommentIds = recentVotedOnDocumentIds
      .filter(vote => vote.collectionName === 'Comments')
      .map(vote => vote.documentId);

    const votedOnPostIds = recentVotedOnDocumentIds
      .filter(vote => vote.collectionName === 'Posts')
      .map(vote => vote.documentId);

    const votedOnCommentQuery = this.getRawDb().any<DbComment>(`
      SELECT c.*
      FROM "Comments" c
      WHERE c._id = ANY($1)
    `, [votedOnCommentIds]);

    const votedOnPostQuery = this.getRawDb().any<DbPost>(`
      SELECT p.*
      FROM "Posts" p
      WHERE p._id = ANY($1)
    `, [votedOnPostIds]);

    const [comments, posts] = await Promise.all([votedOnCommentQuery, votedOnPostQuery]);

    return {
      comments,
      posts,
      voteInfo: recentVotedOnDocumentIds
    };

    // const votedOnContent = [...votedOnComments, ...]

    // return this.getRawDb().any(`
    //   WITH recent_vote_documents AS (
    //     SELECT v."documentId"
    //     FROM "Votes" v
    //     WHERE v."userId" = $1
    //     AND cancelled IS NOT TRUE
    //     AND NOT ($1 = ANY(v."authorIds"))
    //     AND "collectionName" IN ('Posts', 'Comments')
    //     ORDER BY "votedAt" DESC
    //     LIMIT $2
    //   )
    //   SELECT c.*, 'comment' AS content_type
    //   FROM "Comments" c
    //   WHERE c._id IN recent_vote_documents
    //   UNION
    //   SELECT p.*, 'post' AS content_type
    //   FROM "Posts" p
    //   WHERE p._id IN recent_vote_documents
    // `, [userId, limit]);
  }
}
