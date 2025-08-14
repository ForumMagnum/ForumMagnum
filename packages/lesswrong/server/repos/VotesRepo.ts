import AbstractRepo from "./AbstractRepo";
import Votes from "../../server/collections/votes/collection";
import type { RecentVoteInfo } from "../../lib/rateLimits/types";
import groupBy from "lodash/groupBy";
import { NamesAttachedReactionsVote } from "../../lib/voting/namesAttachedReactions";
import { eaEmojiPalette, getEAEmojisForKarmaChanges } from "../../lib/voting/eaEmojiPalette";
import { recordPerfMetrics } from "./perfMetricWrapper";
import type {
  AnyKarmaChange,
  KarmaChangesArgs,
} from "../collections/users/karmaChangesGraphQL";

export const RECENT_CONTENT_COUNT = 20

type PostVoteCounts = {
  postId: string,
  smallUpvoteCount: number,
  bigUpvoteCount: number,
  smallDownvoteCount: number
  bigDownvoteCount: number
}

export type React = {
  documentId: string,
  userId: string,
  createdAt: Date,
  reactionType?: string, // should this be a specific reaction type?
}

export type LongtermScoreResult = {
  longtermSeniorDownvoterCount: number,
  longtermScore: number,
  commentCount: number
};

class VotesRepo extends AbstractRepo<"Votes"> {
  constructor() {
    super(Votes);
  }

  /**
   * Get data to populate the karma-change notifier (that is, the star icon that
   * appears in the header for logged-in users). The query here starts with the
   * Votes collection, summing up net vote power for votes within a given date
   * range.
   *
   * Note that, for the EA Forum, this logic is handled by the completely
   * separate `getEAKarmaChanges` function.
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
   *
   * UPDATE Nov 2023: We've added react notifications to this logic, which
   * makes it somewhat more complicated. There's now a second query which
   * gets react vote data, and the net changes to reacts on each document
   * are calculated in reactionVotesToReactionChanges().
   */
  async getLWKarmaChanges(
    {userId, startDate, endDate, af, showNegative}: KarmaChangesArgs,
  ): Promise<{
    changedComments: CommentKarmaChange[],
    changedPosts: PostKarmaChange[],
    changedTagRevisions: RevisionsKarmaChange[],
  }> {
    const powerField = af ? "afPower" : "power";

    const reactionConditions = `jsonb_array_length("extendedVoteType"->'reacts') > 0`;

    const reactionVotesQuery = `
        -- VotesRepo.getLWKarmaChanges.reactionVotesQuery
        SELECT
          v.*
        FROM
          "Votes" v
        WHERE
          (${reactionConditions})
          AND
          "authorIds" @> ARRAY[$1::CHARACTER VARYING] AND
          "votedAt" >= $2 AND
          "votedAt" <= $3 AND
          "userId" <> $1 AND
          "silenceNotification" IS NOT TRUE
      `;

    const [allScoreChanges, allReactionVotes] = await Promise.all([
      this.getRawDb().any(`
        -- VotesRepo.getLWKarmaChanges.allScoreChanges
        SELECT
          v.*,
          comment."contents"->'html' AS "commentHtml",
          comment."postId" AS "commentPostId",
          comment_post."title" AS "commentPostTitle",
          comment_post."slug" AS "commentPostSlug",
          comment."tagId" AS "commentTagId",
          comment_tag."name" AS "commentTagName",
          comment."tagCommentType" AS "commentTagCommentType",
          post."title" AS "postTitle",
          post."slug" AS "postSlug",
          revision."documentId" AS "revisionTagId"
        FROM (
          SELECT
            "documentId" AS "_id",
            "Votes"."collectionName" as "collectionName",
            SUM("${powerField}") AS "scoreChange",
            COUNT(${reactionConditions}) AS "reactionVoteCount"
          FROM "Votes"
          WHERE
            ${af ? '"afPower" IS NOT NULL AND' : ''}
            "authorIds" @> ARRAY[$1::CHARACTER VARYING] AND
            NOT ("authorIds" @> ARRAY["userId"]) AND
            "votedAt" >= $2 AND
            "votedAt" <= $3 AND
            "userId" <> $1 AND
            "silenceNotification" IS NOT TRUE
          GROUP BY "Votes"."documentId", "Votes"."collectionName"
        ) v
        LEFT JOIN "Comments" comment ON (
          v."collectionName" = 'Comments'
          AND comment._id = v._id
        )
        LEFT JOIN "Posts" comment_post ON
          comment_post._id = comment."postId"
        LEFT JOIN "Tags" comment_tag ON
          comment_tag._id = comment."tagId"
        LEFT JOIN "Posts" post ON (
          v."collectionName" = 'Posts'
          AND post._id = v._id
        )
        LEFT JOIN "Revisions" revision ON (
          v."collectionName" = 'Revisions'
          AND revision._id = v._id
        )
        WHERE
          v."scoreChange" ${showNegative ? "<>" : ">"} 0
          OR "reactionVoteCount" > 0
        `,
        [userId, startDate, endDate],
        `getLWKarmaChanges(${userId}, ${startDate}, ${endDate})`
      ),
      this.getRawDb().any<DbVote>(
        reactionVotesQuery,
        [userId, startDate, endDate],
        `getLWKarmaChanges_reacts(${userId}, ${startDate}, ${endDate})`,
      ),
    ]);

    const reactionVotesByDocument = groupBy(allReactionVotes, v=>v.documentId);

    let changedComments: CommentKarmaChange[] = [];
    let changedPosts: PostKarmaChange[] = [];
    let changedTagRevisions: RevisionsKarmaChange[] = [];
    for (let votedContent of allScoreChanges) {
      let change = {
        _id: votedContent._id,
        collectionName: votedContent.collectionName,
        scoreChange: votedContent.scoreChange,
        addedReacts: this.lwReactionVotesToReactionChanges(reactionVotesByDocument[votedContent._id]),
      };
      // If we have no karma or reacts to display for this document, skip it
      if (!change.scoreChange && !change.addedReacts.length) {
        continue
      }

      if (votedContent.collectionName==="Comments") {
        changedComments.push({
          ...change,
          commentId: votedContent._id,
          description: votedContent.commentHtml,
          postId: votedContent.commentPostId,
          postTitle: votedContent.commentPostTitle,
          postSlug: votedContent.commentPostSlug,
          tagId: votedContent.commentTagId,
          tagName: votedContent.commentTagName,
          tagCommentType: votedContent.commentTagCommentType,
          tagSlug: null,
          eaAddedReacts: null,
        });
      } else if (votedContent.collectionName==="Posts") {
        changedPosts.push({
          ...change,
          postId: votedContent._id,
          title: votedContent.postTitle,
          slug: votedContent.postSlug,
          eaAddedReacts: null,
        });
      } else if (votedContent.collectionName==="Revisions") {
        changedTagRevisions.push({
          ...change,
          tagId: votedContent.revisionTagId,
          tagName: null,
          tagSlug: null,
          eaAddedReacts: null,
        });
      }
    }
    return {changedComments, changedPosts, changedTagRevisions};
  }

