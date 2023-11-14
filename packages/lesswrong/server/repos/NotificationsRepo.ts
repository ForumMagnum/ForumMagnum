import AbstractRepo from "./AbstractRepo";
import Notifications from "../../lib/collections/notifications/collection";
import type { NotificationDisplay } from "../../lib/types/notificationDisplayTypes";

export default class NotificationsRepo extends AbstractRepo<DbNotification> {
  constructor() {
    super(Notifications);
  }

  getNotificationDisplays({
    userId,
    includeMessages = false,
    limit = 20,
    offset = 0,
  }: {
    userId: string,
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
        CASE WHEN p."_id" IS NULL THEN NULL ELSE JSON_BUILD_OBJECT(
          '_id', p."_id",
          'title', p."title",
          'slug', p."slug",
          'user', JSON_BUILD_OBJECT(
            '_id', pu."_id",
            'displayName', pu."displayName",
            'slug', pu."slug"
          )
        ) END "post",
        CASE WHEN c."_id" IS NULL THEN NULL ELSE JSON_BUILD_OBJECT(
          '_id', c."_id",
          'user', JSON_BUILD_OBJECT(
            '_id', cu."_id",
            'displayName', cu."displayName",
            'slug', cu."slug"
          ),
          'post', JSON_BUILD_OBJECT(
            '_id', cp."_id",
            'title', cp."title",
            'slug', cp."slug"
          )
        ) END "comment",
        CASE WHEN t."_id" IS NULL THEN NULL ELSE JSON_BUILD_OBJECT(
          '_id', t."_id",
          'name', t."name",
          'slug', t."slug"
        ) END "tag",
        CASE WHEN u."_id" IS NULL THEN NULL ELSE JSON_BUILD_OBJECT(
          '_id', u."_id",
          'displayName', u."displayName",
          'slug', u."slug"
        ) END "user",
        CASE WHEN l."_id" IS NULL THEN NULL ELSE JSON_BUILD_OBJECT(
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
        ${includeMessages ? "": `n."documentType" <> 'message' AND`}
        NOT COALESCE(p."deletedDraft", FALSE) AND
        NOT COALESCE(c."deleted", FALSE) AND
        NOT COALESCE(t."deleted", FALSE) AND
        NOT COALESCE(u."deleted", FALSE) AND
        NOT COALESCE(l."deleted", FALSE)
      ORDER BY n."createdAt" DESC
      LIMIT $2
      OFFSET $3
    `, [userId, limit, offset]);
  }
}
