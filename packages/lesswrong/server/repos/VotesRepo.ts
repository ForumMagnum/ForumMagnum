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
  
  async getDigestPlannerVotesForPosts(postIds: string[]): Promise<Array<PostVoteCounts>> {
    return await logIfSlow(async () => await this.getRawDb().manyOrNone(`
      SELECT p._id as "postId",
        count(v._id) FILTER(WHERE v."voteType" = 'smallUpvote') as "smallUpvoteCount",
        count(v._id) FILTER(WHERE v."voteType" = 'bigUpvote') as "bigUpvoteCount",
        count(v._id) FILTER(WHERE v."voteType" = 'smallDownvote') as "smallDownvoteCount",
        count(v._id) FILTER(WHERE v."voteType" = 'bigDownvote') as "bigDownvoteCount"
      FROM "Posts" p
      JOIN "Votes" v tablesample system(50) ON v."documentId" = p."_id"
      WHERE p._id = ANY($1)
        AND v."collectionName" = 'Posts'
        AND v.cancelled = false
      GROUP BY p._id
    `, [postIds]), "getDigestPlannerVotesForPosts");
  }
}