  private lwReactionVotesToReactionChanges(votes: DbVote[]): ReactionChange[] {
    if (!votes?.length) return [];
    const votesByUser = groupBy(votes, v=>v.userId);
    let reactionChanges: ReactionChange[] = [];
    
    type FlattenedReaction = {
      reactionType: string
      quote: string|undefined
      count: number
    }
    
    function addNormalizedReact(flattenedReactions: FlattenedReaction[], reactionType: string, quote: string|undefined, isCancellation?: boolean) {
      const idx = flattenedReactions.findIndex(r => r.reactionType===reactionType && r.quote===quote);
      if (idx !== -1) {
        flattenedReactions[idx].count += isCancellation ? -1 : 1;
      } else {
        if (!isCancellation) {
          flattenedReactions.push({
            reactionType, quote,
            count: 1
          });
        }
      }
    }
    
    for (let userId of Object.keys(votesByUser)) {
      const flattenedReactions: Array<FlattenedReaction> = [];
      
      // First pass: normalize to an array of the subset of reactions that aren't in unvotes, unmerge reactions of the same type on different quoted regions
      for (let vote of votesByUser[userId]) {
        if (!vote.extendedVoteType)
          continue;
        const extendedVote: NamesAttachedReactionsVote = vote.extendedVoteType;
        const formattedReacts = extendedVote.reacts ?? [];

        if (!vote.isUnvote && formattedReacts) {
          for (let react of formattedReacts) {
            // Skip anti-reacts for now
            if (react.vote === "disagreed") {
              continue;
            }
            if (react.quotes && react.quotes.length > 0) {
              for (let quote of react.quotes) {
                addNormalizedReact(flattenedReactions, react.react, quote);
              }
            } else {
              addNormalizedReact(flattenedReactions, react.react, undefined);
            }
          }
        }
      }
      
      // Second pass: find reactions in unvotes, flatten them, cancel reactions that match unvotes
      for (let vote of votesByUser[userId]) {
        if (!vote.extendedVoteType)
          continue;
        const extendedUnvote: NamesAttachedReactionsVote = vote.extendedVoteType;
        const formattedReacts = extendedUnvote.reacts ?? [];
        
        if (vote.isUnvote && formattedReacts) {
          for (let react of formattedReacts) {
            if (react.vote === "disagreed") {
              continue;
            }
            if (react.quotes && react.quotes.length>0) {
              for (let quote of react.quotes) {
                addNormalizedReact(flattenedReactions, react.react, quote, true);
              }
            } else {
              addNormalizedReact(flattenedReactions, react.react, undefined, true);
            }
          }
        }
      }
      
      for (let reaction of flattenedReactions) {
        if (reaction.count > 0) {
          reactionChanges.push({
            reactionType: reaction.reactionType,
            userId: userId,
          });
        }
      }
    }

    return reactionChanges;
  }

