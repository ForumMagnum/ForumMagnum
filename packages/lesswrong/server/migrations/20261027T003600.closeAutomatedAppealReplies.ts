import { adminAccountSetting } from "@/lib/instanceSettings";
import { forumTypeSetting } from "@/lib/forumTypeUtils";

export const up = async ({db}: MigrationContext) => {
  const teamAccountId = adminAccountSetting.get(forumTypeSetting.get())?._id;
  if (!teamAccountId) return;

  // Match the original automated reply, including its sender, rather than a
  // user quoting it. A newer message or an undecided appeal must stay open.
  const appealReplyPattern = `<p>Thanks for your message. If you'd like us to take a second look at this rejection, please use our <a href="%/rejection-review?%">rejection review form</a>. We aim to complete reviews within 72 hours. If you have a question about a separate matter, please use Intercom (bottom right button on LessWrong pages) or email team@lesswrong.com</p>`;
  await db.none(`
    UPDATE "Conversations" c
    SET "awaitingModeratorReply" = FALSE
    WHERE c."moderator" IS TRUE
      AND c."awaitingModeratorReply" IS TRUE
      AND $(teamAccountId) = ANY(c."participantIds")
      AND NOT EXISTS (
        SELECT 1 FROM "RejectionAppeals" a
        WHERE a."conversationId" = c."_id" AND a."status" = 'open'
      )
      AND (
        SELECT m."userId" = $(teamAccountId)
          AND m."contents"->'originalContents'->>'data' LIKE $(appealReplyPattern)
        FROM "Messages" m
        WHERE m."conversationId" = c."_id"
        ORDER BY m."createdAt" DESC, m."_id" DESC
        LIMIT 1
      )
  `, { teamAccountId, appealReplyPattern });
};

export const down = async (_: MigrationContext) => {
  // Do not reopen conversations that moderators may have handled since the cleanup.
};
