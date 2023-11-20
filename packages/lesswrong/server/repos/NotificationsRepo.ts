import AbstractRepo from "./AbstractRepo";
import Notifications from "../../lib/collections/notifications/collection";
import { READ_WORDS_PER_MINUTE } from "../../lib/collections/posts/schema";
import { getSocialPreviewSql } from "../../lib/collections/posts/helpers";
import { eaPublicEmojiNames } from "../../lib/voting/eaEmojiPalette";
import type { NotificationDisplay } from "../../lib/notificationTypes";

// This should return an object of type `NotificationDisplayUser`
const buildNotificationUser = (prefix: string) =>
  `CASE WHEN ${prefix}."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
    '_id', ${prefix}."_id",
    'slug', ${prefix}."slug",
    'createdAt', ${prefix}."createdAt",
    'displayName', ${prefix}."displayName",
    'profileImageId', ${prefix}."profileImageId",
    'karma', ${prefix}."karma",
    'deleted', ${prefix}."deleted",
    'htmlBio', COALESCE(${prefix}."biography"->>'html', ''),
    'postCount', ${prefix}."postCount",
    'commentCount', ${prefix}."commentCount"
  ) END`;

// This should return an object of type `NotificationDisplayLocalgroup`
const buildNotificationLocalgroup = (prefix: string) =>
  `CASE WHEN ${prefix}."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
    '_id', ${prefix}."_id",
    'name', ${prefix}."name"
  ) END`;

// This should return an object of type `NotificationDisplayPost`
const buildNotificationPost = (
  prefix: string,
  userPrefix: string,
  localgroupPrefix: string,
) =>
  `CASE WHEN ${prefix}."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
    '_id', ${prefix}."_id",
    'slug', ${prefix}."slug",
    'title', ${prefix}."title",
    'draft', ${prefix}."draft",
    'url', ${prefix}."url",
    'isEvent', ${prefix}."isEvent",
    'startTime', ${prefix}."startTime",
    'curatedDate', ${prefix}."curatedDate",
    'postedAt', ${prefix}."postedAt",
    'groupId', ${prefix}."groupId",
    'fmCrosspost', ${prefix}."fmCrosspost",
    'collabEditorDialogue', ${prefix}."collabEditorDialogue",
    'readTimeMinutes', COALESCE(
      ${prefix}."readTimeMinutesOverride",
      (${prefix}."contents"->'wordCount')::INTEGER / ${READ_WORDS_PER_MINUTE}
    ),
    'socialPreviewData', ${getSocialPreviewSql(prefix)},
    'customHighlight', ${prefix}."customHighlight",
    'contents', ${prefix}."contents",
    'rsvps', ${prefix}."rsvps",
    'user', ${buildNotificationUser(userPrefix)},
    'group', ${buildNotificationLocalgroup(localgroupPrefix)}
  ) END`;

// This should return an object of type `NotificationDisplayComment`
const buildNotificationComment = (
  prefix: string,
  userPrefix: string,
  postPrefix: string,
  postUserPrefix: string,
  postLocalgroupPrefix: string,
) =>
  `CASE WHEN ${prefix}."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
    '_id', ${prefix}."_id",
    'user', ${buildNotificationUser(userPrefix)},
    'post', ${buildNotificationPost(postPrefix, postUserPrefix, postLocalgroupPrefix)}
  ) END`;

// This should return an object of type `NotificationDisplayTag`
const buildNotificationTag = (prefix: string) =>
  `CASE WHEN ${prefix}."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
    '_id', ${prefix}."_id",
    'name', ${prefix}."name",
    'slug', ${prefix}."slug"
  ) END`;

