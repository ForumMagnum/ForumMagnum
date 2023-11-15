import AbstractRepo from "./AbstractRepo";
import Notifications from "../../lib/collections/notifications/collection";
import { READ_WORDS_PER_MINUTE } from "../../lib/collections/posts/schema";
import { getSocialPreviewSql } from "../../lib/collections/posts/helpers";
import type { NotificationDisplay } from "../../lib/notificationTypes";

// This should return an object of type `NotificationDisplayUser`
const buildNotificationUser = (prefix: string) => `JSONB_BUILD_OBJECT(
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
)`;

// This should return an object of type `NotificationDisplayPost`
const buildNotificationPost = (
  prefix: string,
  userPrefix: string,
) => `JSONB_BUILD_OBJECT(
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
  'user', ${buildNotificationUser(userPrefix)}
)`;

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
      SELECT
        n."_id",
        n."type",
        n."link",
        n."createdAt",
        CASE WHEN p."_id" IS NULL THEN NULL ELSE
          ${buildNotificationPost("p", "pu")} END "post",
        CASE WHEN c."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
          '_id', c."_id",
          'user', ${buildNotificationUser("cu")},
          'post', ${buildNotificationPost("cp", "cpu")}
        ) END "comment",
        CASE WHEN t."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
          '_id', t."_id",
          'name', t."name",
          'slug', t."slug"
        ) END "tag",
        CASE WHEN u."_id" IS NULL THEN NULL ELSE
          ${buildNotificationUser("u")} END "user",
        CASE WHEN l."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
          '_id', l."_id",
          'name', l."name"
        ) END "localgroup"
      FROM "Notifications" n
      LEFT JOIN "Posts" p ON
        n."documentType" = 'post' AND
        n."documentId" = p."_id"
      LEFT JOIN "Users" pu ON
        p."userId" = pu."_id"
      LEFT JOIN "Comments" c ON
        n."documentType" = 'comment' AND
        n."documentId" = c."_id"
      LEFT JOIN "Users" cu ON
        c."userId" = cu."_id"
      LEFT JOIN "Posts" cp ON
        c."postId" = cp."_id"
      LEFT JOIN "Users" cpu ON
        cp."userId" = cpu."_id"
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
        n."userId" = $1 AND
        n."deleted" IS NOT TRUE AND
        n."waitingForBatch" IS NOT TRUE AND
        ${type ? `n."type" = $4 AND` : ""}
        ${includeMessages ? "": `n."documentType" <> 'message' AND`}
        NOT COALESCE(p."deletedDraft", FALSE) AND
        NOT COALESCE(c."deleted", FALSE) AND
        NOT COALESCE(t."deleted", FALSE) AND
        NOT COALESCE(u."deleted", FALSE) AND
        NOT COALESCE(l."deleted", FALSE)
      ORDER BY n."createdAt" DESC
      LIMIT $2
      OFFSET $3
    `, [userId, limit, offset, type]);
  }
}
