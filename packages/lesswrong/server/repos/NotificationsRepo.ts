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
    'readTimeMinutes', COALESCE(
      ${prefix}."readTimeMinutesOverride",
      (${prefix}."contents"->'wordCount')::INTEGER / ${READ_WORDS_PER_MINUTE}
    ),
    'socialPreviewData', ${getSocialPreviewSql(prefix)},
    'customHighlight', ${prefix}."customHighlight",
    'contents', ${prefix}."contents",
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
    ${buildNotificationPost("p", "pu", "pl")} "post",
    ${buildNotificationComment("c", "cu", "cp", "cpu", "cpl")} "comment",
    ${buildNotificationTag("t")} "tag",
    ${buildNotificationUser("u")} "user",
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
  WHERE
    n."userId" = $${userIdIndex} AND
    n."deleted" IS NOT TRUE AND
    n."waitingForBatch" IS NOT TRUE AND
    ${type ? `n."type" = $${typeIndex} AND` : ""}
    ${includeMessages ? "": `n."documentType" <> 'message' AND`}
    NOT COALESCE(p."deletedDraft", FALSE) AND
    NOT COALESCE(c."deleted", FALSE) AND
    NOT COALESCE(t."deleted", FALSE) AND
    NOT COALESCE(u."deleted", FALSE) AND
    NOT COALESCE(l."deleted", FALSE)`;

const buildReactionsQuery = (userIdIndex: number) =>
  `SELECT
    q."documentId" "_id",
    'reaction' "type",
    NULL "link",
    q."votedAt" "createdAt",
    ${buildNotificationPost("p", "pu", "pl")} "post",
    ${buildNotificationComment("c", "cu", "cp", "cpu", "cpl")} "comment",
    NULL "tag",
    ${buildNotificationUser("u")} "user",
    NULL "localgroup"
  FROM (
    SELECT
      "documentId",
      "collectionName",
      "userId",
      "votedAt",
      "extendedVoteType"
    FROM "Votes"
    WHERE
      "authorIds" @> ARRAY[$${userIdIndex}]::VARCHAR[] AND
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
    return this.getRawDb().any(`
      ${buildNotificationsQuery(1, 2, type, includeMessages)}
      UNION
      ${buildReactionsQuery(1)}
      ORDER BY "createdAt" DESC
      LIMIT $3
      OFFSET $4
    `, [userId, type, limit, offset]);
  }
}