const buildNotificationsQuery = (
  userIdIndex: number,
  typeIndex: number,
  type?: string,
  includeMessages?: boolean,
) =>
  `SELECT
    n."_id",
    n."type",
    n."link",
    n."createdAt",
    NULL "karmaChange",
    NULL::JSONB "extendedVoteType",
    ${buildNotificationPost("p", "pu", "pl")} "post",
    ${buildNotificationComment("c", "cu", "cp", "cpu", "cpl")} "comment",
    ${buildNotificationTag("t")} "tag",
    COALESCE(
      ${buildNotificationUser("nma")},
      ${buildNotificationUser("u")}
    ) "user",
    ${buildNotificationLocalgroup("l")} "localgroup"
  FROM "Notifications" n
  LEFT JOIN "Posts" p ON
    n."documentType" = 'post' AND
    n."documentId" = p."_id"
  LEFT JOIN "Users" pu ON
    p."userId" = pu."_id"
  LEFT JOIN "Localgroups" pl ON
    p."groupId" = pl."_id"
  LEFT JOIN "Comments" c ON
    n."documentType" = 'comment' AND
    n."documentId" = c."_id"
  LEFT JOIN "Users" cu ON
    c."userId" = cu."_id"
  LEFT JOIN "Posts" cp ON
    c."postId" = cp."_id"
  LEFT JOIN "Users" cpu ON
    cp."userId" = cpu."_id"
  LEFT JOIN "Localgroups" cpl ON
    cp."groupId" = cpl."_id"
  LEFT JOIN "TagRels" tr ON
    n."documentType" = 'tagRel' AND
    n."documentId" = tr."_id"
  LEFT JOIN "Tags" t ON
    t."_id" = tr."tagId"
  LEFT JOIN "Users" u ON
    n."documentType" = 'user' AND
    n."documentId" = u."_id"
  LEFT JOIN "Localgroups" l ON
    n."documentType" = 'localgroup' AND
    n."documentId" = l."_id"
  LEFT JOIN "Users" nma ON
    n."extraData"->>'newMessageAuthorId' = nma."_id"
  WHERE
    n."userId" = $${userIdIndex} AND
    n."deleted" IS NOT TRUE AND
    n."emailed" IS NOT TRUE AND
    n."waitingForBatch" IS NOT TRUE AND
    ${type ? `n."type" = $${typeIndex} AND` : ""}
    ${includeMessages ? "": `n."documentType" <> 'message' AND`}
    NOT COALESCE(p."deletedDraft", FALSE) AND
    NOT COALESCE(c."deleted", FALSE) AND
    NOT COALESCE(t."deleted", FALSE) AND
    NOT COALESCE(u."deleted", FALSE) AND
    NOT COALESCE(l."deleted", FALSE)`;

const buildKarmaChangeQuery = (userIdIndex: number) => `
  SELECT
    'karma-' || v."documentId" "_id",
    'karmaChange' "type",
    NULL "link",
    v."createdAt",
    v."karmaChange",
    NULL::JSONB "extendedVoteType",
    ${buildNotificationPost("p", "pu", "pl")} "post",
    ${buildNotificationComment("c", "cu", "cp", "cpu", "cpl")} "comment",
    ${buildNotificationTag("t")} "tag",
    NULL "user",
    NULL "localgroup"
  FROM (
    SELECT
      v."documentId",
      v."collectionName",
      MAX(v."votedAt") "createdAt",
      SUM(v."power") "karmaChange"
    FROM "Votes" v
    JOIN "Users" u ON u."_id" = $${userIdIndex}
    WHERE
      v."cancelled" IS NOT TRUE AND
      v."isUnvote" IS NOT TRUE AND
      v."silenceNotification" IS NOT TRUE AND
      v."authorIds" @> ARRAY[$${userIdIndex}]::VARCHAR[] AND
      NOT v."authorIds" @> ARRAY[v."userId"] AND
      v."collectionName" IN ('Posts', 'Comments', 'Revisions') AND
      v."votedAt" >= NOW() - (
        CASE u."karmaChangeNotifierSettings"->>'updateFrequency'
          WHEN 'disabled' THEN '0 seconds'::INTERVAL
          WHEN 'daily' THEN '1 day'::INTERVAL
          WHEN 'weekly' THEN '1 week'::INTERVAL
          ELSE LEAST(NOW() - u."karmaChangeBatchStart", '1 month'::INTERVAL)
        END
      )
    GROUP BY v."documentId", v."collectionName", u."_id"
    HAVING CASE
      WHEN u."karmaChangeNotifierSettings"->'showNegativeKarma'= TO_JSONB(TRUE)
      THEN SUM(v."power") <> 0
      ELSE SUM(v."power") > 0
    END
  ) v
  LEFT JOIN "Posts" p ON
    v."collectionName" = 'Posts' AND
    p."_id" = v."documentId"
  LEFT JOIN "Users" pu ON
    p."userId" = pu."_id"
  LEFT JOIN "Localgroups" pl ON
    p."groupId" = pl."_id"
  LEFT JOIN "Comments" c ON
    v."collectionName" = 'Comments' AND
    c."_id" = v."documentId"
  LEFT JOIN "Users" cu ON
    c."userId" = cu."_id"
  LEFT JOIN "Posts" cp ON
    c."postId" = cp."_id"
  LEFT JOIN "Users" cpu ON
    cp."userId" = cpu."_id"
  LEFT JOIN "Localgroups" cpl ON
    cp."groupId" = cpl."_id"
  LEFT JOIN "Revisions" r ON
    v."collectionName" = 'Revisions' AND
    r."_id" = v."documentId"
  LEFT JOIN "Tags" t ON
    r."collectionName" = 'Tags' AND
    t."_id" = r."documentId"`;

