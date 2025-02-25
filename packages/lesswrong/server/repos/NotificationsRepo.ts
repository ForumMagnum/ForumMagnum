import AbstractRepo from "./AbstractRepo";
import Notifications from "../../lib/collections/notifications/collection";
import { READ_WORDS_PER_MINUTE } from "../../lib/collections/posts/schema";
import { getSocialPreviewSql } from "../../lib/collections/posts/helpers";
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

const buildNotificationRevision = (prefix: string) =>
  `JSONB_BUILD_OBJECT(
    'html', ${prefix}."html",
    'wordCount', ${prefix}."wordCount",
    'originalContents', ${prefix}."originalContents",
    'editedAt', ${prefix}."editedAt",
    'userId', ${prefix}."userId",
    'version', ${prefix}."version"
  )`;

// This should return an object of type `NotificationDisplayPost`
const buildNotificationPost = (
  prefix: string,
  revisionPrefix: string,
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
      (${revisionPrefix}."wordCount")::INTEGER / ${READ_WORDS_PER_MINUTE}
    ),
    'socialPreviewData', ${getSocialPreviewSql(prefix)},
    'customHighlight', ${prefix}."customHighlight",
    'contents', ${buildNotificationRevision(revisionPrefix)},
    'rsvps', ${prefix}."rsvps",
    'user', ${buildNotificationUser(userPrefix)},
    'group', ${buildNotificationLocalgroup(localgroupPrefix)}
  ) END`;

// This should return an object of type `NotificationDisplayComment`
const buildNotificationComment = (
  prefix: string,
  userPrefix: string,
  postPrefix: string,
  postRevisionPrefix: string,
  postUserPrefix: string,
  postLocalgroupPrefix: string,
) =>
  `CASE WHEN ${prefix}."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
    '_id', ${prefix}."_id",
    'user', ${buildNotificationUser(userPrefix)},
    'post', ${buildNotificationPost(postPrefix, postRevisionPrefix, postUserPrefix, postLocalgroupPrefix)}
  ) END`;

// This should return an object of type `NotificationDisplayTag`
const buildNotificationTag = (prefix: string) =>
  `CASE WHEN ${prefix}."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
    '_id', ${prefix}."_id",
    'name', ${prefix}."name",
    'slug', ${prefix}."slug"
  ) END`;
  
// This should return an object of type `NotificationDisplaySequence`
const buildNotificationSequence = (prefix: string) =>
  `CASE WHEN ${prefix}."_id" IS NULL THEN NULL ELSE JSONB_BUILD_OBJECT(
    '_id', ${prefix}."_id",
    'title', ${prefix}."title"
  ) END`;

export default class NotificationsRepo extends AbstractRepo<"Notifications"> {
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
      -- NotificationsRepo.getNotificationDisplays
      SELECT
        n."_id",
        n."type",
        n."link",
        n."viewed",
        n."message",
        n."createdAt",
        n."extraData",
        tr."_id" "tagRelId",
        COALESCE(
          ${buildNotificationPost("p", "pr", "pu", "pl")},
          ${buildNotificationPost("trp", "trpr", "trpu", "trpl")}
        ) "post",
        ${buildNotificationComment("c", "cu", "cp", "cpr", "cpu", "cpl")} "comment",
        ${buildNotificationTag("t")} "tag",
        ${buildNotificationSequence("s")} "sequence",
        COALESCE(
          ${buildNotificationUser("nma")},
          ${buildNotificationUser("u")}
        ) "user",
        ${buildNotificationLocalgroup("l")} "localgroup"
      FROM "Notifications" n
      LEFT JOIN "Posts" p ON
        n."documentType" = 'post' AND
        n."documentId" = p."_id"
      LEFT JOIN "Revisions" pr ON
        pr."_id" = p."contents_latest"
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
      LEFT JOIN "Revisions" cpr ON
        cpr."_id" = cp."contents_latest"
      LEFT JOIN "Users" cpu ON
        cp."userId" = cpu."_id"
      LEFT JOIN "Localgroups" cpl ON
        cp."groupId" = cpl."_id"
      LEFT JOIN "TagRels" tr ON
        n."documentType" = 'tagRel' AND
        n."documentId" = tr."_id"
      LEFT JOIN "Tags" t ON
        t."_id" = tr."tagId"
      LEFT JOIN "Posts" trp ON
        trp."_id" = tr."postId"
      LEFT JOIN "Revisions" trpr ON
        trpr."_id" = trp."contents_latest"
      LEFT JOIN "Users" trpu ON
        trpu."_id" = trp."userId"
      LEFT JOIN "Sequences" s ON
        n."documentType" = 'sequence' AND
        n."documentId" = s."_id"
      LEFT JOIN "Localgroups" trpl ON
        trpl."_id" = trp."groupId"
      LEFT JOIN "Users" u ON
        n."documentType" = 'user' AND
        n."documentId" = u."_id"
      LEFT JOIN "Localgroups" l ON
        n."documentType" = 'localgroup' AND
        n."documentId" = l."_id"
      LEFT JOIN "Users" nma ON
        n."extraData"->>'newMessageAuthorId' = nma."_id"
      WHERE
        n."userId" = $(userId) AND
        n."deleted" IS NOT TRUE AND
        n."emailed" IS NOT TRUE AND
        n."waitingForBatch" IS NOT TRUE AND
        ${type ? `n."type" = $(type) AND` : ""}
        ${includeMessages ? "": `COALESCE(n."documentType", '') <> 'message' AND`}
        NOT COALESCE(p."deletedDraft", FALSE) AND
        NOT COALESCE(pu."deleted", FALSE) AND
        NOT COALESCE(pl."deleted", FALSE) AND
        NOT COALESCE(c."deleted", FALSE) AND
        NOT COALESCE(cu."deleted", FALSE) AND
        NOT COALESCE(cp."deletedDraft", FALSE) AND
        NOT COALESCE(cpu."deleted", FALSE) AND
        NOT COALESCE(cpl."deleted", FALSE) AND
        NOT COALESCE(t."deleted", FALSE) AND
        NOT COALESCE(u."deleted", FALSE) AND
        NOT COALESCE(l."deleted", FALSE) AND
        NOT COALESCE(s."isDeleted", FALSE) AND
        NOT COALESCE(nma."deleted", FALSE)
      ORDER BY "createdAt" DESC
      LIMIT $(limit)
      OFFSET $(offset)
    `, {userId, type, limit, offset});
  }
}
