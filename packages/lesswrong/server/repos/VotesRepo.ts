import AbstractRepo from "./AbstractRepo";
import type { TagCommentType } from "../../lib/collections/comments/types";

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

export default class VotesRepo extends AbstractRepo {
  private getKarmaChanges<T extends KarmaChangeBase>(
    {userId, startDate, endDate, af, showNegative}: KarmaChangesArgs,
    collectionName: CollectionNameString,
    dataFields: string[],
  ): Promise<T[]> {
    const powerField = af ? "afPower" : "power";
    const scoreChangeFilter = showNegative ? "<> 0" : "> 0";
    return this.db.any(`
      SELECT
        v.*,
        '${collectionName}' AS "collectionName",
        ${dataFields.join(", ")}
      FROM (
        SELECT "documentId" AS "_id", SUM("${powerField}") AS "scoreChange"
        FROM "Votes"
        WHERE
          ${af ? '"afPower" IS NOT NULL AND' : ''}
          "authorIds" @> ARRAY[$1::CHARACTER VARYING] AND
          ("votedAt" >= $2 AND "votedAt" <= $3) AND
          "userId" <> $1 AND
          "collectionName" = '${collectionName}'
        GROUP BY "documentId", "_id"
      ) v
      JOIN "${collectionName}" data ON data."_id" = v."_id"
      WHERE v."scoreChange" ${scoreChangeFilter}
    `, [userId, startDate, endDate]);
  }

  getKarmaChangesForComments(args: KarmaChangesArgs): Promise<CommentKarmaChange[]> {
    return this.getKarmaChanges(args, "Comments", [
      'data."contents"->>\'html\' AS "description"',
      'data."postId"',
      'data."tagId"',
      'data."tagCommentType"'
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
}