// The logic in this selector should match `countNewReactions`
const buildReactionsQuery = (userIdIndex: number) =>
  `SELECT
    q."_id",
    'reaction' "type",
    NULL "link",
    q."votedAt" "createdAt",
    NULL "karmaChange",
    q."extendedVoteType",
    ${buildNotificationPost("p", "pu", "pl")} "post",
    ${buildNotificationComment("c", "cu", "cp", "cpu", "cpl")} "comment",
    NULL "tag",
    ${buildNotificationUser("u")} "user",
    NULL "localgroup"
  FROM (
    SELECT
      "_id",
      "documentId",
      "collectionName",
      "userId",
      "votedAt",
      "extendedVoteType"
    FROM "Votes"
    WHERE
      "authorIds" @> ARRAY[$${userIdIndex}]::VARCHAR[] AND
      NOT "authorIds" @> ARRAY["userId"] AND
      "cancelled" IS NOT TRUE AND
      "isUnvote" IS NOT TRUE AND
      "collectionName" IN ('Posts', 'Comments') AND (
        ${eaPublicEmojiNames.map((name) =>
          `("extendedVoteType"->'${name}')::BOOLEAN`
        ).join(" OR ")}
      )
  ) q
  JOIN "Users" u ON
    q."userId" = u."_id"
  LEFT JOIN "Posts" p ON
    q."collectionName" = 'Posts' AND
    q."documentId" = p."_id"
  LEFT JOIN "Users" pu ON
    p."userId" = pu."_id"
  LEFT JOIN "Localgroups" pl ON
    p."groupId" = pl."_id"
  LEFT JOIN "Comments" c ON
    q."collectionName" = 'Comments' AND
    q."documentId" = c."_id"
  LEFT JOIN "Users" cu ON
    c."userId" = cu."_id"
  LEFT JOIN "Posts" cp ON
    c."postId" = cp."_id"
  LEFT JOIN "Users" cpu ON
    cp."userId" = cpu."_id"
  LEFT JOIN "Localgroups" cpl ON
    cp."groupId" = cpl."_id"
  WHERE
    COALESCE(p."_id", c."_id") IS NOT NULL AND
    NOT COALESCE(u."deleted", FALSE)`;

export default class NotificationsRepo extends AbstractRepo<DbNotification> {
  constructor() {
    super(Notifications);
  }

  getNotificationDisplays({
    userId,
    type,
    includeMessages = false,
    limit = 20,
    offset = 0,
  }: {
    userId: string,
    type?: string,
    includeMessages?: boolean,
    limit?: number,
    offset?: number,
  }): Promise<NotificationDisplay[]> {
    const includeNotifications = type !== "karmaChange" && type !== "reaction";
    const includeKarma = !type || type === "karmaChange";
    const includeReactions = !type || type === "reaction";

    const queries: string[] = [];
    if (includeNotifications) {
      queries.push(buildNotificationsQuery(1, 2, type, includeMessages));
    }
    if (includeKarma) {
      queries.push(buildKarmaChangeQuery(1));
    }
    if (includeReactions) {
      queries.push(buildReactionsQuery(1));
    }

    return this.getRawDb().any(`
      ${queries.join("\nUNION\n")}
      ORDER BY "createdAt" DESC
      LIMIT $3
      OFFSET $4
    `, [userId, type, limit, offset]);
  }

  async countNewReactions(userId: string): Promise<number> {
    // The logic in this selector should match `buildReactionsQuery`
    const result = await this.getRawDb().one(`
      SELECT COUNT(*) "count"
      FROM "Votes" v
      JOIN "Users" u ON u."_id" = $1
      WHERE
        v."authorIds" @> ARRAY[u."_id"]::VARCHAR[] AND
        NOT v."authorIds" @> ARRAY[v."userId"] AND
        v."cancelled" IS NOT TRUE AND
        v."isUnvote" IS NOT TRUE AND
        v."collectionName" IN ('Posts', 'Comments') AND (
          ${eaPublicEmojiNames.map((name) =>
            `(v."extendedVoteType"->'${name}')::BOOLEAN`
          ).join(" OR ")}
        ) AND
        v."createdAt" > COALESCE(u."lastNotificationsCheck", TO_TIMESTAMP(0))
    `, [userId]);
    const count = result?.count;
    return Number(count);
  }
}