  getEAKarmaChanges({
    userId,
    startDate,
    endDate,
    af,
    showNegative = false,
  }: KarmaChangesArgs): Promise<AnyKarmaChange[]> {
    const powerField = af ? "afPower" : "power";
    const {publicEmojis, privateEmojis} = getEAEmojisForKarmaChanges(showNegative);
    const publicSelectors = publicEmojis.map((emoji) =>
      `'${emoji}', ARRAY_AGG(
        DISTINCT JSONB_BUILD_OBJECT('_id', v."userId", 'displayName', u."displayName", 'slug', u."slug")
      ) FILTER (WHERE
        v."cancelled" IS NOT TRUE AND
        v."isUnvote" IS NOT TRUE AND
        fm_vote_added_emoji(v."_id", '${emoji}')
      )`,
    );
    const privateSelectors = privateEmojis.map((emoji) =>
      `'${emoji}', NULLIF(COUNT(DISTINCT "userId") FILTER (WHERE
        v."cancelled" IS NOT TRUE AND
        v."isUnvote" IS NOT TRUE AND
        fm_vote_added_emoji(v."_id", '${emoji}')
      ), 0)`,
    );
    return this.getRawDb().any(`
      -- VotesRepo.getEAKarmaChanges
      SELECT
        q.*,
        ARRAY[]::TEXT[] "addedReacts",
        post."title",
        post."slug",
        comment._id "commentId",
        COALESCE(comment."postId", post._id) "postId",
        comment."tagCommentType",
        comment."contents"->>'html' "description",
        comment_post."title" "postTitle",
        comment_post."slug" "postSlug",
        COALESCE(comment_tag."_id", revision_tag."_id") "tagId",
        COALESCE(comment_tag."name", revision_tag."name") "tagName",
        COALESCE(comment_tag."slug", revision_tag."slug") "tagSlug"
      FROM (
        SELECT
          v."documentId" "_id",
          v."collectionName",
          CASE
            WHEN (
              SELECT ("karmaChangeNotifierSettings"->'showNegativeKarma')::JSONB = TO_JSONB(TRUE)
              FROM "Users"
              WHERE "_id" = $1
            )
              THEN SUM(v."${powerField}")
            ELSE
              GREATEST(SUM(v."${powerField}"), 0)
            END "scoreChange",
          NULLIF(JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
            ${[...publicSelectors, ...privateSelectors].join(",\n")}
          )), '{}'::JSONB) "eaAddedReacts"
        FROM "Votes" v
        JOIN "Users" u ON v."userId" = u."_id"
        WHERE
          ${af ? '"afPower" IS NOT NULL AND' : ''}
          v."userId" <> $1 AND
          v."authorIds" @> ARRAY[$1::VARCHAR] AND
          NOT (v."authorIds" @> ARRAY[v."userId"]) AND
          v."votedAt" >= $2 AND
          v."votedAt" <= $3 AND
          v."silenceNotification" IS NOT TRUE
        GROUP BY v."documentId", v."collectionName"
      ) q
      LEFT JOIN "Posts" post ON
        q."collectionName" = 'Posts' AND
        q."_id" = post."_id"
      LEFT JOIN "Comments" comment ON
        q."collectionName" = 'Comments' AND
        q."_id" = comment."_id"
      LEFT JOIN "Posts" comment_post ON
        comment."postId" = comment_post."_id"
      LEFT JOIN "Tags" comment_tag ON
        comment."tagId" = comment_tag."_id"
      LEFT JOIN "Revisions" revision ON
        q."collectionName" = 'Revisions' AND
        q."_id" = revision."_id"
      LEFT JOIN "Tags" revision_tag ON
        revision."documentId" = revision_tag."_id"
      WHERE
        "scoreChange" <> 0 OR
        "eaAddedReacts" IS NOT NULL
    `,
      [userId, startDate, endDate],
      `getEAKarmaChanges(${userId}, ${startDate}, ${endDate})`,
    );
  }

  getSelfVotes(tagRevisionIds: string[]): Promise<DbVote[]> {
    return this.any(`
      -- VotesRepo.getSelfVotes
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
      -- VotesRepo.transferVotesTargetingUser
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
      -- VotesRepo.getVotesOnRecentContent
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
              AND
              "Comments"."debateResponse" IS NOT true
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
        -- VotesRepo.getVotesOnPreviousContentItem
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
        -- VotesRepo.getVotesOnPreviousContentItem
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
    return this.getRawDb().manyOrNone(`
      -- VotesRepo.getDigestPlannerVotesForPosts
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
    `, [postIds], "getDigestPlannerVotesForPosts");
  }

  async getDocumentKarmaChangePerDay({ documentIds, startDate, endDate }: { documentIds: string[]; startDate?: Date; endDate: Date; }): Promise<{ window_start_key: string; karma_change: string }[]> {
    if (!documentIds.length) return []
    
    return await this.getRawDb().any<{window_start_key: string, karma_change: string}>(`
      -- VotesRepo.getDocumentKarmaChangePerDay
      SELECT
        -- Format as YYYY-MM-DD to make grouping easier
        to_char(v."createdAt", 'YYYY-MM-DD') AS window_start_key,
        SUM(v."power") AS karma_change
      FROM "Votes" v
      WHERE
        v."documentId" IN ($1:csv)
        AND ($2 IS NULL OR v."createdAt" >= $2)
        AND v."createdAt" <= $3
        AND v."cancelled" IS NOT TRUE
        AND v."isUnvote" IS NOT TRUE
        AND v."voteType" != 'neutral'
        AND NOT "authorIds" @> ARRAY["userId"]
      GROUP BY
        window_start_key
      ORDER BY
        window_start_key;
    `, [documentIds, startDate, endDate]);
  }

  /**
   * Get the ids of all votes where user1 and user2 have voted on the same document. This is mainly
   * for the purpose of nullifying votes where a user has double-voted from an alt.
   */
  async getSharedVoteIds({ user1Id, user2Id }: { user1Id: string; user2Id: string; }): Promise<string[]> {
    const results = await this.getRawDb().any<{vote_id: string}>(
      `-- VotesRepo.getSharedVoteIds
      WITH JoinedVotes AS (
        SELECT
          v1._id AS v1_id,
          v1.power AS v1_power,
          v2._id AS v2_id,
          v2.power AS v2_power
        FROM
          "Votes" v1
          INNER JOIN "Votes" v2 ON v1."documentId" = v2."documentId"
            AND v2."userId" = $2
            AND v2.cancelled IS FALSE
            AND v2."isUnvote" IS FALSE
            AND v2."voteType" != 'neutral'
        WHERE
          v1."userId" = $1
          AND v1.cancelled IS FALSE
          AND v1."isUnvote" IS FALSE
          AND v1."voteType" != 'neutral'
      )
      SELECT DISTINCT
        v1_id AS vote_id
      FROM
        JoinedVotes
      UNION
      SELECT DISTINCT
        v2_id AS vote_id
      FROM
        JoinedVotes;
      `, [user1Id, user2Id]
    );
    return results.map(({ vote_id }) => vote_id);
  }
  
  async getVotesOnSamePost({userId, postId, excludedDocumentId}: {
    userId: string,
    postId: string,
    excludedDocumentId: string,
  }): Promise<DbVote[]> {
    return await this.manyOrNone(`
      SELECT
        v.*
      FROM
        "Votes" v
      INNER JOIN "Comments" c ON (
        c._id = v."documentId"
        AND c."postId" = $2
      )
      WHERE
        v."cancelled" IS FALSE
        AND v."userId" = $1
        AND v."documentId" != $3
        AND v."collectionName" = 'Comments'
    `, [userId, postId, excludedDocumentId]);
  }

  getLongtermDownvoteScore(userId: string): Promise<LongtermScoreResult | null> {
    return this.getRawDb().oneOrNone(`
      SELECT
        COUNT(DISTINCT senior_downvoter) AS "longtermSeniorDownvoterCount",
        COUNT(c."userId") as "commentCount",
        (SUM(
            CASE WHEN c.total_vote_power < 0
              THEN
                GREATEST((c.total_vote_power * 20)::INT, -100)
              ELSE
                c.total_vote_power
            END
        ) / COUNT(c."userId")) AS "longtermScore"
      FROM (
        SELECT
          full_c.*,
          SUM(v.power) AS total_vote_power,
          ARRAY_AGG(DISTINCT v."userId") FILTER (
            WHERE v.power < 0 AND u.karma > 2000
          ) AS senior_downvoters
        FROM "Comments" as full_c
        LEFT JOIN
          "Votes" AS v
          ON full_c._id = v."documentId"
        LEFT JOIN
          "Users" AS u ON v."userId" = u._id
        WHERE
          v.cancelled IS NOT TRUE
          AND full_c."userId" = $1
          AND v."userId" != $1
          AND full_c."postedAt" > CURRENT_TIMESTAMP - INTERVAL '1 year'
        GROUP BY full_c._id
      ) AS c
      LEFT JOIN LATERAL (
        SELECT senior_downvoter
        FROM unnest(c.senior_downvoters) AS senior_downvoter
        WHERE c.total_vote_power < 0
      ) AS sd ON true
      GROUP BY c."userId"
      ORDER BY "longtermScore" DESC
    `, [userId]);
  }

  async getEAReactsReceived(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<Record<string, number>> {
    const fields = eaEmojiPalette.map(({name}) =>
      `COUNT(*) FILTER (WHERE ("extendedVoteType"->'${name}')::BOOLEAN) AS "${name}"`,
    );
    const result = await this.getRawDb().oneOrNone(`
      -- VotesRepo.getEAReactsReceived
      SELECT ${fields.join(", ")}
      FROM "Votes"
      WHERE
        "authorIds" @> ARRAY[$1::VARCHAR]
        AND "votedAt" >= $2
        AND "votedAt" < $3
        AND "cancelled" IS NOT TRUE
        AND "isUnvote" IS NOT TRUE
        AND "extendedVoteType" IS NOT NULL
    `, [userId, start, end]);
    if (!result) {
      return {};
    }
    for (const key in result) {
      result[key] = parseInt(result[key]);
    }
    return result;
  }

  async getEAReactsGiven(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<Record<string, number>> {
    const fields = eaEmojiPalette.map(({name}) =>
      `COUNT(*) FILTER (WHERE ("extendedVoteType"->'${name}')::BOOLEAN) AS "${name}"`,
    );
    const result = await this.getRawDb().oneOrNone(`
      -- VotesRepo.getEAReactsGiven
      SELECT ${fields.join(", ")}
      FROM "Votes"
      WHERE
        "userId" = $1
        AND "votedAt" >= $2
        AND "votedAt" < $3
        AND "cancelled" IS NOT TRUE
        AND "isUnvote" IS NOT TRUE
        AND "extendedVoteType" IS NOT NULL
    `, [userId, start, end]);
    if (!result) {
      return {};
    }
    for (const key in result) {
      result[key] = parseInt(result[key]);
    }
    return result;
  }

  async getEAAgreements(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<Record<"agree" | "disagree", number>> {
    const result = await this.getRawDb().oneOrNone(`
      -- VotesRepo.getEAAgreements
      SELECT
        COUNT(*) FILTER
          (WHERE ("extendedVoteType"->'agree')::BOOLEAN IS TRUE) AS "agree",
        COUNT(*) FILTER
          (WHERE ("extendedVoteType"->'disagree')::BOOLEAN IS TRUE) AS "disagree"
      FROM "Votes"
      WHERE
        "userId" = $1
        AND "votedAt" >= $2
        AND "votedAt" < $3
        AND "cancelled" IS NOT TRUE
        AND "isUnvote" IS NOT TRUE
        AND "extendedVoteType" IS NOT NULL
    `, [userId, start, end]);
    if (!result) {
      return {agree: 0, disagree: 0};
    }
    for (const key in result) {
      result[key] = parseInt(result[key]) || 0;
    }
    return result;
  }

  async getNetKarmaChangesForAuthorsOverPeriod(days: number, limit: number): Promise<Array<{ userId: string; netKarma: number }>> {
    return this.getRawDb().any(`
      -- VotesRepo.getNetKarmaChangesForAuthorsOverPeriod
      SELECT
        author_id AS "userId",
        SUM(power) AS "netKarma"
      FROM (
        SELECT
          UNNEST("authorIds") AS author_id,
          "power"
        FROM "Votes"
        WHERE
          "votedAt" >= NOW() - INTERVAL '$1 days'
          AND "cancelled" IS NOT TRUE
          AND "isUnvote" IS NOT TRUE
      ) sub
      GROUP BY author_id
      ORDER BY "netKarma" DESC
      LIMIT $2 
    `, [days, limit], `getNetKarmaChangesForAuthorsOverPeriod(${days}, ${limit})`);
  }
}

recordPerfMetrics(VotesRepo);

export default VotesRepo;
